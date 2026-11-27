/** Cheerful inline SVG characters, items, and the piggy bank. */

let piggyUid = 0;

function eyes(x1, x2, y, r = 8) {
  return `
    <ellipse cx="${x1}" cy="${y}" rx="${r}" ry="${r + 2}" fill="#fff"/>
    <ellipse cx="${x2}" cy="${y}" rx="${r}" ry="${r + 2}" fill="#fff"/>
    <circle cx="${x1 + 1.2}" cy="${y + 1}" r="${Math.max(2.4, r - 3.2)}" fill="#3a2a30"/>
    <circle cx="${x2 + 1.2}" cy="${y + 1}" r="${Math.max(2.4, r - 3.2)}" fill="#3a2a30"/>
    <circle cx="${x1 - 1.4}" cy="${y - 1.6}" r="1.7" fill="#fff"/>
    <circle cx="${x2 - 1.4}" cy="${y - 1.6}" r="1.7" fill="#fff"/>`;
}

function blush(x1, x2, y) {
  return `<ellipse cx="${x1}" cy="${y}" rx="8" ry="4.5" fill="#ff8fb3" opacity=".8"/>
          <ellipse cx="${x2}" cy="${y}" rx="8" ry="4.5" fill="#ff8fb3" opacity=".8"/>`;
}

function smile(x, y, w = 22) {
  return `<path d="M${x - w / 2} ${y} Q${x} ${y + 10} ${x + w / 2} ${y}" fill="none" stroke="#5a3040" stroke-width="2.6" stroke-linecap="round"/>`;
}

