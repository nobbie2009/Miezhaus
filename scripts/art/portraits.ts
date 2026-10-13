import { P, circle, ellipse, g, line, path, rect, shade, svg } from './lib';

type Hair = 'short' | 'long' | 'curly' | 'bun' | 'bald' | 'bob' | 'buzz' | 'ponytail' | 'cap' | 'strawhat';
type Cloth = 'cardigan' | 'blazer' | 'hoodie' | 'shirt' | 'overalls' | 'sweater' | 'turtleneck' | 'apron' | 'jacket' | 'suit' | 'blanket';
type Acc = 'headset' | 'headphones' | 'camera' | 'phone' | 'clipboard' | 'package' | 'bag' | 'tomato' | 'herbs' | 'mug' | 'tea' | 'drill' | 'rule' | 'scarf' | 'backpack' | 'laptopbag' | 'schoolbag' | 'trowel' | 'gloves' | 'door';

interface Person {
  skin: string;
  hair: Hair;
  hairColor: string;
  cloth: Cloth;
  clothColor: string;
  beard?: boolean;
  glasses?: boolean;
  freckles?: boolean;
  older?: boolean;
  eyes?: 'round' | 'almond';
  smile?: 'big' | 'soft' | 'neutral';
}

interface Spec {
  bg: string;
  main: Person;
  acc?: Acc[];
  extra?: { kind: 'child' | 'baby' | 'adult'; person: Person }[];
}

const SKIN = { light: '#f1cfb4', freckle: '#eec6a6', olive: '#d6a47a', medium: '#b77b54', dark: '#7a4c31', eastAsian: '#eecda6', southAsian: '#ad7650' };
const HAIR = { black: '#2a211c', brown: '#5b3a24', blond: '#d6b26a', red: '#a8502f', grey: '#b9b6b0', white: '#e6e3dd', dark: '#3a2a20' };

