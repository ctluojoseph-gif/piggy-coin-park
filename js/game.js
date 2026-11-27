/** Touch-first coin play: levels, sandbox, parent questions, and the piggy bank. */

import {
  ACCESSORIES,
  ITEMS,
  LEVELS,
  PARENT_ITEM_IDS,
  PRAISE,
  createRng,
  makeQuestions,
  questionLine,
  validQuestion,
  yuanSpeak,
} from "./data.js";
import { accessorySVG, animalSVG, handSVG, itemSVG, piggySVG } from "./art.js";
import { audio } from "./audio.js";
import { bellyCoins, store } from "./storage.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const state = {
  screen: "home",
  mode: null,
  levelId: null,
  questions: [],
  qIndex: 0,
  tray: [],
  seq: 1,
  busy: false,
  merging: false,
  advanced: false,
  exchange: false,
  sessionStars: 0,
  allow: [1],
  guided: false,
  free: false,
  canMerge: false,
  theme: "fruit",
  keeper: "rabbit",
  hintTimer: 0,
  advanceTimer: 0,
  hintSpoken: false,
  toldZone: false,
  pendingParty: false,
  afterParty: null,
  picks: [],
  priceDigits: "",
};

const drags = new Map();

function motionOn() {
  return document.documentElement.dataset.motion !== "reduce";
}

function animMs(ms) {
  return motionOn() ? ms : 1;
}

function hasGoal() {
  return state.mode === "level" || state.mode === "parent";
}

function goal() {
  return state.questions[state.qIndex]?.total || 0;
}

function sum() {
  return state.tray.reduce((total, coin) => total + coin.value, 0);
}

function setPhase(phase) {
  document.body.dataset.screen = state.screen;
  document.body.dataset.phase = phase;
  const play = $("#play");
  if (play) play.dataset.phase = state.screen === "play" ? phase : "";
}

function clearFloaters() {
  $("#fx").replaceChildren();
  $("#drag-layer").replaceChildren();
}

function showScreen(name) {
  ["home", "play", "parent", "bank"].forEach((id) => {
    $(`#${id}`).classList.toggle("active", id === name);
  });
  state.screen = name;
  document.body.dataset.screen = name;
  $("#btn-home").classList.toggle("is-current", name === "home");
}

function openModal(sheetId) {
  $("#modal").classList.add("open");
  $("#modal").setAttribute("aria-hidden", "false");
  $$("#modal .sheet").forEach((sheet) => {
    sheet.hidden = sheet.id !== sheetId;
  });
}

function closeModal() {
  $("#modal").classList.remove("open");
  $("#modal").setAttribute("aria-hidden", "true");
}

function refreshPiggies() {
  const coins = bellyCoins(store.data.piggyCounts);
  $$("[data-piggy]").forEach((host) => {
    host.innerHTML = piggySVG({ coins, equipped: store.data.equipped });
  });
}

function mood(name) {
  $$(".piggy-slot").forEach((el) => {
    el.dataset.mood = name;
    if (name !== "idle") {
      el.classList.remove("mood-replay");
      void el.offsetWidth;
      el.classList.add("mood-replay");
    }
  });
}

function showBubble(text) {
  const bubble = $("#bubble");
  if (!bubble) return;
  bubble.textContent = text;
  bubble.classList.remove("pop");
  void bubble.offsetWidth;
  bubble.classList.add("pop");
}

function renderStarbar() {
  const bar = $("#starbar");
  if (state.screen === "play" && state.mode === "level") {
    bar.innerHTML = Array.from({ length: 6 }, (_, i) => (
      `<span class="star ${i < state.sessionStars ? "on" : ""}">★</span>`
    )).join("");
    bar.setAttribute("aria-label", `這一關拿到 ${state.sessionStars} 顆星星`);
    return;
  }
  const total = store.totalStars();
  bar.innerHTML = `<span class="star-total">★ ${total}</span>`;
  bar.setAttribute("aria-label", `一共 ${total} 顆星星`);
}

function renderHome() {
  const bubble = $("#home-bubble");
  if (store.data.piggyTotal >= 100) bubble.textContent = "我存滿一百元囉！";
  else if (store.totalStars() > 0) bubble.textContent = "我們再去逛街吧！";
  else bubble.textContent = "點一間商店，去付錢吧！";

  $("#street").innerHTML = [1, 2, 3, 4].map((id) => {
    const level = LEVELS[id];
    const stars = store.data.stars[id] || 0;
    const starHtml = [1, 2, 3, 4, 5, 6].map((n) => `<i class="${n <= stars ? "on" : ""}">★</i>`).join("");
    return `<button type="button" class="shop-card theme-${level.theme}" data-level="${id}" aria-label="${level.title}">
      <span class="awning"></span>
      <span class="shop-window" aria-hidden="true"></span>
      <span class="shop-animal">${animalSVG(level.keeper)}</span>
      <span class="shop-name">${level.name}</span>
      <span class="shop-stars" aria-hidden="true">${starHtml}</span>
      <span class="shop-blurb">${level.blurb}</span>
    </button>`;
  }).join("");
  refreshPiggies();
  renderStarbar();
}

