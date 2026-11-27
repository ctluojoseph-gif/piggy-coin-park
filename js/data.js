/** Game content, question builder, and Traditional Chinese money speech. */

export const ITEMS = {
  apple: { name: "蘋果" },
  banana: { name: "香蕉" },
  grape: { name: "葡萄" },
  orange: { name: "橘子" },
  berry: { name: "草莓" },
  melon: { name: "西瓜" },
  peach: { name: "水蜜桃" },
  pear: { name: "梨子" },
  cone: { name: "甜筒" },
  sundae: { name: "聖代" },
  popsicle: { name: "冰棒" },
  cup: { name: "霜淇淋" },
  scoop: { name: "雙球冰淇淋" },
  choco: { name: "巧克力杯" },
  ball: { name: "皮球" },
  teddy: { name: "小熊玩偶" },
  car: { name: "小汽車" },
  blocks: { name: "積木" },
  robot: { name: "機器人" },
  drum: { name: "小鼓" },
  kite: { name: "風箏" },
  train: { name: "小火車" },
  bread: { name: "麵包" },
  milk: { name: "牛奶" },
  fish: { name: "小魚" },
  carrot: { name: "紅蘿蔔" },
  cake: { name: "蛋糕" },
  juice: { name: "果汁" },
  cookie: { name: "餅乾" },
  flower: { name: "花朵" },
  cheese: { name: "起司" },
};

export const LEVELS = {
  1: {
    id: 1,
    name: "兔兔水果攤",
    title: "第 1 關・兔兔水果攤",
    keeper: "rabbit",
    theme: "fruit",
    coins: [1],
    guided: false,
    merge: false,
    blurb: "只用 1 元",
    welcome: "歡迎來到兔兔水果攤！我們一個一個數，用一塊錢付錢喔。",
  },
  2: {
    id: 2,
    name: "熊熊冰淇淋車",
    title: "第 2 關・熊熊冰淇淋車",
    keeper: "bear",
    theme: "ice",
    coins: [1, 5],
    guided: false,
    merge: true,
    blurb: "1 元和 5 元",
    welcome: "熊熊冰淇淋車來囉！五個一塊可以變成一個五塊喔。",
  },
  3: {
    id: 3,
    name: "貓頭鷹玩具店",
    title: "第 3 關・貓頭鷹玩具店",
    keeper: "owl",
    theme: "toy",
    coins: [1, 5, 10],
    guided: true,
    merge: true,
    blurb: "1、5、10 元",
    welcome: "貓頭鷹玩具店到囉！十塊錢放十元區，一塊和五塊放另外一邊喔。",
  },
  4: {
    id: 4,
    name: "動物大賣場",
    title: "第 4 關・動物大賣場",
    keeper: "cat",
    theme: "market",
    coins: [1, 5, 10],
    guided: true,
    merge: true,
    blurb: "兩樣也沒問題",
    welcome: "動物大賣場到囉！看看一共要付多少，付剛剛好喔。",
  },
};

export const ACCESSORIES = [
  { id: "bow", name: "粉紅蝴蝶結", stars: 1, hint: "得到 1 顆星星" },
  { id: "hat", name: "草莓帽", stars: 3, hint: "得到 3 顆星星" },
  { id: "glasses", name: "圓圓眼鏡", stars: 6, hint: "得到 6 顆星星" },
  { id: "crown", name: "小皇冠", stars: 12, hint: "得到 12 顆星星" },
  { id: "cape", name: "星星披風", piggy: 100, hint: "存滿 100 元" },
];

export const PARENT_ITEM_IDS = [
  "apple", "banana", "berry", "melon", "cone", "popsicle",
  "ball", "teddy", "car", "kite", "bread", "milk", "cake", "cookie", "juice", "flower",
];

const FRUITS = ["apple", "banana", "grape", "orange", "berry", "melon", "peach", "pear"];
const ICES = ["cone", "sundae", "popsicle", "cup", "scoop", "choco"];
const TOYS = ["ball", "teddy", "car", "blocks", "robot", "drum", "kite", "train"];
const CUSTOMERS = ["cat", "dog", "panda", "fox", "frog", "penguin", "chick", "squirrel", "rabbit", "bear", "owl"];

const QA = {
  1: pricesToQuestions([3, 5, 2, 4, 8, 1], FRUITS, "rabbit"),
  2: pricesToQuestions([12, 8, 15, 6, 10, 20], ICES, "bear"),
  3: pricesToQuestions([26, 15, 40, 10, 33, 50], TOYS, "owl"),
  4: [
    bundle([["bread", 30], ["milk", 25]], "dog"),
    bundle([["cake", 40]], "frog"),
    bundle([["fish", 18], ["carrot", 12]], "penguin"),
    bundle([["juice", 22], ["cookie", 18]], "chick"),
    bundle([["teddy", 36]], "fox"),
    bundle([["flower", 15], ["bread", 20]], "panda"),
  ],
};