function head(p: Person, cx: number, cy: number, s: number) {
  const hw = 46 * s, hh = 56 * s;
  let back = '';
  let front = '';
  const hc = p.hairColor;
  if (p.hair === 'long') back += path(`M${cx - hw - 6 * s} ${cy - 10 * s} Q${cx - hw - 10 * s} ${cy + hh + 20 * s} ${cx - hw + 6 * s} ${cy + hh + 26 * s} L${cx + hw - 6 * s} ${cy + hh + 26 * s} Q${cx + hw + 10 * s} ${cy + hh + 20 * s} ${cx + hw + 6 * s} ${cy - 10 * s} Z`, hc);
  if (p.hair === 'bob') back += path(`M${cx - hw - 8 * s} ${cy - 6 * s} Q${cx - hw - 8 * s} ${cy + hh * 0.75} ${cx - hw + 4 * s} ${cy + hh * 0.8} L${cx + hw - 4 * s} ${cy + hh * 0.8} Q${cx + hw + 8 * s} ${cy + hh * 0.75} ${cx + hw + 8 * s} ${cy - 6 * s} Z`, hc);
  if (p.hair === 'ponytail') back += ellipse(cx + hw + 4 * s, cy + 18 * s, 12 * s, 30 * s, hc);
  // Ohren, Gesicht
  let face = ellipse(cx - hw + 2 * s, cy + 8 * s, 9 * s, 13 * s, shade(p.skin, -0.06)) + ellipse(cx + hw - 2 * s, cy + 8 * s, 9 * s, 13 * s, shade(p.skin, -0.06));
  face += ellipse(cx, cy, hw, hh, p.skin);
  face += ellipse(cx + hw * 0.35, cy + hh * 0.2, hw * 0.55, hh * 0.65, shade(p.skin, -0.07), 'opacity="0.35"');
  // Augen
  const ey = cy + 2 * s;
  for (const dx of [-17, 17]) {
    face += p.eyes === 'almond' ? ellipse(cx + dx * s, ey, 5.5 * s, 3.2 * s, P.ink) : ellipse(cx + dx * s, ey, 4.5 * s, 5 * s, P.ink);
    face += circle(cx + dx * s + 1.5 * s, ey - 1.5 * s, 1.3 * s, '#ffffff');
    face += path(`M${cx + dx * s - 8 * s} ${ey - 11 * s} Q${cx + dx * s} ${ey - 15 * s} ${cx + dx * s + 8 * s} ${ey - 11 * s}`, 'none', `stroke="${p.older ? HAIR.grey : shade(p.hairColor, -0.2)}" stroke-width="${3 * s}" stroke-linecap="round"`);
  }
  face += circle(cx - 26 * s, cy + 18 * s, 6 * s, '#e58a7a', 'opacity="0.25"') + circle(cx + 26 * s, cy + 18 * s, 6 * s, '#e58a7a', 'opacity="0.25"');
  face += path(`M${cx - 2 * s} ${cy + 6 * s} Q${cx + 3 * s} ${cy + 16 * s} ${cx - 3 * s} ${cy + 18 * s}`, 'none', `stroke="${shade(p.skin, -0.25)}" stroke-width="${2.2 * s}" stroke-linecap="round"`);
  const sm = p.smile ?? 'soft';
  face += sm === 'big' ? path(`M${cx - 15 * s} ${cy + 26 * s} Q${cx} ${cy + 42 * s} ${cx + 15 * s} ${cy + 26 * s} Z`, '#8c3b33') + path(`M${cx - 12 * s} ${cy + 27 * s} Q${cx} ${cy + 31 * s} ${cx + 12 * s} ${cy + 27 * s}`, '#ffffff') : path(`M${cx - 13 * s} ${cy + 27 * s} Q${cx} ${cy + (sm === 'soft' ? 36 : 30) * s} ${cx + 13 * s} ${cy + 27 * s}`, 'none', `stroke="#8c3b33" stroke-width="${3 * s}" stroke-linecap="round"`);
  if (p.older) face += path(`M${cx - 30 * s} ${ey + 4 * s} q4 4 8 2 M${cx + 22 * s} ${ey + 6 * s} q4 -2 8 -2`, 'none', `stroke="${shade(p.skin, -0.2)}" stroke-width="${1.5 * s}"`);
  if (p.freckles) for (const [x, y] of [[-20, 14], [-14, 18], [-24, 19], [20, 14], [14, 18], [24, 19]]) face += circle(cx + x * s, cy + y * s, 1.4 * s, '#b9744e', 'opacity="0.7"');
  if (p.beard) face += path(`M${cx - hw + 6 * s} ${cy + 8 * s} Q${cx - hw + 8 * s} ${cy + hh + 6 * s} ${cx} ${cy + hh + 8 * s} Q${cx + hw - 8 * s} ${cy + hh + 6 * s} ${cx + hw - 6 * s} ${cy + 8 * s} Q${cx + 20 * s} ${cy + 20 * s} ${cx} ${cy + 22 * s} Q${cx - 20 * s} ${cy + 20 * s} ${cx - hw + 6 * s} ${cy + 8 * s} Z`, hc, 'opacity="0.92"') + path(`M${cx - 12 * s} ${cy + 30 * s} Q${cx} ${cy + 36 * s} ${cx + 12 * s} ${cy + 30 * s}`, 'none', `stroke="#8c3b33" stroke-width="${3 * s}" stroke-linecap="round"`);
  if (p.glasses) face += circle(cx - 17 * s, ey, 11 * s, 'none', `stroke="${P.ink}" stroke-width="${2.6 * s}"`) + circle(cx + 17 * s, ey, 11 * s, 'none', `stroke="${P.ink}" stroke-width="${2.6 * s}"`) + line(cx - 6 * s, ey, cx + 6 * s, ey, P.ink, 2.6 * s);
  // Haare vorne
  const top = `M${cx - hw - 2 * s} ${cy - 2 * s} Q${cx - hw - 4 * s} ${cy - hh - 8 * s} ${cx} ${cy - hh - 10 * s} Q${cx + hw + 4 * s} ${cy - hh - 8 * s} ${cx + hw + 2 * s} ${cy - 2 * s}`;
  if (['short', 'long', 'bob', 'ponytail', 'bun'].includes(p.hair)) front += path(`${top} Q${cx + hw * 0.4} ${cy - hh * 0.55} ${cx - hw * 0.1} ${cy - hh * 0.7} Q${cx - hw * 0.7} ${cy - hh * 0.5} ${cx - hw - 2 * s} ${cy - 2 * s} Z`, hc);
  if (p.hair === 'bun') front += circle(cx, cy - hh - 14 * s, 18 * s, hc);
  if (p.hair === 'buzz') front += path(`${top} Q${cx} ${cy - hh * 0.62} ${cx - hw - 2 * s} ${cy - 2 * s} Z`, hc, 'opacity="0.85"');
  if (p.hair === 'bald') front += path(`M${cx - hw} ${cy - 4 * s} Q${cx - hw - 2 * s} ${cy - 26 * s} ${cx - hw + 10 * s} ${cy - 32 * s} L${cx - hw + 12 * s} ${cy - 6 * s} Z M${cx + hw} ${cy - 4 * s} Q${cx + hw + 2 * s} ${cy - 26 * s} ${cx + hw - 10 * s} ${cy - 32 * s} L${cx + hw - 12 * s} ${cy - 6 * s} Z`, hc);
  if (p.hair === 'curly') for (let i = 0; i < 14; i++) { const a = Math.PI + (i / 13) * Math.PI; front += circle(cx + Math.cos(a) * (hw + 2 * s), cy - 6 * s + Math.sin(a) * (hh + 4 * s), 14 * s, hc); }
  if (p.hair === 'cap') front += path(`M${cx - hw - 4 * s} ${cy - 10 * s} Q${cx} ${cy - hh - 24 * s} ${cx + hw + 4 * s} ${cy - 10 * s} Z`, '#5f5a52') + path(`M${cx - hw - 6 * s} ${cy - 12 * s} Q${cx - 10 * s} ${cy - 2 * s} ${cx + hw + 22 * s} ${cy - 16 * s} L${cx + hw + 4 * s} ${cy - 8 * s} Z`, '#4c4841');
  if (p.hair === 'strawhat') front += path(`M${cx - hw - 4 * s} ${cy - hh * 0.25} Q${cx} ${cy - hh - 36 * s} ${cx + hw + 4 * s} ${cy - hh * 0.25} Z`, '#e3c27a') + ellipse(cx, cy - hh * 0.25, hw + 34 * s, 12 * s, '#d8b468') + rect(cx - hw - 2 * s, cy - hh * 0.25 - 12 * s, 2 * hw + 4 * s, 8 * s, P.petrol);
  return back + face + front;
}