function renderBank() {
  const total = store.data.piggyTotal;
  $("#bank-total").textContent = String(total);
  $("#bank-fill").style.width = `${Math.min(100, total)}%`;
  $("#bank-label").textContent = total >= 100 ? "存滿一百元囉！" : `再存 ${100 - total} 元就滿囉`;
  $("#acc-grid").innerHTML = ACCESSORIES.map((acc) => {
    const unlocked = !!store.data.unlocked[acc.id];
    const equipped = !!store.data.equipped[acc.id];
    return `<button type="button" class="acc-card ${unlocked ? "" : "locked"} ${equipped ? "on" : ""}" data-acc="${acc.id}" aria-pressed="${equipped}">
      <span class="acc-art">${accessorySVG(acc.id)}</span>
      <span class="acc-name">${acc.name}</span>
      <span class="acc-need">${unlocked ? (equipped ? "穿上了" : "點一點穿上") : acc.hint}</span>
    </button>`;
  }).join("");
  refreshPiggies();
}

function renderParentGrid() {
  $("#item-grid").innerHTML = PARENT_ITEM_IDS.map((id) => {
    const on = state.picks.includes(id);
    return `<button type="button" class="item-btn ${on ? "on" : ""}" data-item="${id}" aria-pressed="${on}">
      ${itemSVG(id)}
      <span>${ITEMS[id].name}</span>
    </button>`;
  }).join("");
  const picked = $("#picked");
  if (!state.picks.length) {
    picked.innerHTML = `<span class="picked-empty">還沒選商品</span>`;
  } else {
    picked.innerHTML = state.picks.map((id) => `<span class="picked-chip">${itemSVG(id)}<b>${ITEMS[id].name}</b></span>`).join("");
  }
  const price = Number(state.priceDigits || "0");
  $("#price-entry").textContent = state.priceDigits === "" ? "0" : String(price);
  const valid = state.picks.length >= 1 && price >= 1 && price <= 100;
  $("#btn-parent-start").classList.toggle("is-disabled", !valid);
  $("#btn-parent-start").setAttribute("aria-disabled", String(!valid));
}

function makeCoin(value, source) {
  const el = document.createElement("div");
  el.className = "coin";
  el.dataset.value = String(value);
  el.dataset.source = source;
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", `${value}元`);
  el.innerHTML = `<span class="disc"><span class="inner"><span class="face" aria-hidden="true"><i></i><i></i></span><span class="num">${value}</span></span></span>`;
  return el;
}

function buildSpawners(values) {
  const root = $("#spawners");
  root.innerHTML = "";
  values.forEach((value) => {
    const spawner = document.createElement("div");
    spawner.className = "spawner";
    spawner.dataset.value = String(value);
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.textContent = `${value}元`;
    spawner.append(makeCoin(value, "supply"), tag);
    root.appendChild(spawner);
  });
  root.dataset.count = String(values.length);
}

function clearTrayDom() {
  $("#zone-tens-coins").innerHTML = "";
  $("#zone-ones-coins").innerHTML = "";
  $$("#tray > .coin").forEach((el) => el.remove());
  state.tray = [];
}

function updateHud() {
  const now = sum();
  const sumEl = $("#sum");
  sumEl.textContent = String(now);
  sumEl.classList.remove("pop");
  void sumEl.offsetWidth;
  sumEl.classList.add("pop");
  $("#tray").dataset.sum = String(now);
  $("#tray").classList.toggle("has-coins", state.tray.length > 0);
  const empty = $("#tray-empty");
  if (state.free) {
    empty.hidden = state.tray.length > 0;
    empty.textContent = "拖進來玩吧";
  } else if (state.guided) {
    empty.hidden = true;
  } else {
    empty.hidden = state.tray.length > 0;
    empty.textContent = "把錢幣放這裡";
  }
  if (hasGoal()) {
    $("#goal").textContent = String(goal());
    $("#goal-card").hidden = false;
    $("#sum-k").textContent = "現在";
    $("#totals").classList.toggle("is-match", now === goal() && goal() > 0);
  } else {
    $("#goal-card").hidden = true;
    $("#sum-k").textContent = "一共";
    $("#totals").classList.remove("is-match");
  }
}

function updateMerge() {
  const ones = state.tray.filter((coin) => coin.value === 1).length;
  const fives = state.tray.filter((coin) => coin.value === 5).length;
  const show = state.canMerge && !state.busy && !state.merging;
  $("#btn-merge-5").hidden = !(show && ones >= 5);
  $("#btn-merge-10").hidden = !(show && fives >= 2);
  $("#btn-exchange").hidden = !state.canMerge || state.busy;
  $("#btn-reset-free").hidden = !state.free || state.busy;
  $("#btn-exchange").classList.toggle("is-on", state.exchange);
  $("#btn-exchange").setAttribute("aria-pressed", String(state.exchange));
  $("#tray").classList.toggle("exchange-on", state.exchange);
}

