/** Soft synthesized sounds plus zh-TW speech. Never throws into the game. */

export const audio = {
  ctx: null,
  master: null,
  volume: 0.85,
  muted: false,
  noise: null,

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
      if (!window.speechSynthesis) return;
      window.speechSynthesis.getVoices();
    } catch {
      /* speech is optional */
    }
  },

  say(text, { rate = 0.96, pitch = 1.12 } = {}) {
    try {
      if (!text || this.muted || this.volume <= 0 || !window.speechSynthesis) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "zh-TW";
      utter.rate = rate;
      utter.pitch = pitch;
      utter.volume = Math.min(1, this.volume);
      const voices = window.speechSynthesis.getVoices() || [];
      const voice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("zh-tw"))
        || voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("zh"));
      if (voice) utter.voice = voice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {
      /* show the words on screen even if speech is missing */
    }
  },
};
