import { P, circle, ellipse, g, line, linear, path, rect, rng, shade, shadowFilter, svg } from './lib';

// ============================================================ Bausteine
const SH = 'filter="url(#sh)"';
const defs = (extra = '') => shadowFilter() + extra;

function skyBg(w: number, h: number, mood: 'day' | 'storm' | 'rain' | 'frost' | 'heat' | 'dusk' | 'autumn' | 'night', id = 'sky') {
  const st: Record<string, [string, string]> = { day: ['#8ccbea', '#e4f3f9'], storm: ['#4f5d6b', '#9aa6ae'], rain: ['#7d8c98', '#c3ccd2'], frost: ['#b9cfdf', '#eef4f8'], heat: ['#f2b25a', '#fbe3b0'], dusk: ['#45507a', '#f0a07a'], autumn: ['#f0b98a', '#fbe5cf'], night: ['#1f2a44', '#4a5a7e'] };
  return { defs: linear(id, [[0, st[mood][0]], [1, st[mood][1]]]), body: rect(0, 0, w, h, `url(#${id})`) };
}
const cloud = (x: number, y: number, s: number, c = '#ffffff', op = 0.9) => g([[0, 0, 26], [26, -10, 30], [56, 0, 24], [28, 8, 26]].map(([dx, dy, r]) => circle(x + dx * s, y + dy * s, r * s, c)).join(''), `opacity="${op}"`);
const sun = (x: number, y: number, r: number) => circle(x, y, r * 1.6, '#fff3b0', 'opacity="0.5"') + circle(x, y, r, '#f6c945');
function rain(w: number, h: number, n: number, seed: number, slant = 8) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) { const x = r() * w, y = r() * h; s += line(x, y, x - slant, y + 22, '#dbe8f2', 2, 'opacity="0.7"'); }
  return s;
}
function snow(w: number, h: number, n: number, seed: number) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) s += circle(r() * w, r() * h, 1.5 + r() * 3, '#ffffff', 'opacity="0.9"');
  return s;
}

interface HouseOpt { lit?: boolean; damaged?: boolean; insulated?: boolean; solar?: boolean; green?: boolean; scaffold?: boolean; floors?: number; snowRoof?: boolean; tilesFlying?: boolean; open?: boolean }
function house(x: number, y: number, s: number, o: HouseOpt = {}) {
  const fl = o.floors ?? 4, W = 220 * s, FH = 52 * s, H = fl * FH;
  const facade = o.insulated ? P.cream : o.damaged ? '#c3aa80' : P.sand;
  let b = rect(x, y - H, W, H, facade) + rect(x + W * 0.7, y - H, W * 0.3, H, shade(facade, -0.08), 'opacity="0.6"');
  b += path(`M${x - 12 * s} ${y - H} L${x + W / 2} ${y - H - 70 * s} L${x + W + 12 * s} ${y - H} Z`, o.damaged ? '#8a5a4a' : P.brick);
  b += rect(x + W * 0.68, y - H - 62 * s, 16 * s, 34 * s, P.brickDark);
  if (o.snowRoof) b += path(`M${x + W / 2 - 60 * s} ${y - H - 38 * s} L${x + W / 2} ${y - H - 70 * s} L${x + W / 2 + 60 * s} ${y - H - 38 * s} Z`, '#ffffff');
  if (o.solar) b += path(`M${x + W / 2 + 14 * s} ${y - H - 54 * s} L${x + W - 4 * s} ${y - H - 6 * s} L${x + W - 40 * s} ${y - H - 6 * s} L${x + W / 2 + 4 * s} ${y - H - 42 * s} Z`, '#1f3a63', `stroke="#9fb7d4" stroke-width="${1.5 * s}"`);
  if (o.green) b += path(`M${x - 12 * s} ${y - H} L${x + W + 12 * s} ${y - H} L${x + W + 6 * s} ${y - H - 6 * s} L${x - 6 * s} ${y - H - 6 * s} Z`, P.olive) + [0.1, 0.3, 0.5, 0.7, 0.9].map((k) => circle(x + W * k, y - H - 6 * s, 5 * s, P.oliveLight)).join('');
  for (let f = 0; f < fl; f++) for (let c = 0; c < 4; c++) {
    if (f === 0 && c === 1) continue;
    const wx = x + 18 * s + c * 50 * s, wy = y - (f + 1) * FH + 12 * s;
    b += rect(wx, wy, 30 * s, 30 * s, o.lit ? (f + c) % 3 === 0 ? '#9fb4c4' : '#f6d27a' : P.glass, `stroke="${o.insulated ? '#ffffff' : P.woodDark}" stroke-width="${3 * s}"`) + line(wx + 15 * s, wy, wx + 15 * s, wy + 30 * s, o.insulated ? '#ffffff' : P.woodDark, 2 * s);
  }
  b += rect(x + 66 * s, y - 44 * s, 26 * s, 44 * s, o.open ? '#2a1d14' : P.woodDark) + rect(x + 60 * s, y - 48 * s, 38 * s, 5 * s, P.stoneDark);
  if (o.damaged) b += path(`M${x + 20 * s} ${y - H + 40 * s} l8 18 l-6 14 M${x + W - 30 * s} ${y - 70 * s} l-6 16 l8 12`, 'none', `stroke="#5b4a36" stroke-width="${2 * s}"`) + ellipse(x + 40 * s, y - 20 * s, 22 * s, 10 * s, '#5c5440', 'opacity="0.35"');
  if (o.tilesFlying) for (const [dx, dy, rt] of [[30, -40, 20], [70, -70, -30], [120, -30, 45]]) b += rect(x + W / 2 + dx * s, y - H - 70 * s + dy * s, 18 * s, 10 * s, P.brick, `transform="rotate(${rt} ${x + W / 2 + dx * s} ${y - H - 70 * s + dy * s})"`);
  if (o.scaffold) { for (let k = 0; k <= 5; k++) b += rect(x - 8 * s + k * (W + 16 * s) / 5, y - H - 10 * s, 4 * s, H + 10 * s, '#9aa3aa'); for (let f = 1; f <= fl; f++) b += rect(x - 10 * s, y - f * FH, W + 20 * s, 5 * s, '#c49a5c'); }
  return g(b, SH);
}