function renderGoods(q) {
  const showEach = q.items.length > 1
    && q.items.every((it) => Number(it.price) > 0)
    && q.items.reduce((total, it) => total + it.price, 0) === q.total;
  const dots = state.levelId === 1
    ? `<span class="dots" aria-hidden="true">${Array.from({ length: q.total }, () => "<i></i>").join("")}</span>`
    : "";
  $("#goods").innerHTML = `
    <div class="goods-row ${q.items.length > 1 ? "two" : ""}">
      ${q.items.map((it) => `<div class="good">
        <div class="good-art">${itemSVG(it.id)}</div>
        <div class="good-name">${it.name}</div>
        ${showEach ? `<div class="good-price">${it.price} 元</div>` : ""}
      </div>`).join("")}
    </div>
    <div class="price-tag"><span>${q.total}</span><small>${q.items.length > 1 ? "一共・元" : "元"}</small>${dots}</div>`;
}

function renderScene(customer) {
  const theme = state.theme;
  $("#shop").className = `scene theme-${theme}`;
  $("#shop").innerHTML = `
    <div class="awning"></div>
    <div class="scene-stage">
      <div class="keeper">${animalSVG(state.keeper)}</div>
      <div class="customer" id="customer">${customer ? animalSVG(customer) : animalSVG("chick")}</div>
      <div class="cust-bubble" id="cust-bubble" hidden>謝謝光臨！</div>
    </div>
    <div class="counter-strip"></div>`;
}

function configureTray() {
  const tray = $("#tray");
  tray.classList.toggle("guided", state.guided && !state.free);
  tray.classList.toggle("is-free", state.free);
  $("#zone-ones-label").textContent = state.guided && !state.free ? "一元／五元區" : "付款盤";
  $("#zone-tens").hidden = !(state.guided && !state.free);
}

function armHint() {
  clearTimeout(state.hintTimer);
  $$(".coin.is-hint").forEach((el) => el.classList.remove("is-hint"));
  if (!hasGoal() || state.busy || state.screen !== "play") return;
  state.hintTimer = setTimeout(() => {
    const remain = goal() - sum();
    if (remain <= 0) return;
    const choice = [...state.allow].sort((a, b) => b - a).find((value) => value <= remain) || state.allow[0];
    const el = document.querySelector(`.spawner[data-value="${choice}"] .coin`);
    el?.classList.add("is-hint");
    if (!state.hintSpoken) {
      state.hintSpoken = true;
      showBubble("試試看發亮的錢幣");
      audio.say("試試看這個");
    }
  }, 10000);
}

function renderQuestion() {
  const q = state.questions[state.qIndex];
  state.busy = false;
  state.merging = false;
  state.advanced = false;
  state.exchange = false;
  state.hintSpoken = false;
  clearTrayDom();
  $("#btn-next").hidden = true;
  $("#btn-next").textContent = nextLabel();
  renderGoods(q);
  renderScene(q.customer);
  configureTray();
  updateHud();
  updateMerge();
  const line = questionLine(q);
  showBubble(line);
  const spoken = state.qIndex === 0 && state.mode === "level"
    ? `${LEVELS[state.levelId].welcome}${line}`
    : line;
  audio.say(spoken, { rate: state.levelId === 1 ? 0.9 : 0.98 });
  const showHand = state.mode === "level" && state.levelId === 1 && state.qIndex === 0 && !store.data.seenHand;
  $("#hand-hint").hidden = !showHand;
  renderStarbar();
  setPhase("play");
  armHint();
  mood("idle");
}

function nextLabel() {
  if (state.mode === "parent") return "完成";
  if (state.mode === "level" && state.qIndex >= state.questions.length - 1) return "完成";
  return "下一題";
}

function openPlay(config) {
  clearTimeout(state.advanceTimer);
  closeModal();
  clearFloaters();
  Object.assign(state, {
    allow: config.allow,
    guided: !!config.guided,
    free: !!config.free,
    canMerge: !!config.merge,
    theme: config.theme,
    keeper: config.keeper,
    exchange: false,
    busy: false,
    merging: false,
    toldZone: false,
  });
  $("#title").textContent = config.title;
  showScreen("play");
  buildSpawners(config.allow);
  configureTray();
  refreshPiggies();
  renderStarbar();
  if (state.free) {
    clearTrayDom();
    $("#goods").innerHTML = `<div class="free-banner"><b>自由玩</b><span>拖一拖、點一點，聽聽看一共多少元</span></div>`;
    renderScene("chick");
    updateHud();
    updateMerge();
    showBubble("把錢幣放進來玩吧！");
    audio.say("把錢幣放進來玩吧");
    $("#hand-hint").hidden = true;
    $("#btn-next").hidden = true;
    setPhase("play");
    return;
  }
  renderQuestion();
}

function startLevel(id) {
  const qa = new URLSearchParams(location.search).get("qa") === "1";
  const rng = createRng((Date.now() % 99991) + id * 17);
  const questions = makeQuestions(id, rng, qa).filter(validQuestion).slice(0, 6);
  if (questions.length < 5) return;
  state.mode = "level";
  state.levelId = id;
  state.questions = questions;
  state.qIndex = 0;
  state.sessionStars = 0;
  const level = LEVELS[id];
  openPlay({
    allow: level.coins,
    guided: level.guided,
    merge: level.merge,
    free: false,
    theme: level.theme,
    keeper: level.keeper,
    title: level.title,
  });
}

