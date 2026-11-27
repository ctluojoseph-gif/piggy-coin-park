#!/usr/bin/env python3
"""Generate bundled Taiwan narration with Microsoft zh-TW-HsiaoChenNeural.

Reads a JSON object of {clipId: text} and writes audio/clips/*.mp3 plus
audio/manifest.json. Re-run only when the lines change. The game itself
does not need this script.
"""

import asyncio
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import edge_tts

VOICE = "zh-TW-HsiaoChenNeural"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio" / "clips"
MANIFEST = ROOT / "audio" / "manifest.json"


async def synthesize(clip_id: str, text: str, dest: Path, sem: asyncio.Semaphore) -> None:
    last_error = None
    for attempt in range(4):
        try:
            async with sem:
                communicate = edge_tts.Communicate(text, VOICE, rate="-6%", pitch="+2Hz")
                await communicate.save(str(dest))
            if dest.stat().st_size < 400:
                raise RuntimeError(f"tiny file {dest.stat().st_size}")
            return
        except Exception as error:  # noqa: BLE001 - retry transient TTS errors
            last_error = error
            await asyncio.sleep(0.6 * (attempt + 1))
    raise RuntimeError(f"{clip_id}: {last_error}")


def compress(path: Path) -> None:
    temporary = path.with_suffix(".tmp.mp3")
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(path),
            "-af",
            "silenceremove=start_periods=1:start_silence=0.02:start_threshold=-32dB,"
            "areverse,silenceremove=start_periods=1:start_silence=0.04:start_threshold=-32dB,"
            "afade=t=in:st=0:d=0.09,areverse",
            "-ac", "1", "-ar", "22050", "-b:a", "32k",
            str(temporary),
        ],
        check=True,
    )
    temporary.replace(path)


async def main() -> None:
    catalog = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(6)
    jobs = []
    for clip_id, text in catalog.items():
        dest = OUT / f"{clip_id}.mp3"
        jobs.append(synthesize(clip_id, text, dest, sem))
    await asyncio.gather(*jobs)
    paths = sorted(OUT.glob("*.mp3"))
    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(compress, paths))
    clips = {clip_id: f"./clips/{clip_id}.mp3" for clip_id in catalog}
    MANIFEST.write_text(json.dumps({
        "voice": VOICE,
        "label": "豬豬寶（台灣腔）",
        "clips": clips,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(clips)} clips")


if __name__ == "__main__":
    asyncio.run(main())
