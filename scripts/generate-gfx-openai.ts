/**
 * Erzeugt ALLE Grafiken vollautomatisch über die OpenAI-Bild-API und speichert sie mit den
 * richtigen Namen unter public/gfx/ (inkl. Skalierung/WebP wie gfx:import).
 *
 *   OPENAI_API_KEY=sk-... npm run gfx:generate
 *
 * Optionen (nach „--“):
 *   --prio=1          nur Priorität 1 (bzw. --prio=2 → Priorität 1 und 2)
 *   --only=tex.,spr.  nur IDs mit diesen Präfixen
 *   --quality=medium  low | medium | high (Standard: medium)
 *   --force           vorhandene Grafiken neu erzeugen
 *   --dry-run         nur anzeigen, was erzeugt würde (kein API-Aufruf, keine Kosten)
 * Umgebungsvariablen: OPENAI_IMAGE_MODEL (Standard gpt-image-1), OPENAI_BASE_URL.
 * Bereits vorhandene Dateien werden übersprungen – der Lauf kann jederzeit fortgesetzt werden.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { GRAPHICS, type GfxAsset } from '../src/content/graphics';
import { apiSize, fullPrompt } from './prompt-builder';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const key = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1';
const base = (process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '');
const quality = String(args.quality ?? 'medium');
const maxPrio = args.prio ? Number(args.prio) : 3;
const only = args.only ? String(args.only).split(',') : null;
const exists = (a: GfxAsset) => ['webp', 'png', 'svg'].some((e) => existsSync(join('public/gfx', `${a.path}.${e}`)));

const todo = GRAPHICS.filter((a) => a.priority <= maxPrio && (!only || only.some((p) => a.id.startsWith(p))) && (args.force || !exists(a)));
console.log(`${todo.length} Grafik(en) zu erzeugen (Modell ${model}, Qualität ${quality}).`);
if (args['dry-run']) {
  for (const a of todo) console.log(`- ${a.path} (${apiSize(a)}${a.transparent ? ', transparent' : ''})`);
  process.exit(0);
}
if (!key) {
  console.error('Bitte OPENAI_API_KEY setzen, z. B.:  OPENAI_API_KEY=sk-... npm run gfx:generate');
  process.exit(1);
}

async function generate(a: GfxAsset): Promise<Buffer> {
  const body: Record<string, unknown> = { model, prompt: fullPrompt(a), size: apiSize(a), quality, n: 1 };
  if (a.transparent) {
    body.background = 'transparent';
    body.output_format = 'png';
  }
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(`${base}/images/generations`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) {
      const j = (await r.json()) as { data: { b64_json?: string; url?: string }[] };
      const d = j.data[0];
      if (d.b64_json) return Buffer.from(d.b64_json, 'base64');
      if (d.url) return Buffer.from(await (await fetch(d.url)).arrayBuffer());
      throw new Error('Leere Antwort');
    }
    const txt = await r.text();
    if ((r.status === 429 || r.status >= 500) && attempt < 5) {
      const wait = 2000 * 2 ** attempt;
      console.log(`  … ${r.status}, neuer Versuch in ${wait / 1000}s`);
      await new Promise((res) => setTimeout(res, wait));
      continue;
    }
    throw new Error(`HTTP ${r.status}: ${txt.slice(0, 300)}`);
  }
}

mkdirSync('gfx-incoming/generated', { recursive: true });
let done = 0;
const failed: string[] = [];
const queue = [...todo];
async function worker() {
  for (let a = queue.shift(); a; a = queue.shift()) {
    try {
      const png = await generate(a);
      writeFileSync(join('gfx-incoming/generated', `${a.path.replace(/\//g, '__')}.png`), png); // Rohbild aufbewahren
      const [w, h] = a.size;
      const out = join('public/gfx', `${a.path}.webp`);
      mkdirSync(join(out, '..'), { recursive: true });
      let img = sharp(png).ensureAlpha();
      img = a.transparent ? sharp(await img.trim({ threshold: 6 }).toBuffer()).resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }) : img.resize(w, h, { fit: 'cover' });
      await img.webp({ quality: 88, alphaQuality: 95 }).toFile(out);
      done++;
      console.log(`✓ [${done}/${todo.length}] ${out}`);
    } catch (e) {
      failed.push(a.path);
      console.log(`✗ ${a.path}: ${(e as Error).message}`);
    }
  }
}
await Promise.all([worker(), worker(), worker()]);
console.log(`\nFertig: ${done} erzeugt, ${failed.length} fehlgeschlagen.${failed.length ? ' Einfach erneut starten – vorhandene werden übersprungen.' : ''}`);