interface Person { skin?: string; shirt?: string; pants?: string; hair?: string; pose?: 'stand' | 'wave' | 'point' | 'sit' | 'arms' | 'hold'; long?: boolean; hat?: string; flip?: boolean }
const SKINS = ['#f1cfb4', '#d6a47a', '#b77b54', '#7a4c31', '#eecda6'];
function person(x: number, y: number, s: number, p: Person = {}) {
  const sk = p.skin ?? SKINS[0], sh = p.shirt ?? P.petrol, pa = p.pants ?? '#3a4249', hr = p.hair ?? '#3a2a20';
  let b = '';
  if (p.pose === 'sit') {
    b += rect(x - 14 * s, y - 40 * s, 28 * s, 10 * s, pa, `rx="${4 * s}"`) + rect(x + 6 * s, y - 40 * s, 10 * s, 40 * s, pa, `rx="${4 * s}"`);
    b += path(`M${x - 18 * s} ${y - 40 * s} Q${x - 18 * s} ${y - 90 * s} ${x} ${y - 92 * s} Q${x + 18 * s} ${y - 90 * s} ${x + 16 * s} ${y - 40 * s} Z`, sh);
  } else {
    b += rect(x - 12 * s, y - 50 * s, 10 * s, 50 * s, pa, `rx="${4 * s}"`) + rect(x + 2 * s, y - 50 * s, 10 * s, 50 * s, pa, `rx="${4 * s}"`);
    b += path(`M${x - 20 * s} ${y - 46 * s} Q${x - 20 * s} ${y - 96 * s} ${x} ${y - 98 * s} Q${x + 20 * s} ${y - 96 * s} ${x + 20 * s} ${y - 46 * s} Z`, sh);
  }
  const top = p.pose === 'sit' ? y - 92 * s : y - 98 * s;
  const arm = (x1: number, y1: number, x2: number, y2: number) => line(x1, y1, x2, y2, sh, 8 * s) + circle(x2, y2, 5 * s, sk);
  if (p.pose === 'wave') b += arm(x + 18 * s, top + 14 * s, x + 34 * s, top - 14 * s) + arm(x - 18 * s, top + 14 * s, x - 22 * s, top + 46 * s);
  else if (p.pose === 'point') b += arm(x + 18 * s, top + 14 * s, x + 46 * s, top + 4 * s) + arm(x - 18 * s, top + 14 * s, x - 22 * s, top + 46 * s);
  else if (p.pose === 'arms') b += arm(x + 18 * s, top + 14 * s, x + 40 * s, top - 6 * s) + arm(x - 18 * s, top + 14 * s, x - 40 * s, top - 6 * s);
  else if (p.pose === 'hold') b += arm(x + 18 * s, top + 14 * s, x + 26 * s, top + 34 * s) + arm(x - 18 * s, top + 14 * s, x - 24 * s, top + 34 * s);
  else b += arm(x + 18 * s, top + 14 * s, x + 22 * s, top + 46 * s) + arm(x - 18 * s, top + 14 * s, x - 22 * s, top + 46 * s);
  b += rect(x - 5 * s, top - 8 * s, 10 * s, 10 * s, sk) + circle(x, top - 20 * s, 15 * s, sk);
  b += path(`M${x - 15 * s} ${top - 20 * s} Q${x - 16 * s} ${top - 40 * s} ${x} ${top - 38 * s} Q${x + 16 * s} ${top - 40 * s} ${x + 15 * s} ${top - 20 * s} Q${x + 4 * s} ${top - 30 * s} ${x - 15 * s} ${top - 20 * s} Z`, hr);
  if (p.long) b += path(`M${x - 15 * s} ${top - 22 * s} Q${x - 20 * s} ${top + 4 * s} ${x - 10 * s} ${top + 6 * s} L${x - 12 * s} ${top - 18 * s} Z M${x + 15 * s} ${top - 22 * s} Q${x + 20 * s} ${top + 4 * s} ${x + 10 * s} ${top + 6 * s} L${x + 12 * s} ${top - 18 * s} Z`, hr);
  if (p.hat) b += rect(x - 14 * s, top - 52 * s, 28 * s, 18 * s, p.hat, `rx="${3 * s}"`) + rect(x - 20 * s, top - 36 * s, 40 * s, 5 * s, p.hat, `rx="${2 * s}"`);
  b += circle(x - 5 * s, top - 21 * s, 1.8 * s, P.ink) + circle(x + 5 * s, top - 21 * s, 1.8 * s, P.ink) + path(`M${x - 5 * s} ${top - 13 * s} Q${x} ${top - 9 * s} ${x + 5 * s} ${top - 13 * s}`, 'none', `stroke="${P.ink}" stroke-width="${1.5 * s}"`);
  return g(b, `${SH}${p.flip ? ` transform="translate(${2 * x} 0) scale(-1 1)"` : ''}`);
}

const groundStrip = (w: number, y: number, c = P.olive) => rect(0, y, w, 600, c) + rect(0, y, w, 6, shade(c, 0.15));
const tree = (x: number, y: number, s: number, col = P.olive) => g(rect(x - 5 * s, y - 60 * s, 10 * s, 60 * s, P.woodDark) + circle(x, y - 80 * s, 34 * s, col) + circle(x - 22 * s, y - 64 * s, 22 * s, col) + circle(x + 22 * s, y - 64 * s, 22 * s, shade(col, -0.1)), SH);
const doc = (x: number, y: number, s: number, seal = false) => g(rect(x, y, 70 * s, 90 * s, '#ffffff', `rx="${3 * s}"`) + [16, 28, 40, 52].map((dy) => line(x + 10 * s, y + dy * s, x + 60 * s, y + dy * s, '#c9ccd0', 3 * s)).join('') + (seal ? circle(x + 50 * s, y + 72 * s, 10 * s, P.red) : ''), SH);
const arrowUp = (x: number, y: number, s: number, c = P.red) => g(path(`M${x} ${y} l${30 * s} ${-30 * s} l${20 * s} ${16 * s} l${30 * s} ${-40 * s}`, 'none', `stroke="${c}" stroke-width="${8 * s}" stroke-linecap="round" stroke-linejoin="round"`) + path(`M${x + 80 * s} ${y - 54 * s} l${4 * s} ${26 * s} l${-24 * s} ${-8 * s} z`, c), SH);
const table = (x: number, y: number, w: number, c = P.woodLight) => g(rect(x, y, w, 10, c, 'rx="2"') + rect(x + 10, y + 10, 8, 40, shade(c, -0.25)) + rect(x + w - 18, y + 10, 8, 40, shade(c, -0.25)), SH);
const van = (x: number, y: number) => g(rect(x, y - 70, 170, 56, '#f2f0ea', 'rx="10"') + path(`M${x + 170} ${y - 70} h30 l26 30 v26 h-56 z`, '#e3e0d8') + rect(x + 180, y - 62, 24, 20, P.glass, 'rx="3"') + rect(x + 20, y - 54, 110, 18, P.petrol, 'rx="4"') + circle(x + 40, y - 12, 16, P.ink) + circle(x + 190, y - 12, 16, P.ink) + circle(x + 40, y - 12, 7, P.grey) + circle(x + 190, y - 12, 7, P.grey), SH);
const toolbox = (x: number, y: number) => g(rect(x, y - 34, 60, 34, P.red, 'rx="4"') + rect(x + 18, y - 44, 24, 12, 'none', `stroke="${P.ink}" stroke-width="4" rx="3"`), SH);
const radiator = (x: number, y: number, w = 120) => g(Array.from({ length: Math.floor(w / 14) }, (_, i) => rect(x + i * 14, y, 11, 60, '#eef0f0', 'rx="5"')).join('') + rect(x, y + 8, w - 3, 6, '#dfe3e3'), SH);

function room(w: number, h: number, wall: string, floor: 'wood' | 'tile' | 'laminate' = 'wood') {
  let b = rect(0, 0, w, h * 0.72, wall) + rect(0, h * 0.72, w, h * 0.28, floor === 'tile' ? '#d9d6d0' : floor === 'laminate' ? '#c9a77c' : '#a87a4c');
  if (floor !== 'tile') for (let x = 0; x < w; x += 46) b += line(x, h * 0.72, x - 30, h, shade(floor === 'laminate' ? '#c9a77c' : '#a87a4c', -0.15), 2);
  else for (let x = 0; x < w; x += 40) b += line(x, h * 0.72, x - 20, h, '#bdb9b2', 2);
  b += rect(0, h * 0.72 - 6, w, 6, shade(wall, -0.18));
  return b;
}
const windowIn = (x: number, y: number, w: number, h: number, frame = '#ffffff') => g(rect(x, y, w, h, '#bfe0ef', `stroke="${frame}" stroke-width="8"`) + line(x + w / 2, y, x + w / 2, y + h, frame, 6) + rect(x - 8, y + h, w + 16, 8, '#e8e4dc') + path(`M${x + 8} ${y + 8} l30 0 l-30 30z`, '#ffffff', 'opacity="0.5"'), SH);
const plant = (x: number, y: number, s = 1) => g(path(`M${x - 14 * s} ${y} l4 ${-26 * s} h${20 * s} l4 ${26 * s} z`, '#c46a3c') + ellipse(x, y - 40 * s, 10 * s, 20 * s, P.olive) + ellipse(x - 12 * s, y - 34 * s, 8 * s, 16 * s, P.oliveDark, `transform="rotate(-30 ${x - 12 * s} ${y - 34 * s})"`) + ellipse(x + 12 * s, y - 34 * s, 8 * s, 16 * s, P.oliveLight, `transform="rotate(30 ${x + 12 * s} ${y - 34 * s})"`), SH);