function body(p: Person, cx: number, top: number, s: number) {
  const w = 96 * s;
  const c = p.clothColor;
  let b = rect(cx - 14 * s, top - 14 * s, 28 * s, 26 * s, shade(p.skin, -0.08));
  const torso = `M${cx - w} ${top + 120 * s} Q${cx - w} ${top + 10 * s} ${cx - 30 * s} ${top} L${cx + 30 * s} ${top} Q${cx + w} ${top + 10 * s} ${cx + w} ${top + 120 * s} Z`;
  b += path(torso, c);
  b += path(`M${cx + 10 * s} ${top + 6 * s} Q${cx + w * 0.8} ${top + 20 * s} ${cx + w} ${top + 120 * s} L${cx + 40 * s} ${top + 120 * s} Z`, shade(c, -0.12), 'opacity="0.6"');
  switch (p.cloth) {
    case 'cardigan':
      b += path(`M${cx - 18 * s} ${top} L${cx} ${top + 40 * s} L${cx + 18 * s} ${top} Z`, '#f2ede2') + line(cx, top + 40 * s, cx, top + 120 * s, shade(c, -0.3), 2 * s) + [56, 76, 96].map((y) => circle(cx + 6 * s, top + y * s, 3 * s, shade(c, -0.4))).join('');
      break;
    case 'blazer':
    case 'suit':
      b += path(`M${cx - 20 * s} ${top} L${cx} ${top + 54 * s} L${cx + 20 * s} ${top} Z`, p.cloth === 'suit' ? '#f4f4f2' : '#f2e6dc') + path(`M${cx - 22 * s} ${top} L${cx - 4 * s} ${top + 60 * s} L${cx - 36 * s} ${top + 30 * s} Z M${cx + 22 * s} ${top} L${cx + 4 * s} ${top + 60 * s} L${cx + 36 * s} ${top + 30 * s} Z`, shade(c, -0.2));
      if (p.cloth === 'suit') b += path(`M${cx - 5 * s} ${top + 4 * s} h10 l-2 40 l-3 6 l-3 -6 z`, P.petrol);
      break;
    case 'hoodie':
      b += path(`M${cx - 40 * s} ${top + 4 * s} Q${cx} ${top + 34 * s} ${cx + 40 * s} ${top + 4 * s} Q${cx} ${top + 18 * s} ${cx - 40 * s} ${top + 4 * s}`, shade(c, -0.18)) + line(cx - 10 * s, top + 22 * s, cx - 12 * s, top + 56 * s, '#f2f0ea', 3 * s) + line(cx + 10 * s, top + 22 * s, cx + 12 * s, top + 56 * s, '#f2f0ea', 3 * s);
      break;
    case 'shirt':
      b += path(`M${cx - 20 * s} ${top - 2 * s} L${cx - 2 * s} ${top + 22 * s} L${cx - 6 * s} ${top + 30 * s} L${cx - 26 * s} ${top + 10 * s} Z M${cx + 20 * s} ${top - 2 * s} L${cx + 2 * s} ${top + 22 * s} L${cx + 6 * s} ${top + 30 * s} L${cx + 26 * s} ${top + 10 * s} Z`, shade(c, 0.25)) + [44, 64, 84].map((y) => circle(cx, top + y * s, 2.5 * s, shade(c, -0.35))).join('');
      break;
    case 'overalls':
      b += rect(cx - 36 * s, top + 40 * s, 72 * s, 80 * s, '#3f5f86', `rx="${8 * s}"`) + rect(cx - 36 * s, top + 4 * s, 10 * s, 40 * s, '#3f5f86') + rect(cx + 26 * s, top + 4 * s, 10 * s, 40 * s, '#3f5f86') + circle(cx - 31 * s, top + 44 * s, 4 * s, P.mustard) + circle(cx + 31 * s, top + 44 * s, 4 * s, P.mustard);
      break;
    case 'turtleneck':
      b += rect(cx - 20 * s, top - 14 * s, 40 * s, 22 * s, shade(c, 0.08), `rx="${8 * s}"`);
      break;
    case 'sweater':
      b += path(`M${cx - 22 * s} ${top} Q${cx} ${top + 16 * s} ${cx + 22 * s} ${top}`, 'none', `stroke="${shade(c, -0.25)}" stroke-width="${6 * s}"`);
      break;
    case 'apron':
      b += path(`M${cx - 30 * s} ${top + 30 * s} h${60 * s} v${90 * s} h-${60 * s} z`, '#f2efe6') + line(cx - 30 * s, top + 30 * s, cx - 20 * s, top, '#f2efe6', 4 * s) + line(cx + 30 * s, top + 30 * s, cx + 20 * s, top, '#f2efe6', 4 * s);
      break;
    case 'jacket':
      b += line(cx, top + 6 * s, cx, top + 120 * s, shade(c, -0.35), 3 * s) + path(`M${cx - 24 * s} ${top} l-10 22 l18 -4 z M${cx + 24 * s} ${top} l10 22 l-18 -4 z`, shade(c, -0.2));
      break;
    case 'blanket':
      b = rect(cx - 14 * s, top - 14 * s, 28 * s, 26 * s, shade(p.skin, -0.08)) + path(`M${cx - w - 6 * s} ${top + 120 * s} Q${cx - w} ${top - 6 * s} ${cx} ${top - 8 * s} Q${cx + w} ${top - 6 * s} ${cx + w + 6 * s} ${top + 120 * s} Z`, c) + [20, 50, 80].map((y) => line(cx - w, top + y * s, cx + w, top + y * s, shade(c, -0.15), 6 * s)).join('');
      break;
  }
  return b;
}

