/** Erzeugt docs/CHATGPT_PROMPTS.md: npx vite-node scripts/gen-chatgpt-prompts.ts */
import { writeFileSync } from 'node:fs';
import { GRAPHICS, type GfxAsset } from '../src/content/graphics';
import { MEASURE_BY_ID } from '../src/content/measures';
import { COMPONENTS } from '../src/content/components';
import { ARCHETYPE_BY_ID } from '../src/content/tenants';
import { DETAILS, PORTRAITS, STYLE } from './graphics-prompts';

const chatSize = (a: GfxAsset) => {
  const r = a.size[0] / a.size[1];
  return r > 1.25 ? '1536×1024 (Querformat)' : r < 0.8 ? '1024×1536 (Hochformat)' : '1024×1024 (quadratisch)';
};
const fileName = (a: GfxAsset) => `${a.path.split('/').pop()}.png`;

function describe(a: GfxAsset): string {
  if (DETAILS[a.id]) return DETAILS[a.id];
  if (a.kind === 'portrait') {
    const [, rest] = a.id.split('.');
    const arch = rest.replace(/_\d$/, '');
    const v = Number(rest.slice(-1));
    const at = ARCHETYPE_BY_ID[arch];
    return `Porträt (Kopf und Schultern) eines Mieters für ein Wirtschaftsspiel: ${PORTRAITS[arch][v - 1]}. Lebenssituation: ${at.label} – ${at.description} Freundlicher, sympathischer Ausdruck, Blick leicht zur Kamera, ruhiger einfarbiger Hintergrund in einem gedeckten Pastellton.`;
  }
  if (a.id.startsWith('measure.')) {
    const m = MEASURE_BY_ID[a.id.slice(8)];
    return `Illustration für eine Renovierungsmaßnahme in einem Mietshaus: „${m.label}“. ${m.description} Zeige das fertige, gelungene Ergebnis (gerne mit Handwerkern bei der Arbeit am Rand), innen bzw. außen passend zur Maßnahme.`;
  }
  if (a.id.startsWith('component.')) {
    const c = COMPONENTS[a.id.slice(10) as keyof typeof COMPONENTS];
    return `Einfaches, flaches Symbol-Icon für das Gebäudebauteil „${c.label}“ (${c.description}). Klare Silhouette, 2–3 Farben, gut auf 24 Pixel lesbar.`;
  }
  return a.label;
}

function block(a: GfxAsset, n: number): string {
  const props: string[] = [];
  if (a.tileable) props.push('Das Bild muss NAHTLOS KACHELBAR sein: linke und rechte sowie obere und untere Kante passen exakt aneinander, keine Vignette, keine auffälligen Einzelelemente, gleichmäßige Beleuchtung, die gesamte Fläche ist Material (keine Ränder, kein Hintergrund).');
  if (a.transparent) props.push('TRANSPARENTER HINTERGRUND (PNG mit Alphakanal), kein Boden, kein Schatten auf dem Untergrund, Motiv zentriert und füllt das Bild fast vollständig aus.');
  if (a.kind === 'illustration' || a.kind === 'background') props.push('Wichtiges mittig platzieren – das Bild wird später auf das Seitenverhältnis ' + `${a.size[0]}:${a.size[1]} beschnitten.`);
  return `### ${n}. ${a.label}
Dateiname: \`${fileName(a)}\` · Bildformat: ${chatSize(a)} · Zielgröße im Spiel: ${a.size[0]}×${a.size[1]} · ${['', 'Priorität 1', 'Priorität 2', 'Priorität 3'][a.priority]}

\`\`\`
Erstelle ein Bild im Format ${chatSize(a)}.
${describe(a)}
${props.join('\n')}
Halte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.
\`\`\`
`;
}