// ============================================================ Ereignisse (1200×500)
const EW = 1200, EH = 500, GY = 420;
function eventScene(mood: Parameters<typeof skyBg>[2], content: string, groundColor = P.olive, extraDefs = '') {
  const s = skyBg(EW, EH, mood);
  return svg(EW, EH, s.body + content.replace('%GROUND%', groundStrip(EW, GY, groundColor)), defs(s.defs + extraDefs));
}

const EVENTS: Record<string, () => string> = {
  storm: () => eventScene('storm', cloud(150, 80, 2.2, '#56636e', 1) + cloud(700, 60, 2.6, '#4a5560', 1) + path('M880 80 l-40 90 h40 l-30 90 l90 -120 h-44 l30 -60z', '#f6d75a') + '%GROUND%' + house(420, GY, 1.3, { tilesFlying: true }) + g(rect(195, GY - 120, 14, 120, P.woodDark) + path(`M202 ${GY - 120} q60 -40 120 -30 q-40 40 -120 30z`, P.oliveDark) + path(`M202 ${GY - 150} q50 -60 110 -50 q-40 50 -110 50z`, P.olive), SH) + rain(EW, EH, 160, 1, 40) + [0, 1, 2, 3].map((i) => path(`M${60 + i * 260} ${200 + i * 30} q80 -20 160 0`, 'none', 'stroke="#ffffff" stroke-width="4" opacity="0.5" stroke-linecap="round"')).join(''), '#5d7a3a'),
  heavy_rain: () => eventScene('rain', cloud(200, 70, 2.2, '#8a96a0', 1) + cloud(760, 50, 2.6, '#7a8690', 1) + '%GROUND%' + house(440, GY, 1.3) + ellipse(400, GY + 30, 220, 26, '#7fa7c2', 'opacity="0.8"') + ellipse(860, GY + 40, 140, 18, '#7fa7c2', 'opacity="0.8"') + rect(470, GY - 4, 60, 22, '#3e5566', 'rx="3"') + path(`M490 ${GY + 8} q20 -14 40 0`, 'none', 'stroke="#bcd6e6" stroke-width="4"') + rain(EW, EH, 220, 2, 6), '#5f7d46'),
  frost: () => eventScene('frost', '%GROUND%' + house(420, GY, 1.3, { snowRoof: true, lit: true }) + Array.from({ length: 12 }, (_, i) => path(`M${400 + i * 26} ${GY - 210} l6 ${24 + (i % 3) * 10} l6 -${24 + (i % 3) * 10}z`, '#e6f3fb')).join('') + person(880, GY + 10, 1.2, { shirt: '#5a7fa8', skin: SKINS[3], pose: 'hold' }) + rect(855, GY - 92, 50, 12, P.red, 'rx="6"') + snow(EW, EH, 140, 3) + tree(180, GY, 1.2, '#e8eef2'), '#f2f6f9'),
  heatwave: () => eventScene('heat', sun(1030, 90, 56) + '%GROUND%' + house(440, GY, 1.3, {}) + rect(452, GY - 200, 280, 6, '#e8d4a8') + person(840, GY + 4, 1.2, { shirt: '#f2f0ea', skin: SKINS[1], pose: 'wave' }) + [0, 1, 2].map((i) => path(`M${120 + i * 30} 260 q10 -20 0 -40 q-10 -20 0 -40`, 'none', 'stroke="#f7d49b" stroke-width="5" opacity="0.8"')).join(''), '#b7a65a'),
  energy_price_shock: () => eventScene('day', rect(0, 0, EW, EH, '#eae4da') + rect(0, 330, EW, 170, '#cfc6b8') + g(rect(220, 110, 200, 240, '#f2f0ea', 'rx="12"') + rect(250, 150, 140, 50, '#2c3a44', 'rx="4"') + [0, 1, 2, 3, 4].map((i) => rect(262 + i * 24, 162, 18, 26, '#7fd18b', 'rx="2"')).join('') + circle(320, 270, 34, '#ffffff', `stroke="${P.greyDark}" stroke-width="4"`) + line(320, 270, 344, 250, P.red, 5), SH) + doc(520, 160, 2.1) + arrowUp(760, 330, 2.6) + rect(960, 120, 120, 200, '#3a4249', 'rx="8"') + circle(1020, 210, 30, '#f6c945'), '#cfc6b8'),
  material_price_rise: () => eventScene('day', '%GROUND%' + g(rect(160, GY - 20, 260, 20, P.woodLight) + [0, 1, 2].map((i) => rect(170 + i * 84, GY - 120, 76, 100, '#d8d2c6', 'rx="4"')).join('') + rect(560, GY - 150, 220, 130, P.brick) + [0, 1, 2, 3].map((i) => line(560, GY - 120 + i * 30, 780, GY - 120 + i * 30, P.brickDark, 3)).join('') + rect(880, GY - 100, 180, 80, '#f2e9a8'), SH) + [[290, 230], [670, 200], [970, 250]].map(([x, y]) => g(rect(x - 40, y - 40, 80, 50, '#ffffff', 'rx="6"') + path(`M${x} ${y - 30} l18 22 h-12 v14 h-12 v-14 h-12z`, P.red), SH)).join('') + tree(1120, GY, 1), '#9aa36a'),
  new_contractor: () => eventScene('day', cloud(120, 80, 1.6) + '%GROUND%' + house(80, GY, 1.2) + van(420, GY + 10) + person(820, GY + 10, 1.3, { shirt: P.mustard, pants: '#3f5f86', skin: SKINS[2], pose: 'wave', long: true }) + toolbox(880, GY + 10) + tree(1080, GY, 1.2), '#7d9a4c'),
  subsidy_program: () => eventScene('day', rect(0, 0, EW, EH, '#efe9df') + rect(0, 300, EW, 200, P.woodLight) + doc(250, 120, 2.4, true) + g(rect(560, 180, 120, 160, '#3a4249', 'rx="10"') + Array.from({ length: 12 }, (_, i) => rect(574 + (i % 3) * 34, 220 + Math.floor(i / 3) * 28, 26, 20, '#dfe3e6', 'rx="3"')).join('') + rect(574, 190, 92, 22, '#9fd7a5', 'rx="3"'), SH) + house(800, 330, 0.9, { insulated: true, solar: true }) + sun(1120, 70, 34), P.woodLight),
  energy_audit: () => eventScene('frost', '%GROUND%' + house(560, GY, 1.3) + g(ellipse(700, 230, 120, 70, '#e8503a', 'opacity="0.35"') + ellipse(640, 160, 90, 40, '#f2b13a', 'opacity="0.35"'), '') + person(300, GY + 10, 1.4, { shirt: '#2f6f7a', skin: SKINS[1], pose: 'point' }) + g(rect(330, GY - 150, 70, 52, '#2f3439', 'rx="6"') + rect(338, GY - 144, 54, 40, 'url(#therm)'), SH), '#9fb07a', linear('therm', [[0, '#2b3fa8'], [0.5, '#e7c73a'], [1, '#e2452f']], false)),
  neighbor_conflict: () => eventScene('day', rect(0, 0, EW, EH, '#e9e1d2') + rect(0, 380, EW, 120, '#b9a98e') + rect(200, 120, 150, 260, P.woodDark, 'rx="4"') + rect(850, 120, 150, 260, P.woodDark, 'rx="4"') + circle(330, 260, 6, P.mustard) + circle(870, 260, 6, P.mustard) + person(480, 400, 1.6, { shirt: P.red, skin: SKINS[0], pose: 'arms' }) + person(720, 400, 1.6, { shirt: P.petrol, skin: SKINS[3], pose: 'point', flip: true, long: true }) + g(rect(520, 100, 70, 46, '#ffffff', 'rx="20"') + rect(620, 80, 70, 46, '#ffffff', 'rx="20"') + path('M545 125 h20 M640 103 h30', 'none', `stroke="${P.red}" stroke-width="6" stroke-linecap="round"`), SH), '#b9a98e'),
  community_party: () => eventScene('dusk', '%GROUND%' + house(60, GY, 1.1, { lit: true }) + path('M300 140 Q600 220 1150 120', 'none', 'stroke="#3a3a3a" stroke-width="2"') + Array.from({ length: 16 }, (_, i) => circle(320 + i * 52, 150 + Math.sin(i / 2.5) * 18 + i * 2, 8, ['#f6d27a', '#f28b6a', '#8fd0a8', '#9fb7f0'][i % 4])).join('') + table(420, GY - 60, 380) + g(rect(880, GY - 70, 80, 50, '#3a3f44', 'rx="6"') + path('M890 330 q10 -20 0 -40 M920 330 q10 -20 0 -40', 'none', 'stroke="#cfd3d6" stroke-width="4"'), SH) + person(460, GY + 4, 1.1, { shirt: P.mustard, skin: SKINS[2], pose: 'wave' }) + person(560, GY + 4, 1.1, { shirt: P.petrol, skin: SKINS[0], long: true }) + person(660, GY + 4, 1.1, { shirt: P.red, skin: SKINS[3], pose: 'hold' }) + person(760, GY + 4, 1.1, { shirt: '#9b6bc9', skin: SKINS[4], long: true, pose: 'wave' }) + person(1050, GY + 4, 0.7, { shirt: P.olive, skin: SKINS[1], pose: 'arms' }), '#5f7d46'),
  tenant_job_loss: () => eventScene('night', rect(0, 0, EW, EH, '#3a3a4a') + windowIn(820, 80, 220, 180, '#d9d2c2') + rect(0, 360, EW, 140, '#5a4a3c') + path('M520 40 l-60 120 h120 z', '#f6d27a', 'opacity="0.35"') + circle(520, 160, 14, '#f6d27a') + table(300, 300, 460) + person(520, 400, 1.6, { shirt: '#6a7f93', skin: SKINS[1], pose: 'sit' }) + doc(350, 250, 0.6) + doc(620, 256, 0.6) + g(rect(440, 268, 46, 30, '#2f3439', 'rx="4"'), SH), '#5a4a3c'),
  fire_inspection: () => eventScene('day', rect(0, 0, EW, EH, '#efe7d8') + rect(0, 400, EW, 100, '#b9a98e') + g(circle(700, 60, 34, '#ffffff') + circle(700, 60, 10, P.red), SH) + g(rect(980, 230, 50, 120, P.red, 'rx="16"') + rect(990, 210, 30, 24, P.ink, 'rx="4"'), SH) + person(560, 410, 1.7, { shirt: '#2f6f7a', skin: SKINS[3], pose: 'point', long: true }) + g(rect(450, 230, 60, 80, P.woodLight, 'rx="4"') + rect(456, 240, 48, 64, '#ffffff'), SH), '#b9a98e'),
  kitchen_request: () => eventScene('day', rect(0, 0, EW, EH, '#efe9df') + g(rect(120, 200, 400, 200, '#b9a07a') + [0, 1, 2, 3].map((i) => rect(130 + i * 98, 220, 88, 90, '#a68c66', 'rx="4"')).join('') + rect(120, 190, 400, 14, '#8f7a5a'), SH) + path('M560 280 h80 l-20 -20 M640 280 l-20 20', 'none', 'stroke="#2f6f7a" stroke-width="10" stroke-linecap="round"') + g(rect(700, 170, 380, 240, '#ffffff', 'rx="14"') + rect(720, 280, 340, 110, '#e8e4dc') + [0, 1, 2].map((i) => rect(730 + i * 112, 296, 100, 84, '#f7f4ee', 'rx="6"')).join('') + rect(720, 190, 340, 60, '#cfe2e7', 'rx="6"') + rect(720, 270, 340, 12, P.woodLight), SH), '#efe9df'),
  garden_volunteer: () => eventScene('day', sun(1080, 80, 40) + '%GROUND%' + g(rect(240, GY - 70, 280, 70, P.wood) + rect(640, GY - 70, 280, 70, P.wood), SH) + Array.from({ length: 14 }, (_, i) => circle(260 + i * 20 + (i > 6 ? 260 : 0), GY - 84 - (i % 3) * 8, 9, ['#e05a5a', P.mustard, '#a978d4'][i % 3])).join('') + Array.from({ length: 14 }, (_, i) => ellipse(260 + i * 20 + (i > 6 ? 260 : 0), GY - 72, 8, 14, P.olive)).join('') + person(580, GY + 4, 1.3, { shirt: '#c46a3c', skin: SKINS[0], pose: 'hold', long: true, hair: '#b9b6b0' }) + g(path(`M640 ${GY - 30} h40 l10 30 h-60z`, '#5c8fb0'), SH), '#6f8a3c'),
  diy_stairwell: () => eventScene('day', rect(0, 0, 600, EH, '#cdbf9f') + rect(600, 0, 600, EH, '#f4ecd8') + path('M200 500 L200 140 M300 500 L300 140', 'none', `stroke="${P.woodLight}" stroke-width="12"`) + [180, 240, 300, 360, 420].map((y) => line(200, y, 300, y, P.woodLight, 10)).join('') + person(250, 240, 1.3, { shirt: '#3f5f86', skin: SKINS[2], pose: 'point' }) + g(rect(330, 150, 120, 30, '#d9d9d9', 'rx="8"') + rect(380, 180, 10, 60, P.wood), SH) + g(rect(760, 380, 80, 70, '#dfe3e6', 'rx="6"') + ellipse(800, 382, 40, 10, '#f4ecd8'), SH) + rect(0, 450, EW, 50, '#bdb2a0'), '#bdb2a0'),
  vandalism: () => eventScene('day', rect(0, 0, EW, EH, '#d8c7a6') + rect(0, 420, EW, 80, '#9a9a94') + g(rect(470, 120, 220, 300, P.woodDark, 'rx="4"') + rect(470, 120, 60, 300, '#1c1410', 'opacity="0.6"'), SH) + path('M100 220 C160 140 220 300 300 200 C360 130 380 280 420 220', 'none', 'stroke="#c43ea9" stroke-width="18" stroke-linecap="round"') + path('M760 180 C820 260 880 140 960 230 C1020 290 1060 170 1120 220', 'none', 'stroke="#2f9fd0" stroke-width="16" stroke-linecap="round"') + g(rect(760, 300, 200, 90, '#9aa3aa', 'rx="4"') + [0, 1, 2, 3].map((i) => rect(770 + i * 48, 312, 40, 26, '#7d868d')).join('') + rect(818, 312, 40, 26, '#5a5f63', 'transform="rotate(14 838 325)"'), SH), '#9a9a94'),
  bridge_loan: () => eventScene('day', rect(0, 0, EW, EH, '#e3e8ec') + windowIn(860, 70, 240, 170) + rect(0, 360, EW, 140, '#9fa8b0') + table(260, 300, 560, '#d9d2c2') + person(380, 390, 1.5, { shirt: '#3a4249', skin: SKINS[0], pose: 'sit' }) + person(700, 390, 1.5, { shirt: '#24364f', skin: SKINS[2], pose: 'sit', long: true }) + doc(500, 250, 0.6) + g(circle(560, 290, 14, P.mustard) + circle(586, 292, 14, P.mustard), SH), '#9fa8b0'),
  chimney_sweep: () => eventScene('day', cloud(150, 90, 1.5) + path('M0 500 L0 260 L600 120 L1200 260 L1200 500 Z', P.brick) + Array.from({ length: 10 }, (_, i) => line(0, 280 + i * 24, EW, 280 + i * 24, P.brickDark, 2, 'opacity="0.4"')).join('') + g(rect(640, 60, 80, 140, P.brickDark) + rect(630, 50, 100, 16, P.stoneDark), SH) + person(520, 230, 1.5, { shirt: '#1f1f22', pants: '#1f1f22', skin: SKINS[0], hat: '#111111', pose: 'point' }) + g(line(600, 140, 640, 100, P.ink, 4) + circle(650, 90, 16, P.ink), SH), P.brick),
  pipe_warning: () => eventScene('night', rect(0, 0, EW, EH, '#4a4a46') + rect(0, 400, EW, 100, '#5f5c55') + g(rect(300, 0, 46, 400, '#a9a39a') + rect(300, 180, 46, 80, '#9a5a30') + ellipse(323, 220, 30, 18, '#7a3a20', 'opacity="0.7"'), SH) + path('M323 270 q-10 18 0 28 q10 -10 0 -28', '#8fc6e8') + ellipse(323, 410, 70, 12, '#6fa0c0', 'opacity="0.7"') + path('M700 60 L380 220 L420 300 Z', '#fff3c0', 'opacity="0.25"') + person(780, 410, 1.5, { shirt: '#3f5f86', skin: SKINS[1], pose: 'point', flip: true }), '#5f5c55'),
  insurance_offer: () => eventScene('day', '%GROUND%' + house(140, GY, 1.2) + person(640, GY + 10, 1.4, { shirt: '#24364f', skin: SKINS[4], pose: 'hold' }) + person(820, GY + 10, 1.4, { shirt: P.mustard, skin: SKINS[1], long: true }) + g(rect(660, GY - 150, 90, 70, '#2f6f7a', 'rx="6"') + path('M705 ' + (GY - 140) + ' l24 10 v18 q0 18 -24 28 q-24 -10 -24 -28 v-18 z', '#ffffff'), SH), '#7d9a4c'),
  helpful_neighbor: () => eventScene('day', rect(0, 0, EW, EH, '#efe3cf') + rect(0, 400, EW, 100, '#c3b399') + rect(150, 120, 140, 280, P.woodDark, 'rx="4"') + g(rect(880, 140, 200, 120, '#9aa3aa', 'rx="4"') + Array.from({ length: 6 }, (_, i) => rect(890 + (i % 3) * 64, 150 + Math.floor(i / 3) * 54, 56, 44, '#7d868d')).join(''), SH) + person(460, 410, 1.6, { shirt: '#c46a3c', skin: SKINS[3], hair: '#e6e3dd', pose: 'hold' }) + g(rect(470, 250, 110, 80, '#c69a62', 'rx="4"') + rect(470, 282, 110, 10, '#a87e48'), SH) + person(700, 410, 1.6, { shirt: P.petrol, skin: SKINS[0], pose: 'hold', flip: true }), '#c3b399'),
  investor_inquiry: () => eventScene('day', cloud(900, 70, 1.6) + '%GROUND%' + house(560, GY, 1.4, { lit: false }) + person(250, GY + 10, 1.4, { shirt: '#2b3440', skin: SKINS[0], pose: 'point' }) + person(380, GY + 10, 1.4, { shirt: '#5b4a6e', skin: SKINS[2], long: true, pose: 'hold' }) + g(rect(345, GY - 110, 60, 44, '#2f3439', 'rx="5"') + rect(350, GY - 105, 50, 34, '#9fd0ea'), SH) + tree(1100, GY, 1.1), '#7d9a4c'),
  press_praise: () => eventScene('day', rect(0, 0, EW, EH, '#d9cdb8') + rect(0, 330, EW, 170, P.woodLight) + g(rect(240, 70, 720, 380, '#f7f4ee', 'rx="6"') + line(600, 80, 600, 440, '#d2ccc0', 3) + rect(280, 100, 280, 24, '#3a3a3a', 'rx="4"') + [140, 170, 200, 230, 260, 290, 320, 350, 380].map((y) => line(280, y, 560, y, '#c9c4b8', 6)).join(''), SH) + g(rect(640, 110, 280, 200, '#9fd0ea') + house(690, 300, 0.75, { insulated: true, green: true }), '') + [340, 370, 400].map((y) => line(640, y, 920, y, '#c9c4b8', 6)).join('') + g(rect(1000, 300, 70, 90, '#ffffff', 'rx="8"') + ellipse(1035, 300, 35, 8, '#7a4a28'), SH), P.woodLight),
  generic: () => eventScene('day', rect(0, 0, EW, EH, '#ece4d4') + rect(0, 400, EW, 100, '#bfae94') + g(rect(380, 100, 440, 240, '#a9b1b7', 'rx="6"') + Array.from({ length: 8 }, (_, i) => rect(396 + (i % 4) * 104, 116 + Math.floor(i / 4) * 110, 96, 100, '#8d969d', 'rx="4"') + rect(410 + (i % 4) * 104, 140 + Math.floor(i / 4) * 110, 68, 8, '#3a3f44', 'rx="3"')).join(''), SH) + g(rect(520, 120, 70, 46, '#ffffff', 'transform="rotate(-12 555 143)"') + path('M522 124 l33 22 l33 -22', 'none', `stroke="${P.red}" stroke-width="4" transform="rotate(-12 555 143)"`), SH) + plant(240, 400, 2) + plant(980, 400, 1.6), '#bfae94'),
};

