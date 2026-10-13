/** Schreibt alle SVG-Grafiken nach public/gfx/ und erzeugt eine Übersicht (npm run gfx:art). */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { GRAPHICS } from '../../src/content/graphics';
import { TEXTURES } from './textures';
import { SPRITES } from './sprites';
import { PORTRAITS_SVG } from './portraits';

const modules: Record<string, () => string>[] = [TEXTURES, SPRITES, PORTRAITS_SVG];
try {
  modules.push((await import('./scenes')).SCENES);
} catch (e) {
  if (!String(e).includes('Cannot find')) throw e;
}
const all: Record<string, () => string> = Object.assign({}, ...modules);
const onlyArg = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
let n = 0;
const sheet: string[] = [];
for (const a of GRAPHICS) {
  const fn = all[a.path];
  if (!fn || (onlyArg && !a.path.startsWith(onlyArg))) continue;
  const out = join('public/gfx', `${a.path}.svg`);
  mkdirSync(dirname(out), { recursive: true });
  const content = fn();
  writeFileSync(out, content);
  sheet.push(`<figure><div class="${a.tileable ? 'tile' : ''}" style="${a.tileable ? `background-image:url('/gfx/${a.path}.svg');background-size:${Math.min(128, a.size[0] / 2)}px` : ''}">${a.tileable ? '' : `<img src="/gfx/${a.path}.svg">`}</div><figcaption>${a.path}</figcaption></figure>`);
  n++;
}
const missing = GRAPHICS.filter((a) => !all[a.path]).map((a) => a.path);
mkdirSync('public/gfx', { recursive: true });
writeFileSync(
  'public/gfx/_overview.html',
  `<!doctype html><meta charset="utf-8"><title>Grafikübersicht</title><style>body{font:12px system-ui;background:#eee;margin:16px;display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;background:repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0 0/16px 16px;padding:6px;border-radius:8px;width:300px}figure img{max-width:100%;max-height:200px;display:block;margin:auto}.tile{height:200px}figcaption{text-align:center;padding-top:4px}</style>${sheet.join('')}`,
);
console.log(`${n} SVG-Grafiken geschrieben, ${missing.length} ohne Generator${missing.length ? ` (z. B. ${missing.slice(0, 4).join(', ')})` : ''}.`);