function startFree() {
  state.mode = "free";
  state.levelId = null;
  state.questions = [];
  state.qIndex = 0;
  state.sessionStars = 0;
  openPlay({
    allow: [1, 5, 10],
    guided: false,
    merge: true,
    free: true,
    theme: "picnic",
    keeper: "panda",
    title: "自由玩",
  });
}

function startParentRound() {
  const price = Number(state.priceDigits || "0");
  if (state.picks.length < 1 || price < 1 || price > 100) {
    $("#parent-hint").textContent = "請選 1 到 2 樣商品，價錢要在 1 到 100 元。";
    return;
  }
  const items = state.picks.map((id) => ({ id, name: ITEMS[id].name }));
  const question = {
    items,
    total: price,
    customer: "dog",
  };
  state.mode = "parent";
  state.levelId = null;
  state.questions = [question];
  state.qIndex = 0;
  state.sessionStars = 0;
  openPlay({
    allow: [1, 5, 10],
    guided: true,
    merge: true,
    free: false,
    theme: "family",
    keeper: "fox",
    title: "親子出題",
  });
}

function goHome() {
  clearTimeout(state.hintTimer);
  clearTimeout(state.advanceTimer);
  drags.clear();
  clearFloaters();
  state.mode = null;
  state.busy = false;
  state.merging = false;
  state.tray = [];
  closeModal();
  $("#settings").classList.remove("open");
  $("#btn-next").hidden = true;
  $("#hand-hint").hidden = true;
  $("#title").textContent = "小豬存錢樂園";
  showScreen("home");
  renderHome();
  setPhase("home");
  mood("idle");
}

function goParent() {
  clearFloaters();
  state.picks = [];
  state.priceDigits = "";
  $("#parent-hint").textContent = "請家長選 1～2 樣商品，再輸入總價。";
  showScreen("parent");
  $("#title").textContent = "親子出題";
  renderParentGrid();
  renderStarbar();
  setPhase("parent");
}

function goBank() {
  clearFloaters();
  showScreen("bank");
  $("#title").textContent = "存錢筒";
  renderBank();
  renderStarbar();
  setPhase("bank");
  if (store.data.piggyTotal >= 100 && !store.data.piggyCelebrated) {
    openParty(() => {
      showScreen("bank");
      $("#title").textContent = "存錢筒";
      renderBank();
      setPhase("bank");
    });
  }
}