// ============================================================ Maßnahmen (640×320)
const MW = 640, MH = 320;
const ms = (body: string, extra = '') => svg(MW, MH, body, defs(extra));
const exterior = (inner: string, sky: Parameters<typeof skyBg>[2] = 'day') => { const s = skyBg(MW, MH, sky, 'msky'); return ms(s.body + groundStrip(MW, 270) + inner, s.defs); };
const MEASURES: Record<string, () => string> = {
  apt_paint: () => ms(room(MW, MH, '#f2e7c9') + rect(0, 0, 260, MH * 0.72, '#cfc3a6') + g(rect(300, 90, 26, 120, '#d9d9d9', 'rx="10"') + rect(309, 210, 8, 70, P.wood), SH) + g(rect(430, 230, 70, 60, '#dfe3e6', 'rx="6"') + ellipse(465, 232, 35, 8, '#f2e7c9'), SH) + person(160, 300, 0.9, { shirt: '#f2f0ea', pants: '#f2f0ea', skin: SKINS[2], pose: 'point' })),
  apt_floor: () => ms(room(MW, MH, '#e9e2d4', 'laminate') + g([0, 1, 2].map((i) => rect(420 + i * 8, 180 - i * 22, 160, 20, '#c9a77c', 'rx="2"')).join(''), SH) + person(220, 300, 0.9, { shirt: P.mustard, skin: SKINS[3], pose: 'hold' }) + windowIn(80, 50, 120, 110)),
  apt_kitchen: () => ms(room(MW, MH, '#eef0ee', 'tile') + g(rect(60, 140, 520, 90, '#ffffff') + [0, 1, 2, 3, 4].map((i) => rect(68 + i * 102, 150, 94, 74, '#f4f4f2', `stroke="#e1e1de" stroke-width="2" rx="4"`) + rect(100 + i * 102, 160, 30, 4, P.greyDark)).join('') + rect(60, 130, 520, 12, P.woodLight) + rect(60, 30, 520, 70, '#ffffff') + [0, 1, 2, 3].map((i) => rect(68 + i * 128, 36, 120, 58, '#f4f4f2', `stroke="#e1e1de" stroke-width="2" rx="4"`)).join('') + rect(240, 116, 80, 14, '#3a3f44', 'rx="3"'), SH) + plant(560, 128, 0.7)),
  apt_bath: () => ms(rect(0, 0, MW, MH, '#e8f1f3') + Array.from({ length: 16 }, (_, i) => line(i * 40, 0, i * 40, MH, '#d4e2e6', 2)).join('') + Array.from({ length: 8 }, (_, i) => line(0, i * 40, MW, i * 40, '#d4e2e6', 2)).join('') + g(rect(80, 40, 160, 240, '#cfe7ef', 'opacity="0.6"') + rect(80, 40, 6, 240, '#bcc6ca') + circle(160, 70, 18, '#c8cdd2') + path('M150 92 l-6 40 M160 92 v44 M170 92 l6 40', 'none', 'stroke="#9fd0ea" stroke-width="3"'), SH) + g(rect(360, 180, 180, 30, '#ffffff', 'rx="6"') + rect(370, 210, 160, 70, P.woodLight, 'rx="4"') + rect(400, 40, 100, 120, '#d8eef7', 'rx="8"'), SH) + plant(580, 290, 0.8)),
  apt_full: () => ms(room(MW, MH, '#f4efe4', 'laminate') + windowIn(70, 40, 130, 120) + g(rect(300, 150, 220, 70, '#6f8fb0', 'rx="18"') + rect(300, 130, 220, 40, '#7d9cbc', 'rx="16"') + rect(310, 220, 12, 20, P.woodDark) + rect(498, 220, 12, 20, P.woodDark), SH) + plant(580, 240) + g(rect(380, 40, 80, 60, '#d9a43a') + rect(386, 46, 68, 48, '#f6e3a8'), SH)),
  apt_thermostat: () => ms(room(MW, MH, '#efe8da') + radiator(150, 160, 260) + g(rect(430, 150, 46, 70, '#ffffff', 'rx="10"') + circle(453, 175, 15, '#2c3a44') + rect(444, 172, 18, 6, '#7fd18b', 'rx="2"'), SH) + windowIn(170, 30, 200, 110)),
  stairwell_upgrade: () => ms(rect(0, 0, MW, MH, '#f3ead6') + Array.from({ length: 7 }, (_, i) => rect(260 + i * 50, 280 - i * 34, 380 - i * 50, 34, i % 2 ? '#c8b28c' : '#d6c29e')).join('') + g(rect(40, 90, 180, 110, '#9aa3aa', 'rx="4"') + Array.from({ length: 6 }, (_, i) => rect(50 + (i % 3) * 56, 100 + Math.floor(i / 3) * 50, 48, 40, '#c8cdd2')).join(''), SH) + circle(380, 40, 22, '#fff6c8') + plant(250, 290)),
  outdoor_design: () => exterior(g(rect(60, 230, 200, 40, P.wood) + rect(80, 210, 160, 12, P.woodLight), SH) + Array.from({ length: 16 }, (_, i) => circle(300 + i * 18, 250 - (i % 3) * 8, 7, ['#e05a5a', P.mustard, '#a978d4'][i % 3])).join('') + tree(560, 270, 0.9) + g(rect(100, 150, 120, 60, P.wood, 'rx="4"') + rect(96, 146, 128, 8, P.woodDark), SH)),
  bike_storage: () => exterior(g(rect(60, 120, 520, 12, '#5f666d') + rect(70, 120, 8, 150, '#5f666d') + rect(562, 120, 8, 150, '#5f666d'), SH) + [0, 1, 2, 3].map((i) => g(circle(130 + i * 120, 245, 22, 'none', `stroke="${P.ink}" stroke-width="4"`) + circle(190 + i * 120, 245, 22, 'none', `stroke="${P.ink}" stroke-width="4"`) + path(`M${130 + i * 120} 245 L${155 + i * 120} 210 L${190 + i * 120} 245 M${155 + i * 120} 210 h28`, 'none', `stroke="${[P.petrol, P.red, P.mustard, P.olive][i]}" stroke-width="5"`), SH)).join('')),
  laundry_room: () => ms(rect(0, 0, MW, MH, '#e2e6e8') + rect(0, 250, MW, 70, '#b8bec2') + [0, 1, 2].map((i) => g(rect(80 + i * 170, 120, 130, 150, '#ffffff', 'rx="10"') + circle(145 + i * 170, 200, 40, '#cfe2ea', `stroke="#c8cdd2" stroke-width="8"`) + rect(95 + i * 170, 132, 60, 10, '#c8cdd2', 'rx="4"'), SH)).join('') + line(40, 60, 600, 60, P.greyDark, 3) + [100, 220, 360, 480].map((x, i) => rect(x, 60, 50, 46, ['#9fb7f0', '#f28b6a', '#8fd0a8', '#f6d27a'][i])).join('')),
  community_room: () => ms(room(MW, MH, '#f2e1c6') + windowIn(420, 40, 160, 120) + table(150, 200, 300) + [170, 260, 350, 420].map((x) => g(rect(x, 170, 30, 30, P.petrol, 'rx="4"') + rect(x + 2, 200, 4, 50, P.woodDark) + rect(x + 24, 200, 4, 50, P.woodDark), SH)).join('') + g(rect(240, 180, 40, 22, '#ffffff', 'rx="4"') + circle(330, 190, 12, '#e05a5a'), SH) + plant(80, 260)),
  fire_safety: () => ms(rect(0, 0, MW, MH, '#efe9df') + rect(0, 0, MW, 30, '#e3dccd') + g(circle(320, 60, 40, '#ffffff') + circle(320, 60, 12, P.red), SH) + g(rect(120, 150, 60, 140, P.red, 'rx="18"') + rect(132, 126, 36, 28, P.ink, 'rx="4"'), SH) + g(rect(420, 150, 140, 70, '#3aa05a', 'rx="6"') + path('M450 185 h40 l-14 -14 M490 185 l-14 14', 'none', 'stroke="#ffffff" stroke-width="8" stroke-linecap="round"') + rect(510, 168, 30, 34, '#ffffff', 'rx="3"'), SH)),
  security_upgrade: () => exterior(rect(140, 60, 360, 210, P.sand) + g(rect(250, 110, 120, 160, '#3a4249', 'rx="4"') + rect(270, 126, 14, 120, '#bfe0ef') + rect(330, 180, 26, 6, '#c8cdd2', 'rx="3"'), SH) + g(rect(400, 140, 40, 80, '#2a2f34', 'rx="6"') + circle(420, 160, 7, '#6fb7e8') + rect(408, 176, 24, 34, '#9aa0a6', 'rx="3"'), SH) + circle(200, 110, 14, '#fff3b0')),
  electrical_renewal: () => ms(rect(0, 0, MW, MH, '#e6e2d8') + g(rect(200, 40, 240, 250, '#f2f2ef', 'rx="8"') + Array.from({ length: 12 }, (_, i) => rect(222 + (i % 6) * 34, 70 + Math.floor(i / 6) * 70, 24, 50, i % 4 ? '#2c3a44' : P.mustard, 'rx="3"')).join('') + rect(222, 220, 196, 40, '#dfe3e6', 'rx="4"'), SH) + path('M100 0 V300 M540 0 V300', 'none', 'stroke="#c8473a" stroke-width="6"') + path('M120 0 V300 M520 0 V300', 'none', 'stroke="#2f6f7a" stroke-width="6"')),
  pipe_renewal: () => ms(rect(0, 0, MW, MH, '#dfd9cc') + [140, 260, 380, 500].map((x, i) => g(rect(x, 0, 30, MH, i % 2 ? '#c7cbd0' : '#e0a060') + [60, 180, 260].map((y) => rect(x - 6, y, 42, 12, i % 2 ? '#aab0b6' : '#c48848', 'rx="3"')).join(''), SH)).join('') + path('M0 240 H640', 'none', 'stroke="#8d969d" stroke-width="18"') + toolbox(40, 300)),
  basement_seal: () => ms(rect(0, 0, MW, 120, '#9fd0ea') + groundStrip(MW, 120, '#7a5a3c') + g(rect(160, 120, 320, 200, P.stone) + rect(160, 120, 20, 200, '#2b2d30') + rect(180, 120, 14, 200, '#3a4a5a'), SH) + Array.from({ length: 10 }, (_, i) => line(194, 140 + i * 18, 480, 140 + i * 18, P.stoneDark, 2, 'opacity="0.5"')).join('') + path('M120 300 q30 -10 60 0', 'none', 'stroke="#6fa0c0" stroke-width="4"') + person(560, 300, 0.8, { shirt: P.mustard, skin: SKINS[3] })),
  roof_renovation: () => exterior(g(path('M80 260 L320 90 L560 260 Z', P.brick) + path('M80 260 L320 90 L330 98 L95 266 Z', '#e9d36a') + Array.from({ length: 7 }, (_, i) => line(110 + i * 10, 240 - i * 22, 530 - i * 10, 240 - i * 22, P.brickDark, 3)).join(''), SH) + person(380, 170, 0.7, { shirt: P.red, skin: SKINS[1], pose: 'hold' })),
  facade_renewal: () => exterior(house(215, 270, 0.95, { scaffold: true }) + person(500, 270, 0.8, { shirt: '#f2f0ea', pants: '#f2f0ea', skin: SKINS[1], pose: 'point', flip: true })),
  facade_insulation: () => exterior(g(rect(120, 60, 400, 210, P.sand) + rect(320, 60, 200, 210, '#f0e9dc') + Array.from({ length: 5 }, (_, r) => Array.from({ length: 4 }, (_, c) => rect(326 + c * 48, 66 + r * 40, 44, 36, '#fdf6e6', 'stroke="#e8dcc0" stroke-width="2"')).join('')).join(''), SH) + person(250, 270, 0.9, { shirt: '#3f5f86', skin: SKINS[2], pose: 'point' })),
  windows_replace: () => ms(room(MW, MH, '#f0e8d6') + windowIn(220, 40, 200, 170) + g(rect(500, 130, 80, 110, '#7a4a28', 'transform="rotate(10 540 185)"') + rect(512, 142, 56, 86, '#9fb4c4', 'transform="rotate(10 540 185)"'), SH) + person(120, 300, 0.9, { shirt: P.mustard, skin: SKINS[0] })),
  heating_condensing: () => ms(rect(0, 0, MW, MH, '#e3e1da') + g(rect(240, 50, 160, 220, '#f6f6f4', 'rx="12"') + rect(270, 90, 100, 44, '#2c3a44', 'rx="6"') + path('M320 128 q-14 -8 -4 -24 q4 10 12 14 q2 6 -8 10', '#4aa8e8') + circle(300, 180, 12, '#ffffff', `stroke="${P.greyDark}" stroke-width="3"`) + circle(345, 180, 7, '#53c66a'), SH) + path('M260 270 V310 M380 270 V310', 'none', 'stroke="#b9875a" stroke-width="10"')),
  heating_heatpump: () => exterior(house(60, 270, 1, { insulated: true }) + g(rect(360, 170, 170, 100, '#e7eaec', 'rx="10"') + circle(430, 220, 38, '#4f585f') + [0, 1, 2, 3, 4].map((k) => line(430, 220, 430 + 32 * Math.cos(k * 1.3), 220 + 32 * Math.sin(k * 1.3), '#8d979e', 8)).join(''), SH) + sun(580, 50, 26)),
  heating_district: () => exterior(house(240, 270, 1) + g(rect(0, 286, MW, 18, '#c8473a') + rect(0, 296, MW, 4, '#a83a30') + rect(330, 250, 18, 46, '#c8473a'), SH) + g(rect(60, 150, 120, 120, '#9aa3aa', 'rx="6"') + rect(80, 120, 20, 40, '#7d868d') + path('M90 110 q10 -20 0 -40', 'none', 'stroke="#ffffff" stroke-width="6" opacity="0.8"'), SH), 'frost'),
  hydraulic_balance: () => ms(room(MW, MH, '#efe8da') + radiator(140, 150, 300) + g(circle(460, 170, 18, '#ffffff', `stroke="${P.greyDark}" stroke-width="4"`) + line(460, 170, 470, 158, P.red, 3) + rect(450, 190, 20, 40, '#c8cdd2'), SH) + person(560, 300, 0.85, { shirt: P.petrol, skin: SKINS[3], pose: 'point', flip: true })),
  efficient_pumps: () => ms(rect(0, 0, MW, MH, '#e3e1da') + path('M0 160 H230 M410 160 H640', 'none', 'stroke="#b9875a" stroke-width="22"') + g(rect(230, 110, 180, 100, '#d9473a', 'rx="16"') + circle(320, 160, 30, '#f6f6f4') + rect(304, 152, 32, 16, '#7fd18b', 'rx="3"'), SH)),
  led_lighting: () => ms(rect(0, 0, MW, MH, '#46505f') + [120, 320, 520].map((x) => g(rect(x - 6, 0, 12, 50, '#9aa0a6') + ellipse(x, 60, 46, 14, '#f7f4ee') + path(`M${x - 46} 66 L${x - 120} ${MH} L${x + 120} ${MH} L${x + 46} 66 Z`, '#ffe9a8', 'opacity="0.35"'), '')).join('') + rect(0, 280, MW, 40, '#4a4f58')),
  waste_sorting: () => exterior([['#5c646b', 80], ['#2f5f9e', 210], [P.mustard, 340], ['#7a5a3c', 470]].map(([c, x]) => g(rect(Number(x), 150, 100, 120, String(c), 'rx="8"') + rect(Number(x) - 4, 140, 108, 14, shade(String(c), -0.2), 'rx="5"') + circle(Number(x) + 50, 210, 18, '#ffffff', 'opacity="0.85"'), SH)).join('')),
  rainwater: () => exterior(house(40, 270, 0.9) + path('M245 120 V230 H330', 'none', 'stroke="#9aa3aa" stroke-width="10"') + g(ellipse(400, 250, 70, 24, '#4f7f9a') + rect(330, 180, 140, 70, '#5f8fa8') + ellipse(400, 180, 70, 24, '#6fa0bc'), SH) + rain(MW, 200, 60, 4, 4)),
  solar_pv: () => exterior(house(215, 270, 0.95, { solar: true }) + sun(560, 50, 30)),
  green_roof: () => exterior(g(rect(80, 150, 480, 120, '#d8c7a6') + rect(70, 136, 500, 18, '#8b8a85'), SH) + Array.from({ length: 24 }, (_, i) => circle(84 + i * 21, 132 - (i % 3) * 6, 12, i % 4 ? P.olive : P.oliveLight)).join('') + Array.from({ length: 8 }, (_, i) => circle(100 + i * 60, 120, 5, ['#e05a5a', P.mustard, '#a978d4'][i % 3])).join('') + g(rect(420, 200, 120, 60, P.wood) + Array.from({ length: 5 }, (_, i) => ellipse(434 + i * 24, 196, 10, 18, P.olive)).join(''), SH)),
};