const ANIMALS = {
  rabbit: {
    body: "#fffdfc",
    belly: "#ffe4ee",
    ears: `<ellipse cx="48" cy="58" rx="14" ry="36" fill="#fffdfc" transform="rotate(-12 48 58)"/>
           <ellipse cx="48" cy="58" rx="7" ry="24" fill="#ffd0e0" transform="rotate(-12 48 58)"/>
           <ellipse cx="112" cy="58" rx="14" ry="36" fill="#fffdfc" transform="rotate(12 112 58)"/>
           <ellipse cx="112" cy="58" rx="7" ry="24" fill="#ffd0e0" transform="rotate(12 112 58)"/>`,
  },
  bear: {
    body: "#d08a45",
    belly: "#f6d7ae",
    ears: `<circle cx="42" cy="62" r="20" fill="#d08a45"/><circle cx="42" cy="62" r="10" fill="#f0c088"/>
           <circle cx="118" cy="62" r="20" fill="#d08a45"/><circle cx="118" cy="62" r="10" fill="#f0c088"/>`,
    extra: `<ellipse cx="80" cy="118" rx="16" ry="12" fill="#f6d7ae"/>
            <ellipse cx="74" cy="118" rx="3" ry="4" fill="#6b3a2a"/><ellipse cx="86" cy="118" rx="3" ry="4" fill="#6b3a2a"/>`,
  },
  owl: {
    body: "#8d6b4a",
    belly: "#f3e2c2",
    ears: `<path d="M40 78 L52 36 L70 74 Z" fill="#8d6b4a"/><path d="M120 78 L108 36 L90 74 Z" fill="#8d6b4a"/>`,
    eye: 13,
    mouth: `<path d="M80 124 L72 134 L88 134 Z" fill="#e8a04a"/>`,
  },
  cat: {
    body: "#ffb067",
    belly: "#fff1dc",
    ears: `<path d="M38 86 L48 40 L74 78 Z" fill="#ffb067"/><path d="M46 74 L52 52 L66 74 Z" fill="#ffb7c4"/>
            <path d="M122 86 L112 40 L86 78 Z" fill="#ffb067"/><path d="M114 74 L108 52 L94 74 Z" fill="#ffb7c4"/>`,
    extra: `<path d="M28 112 H52 M108 112 H132 M34 122 H50 M110 122 H126" stroke="#5a3040" stroke-width="2" stroke-linecap="round"/>`,
  },
  dog: {
    body: "#e6b15a",
    belly: "#fff6e4",
    ears: `<ellipse cx="36" cy="100" rx="16" ry="28" fill="#c9843a" transform="rotate(-18 36 100)"/>
           <ellipse cx="124" cy="100" rx="16" ry="28" fill="#c9843a" transform="rotate(18 124 100)"/>`,
    mouth: `<path d="M68 126 Q80 138 92 126" fill="none" stroke="#5a3040" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M80 130 Q86 140 80 142 Q74 138 80 130" fill="#ff8b9a"/>`,
  },
  panda: {
    body: "#fffdfc",
    belly: "#f4f4f4",
    ears: `<circle cx="42" cy="64" r="18" fill="#2c2c2c"/><circle cx="118" cy="64" r="18" fill="#2c2c2c"/>`,
    extra: `<ellipse cx="58" cy="104" rx="16" ry="14" fill="#2c2c2c" transform="rotate(-18 58 104)"/>
            <ellipse cx="102" cy="104" rx="16" ry="14" fill="#2c2c2c" transform="rotate(18 102 104)"/>`,
    eye: 7,
  },
  fox: {
    body: "#ff8a3d",
    belly: "#fff4e8",
    ears: `<path d="M40 88 L52 34 L78 80 Z" fill="#ff8a3d"/><path d="M48 76 L56 48 L70 76 Z" fill="#ffe0c2"/>
           <path d="M120 88 L108 34 L82 80 Z" fill="#ff8a3d"/><path d="M112 76 L104 48 L90 76 Z" fill="#ffe0c2"/>`,
  },
  frog: {
    body: "#7dce63",
    belly: "#e7f8c8",
    ears: `<circle cx="48" cy="70" r="18" fill="#7dce63"/><circle cx="112" cy="70" r="18" fill="#7dce63"/>
           <circle cx="48" cy="70" r="9" fill="#fff"/><circle cx="112" cy="70" r="9" fill="#fff"/>
           <circle cx="50" cy="71" r="4" fill="#3a2a30"/><circle cx="114" cy="71" r="4" fill="#3a2a30"/>`,
    eye: 0,
    mouth: `<path d="M58 128 Q80 148 102 128" fill="none" stroke="#3f6b32" stroke-width="3" stroke-linecap="round"/>`,
  },
  penguin: {
    body: "#355070",
    belly: "#fffdfc",
    ears: `<ellipse cx="46" cy="120" rx="12" ry="22" fill="#355070" transform="rotate(18 46 120)"/>
           <ellipse cx="114" cy="120" rx="12" ry="22" fill="#355070" transform="rotate(-18 114 120)"/>`,
    mouth: `<path d="M70 124 L90 124 L80 134 Z" fill="#f2b544"/>`,
  },
  chick: {
    body: "#ffe56a",
    belly: "#fff4b0",
    ears: `<path d="M80 58 L72 40 L88 40 Z" fill="#ffb703"/>`,
    mouth: `<path d="M72 124 L88 124 L80 132 Z" fill="#ff8a3d"/>`,
  },
  squirrel: {
    body: "#e08a45",
    belly: "#ffe1c2",
    ears: `<ellipse cx="50" cy="66" rx="12" ry="16" fill="#e08a45"/><ellipse cx="110" cy="66" rx="12" ry="16" fill="#e08a45"/>`,
    extra: `<path d="M122 130 C160 90 150 150 120 168 C148 160 156 120 122 130" fill="#c46b32"/>`,
  },
};

export function animalSVG(kind) {
  const p = ANIMALS[kind] || ANIMALS.cat;
  const face = p.eye === 0
    ? (p.mouth || "")
    : `${eyes(62, 98, 104, p.eye || 8)}${blush(50, 110, 118)}${p.mouth || smile(80, 126)}`;
  return `<svg class="animal" viewBox="0 0 160 180" aria-hidden="true">
    <ellipse cx="80" cy="168" rx="40" ry="8" fill="rgba(90,48,64,.12)"/>
    ${p.ears || ""}
    <ellipse cx="80" cy="112" rx="54" ry="50" fill="${p.body}"/>
    <ellipse cx="80" cy="124" rx="34" ry="30" fill="${p.belly}"/>
    ${p.extra || ""}
    ${face}
  </svg>`;
}

