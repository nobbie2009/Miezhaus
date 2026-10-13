import { P, circle, ellipse, g, line, path, rect, rng, shade, shadowFilter, svg } from './lib';

const sh = 'filter="url(#sh)"';
const S = (w: number, h: number, body: string, defs = '') => svg(w, h, body, shadowFilter() + defs);

/** Fensterrahmen mit transparenten Glasflächen (Pfad mit evenodd-Füllung). */
function windowFrame(frame: string, sill: string, mullion: boolean, transom: boolean, thick: number) {
  const w = 160, h = 168, fh = 150;
  const t = thick;
  // Außenrahmen minus Glasflächen
  const panes: [number, number, number, number][] = [];
  const midX = w / 2, midY = transom ? 52 : -1;
  const xs = mullion ? [[t, midX - t / 2], [midX + t / 2, w - t]] : [[t, w - t]];
  const ys = transom ? [[t, midY - t / 2.5], [midY + t / 2.5, fh - t]] : [[t, fh - t]];
  for (const [x1, x2] of xs) for (const [y1, y2] of ys) panes.push([x1, y1, x2 - x1, y2 - y1]);
  let d = `M0 0 H${w} V${fh} H0 Z`;
  for (const [x, y, pw, ph] of panes) d += ` M${x} ${y} V${y + ph} H${x + pw} V${y} Z`;
  let body = path(d, frame, 'fill-rule="evenodd"');
  // Lichtkante oben links, Schatten unten rechts
  body += rect(0, 0, w, 3, shade(frame, 0.25)) + rect(0, 0, 3, fh, shade(frame, 0.2)) + rect(w - 3, 0, 3, fh, shade(frame, -0.25));
  for (const [x, y, pw] of panes) body += rect(x, y, pw, 3, shade(frame, -0.35), 'opacity="0.6"');
  body += rect(-0, fh, w, h - fh, sill) + rect(0, fh, w, 3, shade(sill, 0.25));
  if (!transom) body += circle(midX + t / 2 + 6, fh / 2, 3, shade(frame, -0.4));
  return svg(w, h, body);
}

function tree(season: 'spring' | 'summer' | 'autumn' | 'winter') {
  const r = rng(77);
  const w = 160, h = 240;
  let body = path(`M74 240 C76 190 70 160 72 120 L88 120 C90 160 84 190 86 240 Z`, P.woodDark);
  body += path('M78 150 C60 130 46 120 38 104', 'none', `stroke="${P.woodDark}" stroke-width="7" stroke-linecap="round"`);
  body += path('M82 140 C100 122 114 112 124 96', 'none', `stroke="${P.woodDark}" stroke-width="7" stroke-linecap="round"`);
  body += path('M80 125 C80 100 82 80 80 60', 'none', `stroke="${P.woodDark}" stroke-width="6" stroke-linecap="round"`);
  if (season === 'winter') {
    for (const [x1, y1, x2, y2] of [[40, 105, 24, 84], [124, 96, 140, 76], [80, 60, 66, 40], [80, 60, 96, 38], [52, 116, 44, 130], [110, 108, 128, 116]]) body += line(x1, y1, x2, y2, P.woodDark, 4);
    for (const [x, y] of [[30, 88], [136, 80], [70, 44], [92, 42]]) body += ellipse(x, y, 9, 4, '#ffffff', 'opacity="0.95"');
    return S(w, h, g(body, sh));
  }
  const cols = season === 'spring' ? ['#9cc566', '#b5d77f', '#86b552'] : season === 'summer' ? [P.olive, P.oliveDark, '#7f9c47'] : ['#d9822b', '#c4562f', '#e0ad3a'];
  const blobs: [number, number, number][] = [[80, 70, 52], [46, 98, 38], [116, 96, 40], [80, 112, 40], [60, 58, 32], [104, 56, 32]];
  let crown = '';
  for (const [x, y, rr] of blobs) crown += circle(x, y, rr, cols[0]);
  for (const [x, y, rr] of blobs) crown += circle(x - rr * 0.25, y - rr * 0.3, rr * 0.55, cols[1], 'opacity="0.55"');
  for (let i = 0; i < 26; i++) crown += circle(30 + r() * 100, 30 + r() * 100, 4 + r() * 6, cols[2], 'opacity="0.6"');
  if (season === 'spring') for (let i = 0; i < 14; i++) crown += circle(34 + r() * 92, 30 + r() * 90, 3, '#fff6f0');
  if (season === 'autumn') for (let i = 0; i < 6; i++) body += ellipse(30 + r() * 100, 150 + r() * 80, 5, 3, cols[2]);
  return S(w, h, g(body + crown, sh));
}

