/** Persist stars, piggy coins, accessories, and settings. */

import { ACCESSORIES } from "./data.js";

const KEY = "piggy-coin-park-v1";

function defaults() {
  let reduced = false;
  try {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    reduced = false;
  }
  return {
    v: 1,
    stars: { 1: 0, 2: 0, 3: 0, 4: 0 },
    piggyTotal: 0,
    piggyCounts: { 1: 0, 5: 0, 10: 0 },
    piggyCelebrated: false,
    unlocked: { bow: false, hat: false, glasses: false, crown: false, cape: false },
    equipped: { bow: false, hat: false, glasses: false, crown: false, cape: false },
    settings: {
      coinStyle: "cartoon",
      reducedMotion: reduced,
      muted: false,
      volume: 0.85,
    },
    seenHand: false,
  };
}

function merge(base, saved) {
  if (!saved || typeof saved !== "object") return base;
  return {
    ...base,
    ...saved,
    stars: { ...base.stars, ...(saved.stars || {}) },
    piggyCounts: { ...base.piggyCounts, ...(saved.piggyCounts || {}) },
    unlocked: { ...base.unlocked, ...(saved.unlocked || {}) },
    equipped: { ...base.equipped, ...(saved.equipped || {}) },
    settings: { ...base.settings, ...(saved.settings || {}) },
  };
}

export const store = {
  data: defaults(),
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      this.data = merge(defaults(), raw ? JSON.parse(raw) : null);
    } catch {
      this.data = defaults();
    }
    const unlocked = this.syncUnlocks();
    if (unlocked.length) this.save();
    return this.data;
  },
  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* private mode or full storage: keep playing in memory */
    }
  },
  totalStars() {
    return Object.values(this.data.stars).reduce((sum, n) => sum + (Number(n) || 0), 0);
  },
  setLevelStars(level, sessionCount) {
    const prev = Number(this.data.stars[level]) || 0;
    if (sessionCount > prev) this.data.stars[level] = sessionCount;
    const unlocked = this.syncUnlocks();
    this.save();
    return unlocked;
  },
  syncUnlocks() {
    const total = this.totalStars();
    const got = [];
    ACCESSORIES.forEach((acc) => {
      if (!acc.stars) return;
      if (total >= acc.stars && !this.data.unlocked[acc.id]) {
        this.data.unlocked[acc.id] = true;
        this.data.equipped[acc.id] = true;
        got.push(acc);
      }
    });
    return got;
  },
  unlockCape() {
    const fresh = !this.data.unlocked.cape;
    this.data.unlocked.cape = true;
    this.data.equipped.cape = true;
    this.data.piggyCelebrated = true;
    this.save();
    return fresh;
  },
  toggleEquip(id) {
    if (!this.data.unlocked[id]) return false;
    this.data.equipped[id] = !this.data.equipped[id];
    this.save();
    return this.data.equipped[id];
  },
  addCoins(values) {
    const before = this.data.piggyTotal;
    values.forEach((value) => {
      if (value === 1 || value === 5 || value === 10) {
        this.data.piggyCounts[value] += 1;
        this.data.piggyTotal += value;
      }
    });
    this.save();
    return before < 100 && this.data.piggyTotal >= 100;
  },
};

export function bellyCoins(counts, limit = 16) {
  const list = [];
  const push = (value, count, max) => {
    const n = Math.min(count || 0, max);
    for (let i = 0; i < n && list.length < limit; i += 1) list.push(value);
  };
  push(10, counts?.[10], 6);
  push(5, counts?.[5], 6);
  push(1, counts?.[1], 8);
  return list;
}
