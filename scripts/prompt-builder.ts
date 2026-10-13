/** Gemeinsame Bausteine für alle Bild-Prompts (ChatGPT, Sammelblätter, OpenAI-API). */
import { GRAPHICS, type GfxAsset } from '../src/content/graphics';
import { MEASURE_BY_ID } from '../src/content/measures';
import { COMPONENTS } from '../src/content/components';
import { ARCHETYPE_BY_ID } from '../src/content/tenants';
import { DETAILS, PORTRAITS, STYLE } from './graphics-prompts';

export { STYLE };

export type ApiSize = '1024x1024' | '1536x1024' | '1024x1536';
export const apiSize = (a: GfxAsset): ApiSize => {
  const r = a.size[0] / a.size[1];
  return r > 1.25 ? '1536x1024' : r < 0.8 ? '1024x1536' : '1024x1024';
};
export const chatSize = (a: GfxAsset) => ({ '1536x1024': '1536×1024 (Querformat)', '1024x1536': '1024×1536 (Hochformat)', '1024x1024': '1024×1024 (quadratisch)' })[apiSize(a)];
export const fileName = (a: GfxAsset) => `${a.path.split('/').pop()}.png`;

export function describe(a: GfxAsset): string {
  if (DETAILS[a.id]) return DETAILS[a.id];
  if (a.kind === 'portrait') {
    const rest = a.id.split('.')[1];
    const arch = rest.replace(/_\d$/, '');
    const v = Number(rest.slice(-1));
    const at = ARCHETYPE_BY_ID[arch];
    return `Porträt (Kopf und Schultern) eines Mieters: ${PORTRAITS[arch][v - 1]}. Lebenssituation: ${at.label} – ${at.description} Freundlicher, sympathischer Ausdruck, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.`;
  }
  if (a.id.startsWith('measure.')) {
    const m = MEASURE_BY_ID[a.id.slice(8)];
    return `Renovierungsmaßnahme „${m.label}“: ${m.description} Zeige das fertige, gelungene Ergebnis passend zur Maßnahme (innen oder außen).`;
  }
  if (a.id.startsWith('component.')) {
    const c = COMPONENTS[a.id.slice(10) as keyof typeof COMPONENTS];
    return `Flaches Symbol-Icon für das Gebäudebauteil „${c.label}“ (${c.description}). Klare Silhouette, 2–3 Farben, auf 24 Pixel lesbar.`;
  }
  return a.label;
}

export function requirements(a: GfxAsset): string[] {
  const r: string[] = [];
  if (a.tileable) r.push('Das Bild muss NAHTLOS KACHELBAR sein: linke/rechte und obere/untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die ganze Fläche ist Material.');
  if (a.transparent) r.push('Transparenter Hintergrund (PNG mit Alphakanal), kein Boden, kein Schlagschatten, Motiv zentriert und bildfüllend.');
  if (a.kind === 'illustration' || a.kind === 'background') r.push(`Wichtiges mittig platzieren – das Bild wird auf das Seitenverhältnis ${a.size[0]}:${a.size[1]} beschnitten.`);
  return r;
}

/** Vollständiger Einzel-Prompt (für API-Aufrufe, Stil inklusive). */
export function fullPrompt(a: GfxAsset): string {
  return `Bild für das deutsche Browser-Wirtschaftsspiel „Mietshaus Tycoon“ (Verwaltung eines Mietshauses der 1950er/60er Jahre).\n\n${STYLE}\n\nMotiv: ${describe(a)}\n${requirements(a).join('\n')}\nPersonen (falls vorhanden): vielfältig, sympathisch, ohne Klischees.`;
}

// ---------------------------------------------------------------- Sammelblätter (Raster)
export interface Sheet {
  id: string; // sheet_01 …
  title: string;
  cols: number;
  rows: number;
  size: ApiSize;
  transparent: boolean;
  assets: GfxAsset[];
  note: string;
}

const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