function overTray(x, y) {
  const rect = $("#tray").getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function pop(el) {
  el.classList.remove("landed");
  void el.offsetWidth;
  el.classList.add("landed");
}

function settleIntoTray(el, value, pointer) {
  el.dataset.value = String(value);
  el.dataset.source = state.free ? "mat" : "tray";
  el.setAttribute("aria-label", `${value}元`);
  const num = el.querySelector(".num");
  if (num) num.textContent = String(value);
  if (state.free) {
    const tray = $("#tray");
    const rect = tray.getBoundingClientRect();
    const size = 92;
    const rawX = (pointer?.x ?? rect.left + rect.width / 2) - rect.left - size / 2;
    const rawY = (pointer?.y ?? rect.top + rect.height / 2) - rect.top - size / 2;
    const x = Math.max(4, Math.min(rect.width - size - 4, rawX));
    const y = Math.max(4, Math.min(rect.height - size - 4, rawY));
    el.classList.remove("is-lifted", "is-dragging", "is-shake", "is-hint");
    el.style.position = "absolute";
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.width = "";
    el.style.height = "";
    tray.appendChild(el);
    pop(el);
    return;
  }
  const zone = value === 10 && state.guided ? $("#zone-tens-coins") : $("#zone-ones-coins");
  const first = el.getBoundingClientRect();
  el.classList.remove("is-lifted", "is-dragging", "is-shake", "is-hint");
  el.style.left = "";
  el.style.top = "";
  el.style.width = "";
  el.style.height = "";
  el.style.position = "";
  zone.appendChild(el);
  const last = el.getBoundingClientRect();
  const dx = first.left - last.left;
  const dy = first.top - last.top;
  if (motionOn() && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
    el.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(1.12)` },
      { transform: "translate(0,0) scale(1.05)", offset: 0.72 },
      { transform: "none" },
    ], { duration: animMs(340), easing: "cubic-bezier(.18,1.25,.36,1)" });
  } else {
    pop(el);
  }
}

function discardDrag(drag) {
  const el = drag.el;
  const spawnerCoin = document.querySelector(`.spawner[data-value="${drag.value}"] .coin`);
  const target = spawnerCoin ? spawnerCoin.getBoundingClientRect() : { left: 24, top: window.innerHeight - 100 };
  el.classList.remove("is-dragging");
  const left = el.style.left || `${el.getBoundingClientRect().left}px`;
  const top = el.style.top || `${el.getBoundingClientRect().top}px`;
  const anim = el.animate([
    { left, top, transform: "scale(1)" },
    { left: `${target.left}px`, top: `${target.top}px`, transform: "scale(.55)", opacity: 0.2 },
  ], { duration: animMs(320), easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
  const remove = () => el.remove();
  anim.onfinish = remove;
  setTimeout(remove, animMs(360));
}

function overpay(drag, message) {
  audio.boing();
  showBubble(message);
  audio.say(message);
  mood("oops");
  drag.el.classList.add("is-shake");
  drag.el.animate([
    { transform: "translateX(0) rotate(0)" },
    { transform: "translateX(-14px) rotate(-8deg)" },
    { transform: "translateX(14px) rotate(8deg)" },
    { transform: "translateX(-8px) rotate(-4deg)" },
    { transform: "translateX(0) rotate(0)" },
  ], { duration: animMs(420) }).onfinish = () => discardDrag(drag);
}

function rememberHand() {
  if (store.data.seenHand) return;
  store.data.seenHand = true;
  store.save();
  $("#hand-hint").hidden = true;
}

function payCoin(el, value, pointer) {
  if (state.busy || state.merging) {
    discardDrag({ el, value });
    return;
  }
  const next = sum() + value;
  const limit = hasGoal() ? goal() : 100;
  if (next > limit) {
    overpay({ el, value }, hasGoal() ? "太多囉～拿回來一個" : "最多到一百元喔");
    armHint();
    return;
  }
  const id = `c${state.seq++}`;
  el.dataset.coinId = id;
  state.tray.push({ id, value });
  settleIntoTray(el, value, state.free ? pointer : null);
  audio.coin(value);
  rememberHand();
  updateHud();
  if (hasGoal() && sum() === goal()) {
    beginSuccess();
  } else {
    let line = `${yuanSpeak(sum())}！`;
    if (value === 10 && state.guided && !state.toldZone) {
      state.toldZone = true;
      line = `${yuanSpeak(sum())}！十元放在十元區喔`;
    }
    showBubble(line);
    audio.say(line, { rate: state.levelId === 1 ? 0.86 : 1 });
    updateMerge();
    armHint();
  }
}

function returnCoin(drag) {
  const id = drag.el.dataset.coinId;
  if (id) state.tray = state.tray.filter((coin) => coin.id !== id);
  audio.boing();
  discardDrag(drag);
  updateHud();
  updateMerge();
  if (state.screen === "play" && !state.busy) {
    const line = `${yuanSpeak(sum())}！`;
    showBubble(line);
    audio.say(line);
  }
  armHint();
}

function suggestSplitMessage(value) {
  return value === 10 ? "換成兩個五元囉！" : "換成五個一元囉！";
}

function splitFromDrag(drag) {
  const parts = drag.value === 10 ? [5, 5] : [1, 1, 1, 1, 1];
  const id = drag.el.dataset.coinId;
  state.tray = state.tray.filter((coin) => coin.id !== id);
  const rect = drag.el.getBoundingClientRect();
  drag.el.remove();
  parts.forEach((value, index) => {
    const el = makeCoin(value, state.free ? "mat" : "tray");
    const coinId = `c${state.seq++}`;
    el.dataset.coinId = coinId;
    el.classList.add("is-lifted");
    const spread = (index - (parts.length - 1) / 2) * 16;
    el.style.left = `${rect.left + spread}px`;
    el.style.top = `${rect.top}px`;
    $("#drag-layer").appendChild(el);
    state.tray.push({ id: coinId, value });
    const pointer = state.free ? { x: rect.left + rect.width / 2 + spread, y: rect.top + rect.height / 2 } : null;
    settleIntoTray(el, value, pointer);
  });
  audio.whoosh();
  const line = suggestSplitMessage(drag.value);
  showBubble(line);
  audio.say(line);
  updateHud();
  updateMerge();
  armHint();
}

function mergeCoins(from, to) {
  if (state.busy || state.merging || !state.canMerge) return;
  const need = from === 1 ? 5 : 2;
  const chosen = state.tray.filter((coin) => coin.value === from).slice(0, need);
  if (chosen.length < need) return;
  state.merging = true;
  updateMerge();
  const els = chosen.map((coin) => document.querySelector(`[data-coin-id="${coin.id}"]`)).filter(Boolean);
  const rects = els.map((el) => el.getBoundingClientRect());
  const cx = rects.reduce((acc, rect) => acc + rect.left, 0) / Math.max(1, rects.length);
  const cy = rects.reduce((acc, rect) => acc + rect.top, 0) / Math.max(1, rects.length);
  audio.whoosh();
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    const ids = new Set(chosen.map((coin) => coin.id));
    state.tray = state.tray.filter((coin) => !ids.has(coin.id));
    els.forEach((el) => el.remove());
    const el = makeCoin(to, state.free ? "mat" : "tray");
    const id = `c${state.seq++}`;
    el.dataset.coinId = id;
    el.classList.add("is-lifted");
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;
    $("#drag-layer").appendChild(el);
    state.tray.push({ id, value: to });
    settleIntoTray(el, to, state.free ? { x: cx + 46, y: cy + 46 } : null);
    audio.coin(to);
    const line = to === 5 ? "變成五元囉！" : "變成十元囉！";
    showBubble(line);
    audio.say(line);
    state.merging = false;
    updateHud();
    updateMerge();
    armHint();
  };
  if (!motionOn() || !els.length) {
    finish();
    return;
  }
  let done = 0;
  els.forEach((el) => {
    const rect = el.getBoundingClientRect();
    el.animate([
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${cx - rect.left}px, ${cy - rect.top}px) scale(.35)`, opacity: 0.15 },
    ], { duration: 380, easing: "ease-in", fill: "forwards" }).onfinish = () => {
      done += 1;
      if (done === els.length) finish();
    };
  });
  setTimeout(finish, 520);
}

