/** Conversational Taiwan Mandarin lines. Speech says 塊; the price tags still say 元. */

import { ACCESSORIES, ITEMS, kuaiSpeak } from "./data.js";

export { kuaiSpeak };

export const FIXED = {
  "welcome-1": "歡迎來到兔兔水果攤！我們一個一個數，用一塊錢付錢喔。",
  "welcome-2": "熊熊冰淇淋車來囉！五個一塊可以變成一個五塊喔。",
  "welcome-3": "貓頭鷹玩具店到囉！十塊錢放十元區，一塊和五塊放另外一邊喔。",
  "welcome-4": "動物大賣場到囉！看看一共要付多少，付剛剛好喔。",
  "too-much": "太多囉，拿一個回來好不好？",
  cap: "最多到一百塊。",
  hint: "試試看發亮的這個錢錢。",
  "free-start": "把錢幣放進來玩吧！",
  "merge-5": "變成五塊囉！",
  "merge-10": "變成十塊囉！",
  "split-10": "換成兩個五塊囉！",
  "split-5": "換成五個一塊囉！",
  "exchange-on": "點一枚五塊或十塊，換成小錢錢。",
  "exchange-off": "換錢機先休息囉。",
  thanks: "謝謝光臨！",
  "praise-0": "哇～剛剛好耶！",
  "praise-1": "你好棒喔！",
  "praise-2": "豬豬寶好開心！",
  "praise-3": "你真的好厲害！",
  "praise-4": "太棒囉！",
  "unlock-lead": "還得到",
  gen: "跟",
  party: "存滿一百塊囉！好厲害！",
  reset: "清空囉，我們再玩一次吧！",
  zone: "十塊錢放在十元區。",
  preview: "嗨，我是豬豬寶！現在有十五塊。",
  "now-0": "現在沒有錢了。",
};

export const PRAISE_LINES = [0, 1, 2, 3, 4].map((index) => ({
  id: `praise-${index}`,
  text: FIXED[`praise-${index}`],
}));

export function fixedPlan(id) {
  return { text: FIXED[id], speakText: FIXED[id], parts: [id] };
}

export function clipCatalog() {
  const clips = { ...FIXED };
  for (let n = 1; n <= 100; n += 1) {
    const kuai = kuaiSpeak(n);
    clips[`ask-${n}`] = `要${kuai}`;
    clips[`total-${n}`] = `一共要${kuai}`;
    clips[`now-${n}`] = `現在有${kuai}`;
  }
  Object.entries(ITEMS).forEach(([id, item]) => {
    clips[`item-${id}`] = item.name;
  });
  ACCESSORIES.forEach((acc) => {
    clips[`acc-${acc.id}`] = acc.name;
  });
  return clips;
}

export function questionPlan(q) {
  const items = q.items || [];
  const total = Math.max(1, Math.min(100, Math.round(q.total)));
  if (items.length <= 1) {
    const item = items[0];
    const text = `${item.name}要${kuaiSpeak(total)}`;
    return { text, speakText: text, parts: [`item-${item.id}`, `ask-${total}`] };
  }
  const text = `${items.map((item) => item.name).join("跟")}一共要${kuaiSpeak(total)}`;
  const parts = [];
  items.forEach((item, index) => {
    if (index) parts.push("gen");
    parts.push(`item-${item.id}`);
  });
  parts.push(`total-${total}`);
  return { text, speakText: text, parts };
}

export function welcomeQuestionPlan(levelId, q) {
  const question = questionPlan(q);
  const welcome = fixedPlan(`welcome-${levelId}`);
  return {
    text: question.text,
    speakText: `${welcome.text}${question.text}`,
    parts: [...welcome.parts, ...question.parts],
  };
}

export function nowPlan(n, { zone = false } = {}) {
  const value = Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  const base = value === 0 ? fixedPlan("now-0") : {
    text: `現在有${kuaiSpeak(value)}`,
    speakText: `現在有${kuaiSpeak(value)}`,
    parts: [`now-${value}`],
  };
  if (!zone) return base;
  const extra = fixedPlan("zone");
  return {
    text: `${base.text}${extra.text}`,
    speakText: `${base.speakText}${extra.text}`,
    parts: [...base.parts, ...extra.parts],
  };
}

export function successPlan(praiseIndex, unlocked = []) {
  const praise = PRAISE_LINES[praiseIndex] || PRAISE_LINES[0];
  const parts = ["thanks", praise.id];
  let text = `謝謝光臨！${praise.text}`;
  if (unlocked.length) {
    text += "還得到";
    parts.push("unlock-lead");
    unlocked.forEach((acc, index) => {
      if (index) {
        text += "跟";
        parts.push("gen");
      }
      text += acc.name;
      parts.push(`acc-${acc.id}`);
    });
    text += "！";
  }
  return { text, speakText: text, parts };
}