export function buildSheets(): Sheet[] {
  const sheets: Omit<Sheet, 'id'>[] = [];
  const by = (pred: (a: GfxAsset) => boolean) => GRAPHICS.filter(pred);
  const pushChunks = (title: string, list: GfxAsset[], cols: number, rows: number, size: ApiSize, transparent: boolean, note: string) => {
    const parts = chunk(list, cols * rows);
    parts.forEach((p, i) => sheets.push({ title: parts.length > 1 ? `${title} (${i + 1}/${parts.length})` : title, cols, rows, size, transparent, assets: p, note }));
  };
  pushChunks('Gebäude-Texturen', by((a) => a.kind === 'texture'), 4, 4, '1024x1024', false, 'Jedes Feld ist eine eigenständige, möglichst nahtlos kachelbare Materialfläche, die das Feld vollständig ausfüllt.');
  pushChunks('Gebäude-Objekte', by((a) => a.kind === 'sprite'), 4, 4, '1024x1024', true, 'Jedes Objekt steht einzeln und frei in seinem Feld auf transparentem Hintergrund, mit etwas Abstand zu den Feldrändern. Bei den Fenstern sind die Glasflächen transparent.');
  pushChunks('Mieterporträts', by((a) => a.kind === 'portrait'), 3, 3, '1024x1024', false, 'Jedes Feld ist ein eigenes quadratisches Porträt (Kopf und Schultern) mit eigenem ruhigen Pastell-Hintergrund. Alle Porträts im gleichen Stil.');
  pushChunks('Ereignis-Illustrationen', by((a) => a.id.startsWith('event.')), 2, 2, '1536x1024', false, 'Jedes Feld ist eine eigene kleine Szene im Querformat, Motiv mittig.');
  pushChunks('Renovierungsmaßnahmen', by((a) => a.id.startsWith('measure.')), 3, 3, '1536x1024', false, 'Jedes Feld zeigt das fertige Ergebnis einer Maßnahme als kleine Szene im Querformat.');
  pushChunks('Bauteil-Icons', by((a) => a.id.startsWith('component.')), 4, 3, '1536x1024', true, 'Jedes Feld enthält genau ein flaches Icon, zentriert, transparenter Hintergrund.');
  for (const a of by((x) => x.kind === 'background' || x.id.startsWith('ui.'))) sheets.push({ title: a.label, cols: 1, rows: 1, size: apiSize(a), transparent: !!a.transparent, assets: [a], note: '' });
  return sheets.map((s, i) => ({ ...s, id: `sheet_${String(i + 1).padStart(2, '0')}` }));
}

export function sheetPrompt(s: Sheet): string {
  if (s.cols * s.rows === 1) {
    const a = s.assets[0];
    return `Erstelle ein Bild im Format ${chatSize(a)}.\n${describe(a)}\n${requirements(a).join('\n')}\nHalte dich an den vereinbarten Stil.`;
  }
  const cells = s.assets.map((a, i) => `${i + 1}. ${describe(a)}`).join('\n');
  const empty = s.cols * s.rows - s.assets.length;
  return `Erstelle EIN Bild im Format ${s.size.replace('x', '×')} als Sammelblatt (Sprite-Sheet) mit einem exakten Raster aus ${s.cols} Spalten × ${s.rows} Zeilen gleich großer Felder.
Regeln für das Raster:
- Alle Felder exakt gleich groß, KEINE Rahmen, KEINE Trennlinien, KEINE Abstände zwischen den Feldern, KEINE Nummern oder Beschriftungen.
- Jedes Motiv bleibt vollständig innerhalb seines Feldes und ragt nicht in Nachbarfelder.
- Reihenfolge: zeilenweise von links oben nach rechts unten.
- ${s.note}
${s.transparent ? '- Der gesamte Hintergrund ist transparent (PNG mit Alphakanal).\n' : ''}${empty ? `- Die letzten ${empty} Feld(er) bleiben leer${s.transparent ? ' (transparent)' : ' (neutrales Hellgrau)'}.\n` : ''}
Inhalt der Felder:
${cells}

Halte dich an den vereinbarten Stil des Spiels.`;
}