function confetti() {
  if (!motionOn()) return;
  const layer = $("#fx");
  const colors = ["#ff8fb3", "#ffe08a", "#7ddeba", "#8ecbff", "#ffb38a", "#fff"];
  for (let i = 0; i < 42; i += 1) {
    const bit = document.createElement("i");
    bit.className = "confetti";
    bit.style.left = `${Math.random() * 100}%`;
    bit.style.background = colors[i % colors.length];
    bit.style.animationDelay = `${Math.random() * 0.15}s`;
    bit.style.transform = `rotate(${Math.random() * 80 - 40}deg)`;
    layer.appendChild(bit);
    setTimeout(() => bit.remove(), 1700);
  }
}

function flyStar(target) {
  if (!target) return;
  const from = $("#customer") || $("#goods");
  const start = from.getBoundingClientRect();
  const end = target.getBoundingClientRect();
  const star = document.createElement("div");
  star.className = "fly-star";
  star.textContent = "★";
  star.style.left = `${start.left + start.width / 2}px`;
  star.style.top = `${start.top}px`;
  $("#fx").appendChild(star);
  const finish = () => star.remove();
  if (!motionOn()) {
    finish();
    return;
  }
  star.animate([
    { left: star.style.left, top: star.style.top, transform: "scale(1)" },
    { left: `${end.left}px`, top: `${end.top}px`, transform: "scale(1.45)" },
  ], { duration: 700, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }).onfinish = finish;
}

function flyCoinsToPiggy() {
  if (!motionOn()) return;
  const target = document.querySelector('[data-where="play"]');
  if (!target) return;
  const tr = target.getBoundingClientRect();
  $$("#tray .coin").slice(0, 8).forEach((coin, index) => {
    const rect = coin.getBoundingClientRect();
    const ghost = coin.cloneNode(true);
    ghost.classList.add("ghost");
    ghost.style.position = "fixed";
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    ghost.style.margin = "0";
    ghost.style.zIndex = "6";
    $("#fx").appendChild(ghost);
    const lifetime = 680 + index * 45;
    ghost.animate([
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${tr.left + tr.width / 2 - rect.left - 20}px, ${tr.top + 30 - rect.top}px) scale(.25)`, opacity: 0.15 },
    ], { duration: 680, delay: index * 45, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }).onfinish = () => ghost.remove();
    setTimeout(() => ghost.remove(), lifetime + 80);
  });
}

function beginSuccess() {
  state.busy = true;
  updateMerge();
  const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
  let speech = `謝謝光臨！${praise}`;
  let unlocked = [];
  if (state.mode === "level") {
    state.sessionStars += 1;
    unlocked = store.setLevelStars(state.levelId, state.sessionStars);
    const star = $(`#starbar .star:nth-child(${state.sessionStars})`);
    if (star) star.classList.add("on");
    flyStar(star);
  }
  if (unlocked.length) {
    speech += `解鎖了${unlocked.map((acc) => acc.name).join("和")}！`;
  }
  const crossed = store.addCoins(state.tray.map((coin) => coin.value));
  state.pendingParty = crossed && !store.data.piggyCelebrated;
  refreshPiggies();
  audio.fanfare();
  confetti();
  mood("happy");
  $("#customer")?.classList.add("dance");
  const custBubble = $("#cust-bubble");
  if (custBubble) {
    custBubble.hidden = false;
    custBubble.textContent = "謝謝光臨！";
  }
  showBubble(speech);
  audio.say(speech, { rate: 0.95 });
  flyCoinsToPiggy();
  $("#btn-next").hidden = false;
  $("#btn-next").textContent = nextLabel();
  setPhase("success");
  const wait = state.mode === "level" && state.qIndex < state.questions.length - 1 ? 2800 : 2000;
  clearTimeout(state.advanceTimer);
  state.advanceTimer = setTimeout(continueAfterSuccess, motionOn() ? wait : 40);
}

function continueAfterSuccess() {
  if (state.advanced || state.screen !== "play") return;
  state.advanced = true;
  clearTimeout(state.advanceTimer);
  $("#btn-next").hidden = true;
  if (state.pendingParty) {
    state.pendingParty = false;
    openParty(() => finishAdvance());
    return;
  }
  finishAdvance();
}

function finishAdvance() {
  state.busy = false;
  if (state.mode === "level" && state.qIndex >= state.questions.length - 1) {
    openLevelClear();
    return;
  }
  if (state.mode === "parent") {
    openParentDone();
    return;
  }
  state.qIndex += 1;
  renderQuestion();
}

function openLevelClear() {
  const level = LEVELS[state.levelId];
  const buttons = [
    { label: "再玩一次", onClick: () => startLevel(state.levelId) },
    { label: "回首頁", onClick: goHome, soft: true },
  ];
  if (state.levelId < 4) {
    buttons.splice(1, 0, { label: "下一關", primary: true, onClick: () => startLevel(state.levelId + 1) });
  }
  showClear({
    title: `${level.name}完成囉！`,
    msg: `這一次拿到 ${state.sessionStars} 顆星星。豬豬寶把錢幣收進肚子裡囉。`,
    buttons,
  });
}

function openParentDone() {
  showClear({
    title: "付好囉！",
    msg: "謝謝光臨！可以再出一題，或回首頁。",
    buttons: [
      { label: "再出一題", primary: true, onClick: goParent },
      { label: "回首頁", onClick: goHome, soft: true },
    ],
  });
}

function showClear({ title, msg, buttons }) {
  $("#clear-title").textContent = title;
  $("#clear-msg").textContent = msg;
  $("#clear-art").innerHTML = piggySVG({
    coins: bellyCoins(store.data.piggyCounts),
    equipped: store.data.equipped,
  });
  const box = $("#clear-actions");
  box.innerHTML = "";
  buttons.forEach((button) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = button.primary ? "btn btn-primary" : "btn btn-soft";
    el.textContent = button.label;
    el.addEventListener("click", button.onClick);
    box.appendChild(el);
  });
  openModal("sheet-clear");
  setPhase("clear");
  mood("happy");
}

function openParty(done) {
  store.unlockCape();
  refreshPiggies();
  audio.fanfare();
  confetti();
  state.afterParty = done;
  $("#party-art").innerHTML = piggySVG({
    coins: bellyCoins(store.data.piggyCounts),
    equipped: store.data.equipped,
  });
  openModal("sheet-party");
  setPhase("party");
  audio.say("存滿一百元囉！好厲害！");
}

function onPointerDown(event) {
  if (event.button > 0) return;
  audio.unlock();
  const spawner = event.target.closest?.(".spawner");
  let el = event.target.closest?.(".coin");
  if (!el && spawner) el = spawner.querySelector(":scope > .coin");
  if (!el || el.classList.contains("is-sample")) return;
  if (el.closest("#settings") || el.closest("#modal")) return;
  if ([...drags.values()].some((drag) => drag.el === el)) return;
  if (state.busy || state.merging) {
    event.preventDefault();
    return;
  }
  if (state.screen !== "play") return;
  event.preventDefault();
  const source = el.dataset.source || (spawner ? "supply" : "tray");
  const value = Number(el.dataset.value);
  if (!value) return;
  if (source === "supply") {
    const clone = el.cloneNode(true);
    clone.classList.remove("is-hint", "is-lifted", "is-dragging", "is-shake");
    el.parentElement.appendChild(clone);
  }
  const rect = el.getBoundingClientRect();
  try { el.setPointerCapture(event.pointerId); } catch { /* pointer may already be gone */ }
  el.classList.add("is-lifted");
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.top}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
  $("#drag-layer").appendChild(el);
  drags.set(event.pointerId, {
    el,
    value,
    source,
    dx: event.clientX - rect.left,
    dy: event.clientY - rect.top,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
  });
  armHint();
}