function boiler(ok: boolean) {
  const w = 144, h = 104;
  let b = rect(30, 6, 84, 92, '#eef0f0', 'rx="8"') + rect(30, 6, 84, 10, '#d9dddd', 'rx="8"');
  b += rect(44, 26, 56, 26, '#2c3a44', 'rx="4"');
  b += ok ? path('M72 48 C64 44 66 36 72 30 C74 36 80 38 78 44 C77 47 75 48 72 48 Z', '#4aa8e8') + path('M72 48 C69 46 70 42 72 39 C74 42 75 45 72 48Z', '#c9ecff') : path('M60 30 h24 v18 h-24z', '#3a2422');
  b += circle(54, 68, 9, '#ffffff', `stroke="${P.greyDark}" stroke-width="2"`) + line(54, 68, 58, 63, P.red, 2);
  b += circle(90, 68, 5, ok ? '#53c66a' : '#e5483a') + (ok ? '' : circle(90, 68, 9, '#e5483a', 'opacity="0.3"'));
  for (const x of [8, 18]) b += rect(x, 20, 6, 84, '#b9875a') + rect(x, 20, 22, 6, '#b9875a');
  b += rect(124, 30, 14, 6, P.grey) + rect(132, 30, 6, 74, P.grey);
  if (!ok) {
    b += path('M100 80 l10 -18 l10 18 z', P.yellow, `stroke="${P.ink}" stroke-width="2" stroke-linejoin="round"`) + rect(109, 68, 2, 6, P.ink) + rect(109, 76, 2, 2, P.ink);
    b += ellipse(72, 101, 30, 3, '#5aa0d0', 'opacity="0.55"');
    for (const [x, y, rr] of [[96, 10, 7], [106, 4, 6], [114, 10, 5]]) b += circle(x, y, rr, '#ffffff', 'opacity="0.8"');
  }
  return S(w, h, g(b, sh));
}

function door(kind: 'old' | 'new' | 'broken') {
  const w = 112, h = 184;
  let b = rect(4, 8, 104, 10, P.stoneDark, 'rx="2"');
  const col = kind === 'new' ? '#3a4249' : P.woodDark;
  b += rect(14, 22, 84, 150, col, 'rx="3"');
  b += rect(4, 172, 104, 12, P.stone, 'rx="2"');
  if (kind === 'new') {
    b += rect(30, 34, 10, 124, '#bfe0ef', 'rx="2"') + rect(72, 80, 18, 4, '#c8cdd2', 'rx="2"');
    b += rect(100, 70, 10, 34, '#2a2f34', 'rx="2"') + circle(105, 78, 3, '#6fb7e8') + rect(102, 86, 6, 14, '#9aa0a6', 'rx="1"');
  } else {
    b += rect(28, 36, 56, 44, kind === 'broken' ? '#9fc7d6' : '#bfe0ef', 'rx="2"') + rect(28, 92, 56, 64, shade(col, 0.12), 'rx="3"');
    b += line(56, 36, 56, 80, col, 4) + rect(76, 104, 12, 5, P.mustard, 'rx="2"');
    if (kind === 'broken') {
      b += path('M34 40 L52 58 L44 72 M52 58 L76 50', 'none', `stroke="#ffffff" stroke-width="2"`);
      b += path('M20 110 l18 6 M24 140 l14 -4', 'none', `stroke="#c8a27a" stroke-width="2"`);
      b += rect(96, 22, 10, 150, '#1c1410', 'opacity="0.7"');
    }
  }
  return S(w, h, g(b, sh));
}

function bins(overflow: boolean) {
  const w = overflow ? 140 : 120, h = 80;
  const bin = (x: number, c: string, open: boolean) => rect(x, 22, 36, 56, c, 'rx="4"') + (open ? path(`M${x - 2} 22 l40 -14 l2 6 l-40 14 z`, shade(c, -0.2)) : rect(x - 2, 16, 40, 8, shade(c, -0.2), 'rx="3"')) + circle(x + 8, 78, 4, P.ink) + circle(x + 28, 78, 4, P.ink);
  let b = bin(overflow ? 26 : 18, '#5c646b', overflow) + bin(overflow ? 70 : 64, '#2f5f9e', false);
  if (overflow) {
    b += ellipse(46, 18, 16, 10, '#3f3f3f') + ellipse(14, 66, 14, 13, '#2d2d2d') + rect(110, 50, 26, 28, '#b98a56', 'rx="2"') + ellipse(124, 72, 14, 8, '#353535');
    b += path('M40 10 l6 -8 l4 6', 'none', `stroke="#d9d0b0" stroke-width="3"`);
  }
  return S(w, h, g(b, sh));
}