function accessory(a: Acc, cx: number, top: number, headY: number) {
  switch (a) {
    case 'headset': return path(`M${cx - 52} ${headY} Q${cx} ${headY - 90} ${cx + 52} ${headY}`, 'none', `stroke="${P.ink}" stroke-width="7"`) + rect(cx - 62, headY - 12, 16, 28, P.ink, 'rx="6"') + rect(cx + 46, headY - 12, 16, 28, P.ink, 'rx="6"') + path(`M${cx - 54} ${headY + 14} Q${cx - 40} ${headY + 46} ${cx - 14} ${headY + 46}`, 'none', `stroke="${P.ink}" stroke-width="4"`) + circle(cx - 12, headY + 46, 5, P.red);
    case 'headphones': return path(`M${cx - 40} ${top + 4} Q${cx} ${top + 34} ${cx + 40} ${top + 4}`, 'none', `stroke="${P.ink}" stroke-width="6"`) + circle(cx - 40, top + 8, 12, P.ink) + circle(cx + 40, top + 8, 12, P.ink);
    case 'camera': return line(cx - 30, top, cx, top + 50, P.ink, 3) + line(cx + 30, top, cx, top + 50, P.ink, 3) + rect(cx - 22, top + 46, 44, 30, '#3b3f44', 'rx="5"') + circle(cx, top + 61, 11, '#6b7d8c') + circle(cx, top + 61, 6, '#202428');
    case 'phone': return rect(cx + 40, headY - 6, 16, 32, '#2f3439', 'rx="4"') + ellipse(cx + 56, headY + 30, 12, 9, '#d9a77c');
    case 'clipboard': return rect(cx + 18, top + 42, 50, 64, P.woodLight, 'rx="4"') + rect(cx + 24, top + 52, 38, 50, '#ffffff') + [62, 72, 82, 92].map((y) => line(cx + 30, top + y, cx + 56, top + y, P.grey, 2)).join('') + rect(cx + 34, top + 38, 18, 8, P.greyDark, 'rx="2"');
    case 'package': return rect(cx - 70, top + 46, 70, 54, '#c69a62', 'rx="3"') + rect(cx - 70, top + 66, 70, 8, '#a87e48') + rect(cx - 39, top + 46, 8, 54, '#a87e48');
    case 'bag': return path(`M${cx + 20} ${top + 60} h56 l-6 50 h-44 z`, '#e6dccb') + path(`M${cx + 32} ${top + 60} q16 -24 32 0`, 'none', `stroke="#b9ab92" stroke-width="4"`) + circle(cx + 40, top + 56, 8, P.olive) + rect(cx + 52, top + 44, 8, 18, P.mustard, 'rx="3"');
    case 'tomato': return path(`M${cx - 66} ${top + 110} l6 -40 h40 l6 40 z`, '#b4643c') + line(cx - 46, top + 70, cx - 46, top + 26, P.oliveDark, 4) + circle(cx - 54, top + 44, 8, P.red) + circle(cx - 38, top + 54, 7, P.red) + ellipse(cx - 36, top + 34, 10, 5, P.olive);
    case 'herbs': return path(`M${cx + 20} ${top + 112} l4 -34 h40 l4 34 z`, '#c46a3c') + [0, 10, 20, 30].map((d) => ellipse(cx + 28 + d, top + 66 - (d % 20), 6, 12, P.olive)).join('');
    case 'mug': return rect(cx + 24, top + 64, 30, 36, P.petrol, 'rx="4"') + path(`M${cx + 54} ${top + 72} q14 6 0 18`, 'none', `stroke="${P.petrol}" stroke-width="5"`) + path(`M${cx + 32} ${top + 56} q4 -8 0 -14 M${cx + 42} ${top + 56} q4 -8 0 -14`, 'none', `stroke="#ffffff" stroke-width="3" opacity="0.8"`);
    case 'tea': return rect(cx - 18, top + 66, 36, 30, '#f2f0ea', 'rx="5"') + path(`M${cx + 18} ${top + 72} q12 6 0 16`, 'none', 'stroke="#f2f0ea" stroke-width="5"') + ellipse(cx, top + 68, 16, 4, '#a0602a');
    case 'drill': return rect(cx + 24, top + 54, 48, 22, P.mustard, 'rx="6"') + rect(cx + 32, top + 74, 16, 30, '#3a3f44', 'rx="4"') + rect(cx + 72, top + 61, 18, 6, P.grey);
    case 'rule': return rect(cx + 22, top + 30, 10, 50, P.mustard) + [36, 44, 52, 60, 68].map((y) => line(cx + 22, top + y, cx + 28, top + y, P.ink, 1.5)).join('');
    case 'scarf': return path(`M${cx - 30} ${top - 2} Q${cx} ${top + 22} ${cx + 30} ${top - 2} L${cx + 26} ${top + 10} Q${cx} ${top + 30} ${cx - 26} ${top + 10} Z`, P.red) + path(`M${cx + 6} ${top + 16} l14 34 l-12 2 z`, '#a83a30');
    case 'backpack': return line(cx - 34, top + 2, cx - 40, top + 110, '#2f3a48', 10) + line(cx + 34, top + 2, cx + 40, top + 110, '#2f3a48', 10);
    case 'laptopbag': return line(cx - 40, top + 4, cx + 50, top + 110, '#4a3626', 9);
    case 'schoolbag': return rect(cx + 30, top + 40, 56, 60, '#d14f6e', 'rx="10"') + rect(cx + 40, top + 52, 36, 18, '#f0c84a', 'rx="4"') + path(`M${cx + 40} ${top + 40} q18 -20 36 0`, 'none', 'stroke="#a83a55" stroke-width="5"');
    case 'trowel': return rect(cx + 30, top + 70, 8, 32, P.wood, 'rx="3"') + path(`M${cx + 24} ${top + 72} l10 -36 l10 36 z`, '#aab3b9');
    case 'gloves': return ellipse(cx - 46, top + 92, 20, 14, '#e0a43a') + ellipse(cx + 46, top + 92, 20, 14, '#e0a43a');
    case 'door': return rect(cx + 60, top - 120, 30, 240, '#8a5a36') + circle(cx + 66, top + 10, 4, P.mustard);
  }
}