function onPointerMove(event) {
  const drag = drags.get(event.pointerId);
  if (!drag) return;
  const x = event.clientX - drag.dx;
  const y = event.clientY - drag.dy;
  drag.el.style.left = `${x}px`;
  drag.el.style.top = `${y}px`;
  if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 12) {
    drag.moved = true;
    drag.el.classList.add("is-dragging");
  }
}

function onPointerUp(event) {
  const drag = drags.get(event.pointerId);
  if (!drag) return;
  drags.delete(event.pointerId);
  try { drag.el.releasePointerCapture(event.pointerId); } catch { /* already released */ }
  const point = { x: event.clientX, y: event.clientY };
  if (!drag.moved) {
    if (drag.source === "supply") payCoin(drag.el, drag.value, point);
    else if (state.exchange && (drag.value === 5 || drag.value === 10)) splitFromDrag(drag);
    else returnCoin(drag);
    return;
  }
  const inside = overTray(point.x, point.y);
  if (drag.source === "supply") {
    if (inside) payCoin(drag.el, drag.value, point);
    else discardDrag(drag);
    return;
  }
  if (inside) settleIntoTray(drag.el, drag.value, state.free ? point : null);
  else returnCoin(drag);
}

function resetFree() {
  if (!state.free || state.busy) return;
  clearTrayDom();
  updateHud();
  updateMerge();
  showBubble("清空囉，再玩一次吧！");
  audio.say("再玩一次吧");
}

function applySettings() {
  const settings = store.data.settings;
  document.documentElement.dataset.coins = settings.coinStyle === "realistic" ? "realistic" : "cartoon";
  document.documentElement.dataset.motion = settings.reducedMotion ? "reduce" : "full";
  audio.setMuted(settings.muted);
  audio.setVolume(settings.volume);
  $("#btn-sound").setAttribute("aria-pressed", String(settings.muted));
  $("#btn-sound").setAttribute("aria-label", settings.muted ? "打開聲音" : "安靜");
  $("#ico-sound-on").hidden = settings.muted;
  $("#ico-sound-off").hidden = !settings.muted;
  $$(".style-pick").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.style === document.documentElement.dataset.coins);
  });
  $("#motion-toggle").classList.toggle("is-on", !settings.reducedMotion);
  $("#motion-toggle").setAttribute("aria-pressed", String(!settings.reducedMotion));
  $("#motion-label").textContent = settings.reducedMotion ? "動畫關" : "動畫開";
  const slider = $("#volume");
  slider.value = String(Math.round(settings.volume * 100));
}