export const SPRITES: Record<string, () => string> = {
  'sprites/window_old': () => windowFrame('#7a4a28', '#b8b2a6', true, true, 14),
  'sprites/window_new': () => windowFrame('#f4f4f2', '#e1ddd6', true, false, 9),
  'sprites/balcony': () => {
    let b = rect(0, 4, 416, 6, '#4a5258', 'rx="3"') + rect(0, 42, 416, 6, '#4a5258', 'rx="2"');
    for (let x = 8; x < 416; x += 16) b += rect(x, 8, 4, 36, '#5c656c');
    return svg(416, 48, b);
  },
  'sprites/door_entrance': () => door('old'),
  'sprites/door_entrance_new': () => door('new'),
  'sprites/door_broken': () => door('broken'),
  'sprites/chimney': () => S(64, 144, g(rect(10, 16, 44, 128, P.brick) + rect(4, 6, 56, 12, P.stoneDark, 'rx="2"') + [28, 52, 76, 100, 124].map((y, i) => line(10, y, 54, y, P.brickDark, 2) + line(i % 2 ? 24 : 38, y, i % 2 ? 24 : 38, y + 24, P.brickDark, 2)).join('') + rect(10, 16, 6, 128, P.brickLight, 'opacity="0.5"'), sh)),
  'sprites/smoke': () => svg(96, 96, [[30, 70, 18], [52, 56, 22], [66, 32, 18], [40, 40, 14]].map(([x, y, rr]) => circle(x, y, rr, '#d5d8db', 'opacity="0.85"')).join('')),
  'sprites/solar_panels': () => {
    let b = '';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const x = 8 + i * 76, y = 8 + j * 54;
      b += rect(x, y, 70, 48, '#c9d1d8', 'rx="2"') + rect(x + 3, y + 3, 64, 42, '#1f3a63');
      for (let k = 1; k < 4; k++) b += line(x + 3 + k * 16, y + 3, x + 3 + k * 16, y + 45, '#3a5a8a', 1);
      b += line(x + 3, y + 24, x + 67, y + 24, '#3a5a8a', 1) + path(`M${x + 6} ${y + 6} h20 l-14 16 h-6z`, '#ffffff', 'opacity="0.15"');
    }
    return S(320, 120, g(b, sh));
  },
  'sprites/heat_pump': () => S(136, 120, g(rect(8, 10, 120, 92, '#e7eaec', 'rx="8"') + circle(56, 56, 34, '#cfd5d9') + circle(56, 56, 30, '#4f585f') + [0, 1, 2, 3, 4, 5].map((k) => line(56, 56, 56 + 26 * Math.cos(k), 56 + 26 * Math.sin(k), '#8d979e', 6)).join('') + circle(56, 56, 6, '#c9cfd3') + rect(100, 24, 20, 64, '#d6dbde', 'rx="3"') + [0, 1, 2, 3, 4].map((k) => line(104, 32 + k * 12, 116, 32 + k * 12, '#aab3b9', 2)).join('') + rect(20, 102, 14, 16, '#7d868d') + rect(102, 102, 14, 16, '#7d868d'), sh)),
  'sprites/boiler_ok': () => boiler(true),
  'sprites/boiler_broken': () => boiler(false),
  'sprites/tree_spring': () => tree('spring'),
  'sprites/tree_summer': () => tree('summer'),
  'sprites/tree_autumn': () => tree('autumn'),
  'sprites/tree_winter': () => tree('winter'),
  'sprites/bins': () => bins(false),
  'sprites/bins_overflow': () => bins(true),
  'sprites/bikes': () => {
    const bike = (x: number, c: string) => g(circle(x + 14, 60, 14, 'none', `stroke="${P.ink}" stroke-width="3"`) + circle(x + 54, 60, 14, 'none', `stroke="${P.ink}" stroke-width="3"`) + path(`M${x + 14} 60 L${x + 30} 36 L${x + 54} 60 M${x + 30} 36 L${x + 48} 36 L${x + 54} 60 M${x + 30} 36 L${x + 26} 28 M${x + 48} 36 L${x + 50} 26`, 'none', `stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`));
    return S(140, 80, g(rect(4, 40, 132, 4, P.greyDark) + [10, 70].map((x) => path(`M${x} 78 V44 Q${x} 30 ${x + 14} 30 Q${x + 28} 30 ${x + 28} 44 V78`, 'none', `stroke="${P.greyDark}" stroke-width="4"`)).join('') + bike(2, P.petrol) + bike(70, P.red) + rect(118, 22, 18, 10, P.wood, 'rx="2"'), sh));
  },
  'sprites/flowers': () => {
    const r = rng(5);
    let b = rect(0, 34, 140, 14, P.woodDark, 'rx="3"') + rect(4, 28, 132, 10, '#5d4030');
    for (let i = 0; i < 18; i++) {
      const x = 8 + i * 7.3, hh = 10 + r() * 14;
      b += line(x, 30, x, 30 - hh, P.oliveDark, 2) + circle(x, 30 - hh, 4.5, ['#d9534f', P.mustard, '#9b6bc9', '#ef8f3a', '#f2f0ea'][i % 5]);
    }
    return svg(140, 48, b);
  },
  'sprites/scaffold': () => {
    let b = '';
    b += rect(0, 0, 6, 128, '#9aa3aa') + rect(64, 0, 6, 128, '#9aa3aa');
    b += rect(0, 58, 128, 10, '#c49a5c') + rect(0, 60, 128, 2, '#a07a42');
    b += line(6, 128, 64, 68, '#8a939a', 4) + line(70, 58, 128, 0, '#8a939a', 4);
    b += rect(0, 120, 128, 4, '#9aa3aa');
    return svg(128, 128, b);
  },
  'sprites/graffiti': () => svg(160, 64, path('M10 44 C20 10 34 10 40 40 C46 60 56 20 70 18 C84 16 80 50 96 48 C112 46 106 14 126 16 C142 18 140 46 152 40', 'none', 'stroke="#c43ea9" stroke-width="9" stroke-linecap="round"') + path('M16 50 C40 40 60 52 80 44 C100 38 120 50 150 30', 'none', 'stroke="#2f9fd0" stroke-width="5" stroke-linecap="round"') + rect(38, 40, 3, 16, '#c43ea9', 'rx="1"') + rect(120, 20, 3, 18, '#c43ea9', 'rx="1"')),
  'sprites/mold_spot': () => svg(96, 64, ellipse(48, 32, 42, 26, '#59614a', 'opacity="0.55"') + ellipse(44, 30, 28, 18, '#2f3a2c', 'opacity="0.7"') + [[24, 20], [64, 40], [70, 18], [30, 46], [52, 22]].map(([x, y]) => circle(x, y, 4, '#1d241b', 'opacity="0.8"')).join('')),
  'sprites/crack': () => svg(96, 128, path('M50 2 L44 26 L56 44 L40 70 L52 90 L46 126 M56 44 L74 56 M40 70 L22 80 M52 90 L66 104', 'none', 'stroke="#4a3d2e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"') + path('M38 64 l-8 8 l6 6z M58 40 l8 -2 l-2 8z', '#8f7c62')),
  'sprites/rat': () => svg(48, 32, ellipse(22, 20, 15, 9, '#7d7a76') + circle(36, 15, 7, '#7d7a76') + circle(34, 9, 3.5, '#d39c9c') + circle(39, 14, 1.4, P.ink) + circle(43, 17, 1.4, '#d39c9c') + path('M8 22 C2 24 0 30 6 30', 'none', 'stroke="#c99a9a" stroke-width="2"') + rect(14, 27, 3, 4, '#5f5c58') + rect(28, 27, 3, 4, '#5f5c58')),
  'sprites/sign_for_rent': () => svg(120, 40, rect(2, 2, 116, 36, '#ffffff', `rx="4" stroke="${P.petrol}" stroke-width="4"`) + path('M26 26 V16 L36 9 L46 16 V26 Z', P.petrol) + rect(33, 19, 6, 7, '#ffffff') + circle(66, 20, 7, 'none', `stroke="${P.mustard}" stroke-width="4"`) + rect(72, 18, 30, 4, P.mustard) + rect(92, 18, 4, 9, P.mustard) + rect(100, 18, 4, 7, P.mustard)),
};
