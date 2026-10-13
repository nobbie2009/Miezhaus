import { P, circle, ellipse, path, rect, rng, shade, svg, wrap, line } from './lib';

const S = 256;

function grain(r: () => number, n: number, colors: string[], maxR: number, op: number, w = S, h = S) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rr = 0.4 + r() * maxR, c = colors[Math.floor(r() * colors.length)];
    const o = (op * (0.5 + r() * 0.5)).toFixed(2);
    s += wrap(w, h, (dx, dy) => circle(x + dx, y + dy, rr, c, `opacity="${o}"`), { x, y, r: rr });
  }
  return s;
}

function plaster(base: string, seed: number, extra = '') {
  const r = rng(seed);
  return svg(S, S, rect(0, 0, S, S, base) + grain(r, 900, [shade(base, -0.12), shade(base, 0.12)], 1.2, 0.5) + grain(r, 40, [shade(base, -0.06)], 9, 0.25) + extra);
}

function streaks(r: () => number, n: number, color: string, op: number) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = r() * S, y = r() * S, w = 4 + r() * 14, h = 40 + r() * 110;
    s += wrap(S, S, (dx, dy) => rect(x + dx, y + dy, w, h, color, `rx="${w / 2}" opacity="${op}"`), { x: x + w / 2, y: y + h / 2, r: h });
  }
  return s;
}

function blobs(r: () => number, n: number, color: string, size: number, op: number) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = r() * S, y = r() * S, rx = size * (0.5 + r()), ry = rx * (0.5 + r() * 0.6);
    s += wrap(S, S, (dx, dy) => ellipse(x + dx, y + dy, rx, ry, color, `opacity="${op}"`), { x, y, r: rx });
  }
  return s;
}

function cracks(r: () => number, n: number) {
  let s = '';
  for (let i = 0; i < n; i++) {
    let x = r() * S, y = r() * S;
    let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    for (let k = 0; k < 6; k++) {
      x += (r() - 0.5) * 22;
      y += 8 + r() * 16;
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    s += wrap(S, S, (dx, dy) => `<path d="${d}" transform="translate(${dx} ${dy})" fill="none" stroke="#5b4a36" stroke-width="1.6" stroke-linecap="round" opacity="0.75"/>`);
  }
  return s;
}

function spall(r: () => number, n: number) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = r() * S, y = r() * S, w = 22 + r() * 30, h = 14 + r() * 18;
    const bricks = (dx: number, dy: number) => {
      let b = rect(x + dx, y + dy, w, h, P.brick, `rx="5"`);
      for (let yy = 0; yy < h; yy += 7) b += line(x + dx + 2, y + dy + yy, x + dx + w - 2, y + dy + yy, P.brickDark, 1);
      return b + rect(x + dx - 2, y + dy - 2, w + 4, h + 4, 'none', `rx="6" stroke="${P.sandDark}" stroke-width="2"`);
    };
    s += wrap(S, S, bricks);
  }
  return s;
}

function roof(seed: number, state: 'good' | 'worn' | 'damaged') {
  const r = rng(seed);
  const tw = 32, th = 32;
  const base = state === 'good' ? P.brick : state === 'worn' ? '#9a5a45' : '#8a5a4a';
  let s = rect(0, 0, S, S, shade(base, -0.45));
  for (let row = 0; row < S / th; row++) {
    const off = row % 2 ? tw / 2 : 0;
    for (let col = -1; col <= S / tw; col++) {
      const x = col * tw + off, y = row * th;
      if (state === 'damaged' && r() < 0.12) continue; // fehlender Ziegel
      const c = shade(base, (r() - 0.5) * 0.18);
      const sh = state === 'damaged' && r() < 0.15 ? (r() - 0.5) * 8 : 0;
      const tile = (dx: number) => path(`M${x + dx + 1} ${y + sh} h${tw - 2} v${th * 0.75} q0 ${th * 0.3} -${(tw - 2) / 2} ${th * 0.3} q-${(tw - 2) / 2} 0 -${(tw - 2) / 2} -${th * 0.3} z`, c) + path(`M${x + dx + 3} ${y + sh + 2} h${tw - 8} v4 h-${tw - 8}z`, shade(c, 0.18), 'opacity="0.6"');
      s += tile(0) + (x + tw > S ? tile(-S) : '') + (x < 0 ? tile(S) : '');
    }
  }
  if (state !== 'good') s += blobs(r, state === 'worn' ? 14 : 22, P.olive, 7, 0.55);
  if (state === 'damaged') s += blobs(r, 10, '#c9c6a0', 5, 0.5);
  return svg(S, S, s);
}