// ============================================================ Hintergründe
function skyBackground(season: 'spring' | 'summer' | 'autumn' | 'winter') {
  const w = 1600, h = 900;
  const mood = { spring: 'day', summer: 'day', autumn: 'autumn', winter: 'frost' }[season] as Parameters<typeof skyBg>[2];
  const s = skyBg(w, h, mood, 'bgsky');
  let b = s.body;
  if (season === 'summer') b += sun(1340, 160, 70);
  if (season !== 'summer') b += cloud(180, 160, 2.4, '#ffffff', 0.85) + cloud(1100, 120, 2.8, season === 'winter' ? '#e8eef2' : '#ffffff', 0.8);
  else b += cloud(300, 200, 1.8, '#ffffff', 0.9);
  const r = rng(9);
  const silhouette = (y: number, c: string, op: number) => { let ss = ''; let x = 0; while (x < w) { const bw = 80 + r() * 140, bh = 80 + r() * 160; ss += rect(x, y - bh, bw, bh + 300, c) + (r() < 0.35 ? path(`M${x} ${y - bh} l${bw / 2} -40 l${bw / 2} 40z`, c) : ''); if (r() < 0.08) ss += rect(x + bw / 2 - 10, y - bh - 140, 20, 140, c) + path(`M${x + bw / 2 - 16} ${y - bh - 140} l16 -50 l16 50z`, c); x += bw + 6; } return g(ss, `opacity="${op}"`); };
  const tint = { spring: '#9fb8c6', summer: '#8fb3c6', autumn: '#c99a7e', winter: '#b6c4cf' }[season];
  b += silhouette(760, tint, 0.55) + silhouette(840, shade(tint, -0.12), 0.6);
  if (season === 'winter') b += snow(w, h, 260, 8);
  return svg(w, h, b, s.defs);
}
function startBackground() {
  const w = 1920, h = 1080;
  const s = skyBg(w, h, 'dusk', 'stsky');
  let b = s.body + groundStrip(w, 900, '#4a4f58') + rect(0, 860, w, 40, '#8b8a85');
  const cols = ['#d8bd8c', '#c9a98a', '#e1cfae', '#b99a68', '#d3b38f'];
  for (let i = 0; i < 6; i++) b += house(40 + i * 320, 860, 1.25, { lit: true, floors: 4 + (i % 2) }).replace(P.sand, cols[i % 5]);
  for (let i = 0; i < 7; i++) b += g(rect(150 + i * 290, 760, 8, 140, '#2b2f36') + circle(154 + i * 290, 756, 14, '#fff3b0') + circle(154 + i * 290, 756, 40, '#fff3b0', 'opacity="0.2"'), '');
  b += tree(120, 900, 1.6, '#3f5a32') + tree(1700, 900, 1.8, '#3f5a32');
  return svg(w, h, b, defs(s.defs));
}

