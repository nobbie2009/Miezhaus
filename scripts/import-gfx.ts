/**
 * Importiert Bilder aus gfx-incoming/ nach public/gfx/ (npm run gfx:import [-- <ordner>]).
 * - sheet_XX.png (Sammelblätter aus docs/CHATGPT_SAMMELBLAETTER.md) werden in Einzelgrafiken zerschnitten.
 * - Einzeldateien (z. B. facade_good.png) werden dem Manifest über den Namen zugeordnet
 *   und überschreiben ggf. den Ausschnitt aus einem Sammelblatt.
 * Alles wird auf die Zielgröße gebracht und als WebP gespeichert.
 */
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import sharp from 'sharp';
import { GRAPHICS, type GfxAsset } from '../src/content/graphics';
import { buildSheets } from './prompt-builder';

const src = process.argv[2] ?? 'gfx-incoming';
if (!existsSync(src)) {
  console.error(`Ordner „${src}“ nicht gefunden. Lege die Bilder dort ab.`);
  process.exit(1);
}

export async function processAsset(input: Buffer | string, asset: GfxAsset, label: string) {
  const [w, h] = asset.size;
  const out = join('public/gfx', `${asset.path}.webp`);
  mkdirSync(dirname(out), { recursive: true });
  let img = sharp(input).ensureAlpha();
  if (asset.transparent || asset.kind === 'sprite' || asset.kind === 'icon') {
    try {
      img = sharp(await img.trim({ threshold: 6 }).toBuffer());
    } catch {
      /* leeres Bild – nicht beschneiden */
    }
    img = img.resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  } else img = img.resize(w, h, { fit: 'cover', position: 'centre' });
  await img.webp({ quality: 88, alphaQuality: 95 }).toFile(out);
  console.log(`✓ ${label} → ${out} (${w}×${h})`);
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
const norm = (f: string) => basename(f, extname(f)).toLowerCase().trim().replace(/[\s-]+/g, '_');
const sheets = new Map(buildSheets().map((s) => [s.id, s]));
let ok = 0;
const unknown: string[] = [];

// 1) Sammelblätter
for (const f of files.filter((x) => /^sheet_\d+$/.test(norm(x)))) {
  const sheet = sheets.get(norm(f));
  if (!sheet) {
    unknown.push(f);
    continue;
  }
  const meta = await sharp(f).metadata();
  const W = meta.width!;
  const H = meta.height!;
  const cw = W / sheet.cols;
  const ch = H / sheet.rows;
  const inset = sheet.cols * sheet.rows > 1 ? 0.025 : 0; // feine Ränder zwischen Feldern abschneiden
  for (let i = 0; i < sheet.assets.length; i++) {
    const col = i % sheet.cols;
    const row = Math.floor(i / sheet.cols);
    const left = Math.round(col * cw + cw * inset);
    const top = Math.round(row * ch + ch * inset);
    const width = Math.round(cw * (1 - 2 * inset));
    const height = Math.round(ch * (1 - 2 * inset));
    const cell = await sharp(f).extract({ left, top, width: Math.min(width, W - left), height: Math.min(height, H - top) }).png().toBuffer();
    await processAsset(cell, sheet.assets[i], `${basename(f)} [Feld ${i + 1}]`);
    ok++;
  }
}

// 2) Einzeldateien
const byName = new Map<string, GfxAsset>();
for (const a of GRAPHICS) byName.set(a.path.split('/').pop()!, a);
for (const f of files.filter((x) => !/^sheet_\d+$/.test(norm(x)))) {
  const name = norm(f);
  const asset = GRAPHICS.find((a) => a.path === `${basename(dirname(f))}/${name}`) ?? byName.get(name);
  if (!asset) {
    unknown.push(f);
    continue;
  }
  await processAsset(f, asset, f);
  ok++;
}

console.log(`\n${ok} Grafik(en) importiert.`);
if (unknown.length) {
  console.log('\nNicht zugeordnet (Dateiname prüfen):');
  for (const u of unknown) console.log(`  – ${u}`);
}
const missing = GRAPHICS.filter((a) => !['webp', 'png', 'svg'].some((e) => existsSync(join('public/gfx', `${a.path}.${e}`))));
console.log(`\nNoch fehlend: ${missing.length} von ${GRAPHICS.length}${missing.length ? ` (z. B. ${missing.slice(0, 5).map((m) => m.path).join(', ')})` : ''}.`);