function portrait(spec: Spec) {
  const W = 256;
  let s = rect(0, 0, W, W, spec.bg) + circle(200, 50, 70, shade(spec.bg, 0.25), 'opacity="0.5"');
  const extras = spec.extra ?? [];
  const mainX = extras.some((e) => e.kind === 'adult') ? 150 : extras.length ? 142 : 128;
  for (const e of extras.filter((x) => x.kind === 'adult')) s += body(e.person, 76, 188, 0.75) + head(e.person, 76, 132, 0.75);
  s += body(spec.main, mainX, 176, 1) + head(spec.main, mainX, 110, 1);
  for (const a of spec.acc ?? []) s += accessory(a, mainX, 176, 110);
  for (const e of extras.filter((x) => x.kind !== 'adult')) {
    if (e.kind === 'child') s += body(e.person, 60, 214, 0.5) + head(e.person, 60, 182, 0.5);
    else s += path('M110 196 q40 30 80 0 v60 h-80z', '#c9a46e') + head(e.person, 150, 212, 0.38);
  }
  return svg(W, W, s);
}

const pp = (skin: string, hair: Hair, hairColor: string, cloth: Cloth, clothColor: string, o: Partial<Person> = {}): Person => ({ skin, hair, hairColor, cloth, clothColor, ...o });
const kid = (skin: string, hair: Hair, hc: string, c: string): Person => pp(skin, hair, hc, 'sweater', c, { smile: 'big' });