// ============================================================ Icons & Logo
const ic = (body: string) => svg(128, 128, body, defs());
const ICONS: Record<string, () => string> = {
  roof: () => ic(g(path('M14 70 L64 24 L114 70 Z', P.brick) + rect(28, 70, 72, 40, P.sand) + rect(84, 30, 12, 26, P.brickDark), SH)),
  facade: () => ic(g(rect(22, 20, 84, 90, P.sand, 'rx="4"') + [0, 1, 2].map((r) => [0, 1].map((c) => rect(34 + c * 36, 30 + r * 26, 24, 18, P.glass, `stroke="${P.woodDark}" stroke-width="3"`)).join('')).join(''), SH)),
  windows: () => ic(g(rect(26, 22, 76, 80, P.glass, `stroke="#ffffff" stroke-width="8" rx="3"`) + line(64, 22, 64, 102, '#ffffff', 6) + rect(20, 102, 88, 10, '#d9d4cb', 'rx="2"'), SH)),
  heating: () => ic(g(Array.from({ length: 6 }, (_, i) => rect(20 + i * 15, 40, 12, 60, '#eef0f0', `stroke="#c8cdd2" stroke-width="2" rx="5"`)).join('') + path('M64 34 c-10 -8 -4 -20 4 -26 c2 10 10 12 6 22 z', P.red), SH)),
  pipes: () => ic(g(path('M20 40 H70 V100 H110', 'none', `stroke="#e0a060" stroke-width="16" stroke-linejoin="round"`) + rect(60, 52, 20, 10, '#c48848') + path('M100 106 q-6 10 0 16 q6 -6 0 -16', '#6fb7e8'), SH)),
  electrical: () => ic(g(rect(30, 18, 68, 92, '#f2f2ef', 'rx="8"') + path('M70 30 L48 66 H64 L56 98 L82 58 H66 Z', P.mustard), SH)),
  sanitary: () => ic(g(path('M30 60 h68 q0 34 -34 34 q-34 0 -34 -34 z', '#ffffff', `stroke="#c8cdd2" stroke-width="4"`) + rect(56, 94, 16, 20, '#c8cdd2') + path('M64 20 v24 M54 30 h20', 'none', `stroke="${P.petrol}" stroke-width="6" stroke-linecap="round"`), SH)),
  stairwell: () => ic(g(Array.from({ length: 5 }, (_, i) => rect(20 + i * 18, 100 - i * 18, 108 - 20 - i * 18, 18, i % 2 ? '#c8b28c' : '#d6c29e')).join('') + line(24, 70, 96, 14, P.woodDark, 5), SH)),
  basement: () => ic(g(rect(16, 56, 96, 56, P.stone) + Array.from({ length: 3 }, (_, i) => line(16, 70 + i * 14, 112, 70 + i * 14, P.stoneDark, 2)).join('') + rect(16, 40, 96, 16, P.olive) + rect(52, 80, 24, 20, '#3a4a5a'), SH)),
  outdoor: () => ic(g(rect(60, 70, 8, 40, P.woodDark) + circle(64, 54, 30, P.olive) + circle(46, 66, 18, P.oliveDark) + rect(10, 108, 108, 8, P.oliveLight), SH)),
};

