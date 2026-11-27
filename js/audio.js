/** Coin sounds, bundled Taiwan narration, and a zh-TW-only speech fallback. */

import { isTaiwanVoice, pickTaiwanVoice, rankTaiwanVoices } from "./voices.js";

const PREVIEW_TEXT = "嗨，我是豬豬寶！現在有十五塊。";
const MANIFEST_URL = new URL("../audio/manifest.json", import.meta.url);

export const audio = {
  ctx: null,
  master: null,
  volume: 0.85,
  muted: false,
  noise: null,
  voiceChoice: "bundled",
  manifest: null,
  manifestPromise: null,
  buffers: new Map(),
  partToken: 0,
  partSources: [],

  unlock() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!this.ctx) {
        this.ctx = new Ctx();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : this.volume;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.primeSpeech();
    } catch {
      /* audio is optional */
    }
  },

  setVolume(value) {
    this.volume = Math.min(1, Math.max(0, Number(value) || 0));
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
  },

  setMuted(muted) {
    this.muted = !!muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
  },

  envGain(peak = 0.2) {
    if (!this.ctx || !this.master || this.muted || this.volume <= 0) return null;
    const gain = this.ctx.createGain();
    gain.connect(this.master);
    gain.peak = peak;
    return gain;
  },

  tone({ freq = 440, to = null, dur = 0.18, type = "sine", peak = 0.18, delay = 0 }) {
    const gain = this.envGain(peak);
    if (!gain || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },

  coin(value) {
    if (value === 1) {
      this.tone({ freq: 1174, dur: 0.12, type: "sine", peak: 0.16 });
      this.tone({ freq: 1568, dur: 0.16, type: "triangle", peak: 0.1, delay: 0.05 });
    } else if (value === 5) {
      this.tone({ freq: 659, dur: 0.14, type: "sine", peak: 0.16 });
      this.tone({ freq: 880, dur: 0.18, type: "triangle", peak: 0.1, delay: 0.06 });
    } else {
      this.tone({ freq: 262, dur: 0.16, type: "triangle", peak: 0.18 });
      this.tone({ freq: 392, dur: 0.22, type: "sine", peak: 0.1, delay: 0.05 });
    }
  },

  whoosh() {
    try {
      if (!this.ctx || this.muted) return;
      if (!this.noise) {
        const len = Math.floor(this.ctx.sampleRate * 0.4);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
        this.noise = buf;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.28);
      const gain = this.envGain(0.12);
      if (!gain) return;
      const t = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      src.connect(filter);
      filter.connect(gain);
      src.start(t);
      src.stop(t + 0.34);
    } catch {
      /* ignore */
    }
  },

  boing() {
    this.tone({ freq: 520, to: 160, dur: 0.22, type: "sine", peak: 0.16 });
    this.tone({ freq: 780, to: 240, dur: 0.16, type: "triangle", peak: 0.06, delay: 0.04 });
  },

  fanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      this.tone({ freq, dur: 0.22, type: "triangle", peak: 0.14, delay: i * 0.11 });
    });
  },

  primeSpeech() {
    try {
      window.speechSynthesis?.getVoices();
    } catch {
      /* speech is optional */
    }
  },

  setVoiceChoice(choice) {
    this.voiceChoice = choice || "bundled";
  },

  taiwanVoices() {
    try {
      return rankTaiwanVoices(window.speechSynthesis?.getVoices?.() || []);
    } catch {
      return [];
    }
  },

  cancelSpeak() {
    this.partToken += 1;
    this.partSources.forEach((source) => {
      try { source.stop(); } catch { /* already ended */ }
    });
    this.partSources = [];
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  },

  speak(text, parts = []) {
    try {
      if (!text || this.muted || this.volume <= 0) return;
      this.cancelSpeak();
      if (this.voiceChoice && this.voiceChoice !== "bundled") {
        const voice = pickTaiwanVoice(this.taiwanVoices(), this.voiceChoice);
        if (voice && this.speakSystem(text, voice)) return;
      }
      this.playParts(parts);
    } catch {
      /* the bubble still shows the words */
    }
  },

  preview() {
    this.speak(PREVIEW_TEXT, ["preview"]);
  },

  speakSystem(text, voice) {
    if (!voice || !isTaiwanVoice(voice) || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return false;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "zh-TW";
    try {
      utter.voice = voice;
    } catch {
      return false;
    }
    if (!utter.voice || !isTaiwanVoice(utter.voice)) return false;
    utter.rate = 0.94;
    utter.pitch = 1.04;
    utter.volume = Math.min(1, this.volume);
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {
      return false;
    }
    return true;
  },

  ensureManifest() {
    if (!this.manifestPromise) {
      this.manifestPromise = fetch(MANIFEST_URL)
        .then((response) => {
          if (!response.ok) throw new Error("manifest");
          return response.json();
        })
        .then((data) => {
          this.manifest = data;
          return data;
        })
        .catch((error) => {
          this.manifestPromise = null;
          throw error;
        });
    }
    return this.manifestPromise;
  },

  async decodeClip(url) {
    if (this.buffers.has(url)) return this.buffers.get(url);
    this.unlock();
    if (!this.ctx) return null;
    const response = await fetch(new URL(url, MANIFEST_URL));
    if (!response.ok) return null;
    const raw = await response.arrayBuffer();
    const decoded = await this.ctx.decodeAudioData(raw.slice(0));
    this.buffers.set(url, decoded);
    return decoded;
  },

  async playParts(keys) {
    const token = this.partToken;
    this.unlock();
    if (!this.ctx || !keys?.length) return;
    let manifest;
    try {
      manifest = await this.ensureManifest();
    } catch {
      return;
    }
    if (token !== this.partToken || this.muted) return;
    const buffers = [];
    for (const key of keys) {
      const url = manifest.clips?.[key];
      if (!url) continue;
      try {
        const buffer = await this.decodeClip(url);
        if (token !== this.partToken) return;
        if (buffer) buffers.push(buffer);
      } catch {
        /* skip a missing clip instead of switching language */
      }
    }
    if (!buffers.length || token !== this.partToken || !this.ctx) return;
    let when = this.ctx.currentTime + 0.03;
    buffers.forEach((buffer) => {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.master);
      source.start(when);
      this.partSources.push(source);
      when += buffer.duration + 0.04;
    });
  },

  /** @deprecated use speak(); kept so older calls cannot select a non-Taiwan voice */
  say(text) {
    this.speak(text, []);
  },
};