export const PORTRAIT_SPECS: Record<string, Spec> = {
  quiet_longterm_1: { bg: '#cfe1d6', main: pp(SKIN.light, 'bald', HAIR.grey, 'cardigan', '#8b6f55', { older: true, glasses: true }) },
  quiet_longterm_2: { bg: '#e8d9c4', main: pp(SKIN.dark, 'short', HAIR.black, 'shirt', '#7d9fb8', { glasses: true }) },
  quiet_longterm_3: { bg: '#d6dbe8', main: pp(SKIN.olive, 'buzz', HAIR.dark, 'shirt', '#a3b18a', { beard: true, smile: 'neutral' }) },
  young_family_1: { bg: '#f2dcc2', main: pp(SKIN.medium, 'curly', HAIR.black, 'sweater', '#d9a43a', { smile: 'big' }), extra: [{ kind: 'adult', person: pp(SKIN.light, 'short', HAIR.blond, 'shirt', '#6f8fb0') }, { kind: 'child', person: kid(SKIN.olive, 'short', HAIR.brown, '#c8473a') }] },
  young_family_2: { bg: '#d9e7d0', main: pp(SKIN.dark, 'bun', HAIR.black, 'jacket', '#2f6f7a', { smile: 'big' }), extra: [{ kind: 'child', person: kid(SKIN.dark, 'curly', HAIR.black, '#f0c84a') }] },
  young_family_3: { bg: '#e6d6ea', main: pp(SKIN.freckle, 'short', HAIR.red, 'sweater', '#6f8a3c', { freckles: true, beard: true }), extra: [{ kind: 'baby', person: kid(SKIN.freckle, 'bald', HAIR.red, '#ffffff') }] },
  busy_professional_1: { bg: '#dfe4ea', main: pp(SKIN.olive, 'ponytail', HAIR.dark, 'blazer', '#24364f'), acc: ['phone'] },
  busy_professional_2: { bg: '#e9dfcf', main: pp(SKIN.dark, 'buzz', HAIR.black, 'shirt', '#e8eef3', { smile: 'soft' }), acc: ['laptopbag'] },
  busy_professional_3: { bg: '#d4e4e0', main: pp(SKIN.light, 'short', HAIR.brown, 'turtleneck', '#3a4249', { glasses: true }), acc: ['mug'] },
  student_1: { bg: '#f3d6cf', main: pp(SKIN.medium, 'curly', HAIR.dark, 'hoodie', '#9b6bc9', { smile: 'big' }) },
  student_2: { bg: '#d3e3f0', main: pp(SKIN.light, 'short', HAIR.blond, 'hoodie', '#4f9a52', { glasses: true }), acc: ['backpack'] },
  student_3: { bg: '#f0e6c8', main: pp(SKIN.eastAsian, 'bob', HAIR.black, 'jacket', '#5a7fa8', { eyes: 'almond' }), acc: ['headphones'] },
  handy_1: { bg: '#e4dcc9', main: pp(SKIN.light, 'ponytail', HAIR.brown, 'overalls', '#d8cbb3') },
  handy_2: { bg: '#d9e2d3', main: pp(SKIN.dark, 'cap', HAIR.grey, 'shirt', '#a8503a', { older: true, beard: true }), acc: ['drill'] },
  handy_3: { bg: '#dde3ea', main: pp(SKIN.olive, 'short', HAIR.black, 'shirt', '#c8473a'), acc: ['rule'] },
  demanding_1: { bg: '#ead9de', main: pp(SKIN.light, 'bob', HAIR.white, 'blazer', '#5b4a6e', { older: true, smile: 'neutral' }), acc: ['scarf'] },
  demanding_2: { bg: '#dbe0e6', main: pp(SKIN.medium, 'short', HAIR.black, 'suit', '#2b3440', { smile: 'neutral' }) },
  demanding_3: { bg: '#e8e4dc', main: pp(SKIN.southAsian, 'buzz', HAIR.black, 'turtleneck', '#1f2326', { glasses: true, smile: 'neutral' }) },
  helpful_neighbor_1: { bg: '#f1dcc8', main: pp(SKIN.dark, 'short', HAIR.white, 'cardigan', '#c46a3c', { older: true, smile: 'big' }), acc: ['package'] },
  helpful_neighbor_2: { bg: '#d6e6dc', main: pp(SKIN.light, 'bald', HAIR.brown, 'sweater', '#2f6f7a', { beard: true, smile: 'big' }), acc: ['bag'] },
  helpful_neighbor_3: { bg: '#e7e0f0', main: pp(SKIN.olive, 'long', HAIR.brown, 'jacket', '#d9a43a', { smile: 'big' }), acc: ['door'] },
  temp_financial_1: { bg: '#dfe3e8', main: pp(SKIN.light, 'short', HAIR.brown, 'sweater', '#6a7f93', { smile: 'soft' }) },
  temp_financial_2: { bg: '#efe2cf', main: pp(SKIN.medium, 'long', HAIR.black, 'jacket', '#7a8f5a', { smile: 'soft' }), acc: ['schoolbag'] },
  temp_financial_3: { bg: '#d8e7ea', main: pp(SKIN.eastAsian, 'short', HAIR.black, 'apron', '#3a4249', { eyes: 'almond', smile: 'big' }) },
  gardener_1: { bg: '#e2ecd0', main: pp(SKIN.light, 'strawhat', HAIR.grey, 'shirt', '#8fae7a', { older: true, smile: 'big' }), acc: ['trowel'] },
  gardener_2: { bg: '#efe0c6', main: pp(SKIN.dark, 'short', HAIR.black, 'overalls', '#d8cbb3', { beard: true }), acc: ['tomato', 'gloves'] },
  gardener_3: { bg: '#dcebe3', main: pp(SKIN.olive, 'bun', HAIR.dark, 'sweater', '#c46a3c', { smile: 'big' }), acc: ['herbs'] },
  high_energy_1: { bg: '#d9dcef', main: pp(SKIN.medium, 'curly', HAIR.black, 'hoodie', '#2f3a48'), acc: ['headset'] },
  high_energy_2: { bg: '#f0dccf', main: pp(SKIN.light, 'long', HAIR.blond, 'blanket', '#c8473a', { smile: 'soft' }), acc: ['tea'] },
  high_energy_3: { bg: '#e3e8d8', main: pp(SKIN.dark, 'short', HAIR.black, 'jacket', '#6f8a3c'), acc: ['camera'] },
  frequent_caller_1: { bg: '#eadfd0', main: pp(SKIN.light, 'bob', HAIR.grey, 'cardigan', '#7d9fb8', { older: true, glasses: true }), acc: ['phone'] },
  frequent_caller_2: { bg: '#d8e3ea', main: pp(SKIN.olive, 'short', HAIR.dark, 'shirt', '#e0d8c8', { glasses: true }), acc: ['phone'] },
  frequent_caller_3: { bg: '#ede0e6', main: pp(SKIN.dark, 'ponytail', HAIR.black, 'blazer', '#a8503a'), acc: ['clipboard'] },
};

export const PORTRAITS_SVG: Record<string, () => string> = Object.fromEntries(Object.entries(PORTRAIT_SPECS).map(([k, sp]) => [`portraits/${k}`, () => portrait(sp)]));
export { g };
