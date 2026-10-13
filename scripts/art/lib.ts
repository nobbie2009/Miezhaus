/** Kleine Zeichenbibliothek für den SVG-Grafikgenerator (einheitliche Palette & Formen). */
export const P = {
  sand: '#d8bd8c', sandLight: '#e6d2a8', sandDark: '#b99a68', cream: '#efe6d4',
  brick: '#a8503a', brickDark: '#7f3a2a', brickLight: '#c06a4f',
  wood: '#8a5a36', woodDark: '#5e3a20', woodLight: '#b07a4c',
  olive: '#6f8a3c', oliveDark: '#4d6428', oliveLight: '#94ad5a',
  mustard: '#d9a43a', petrol: '#2f6f7a', petrolDark: '#1f4c55', navy: '#24364f',
  stone: '#8b8a85', stoneDark: '#62615d', stoneLight: '#adaba4',
  white: '#f7f4ee', ink: '#2b2a28', sky: '#9fd0ea', skyLight: '#d8eef7', glass: '#bfe0ef',
  red: '#c8473a', green: '#4f9a52', yellow: '#f0c84a', grey: '#9aa0a6', greyDark: '#5f666d',
};

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const svg = (w: number, h: number, body: string, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;

/** Zeichnet ein Element kachelbar (an allen Rändern gespiegelt wiederholt). */
export function wrap(w: number, h: number, draw: (dx: number, dy: number) => string, at?: { x: number; y: number; r: number }) {
  let s = '';
  for (const dx of [-w, 0, w])
    for (const dy of [-h, 0, h]) {
      // Nur Kopien zeichnen, die tatsächlich in die Kachel hineinragen
      if (at && (at.x + dx + at.r < 0 || at.x + dx - at.r > w || at.y + dy + at.r < 0 || at.y + dy - at.r > h)) continue;
      s += draw(dx, dy);
    }
  return s;
}

export const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" ${extra}/>`;
export const circle = (cx: number, cy: number, r: number, fill: string, extra = '') => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
export const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = '') => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
export const path = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
export const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, w = 2, extra = '') => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
export const g = (body: string, attrs = '') => `<g ${attrs}>${body}</g>`;
export const f = (n: number) => (Math.round(n * 10) / 10).toString();

/** Farbe aufhellen/abdunkeln (hex). */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + (amt > 0 ? (255 - v) * amt : v * amt))));
  const r = c(n >> 16), gg = c((n >> 8) & 255), b = c(n & 255);
  return `#${((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1)}`;
}

/** Weicher Schatten nach rechts unten (Licht von oben links). */
export const shadowFilter = (id = 'sh') => `<filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="3" dy="4" stdDeviation="3" flood-color="#2b2a28" flood-opacity="0.25"/></filter>`;

export const linear = (id: string, stops: [number, string][], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
