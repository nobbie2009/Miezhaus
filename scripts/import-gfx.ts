/**
 * Importiert generierte Bilder aus gfx-incoming/ nach public/gfx/:
 *   npm run gfx:import            (Standard-Ordner gfx-incoming/)
 *   npm run gfx:import -- <ordner>
 * Dateien werden anhand ihres Namens (z. B. facade_good.png) dem Manifest zugeordnet,
 * auf die Zielgröße gebracht und als WebP gespeichert.
 */
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import sharp from 'sharp';
import { GRAPHICS, type GfxAsset } from '../src/content/graphics';

const src = process.argv[2] ?? 'gfx-incoming';
if (!existsSync(src)) {
  console.error(`Ordner „${src}“ nicht gefunden. Lege die Bilder dort ab.`);
  process.exit(1);
}

const byName = new Map<string, GfxAsset[]>();
for (const a of GRAPHICS) {
  const n = a.path.split('/').pop()!;
  byName.set(n, [...(byName.get(n) ?? []), a]);
  byName.set(a.path.replace(/\//g, '__'), [a]);
}

const files: string[] = [];
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(png|jpe?g|webp)$/i.test(f)) files.push(p);
  }
};
walk(src);

let ok = 0;
const unknown: string[] = [];
for (const f of files) {
  const name = basename(f, extname(f)).toLowerCase().trim().replace(/\s+/g, '_');
  // Pfad-Variante: Unterordner wie textures/facade_good.png
  const rel = `${basename(dirname(f))}/${name}`;
  const asset = GRAPHICS.find((a) => a.path === rel) ?? (byName.get(name)?.length === 1 ? byName.get(name)![0] : undefined);
  if (!asset) {
    unknown.push(f);
    continue;
  }
  const [w, h] = asset.size;
  const out = join('public/gfx', `${asset.path}.webp`);
  mkdirSync(dirname(out), { recursive: true });
  let img = sharp(f).ensureAlpha();
  if (asset.transparent || asset.kind === 'sprite' || asset.kind === 'icon') {
    img = sharp(await img.trim({ threshold: 4 }).toBuffer()).resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  } else {
    img = img.resize(w, h, { fit: 'cover', position: 'centre' });
  }
  await img.webp({ quality: 88, alphaQuality: 95 }).toFile(out);
  console.log(`✓ ${f} → ${out} (${w}×${h})`);
  ok++;
}
console.log(`\n${ok} Bild(er) importiert.`);
if (unknown.length) {
  console.log(`\nNicht zugeordnet (Dateiname prüfen, siehe docs/CHATGPT_PROMPTS.md):`);
  for (const u of unknown) console.log(`  – ${u}`);
}
const missing = GRAPHICS.filter((a) => !['webp', 'png', 'svg'].some((e) => existsSync(join('public/gfx', `${a.path}.${e}`))));
console.log(`\nNoch fehlend: ${missing.length} von ${GRAPHICS.length} (davon Priorität 1: ${missing.filter((m) => m.priority === 1).length}).`);
