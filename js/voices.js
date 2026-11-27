/** Taiwan-only voice selection. zh-CN and zh-HK are never eligible. */

const PREFERRED = [
  "hsiaochen",
  "曉臻",
  "晓臻",
  "hsiaoyu",
  "曉雨",
  "晓雨",
  "yating",
  "雅婷",
  "zhiwei",
  "志威",
  "meijia",
  "美佳",
  "國語（臺灣）",
  "國語(臺灣)",
  "國語（台湾）",
];

export function voiceLang(voice) {
  return String(voice?.lang || "").trim().toLowerCase().replaceAll("_", "-");
}

export function isTaiwanVoice(voice) {
  const lang = voiceLang(voice);
  if (!lang) return false;
  if (
    lang.includes("zh-cn")
    || lang.includes("zh-hk")
    || lang.includes("zh-hans")
    || lang.includes("zh-yue")
    || lang.includes("yue")
    || lang.includes("cmn-hans")
  ) return false;
  return lang === "zh-tw"
    || lang.startsWith("zh-tw-")
    || lang === "zh-hant-tw"
    || lang.startsWith("zh-hant-tw");
}

function preferenceScore(voice) {
  const haystack = `${voice?.name || ""} ${voice?.voiceURI || ""}`.toLowerCase();
  for (let i = 0; i < PREFERRED.length; i += 1) {
    if (haystack.includes(PREFERRED[i].toLowerCase())) return PREFERRED.length - i;
  }
  return 0;
}

export function rankTaiwanVoices(voices) {
  return (voices || []).filter(isTaiwanVoice).sort((a, b) => {
    const score = preferenceScore(b) - preferenceScore(a);
    if (score) return score;
    return String(a.name || "").localeCompare(String(b.name || ""), "zh-Hant");
  });
}

/** A saved URI is used only when that exact voice is zh-TW. Otherwise null. */
export function pickTaiwanVoice(voices, preferredUri) {
  if (!preferredUri || preferredUri === "bundled") return null;
  return rankTaiwanVoices(voices).find((voice) => voice.voiceURI === preferredUri) || null;
}