function itemOf(id, price) {
  return { id, name: ITEMS[id].name, price };
}

function bundle(pairs, customer) {
  const items = pairs.map(([id, price]) => itemOf(id, price));
  const total = items.reduce((sum, it) => sum + it.price, 0);
  return { items, total, customer };
}

function pricesToQuestions(prices, ids, keeper) {
  return prices.map((price, i) => bundle([[ids[i % ids.length], price]], CUSTOMERS[i % CUSTOMERS.length] === keeper ? "chick" : CUSTOMERS[i % CUSTOMERS.length]));
}

const DIGIT = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

export function yuanSpeak(n) {
  return amountSpeak(n, "元");
}

export function kuaiSpeak(n) {
  return amountSpeak(n, "塊");
}

function amountSpeak(n, unit) {
  n = Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  if (n === 0) return `零${unit}`;
  if (n === 100) return `一百${unit}`;
  if (n < 10) return (n === 2 ? "兩" : DIGIT[n]) + unit;
  if (n === 10) return `十${unit}`;
  if (n < 20) return `十${DIGIT[n - 10]}${unit}`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${DIGIT[tens]}十${ones ? DIGIT[ones] : ""}${unit}`;
}

export function questionLine(q) {
  const total = kuaiSpeak(q.total);
  if (q.items.length === 1) return `${q.items[0].name}要${total}喔`;
  return `${q.items.map((item) => item.name).join("跟")}一共要${total}喔`;
}

export function createRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function shuffle(rng, list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function customersFor(rng, keeper) {
  return shuffle(rng, CUSTOMERS.filter((id) => id !== keeper));
}

export function makeQuestions(levelId, rng, qa = false) {
  if (qa && QA[levelId]) return QA[levelId].map((q) => ({ ...q, items: q.items.map((it) => ({ ...it })) }));
  if (levelId === 1) {
    return singles(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], FRUITS, "rabbit");
  }
  if (levelId === 2) {
    return singles(rng, [5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20], ICES, "bear");
  }
  if (levelId === 3) {
    return singles(rng, [10, 12, 15, 16, 18, 20, 24, 25, 30, 32, 36, 40, 45, 50], TOYS, "owl");
  }
  return marketQuestions(rng);
}

function singles(rng, pricePool, itemIds, keeper) {
  const prices = shuffle(rng, pricePool).slice(0, 6);
  const items = shuffle(rng, itemIds);
  const people = customersFor(rng, keeper);
  return prices.map((price, i) => {
    const id = items[i % items.length];
    return {
      items: [itemOf(id, price)],
      total: price,
      customer: people[i % people.length],
    };
  });
}

function marketQuestions(rng) {
  const doubles = [
    [["bread", 30], ["milk", 25]],
    [["fish", 18], ["carrot", 12]],
    [["juice", 22], ["cookie", 18]],
    [["flower", 15], ["bread", 20]],
    [["cake", 36], ["berry", 14]],
    [["cheese", 28], ["milk", 22]],
    [["melon", 40], ["cookie", 15]],
    [["teddy", 33], ["ball", 17]],
    [["juice", 35], ["bread", 25]],
    [["cake", 45], ["milk", 20]],
  ];
  const singlesPool = [
    ["cake", 40],
    ["juice", 26],
    ["train", 45],
    ["robot", 32],
    ["milk", 15],
    ["cookie", 8],
    ["flower", 21],
    ["bread", 60],
    ["melon", 70],
    ["robot", 80],
    ["kite", 55],
    ["cheese", 16],
  ];
  const people = customersFor(rng, "cat");
  const picked = [
    ...shuffle(rng, doubles).slice(0, 3).map((pairs) => pairs),
    ...shuffle(rng, singlesPool).slice(0, 3).map((pair) => [pair]),
  ];
  return shuffle(rng, picked).map((pairs, i) => bundle(pairs, people[i % people.length])).filter(validQuestion);
}

export function validQuestion(q) {
  if (!q || !Array.isArray(q.items) || q.items.length < 1 || q.items.length > 2) return false;
  const total = q.items.reduce((sum, it) => sum + it.price, 0);
  return total === q.total && total >= 1 && total <= 100 && q.items.every((it) => it.price >= 1);
}

export const PRAISE = ["哇～剛剛好耶！", "你好棒喔！", "豬豬寶好開心！", "你真的好厲害！", "太棒囉！"];