function stones(seed: number, damp: boolean) {
  const r = rng(seed);
  let s = rect(0, 0, S, S, '#4f4e4a');
  const rh = 32;
  for (let row = 0; row < S / rh; row++) {
    let x = row % 2 ? -20 : 0;
    while (x < S) {
      const w = 36 + r() * 40;
      const c = shade(P.stone, (r() - 0.5) * 0.25);
      const draw = (dx: number) => rect(x + dx + 2, row * rh + 2, w - 4, rh - 4, c, 'rx="5"') + rect(x + dx + 4, row * rh + 4, w - 10, 4, shade(c, 0.15), 'rx="2" opacity="0.7"');
      s += draw(0) + (x + w > S ? draw(-S) : '');
      x += w;
    }
  }
  if (damp) {
    s += blobs(r, 9, '#2a3028', 22, 0.45);
    s += grain(r, 120, ['#f4f1e6'], 1.8, 0.8);
    s += blobs(r, 6, P.olive, 8, 0.45);
  }
  return svg(S, S, s);
}

function stairwell() {
  const w = 128, h = 256;
  let s = rect(0, 0, w, h, '#c9dce3');
  for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) s += rect(x + 2, y + 2, 28, 28, '#e3f0f4', 'rx="3"') + rect(x + 5, y + 5, 10, 7, '#ffffff', 'rx="2" opacity="0.7"');
  return svg(w, h, s);
}

function ground(seed: number, kind: 'grass' | 'dry' | 'snow') {
  const r = rng(seed);
  const w = 256, h = 64;
  const soil = kind === 'snow' ? '#e8eef2' : '#6b4f35';
  let s = rect(0, 0, w, h, soil);
  const top = kind === 'grass' ? P.olive : kind === 'dry' ? '#a99a52' : '#f6f9fb';
  s += rect(0, 0, w, h * 0.55, top);
  for (let i = 0; i < 260; i++) {
    const x = r() * w, y = h * 0.5 + r() * 6, bh = 6 + r() * 12, lean = (r() - 0.5) * 4;
    const c = kind === 'snow' ? '#d6e2ea' : shade(top, (r() - 0.5) * 0.3);
    for (const dx of [-w, 0, w]) if (x + dx > -6 && x + dx < w + 6) s += line(x + dx, y, x + dx + lean, y - bh, c, 2);
  }
  if (kind === 'dry') for (let i = 0; i < 8; i++) { const x = r() * w, rx = 10 + r() * 10; for (const dx of [-w, 0, w]) s += ellipse(x + dx, h * 0.5, rx, 4, '#7a6040'); }
  if (kind !== 'snow') s += grain(r, 140, [shade(soil, 0.2), shade(soil, -0.2)], 1.6, 0.8, w, h);
  return svg(w, h, s);
}

export const TEXTURES: Record<string, () => string> = {
  'textures/facade_good': () => plaster(P.sand, 11),
  'textures/facade_worn': () => { const r = rng(12); return plaster('#cdb487', 12, streaks(r, 14, '#7d7466', 0.16) + blobs(r, 10, '#a99677', 14, 0.35)); },
  'textures/facade_damaged': () => { const r = rng(13); return plaster('#bea47a', 13, streaks(r, 16, '#5d5a4f', 0.2) + blobs(r, 10, '#5c5440', 18, 0.35) + blobs(r, 8, P.olive, 16, 0.22) + spall(r, 4) + cracks(r, 5)); },
  'textures/facade_insulated': () => plaster(P.cream, 14),
  'textures/roof_good': () => roof(21, 'good'),
  'textures/roof_worn': () => roof(22, 'worn'),
  'textures/roof_damaged': () => roof(23, 'damaged'),
  'textures/basement': () => stones(31, false),
  'textures/basement_damp': () => stones(31, true),
  'textures/stairwell': stairwell,
  'textures/ground_grass': () => ground(41, 'grass'),
  'textures/ground_dry': () => ground(42, 'dry'),
  'textures/ground_snow': () => ground(43, 'snow'),
};