function bindPad() {
  const pad = $("#keypad");
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "清", "0", "⌫"];
  pad.innerHTML = keys.map((key) => `<button type="button" class="key" data-key="${key}">${key}</button>`).join("");
  pad.addEventListener("click", (event) => {
    const key = event.target.closest(".key")?.dataset.key;
    if (!key) return;
    audio.unlock();
    if (key === "清") state.priceDigits = "";
    else if (key === "⌫") state.priceDigits = state.priceDigits.slice(0, -1);
    else {
      const next = (state.priceDigits + key).replace(/^0+(?=\d)/, "");
      const value = Number(next);
      if (next.length > 3 || value > 100) {
        $("#parent-hint").textContent = "最多一百元喔。";
        return;
      }
      state.priceDigits = next;
    }
    $("#parent-hint").textContent = "請家長選 1～2 樣商品，再輸入總價。";
    renderParentGrid();
  });
}

function bind() {
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerUp);
  document.addEventListener("contextmenu", (event) => event.preventDefault());

  $("#btn-home").addEventListener("click", () => {
    audio.unlock();
    if (state.screen !== "home") goHome();
    else mood("happy");
  });
  $("#street").addEventListener("click", (event) => {
    const card = event.target.closest(".shop-card");
    if (!card) return;
    audio.unlock();
    startLevel(Number(card.dataset.level));
  });
  $("#btn-free").addEventListener("click", () => { audio.unlock(); startFree(); });
  $("#btn-parent").addEventListener("click", () => { audio.unlock(); goParent(); });
  $("#btn-bank").addEventListener("click", () => { audio.unlock(); goBank(); });
  $("#btn-merge-5").addEventListener("click", () => mergeCoins(1, 5));
  $("#btn-merge-10").addEventListener("click", () => mergeCoins(5, 10));
  $("#btn-exchange").addEventListener("click", () => {
    if (!state.canMerge || state.busy) return;
    audio.unlock();
    state.exchange = !state.exchange;
    updateMerge();
    const line = state.exchange ? "點一枚五元或十元，換成小錢錢" : "換錢機先休息囉";
    showBubble(line);
    audio.say(line);
  });
  $("#btn-reset-free").addEventListener("click", resetFree);
  $("#btn-next").addEventListener("click", continueAfterSuccess);
  $("#btn-party-ok").addEventListener("click", () => {
    closeModal();
    const done = state.afterParty;
    state.afterParty = null;
    if (done) done();
  });
  $("#item-grid").addEventListener("click", (event) => {
    const btn = event.target.closest(".item-btn");
    if (!btn) return;
    const id = btn.dataset.item;
    if (state.picks.includes(id)) state.picks = state.picks.filter((item) => item !== id);
    else if (state.picks.length >= 2) {
      $("#parent-hint").textContent = "最多兩樣喔。點一下可以取消。";
      return;
    } else state.picks.push(id);
    renderParentGrid();
  });
  $("#btn-parent-start").addEventListener("click", () => { audio.unlock(); startParentRound(); });
  $("#acc-grid").addEventListener("click", (event) => {
    const card = event.target.closest(".acc-card");
    if (!card) return;
    const id = card.dataset.acc;
    if (!store.data.unlocked[id]) {
      $("#bank-label").textContent = "再收集一點點就解鎖囉";
      mood("happy");
      return;
    }
    store.toggleEquip(id);
    renderBank();
    mood("happy");
  });
  $("#btn-settings").addEventListener("click", () => {
    audio.unlock();
    $("#settings").classList.add("open");
    $("#settings").setAttribute("aria-hidden", "false");
  });
  $("#btn-settings-close").addEventListener("click", () => {
    $("#settings").classList.remove("open");
    $("#settings").setAttribute("aria-hidden", "true");
  });
  $$(".style-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.data.settings.coinStyle = btn.dataset.style;
      store.save();
      applySettings();
    });
  });
  $("#motion-toggle").addEventListener("click", () => {
    store.data.settings.reducedMotion = !store.data.settings.reducedMotion;
    store.save();
    applySettings();
  });
  $("#volume").addEventListener("input", () => {
    store.data.settings.volume = Number($("#volume").value) / 100;
    if (store.data.settings.volume > 0 && store.data.settings.muted) store.data.settings.muted = false;
    store.save();
    applySettings();
    audio.unlock();
  });
  $("#btn-sound").addEventListener("click", () => {
    audio.unlock();
    store.data.settings.muted = !store.data.settings.muted;
    store.save();
    applySettings();
    if (!store.data.settings.muted) audio.coin(1);
  });
  bindPad();
}

function guardGestures() {
  document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("gesturechange", (event) => event.preventDefault(), { passive: false });
  document.addEventListener("touchmove", (event) => {
    if (event.touches.length > 1) event.preventDefault();
  }, { passive: false });
}

export function startGame() {
  store.load();
  $("#hand-hint").innerHTML = handSVG();
  applySettings();
  bind();
  guardGestures();
  renderHome();
  refreshPiggies();
  showScreen("home");
  setPhase("home");
  window.speechSynthesis?.getVoices?.();
  window.speechSynthesis?.addEventListener?.("voiceschanged", () => audio.primeSpeech());
}