const ordered = [...GRAPHICS].sort((x, y) => x.priority - y.priority || GRAPHICS.indexOf(x) - GRAPHICS.indexOf(y));
const groups = [...new Set(ordered.map((g) => g.group))];
let md = `# ChatGPT-Prompts für alle Grafiken

Diese Datei wird aus dem Grafik-Manifest erzeugt (\`npx vite-node scripts/gen-chatgpt-prompts.ts\`). Sie enthält ${GRAPHICS.length} Bilder, sortiert nach Priorität.

## So gehst du vor

1. Öffne in ChatGPT einen **neuen Chat** und schicke zuerst den **Start-Prompt** unten. Er legt den Stil für alle Bilder fest.
2. Schicke danach die Bild-Prompts **einzeln** (ein Bild pro Nachricht – das gibt die beste Qualität). Bei langen Chats nach ca. 20–30 Bildern einen neuen Chat beginnen und den Start-Prompt erneut senden.
3. Gefällt dir ein Bild, lade es herunter und **benenne es exakt wie angegeben** (z. B. \`facade_good.png\`).
4. Lege alle Dateien in den Ordner \`gfx-incoming/\` im Projekt (Unterordner sind egal).
5. Führe \`npm run gfx:import\` aus: Das Skript skaliert jedes Bild auf die Zielgröße, schneidet transparente Ränder bei Sprites ab, wandelt in WebP um und legt es unter \`public/gfx/…\` ab.
6. Spiel neu laden → unter *Einstellungen → Grafiken & Texturen* siehst du, was erkannt wurde.

Tipps:
- **Varianten derselben Sache** (Fassade gut/abgenutzt/beschädigt, Baum in vier Jahreszeiten, Heizkessel ok/kaputt) möglichst **direkt nacheinander im selben Chat** erstellen und z. B. ergänzen: „Gleiche Textur wie eben, aber …“.
- **Kachelbarkeit prüfen:** ChatGPT trifft das nicht immer perfekt. Notfalls nachbessern lassen („Die Kanten passen nicht zusammen, mach die Textur nahtlos kachelbar“) oder in einem Bildprogramm mit „Verschiebung/Offset“ nacharbeiten.
- **Transparenz:** Wenn ein Bild mit weißem statt transparentem Hintergrund kommt, schreibe: „Bitte dasselbe Bild mit transparentem Hintergrund als PNG.“
- **Fenster-Sprites:** Die Glasflächen müssen wirklich durchsichtig sein – das Spiel färbt das Glas selbst je nach Wohnungsstatus.

## Start-Prompt (zuerst senden)

\`\`\`
Du bist Art-Director und Illustrator für das deutsche Browser-Wirtschaftsspiel „Mietshaus Tycoon“. Darin verwaltet man ein Mietshaus aus den 1950er/60er Jahren in einer deutschen Stadt: Wohnungen vermieten, Reparaturen beauftragen, Modernisieren. Das Haus wird in einer flachen Frontalansicht gezeigt, die aus vielen Einzelgrafiken (Texturen und Objekten) zusammengesetzt wird.

Ich schicke dir gleich nacheinander einzelne Bildaufträge. Erstelle für jeden Auftrag genau EIN Bild und halte über alle Bilder hinweg exakt denselben Stil ein:

${STYLE}

Personen: vielfältig (Alter, Geschlecht, Herkunft, Kleidung), sympathisch und respektvoll, ohne Klischees oder Karikaturen.

Bestätige kurz, dass du den Stil verstanden hast. Erstelle noch kein Bild.
\`\`\`
`;
let n = 0;
for (const p of [1, 2, 3] as const) {
  md += `\n## ${['', 'Priorität 1 – größter Effekt im Spiel', 'Priorität 2 – macht das Spiel deutlich schöner', 'Priorität 3 – optionale Extras'][p]}\n`;
  for (const g of groups) {
    const items = ordered.filter((a) => a.priority === p && a.group === g);
    if (!items.length) continue;
    md += `\n---\n\n#### ${g}\n\n`;
    for (const a of items) md += block(a, ++n) + '\n';
  }
}
writeFileSync('docs/CHATGPT_PROMPTS.md', md);
console.log(`docs/CHATGPT_PROMPTS.md: ${n} Prompts`);