function logo() {
  return svg(512, 512, rect(16, 16, 480, 480, P.navy, 'rx="104"') + path('M96 250 L256 112 L416 250', 'none', `stroke="${P.mustard}" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"`) + rect(146, 250, 220, 170, '#f1ede4', 'rx="10"') + rect(176, 280, 56, 50, '#9fd0ea', 'rx="6"') + rect(280, 280, 56, 50, '#f6d27a', 'rx="6"') + rect(226, 350, 60, 70, P.wood, 'rx="6"') + rect(320, 140, 30, 60, P.brickLight, 'rx="4"'));
}
function logoWide() {
  const icon = `<g transform="translate(20 30) scale(0.47)">${logo().replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`;
  return svg(1200, 300, icon + `<text x="290" y="150" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="118" font-weight="800" fill="${P.navy}" letter-spacing="-2">Mietshaus</text><text x="294" y="250" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="92" font-weight="800" fill="${P.mustard}" letter-spacing="6">TYCOON</text>`);
}

export const SCENES: Record<string, () => string> = {
  ...Object.fromEntries(Object.entries(EVENTS).map(([k, fn]) => [`events/${k}`, fn])),
  ...Object.fromEntries(Object.entries(MEASURES).map(([k, fn]) => [`measures/${k}`, fn])),
  ...Object.fromEntries(Object.entries(ICONS).map(([k, fn]) => [`components/icon_${k}`, fn])),
  'backgrounds/sky_spring': () => skyBackground('spring'),
  'backgrounds/sky_summer': () => skyBackground('summer'),
  'backgrounds/sky_autumn': () => skyBackground('autumn'),
  'backgrounds/sky_winter': () => skyBackground('winter'),
  'backgrounds/start': startBackground,
  'ui/logo': logo,
  'ui/logo_wide': logoWide,
};