const ITEM_ART = {
  apple: `<circle cx="40" cy="46" r="22" fill="#ff5d6c"/><ellipse cx="32" cy="38" rx="6" ry="4" fill="#fff" opacity=".45"/>
    <path d="M40 26c6-12 16-10 18-4" fill="none" stroke="#6b3a2a" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="54" cy="24" rx="8" ry="5" fill="#3cb371" transform="rotate(25 54 24)"/>`,
  banana: `<path d="M22 30c18 4 30 18 36 36 2 8-8 12-14 6C32 58 22 44 20 36c-1-6 0-8 2-6z" fill="#ffe56a" stroke="#e6b325" stroke-width="2"/>
    <path d="M28 36c10 6 18 16 22 28" fill="none" stroke="#f0c43a" stroke-width="3" stroke-linecap="round"/>`,
  grape: `<g fill="#9b6bff">${[0, 1, 2].map((row) => [0, 1, 2].map((col) => `<circle cx="${30 + col * 12}" cy="${34 + row * 12}" r="7"/>`).join("")).join("")}</g>
    <path d="M40 24c6-8 14-6 14 0" fill="none" stroke="#3cb371" stroke-width="3" stroke-linecap="round"/>`,
  orange: `<circle cx="40" cy="44" r="22" fill="#ff9f1c"/><circle cx="40" cy="44" r="16" fill="none" stroke="#ffd089" stroke-width="2"/>
    <ellipse cx="40" cy="24" rx="4" ry="6" fill="#3cb371"/>`,
  berry: `<ellipse cx="40" cy="46" rx="16" ry="20" fill="#ff4d6d"/><circle cx="34" cy="42" r="2" fill="#ffe08a"/><circle cx="44" cy="40" r="2" fill="#ffe08a"/><circle cx="40" cy="50" r="2" fill="#ffe08a"/>
    <path d="M32 28h16l-3 8h-10z" fill="#3cb371"/>`,
  melon: `<circle cx="40" cy="42" r="24" fill="#8ed98b"/><path d="M40 18v48M18 42h44" stroke="#f4fff4" stroke-width="3"/><path d="M24 28c10 6 22 6 32 0" fill="none" stroke="#f4fff4" stroke-width="3"/>`,
  peach: `<circle cx="34" cy="46" r="16" fill="#ffb3c7"/><circle cx="48" cy="46" r="16" fill="#ff9eb5"/><path d="M40 28c4-10 12-8 12-2" fill="none" stroke="#6b3a2a" stroke-width="3" stroke-linecap="round"/>`,
  pear: `<ellipse cx="40" cy="36" rx="12" ry="14" fill="#c6e38a"/><ellipse cx="40" cy="54" rx="16" ry="16" fill="#b6d96d"/>
    <path d="M40 20c4-6 10-4 8 0" fill="none" stroke="#6b3a2a" stroke-width="3" stroke-linecap="round"/>`,
  cone: `<path d="M28 36h24l-12 36z" fill="#f0c27a"/><circle cx="40" cy="30" r="14" fill="#fff6ea" stroke="#ffb7c4" stroke-width="3"/><circle cx="34" cy="26" r="3" fill="#ff8fb3"/>`,
  sundae: `<path d="M26 40h28l-4 22H30z" fill="#fff"/><circle cx="32" cy="34" r="10" fill="#ffb7c4"/><circle cx="48" cy="34" r="10" fill="#c9b6ff"/><rect x="36" y="18" width="8" height="10" rx="2" fill="#ff5d6c"/>`,
  popsicle: `<rect x="30" y="16" width="20" height="40" rx="10" fill="#7ecbff"/><rect x="30" y="16" width="10" height="40" rx="10" fill="#ff8fb3"/><rect x="37" y="54" width="6" height="14" rx="2" fill="#e6b98a"/>`,
  cup: `<path d="M24 32h28l-4 28H28z" fill="#ffe08a"/><ellipse cx="38" cy="32" rx="16" ry="8" fill="#fff"/><path d="M52 36c10 2 10 16 0 18" fill="none" stroke="#f0c27a" stroke-width="3"/>`,
  scoop: `<circle cx="30" cy="36" r="12" fill="#ffd0e0"/><circle cx="50" cy="36" r="12" fill="#d7c4ff"/><path d="M28 46h24l-12 24z" fill="#f0c27a"/>`,
  choco: `<rect x="24" y="28" width="32" height="30" rx="8" fill="#c68642"/><ellipse cx="40" cy="28" rx="16" ry="8" fill="#8a5a2b"/><circle cx="40" cy="40" r="4" fill="#ffd7a8"/>`,
  ball: `<circle cx="40" cy="42" r="22" fill="#ff7a90"/><path d="M40 20v44M18 42h44" stroke="#fff" stroke-width="3"/><path d="M24 28c10 8 22 8 32 0M24 56c10-8 22-8 32 0" fill="none" stroke="#fff" stroke-width="3"/>`,
  teddy: `<circle cx="40" cy="46" r="18" fill="#e0a060"/><circle cx="26" cy="30" r="8" fill="#e0a060"/><circle cx="54" cy="30" r="8" fill="#e0a060"/>
    <circle cx="34" cy="44" r="2.4" fill="#3a2a30"/><circle cx="46" cy="44" r="2.4" fill="#3a2a30"/><ellipse cx="40" cy="50" rx="4" ry="3" fill="#fff"/>`,
  car: `<rect x="16" y="36" width="48" height="18" rx="8" fill="#6cb6ff"/><path d="M24 36l8-12h16l8 12" fill="#b9dcff"/><circle cx="28" cy="56" r="6" fill="#355070"/><circle cx="52" cy="56" r="6" fill="#355070"/>`,
  blocks: `<rect x="16" y="40" width="22" height="22" rx="4" fill="#ffd056"/><rect x="40" y="28" width="22" height="34" rx="4" fill="#7dce63"/><rect x="28" y="18" width="16" height="16" rx="3" fill="#ff8fb3"/>`,
  robot: `<rect x="24" y="28" width="32" height="28" rx="8" fill="#9fd4ff"/><rect x="32" y="16" width="16" height="10" rx="3" fill="#6cb6ff"/><circle cx="34" cy="40" r="4" fill="#fff"/><circle cx="48" cy="40" r="4" fill="#fff"/><rect x="30" y="58" width="8" height="10" fill="#7aa2d0"/><rect x="44" y="58" width="8" height="10" fill="#7aa2d0"/>`,
  drum: `<ellipse cx="40" cy="30" rx="22" ry="8" fill="#ff8fb3"/><path d="M18 30v22c0 6 10 10 22 10s22-4 22-10V30" fill="#ffe08a"/><path d="M22 24l28 28M58 24L30 52" stroke="#fff" stroke-width="3"/>`,
  kite: `<path d="M40 14 L62 42 L40 66 L18 42 Z" fill="#8eb6ff"/><path d="M40 14 L40 66 M18 42 H62" stroke="#fff" stroke-width="2"/><path d="M40 66c6 8 4 16 0 20" fill="none" stroke="#ff8fb3" stroke-width="3"/>`,
  train: `<rect x="14" y="36" width="36" height="22" rx="4" fill="#ff7a90"/><rect x="50" y="44" width="16" height="14" rx="3" fill="#ffd056"/><circle cx="26" cy="60" r="5" fill="#355070"/><circle cx="42" cy="60" r="5" fill="#355070"/><rect x="20" y="24" width="12" height="12" fill="#c9b6ff"/>`,
  bread: `<ellipse cx="40" cy="44" rx="24" ry="16" fill="#f0c27a"/><path d="M22 44c4-8 32-8 36 0" fill="#ffe1ad"/><path d="M28 40c2 4 6 4 8 0M40 38c2 6 8 6 10 0" stroke="#e0a050" stroke-width="2" fill="none"/>`,
  milk: `<rect x="28" y="22" width="24" height="40" rx="6" fill="#f7fbff" stroke="#c5d7ea" stroke-width="3"/><rect x="28" y="22" width="24" height="12" fill="#9fd4ff"/><rect x="34" y="16" width="12" height="8" rx="2" fill="#d5e6f5"/>`,
  fish: `<ellipse cx="36" cy="42" rx="20" ry="12" fill="#7ecbff"/><path d="M52 42l16-12v24z" fill="#5eb0e6"/><circle cx="26" cy="40" r="2.4" fill="#355070"/>`,
  carrot: `<path d="M40 28c10 8 14 20 8 36-6 8-14 4-16-4-4-14 0-26 8-32z" fill="#ff8a3d"/><path d="M34 30c-6-12 4-18 8-16 6-8 16-4 10 8" fill="#3cb371"/>`,
  cake: `<rect x="18" y="36" width="44" height="24" rx="6" fill="#ffb7c4"/><path d="M18 44h44" stroke="#fff" stroke-width="4"/><rect x="36" y="22" width="8" height="14" rx="2" fill="#ffe08a"/><circle cx="40" cy="20" r="3" fill="#ff7a90"/>`,
  juice: `<path d="M28 24h20l-3 34H31z" fill="#ffb703"/><rect x="26" y="20" width="24" height="6" rx="2" fill="#c68642"/><rect x="46" y="30" width="8" height="12" rx="2" fill="#ffd056"/>`,
  cookie: `<circle cx="40" cy="42" r="20" fill="#e0a15a"/><circle cx="32" cy="36" r="3" fill="#8a5a2b"/><circle cx="46" cy="40" r="3" fill="#8a5a2b"/><circle cx="38" cy="50" r="3" fill="#8a5a2b"/>`,
  flower: `<g fill="#ff8fb3"><circle cx="40" cy="28" r="8"/><circle cx="26" cy="40" r="8"/><circle cx="54" cy="40" r="8"/><circle cx="32" cy="54" r="8"/><circle cx="48" cy="54" r="8"/></g><circle cx="40" cy="42" r="7" fill="#ffe08a"/>`,
  cheese: `<path d="M16 30h40l8 28H16z" fill="#ffe08a"/><circle cx="30" cy="44" r="4" fill="#fff3c4"/><circle cx="44" cy="50" r="3" fill="#fff3c4"/><circle cx="34" cy="54" r="2.5" fill="#fff3c4"/>`,
};

export function itemSVG(id) {
  const inner = ITEM_ART[id] || ITEM_ART.apple;
  return `<svg class="item-art" viewBox="0 0 80 80" aria-hidden="true">${inner}</svg>`;
}

export function piggySVG({ coins = [], equipped = {} } = {}) {
  piggyUid += 1;
  const uid = `belly${piggyUid}`;
  const dots = coins.map((value, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = 78 + col * 12;
    const y = 156 + row * 12;
    const fill = value === 1 ? "#e39a4a" : value === 5 ? "#eef3f8" : "#c5dff3";
    const stroke = value === 1 ? "#b86a32" : "#7f97ad";
    return `<circle cx="${x}" cy="${y}" r="${value === 10 ? 5.4 : 4.4}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
  }).join("");
  const bow = equipped.bow ? `<g class="acc bow">
      <ellipse cx="34" cy="78" rx="14" ry="9" fill="#ff5c8a"/>
      <ellipse cx="58" cy="78" rx="14" ry="9" fill="#ff5c8a"/>
      <circle cx="46" cy="78" r="6" fill="#ffd0e0"/>
      <path d="M42 82 L34 98 L48 86 Z" fill="#ff5c8a"/>
      <path d="M50 82 L60 98 L46 86 Z" fill="#e94876"/>
    </g>` : "";
  const hat = equipped.hat ? `<g class="acc hat">
      <ellipse cx="100" cy="58" rx="30" ry="16" fill="#ff5a7a"/>
      <path d="M82 54c6-20 30-20 36 0" fill="#3cb371"/>
      <circle cx="92" cy="62" r="1.7" fill="#ffe08a"/>
      <circle cx="104" cy="66" r="1.7" fill="#ffe08a"/>
      <circle cx="112" cy="58" r="1.7" fill="#ffe08a"/>
    </g>` : "";
  const glasses = equipped.glasses ? `<g class="acc glasses" fill="none" stroke="#5a3040" stroke-width="3.2">
      <circle cx="74" cy="112" r="16"/><circle cx="126" cy="112" r="16"/><path d="M90 112h20" stroke-linecap="round"/>
    </g>` : "";
  const crown = equipped.crown ? `<g class="acc crown">
      <path d="M72 62 L80 40 L90 56 L100 34 L110 56 L120 40 L128 62 Z" fill="#ffd056" stroke="#e0a020" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="100" cy="48" r="3" fill="#ff7aa2"/>
      <circle cx="84" cy="52" r="2.4" fill="#8ecbff"/>
      <circle cx="116" cy="52" r="2.4" fill="#8ecbff"/>
    </g>` : "";
  const cape = equipped.cape ? `<g class="acc cape">
      <path d="M38 128 Q16 180 34 210 Q100 196 166 210 Q184 180 162 128 Q100 156 38 128" fill="#7aa2ff"/>
      <circle cx="58" cy="176" r="3.2" fill="#ffe08a"/>
      <circle cx="86" cy="190" r="2.4" fill="#fff"/>
      <circle cx="124" cy="184" r="3.2" fill="#ffe08a"/>
      <circle cx="146" cy="170" r="2.4" fill="#fff"/>
    </g>` : "";
  return `<svg class="piggy-svg" viewBox="0 0 200 230" aria-hidden="true">
    ${cape}
    <ellipse cx="46" cy="86" rx="22" ry="30" fill="#ff8fb3" transform="rotate(-18 46 86)"/>
    <ellipse cx="154" cy="86" rx="22" ry="30" fill="#ff8fb3" transform="rotate(18 154 86)"/>
    <ellipse cx="46" cy="86" rx="12" ry="18" fill="#ffd0e0" transform="rotate(-18 46 86)"/>
    <ellipse cx="154" cy="86" rx="12" ry="18" fill="#ffd0e0" transform="rotate(18 154 86)"/>
    <ellipse cx="100" cy="136" rx="78" ry="72" fill="#ff9ebe"/>
    <ellipse cx="100" cy="150" rx="70" ry="58" fill="#ffb3ce" opacity=".45"/>
    <rect x="78" y="62" width="44" height="10" rx="5" fill="#e36b90"/>
    <ellipse cx="100" cy="168" rx="44" ry="34" fill="rgba(255,255,255,.72)" stroke="#fff" stroke-width="4"/>
    <clipPath id="${uid}"><ellipse cx="100" cy="168" rx="38" ry="28"/></clipPath>
    <g clip-path="url(#${uid})">${dots}</g>
    <g class="blink">
      <ellipse cx="74" cy="112" rx="11" ry="13" fill="#fff"/>
      <ellipse cx="126" cy="112" rx="11" ry="13" fill="#fff"/>
      <ellipse cx="76" cy="114" rx="5.5" ry="6.5" fill="#3a2a30"/>
      <ellipse cx="128" cy="114" rx="5.5" ry="6.5" fill="#3a2a30"/>
      <circle cx="74" cy="111" r="2" fill="#fff"/>
      <circle cx="126" cy="111" r="2" fill="#fff"/>
    </g>
    <ellipse cx="100" cy="132" rx="26" ry="18" fill="#ffc2d4"/>
    <ellipse cx="90" cy="132" rx="4.5" ry="6" fill="#e36b90"/>
    <ellipse cx="110" cy="132" rx="4.5" ry="6" fill="#e36b90"/>
    <ellipse cx="52" cy="128" rx="8" ry="5" fill="#ff7aa2" opacity=".75"/>
    <ellipse cx="148" cy="128" rx="8" ry="5" fill="#ff7aa2" opacity=".75"/>
    <path d="M84 146 Q100 158 116 146" fill="none" stroke="#e36b90" stroke-width="3.4" stroke-linecap="round"/>
    <ellipse cx="70" cy="204" rx="16" ry="10" fill="#ff8fb3"/>
    <ellipse cx="132" cy="204" rx="16" ry="10" fill="#ff8fb3"/>
    <path d="M166 150 q18 -8 10 -22" fill="none" stroke="#ff8fb3" stroke-width="7" stroke-linecap="round"/>
    ${bow}${hat}${crown}${glasses}
  </svg>`;
}

export function accessorySVG(id) {
  const map = {
    bow: `<svg viewBox="0 0 80 60" aria-hidden="true"><ellipse cx="22" cy="28" rx="18" ry="12" fill="#ff5c8a"/><ellipse cx="58" cy="28" rx="18" ry="12" fill="#ff5c8a"/><circle cx="40" cy="28" r="8" fill="#ffd0e0"/></svg>`,
    hat: `<svg viewBox="0 0 80 60" aria-hidden="true"><ellipse cx="40" cy="36" rx="24" ry="14" fill="#ff5a7a"/><path d="M24 32c6-18 26-18 32 0" fill="#3cb371"/></svg>`,
    glasses: `<svg viewBox="0 0 80 60" aria-hidden="true"><g fill="none" stroke="#5a3040" stroke-width="4"><circle cx="24" cy="32" r="14"/><circle cx="56" cy="32" r="14"/><path d="M38 32h4"/></g></svg>`,
    crown: `<svg viewBox="0 0 80 60" aria-hidden="true"><path d="M10 42 L20 18 L32 34 L40 12 L48 34 L60 18 L70 42 Z" fill="#ffd056" stroke="#e0a020" stroke-width="2"/></svg>`,
    cape: `<svg viewBox="0 0 80 60" aria-hidden="true"><path d="M12 16 Q8 48 20 54 Q40 40 60 54 Q72 48 68 16 Q40 28 12 16" fill="#7aa2ff"/><circle cx="28" cy="40" r="3" fill="#ffe08a"/><circle cx="48" cy="44" r="3" fill="#fff"/></svg>`,
  };
  return map[id] || "";
}

export function handSVG() {
  return `<svg class="hand-svg" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M30 8c-6 8-8 18-6 28l4 16c1 4 6 6 10 4l8-6c6-8 8-20 4-30-2-6-8-10-14-8-2 6-4 4-6-4z" fill="#ffe1c2" stroke="#e0b48a" stroke-width="2"/>
    <path d="M24 30c-8 2-12 10-8 16" fill="none" stroke="#e0b48a" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}
