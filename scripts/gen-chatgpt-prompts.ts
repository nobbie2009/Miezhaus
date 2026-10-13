/** Erzeugt docs/CHATGPT_PROMPTS.md (Einzelbilder) und docs/CHATGPT_SAMMELBLAETTER.md: npm run gfx:docs */
import { writeFileSync } from 'node:fs';
import { GRAPHICS } from '../src/content/graphics';
import { buildSheets, chatSize, describe, fileName, requirements, sheetPrompt, STYLE } from './prompt-builder';

const START = `\`\`\`
Du bist Art-Director und Illustrator für das deutsche Browser-Wirtschaftsspiel „Mietshaus Tycoon“. Darin verwaltet man ein Mietshaus aus den 1950er/60er Jahren in einer deutschen Stadt: Wohnungen vermieten, Reparaturen beauftragen, Modernisieren. Das Haus wird in einer flachen Frontalansicht gezeigt, die aus vielen Einzelgrafiken (Texturen und Objekten) zusammengesetzt wird.

Ich schicke dir gleich nacheinander einzelne Bildaufträge. Erstelle für jeden Auftrag genau EIN Bild und halte über alle Bilder hinweg exakt denselben Stil ein:

${STYLE}

Personen: vielfältig (Alter, Geschlecht, Herkunft, Kleidung), sympathisch und respektvoll, ohne Klischees oder Karikaturen.

Bestätige kurz, dass du den Stil verstanden hast. Erstelle noch kein Bild.
\`\`\``;

// ---------------------------------------------------------------- Sammelblätter
const sheets = buildSheets();
let sh = `# ChatGPT-Sammelblätter – alle ${GRAPHICS.length} Grafiken mit ${sheets.length} Prompts

Diese Datei wird automatisch erzeugt (\`npm run gfx:docs\`).

ChatGPT erstellt pro Nachricht ein Bild. Damit du nicht ${GRAPHICS.length}-mal fragen und umbenennen musst, zeichnet ChatGPT hier **Sammelblätter**: mehrere Grafiken in einem Raster. Das Importskript schneidet die Blätter automatisch in Einzeldateien mit den richtigen Namen.

## Ablauf

1. Neuen ChatGPT-Chat öffnen, den **Start-Prompt** senden.
2. Die ${sheets.length} Blatt-Prompts nacheinander senden (am besten nach Blatt 10 einen neuen Chat mit Start-Prompt beginnen).
3. Jedes Ergebnis herunterladen und **nur** als \`sheet_01.png\`, \`sheet_02.png\` … speichern (die Nummer steht über jedem Prompt).
4. Alle Blätter nach \`gfx-incoming/\` legen und \`npm run gfx:import\` ausführen → fertig, alle Einzelgrafiken liegen benannt unter \`public/gfx/\`.

Hinweise: Achte darauf, dass das Raster sauber ist (gleich große Felder, keine Ränder). Gelingt ein Blatt nicht, einfach neu erzeugen lassen: „Bitte noch einmal, das Raster muss exakt gleich große Felder (z. B. 4×4) ohne Rand haben.“ Sammelblätter liefern etwas weniger Detail als Einzelbilder – für einzelne Lieblingsmotive kannst du jederzeit die Einzel-Prompts aus \`docs/CHATGPT_PROMPTS.md\` nutzen; Einzeldateien überschreiben dann den Blatt-Ausschnitt.

## Start-Prompt (zuerst senden)

${START}
`;
for (const s of sheets) {
  sh += `\n---\n\n## ${s.id}.png – ${s.title}\n\n${s.cols * s.rows > 1 ? `Raster ${s.cols}×${s.rows}, ergibt: ${s.assets.map(fileName).join(', ')}` : `ergibt: ${fileName(s.assets[0])}`}\n\n\`\`\`\n${sheetPrompt(s)}\n\`\`\`\n`;
}
writeFileSync('docs/CHATGPT_SAMMELBLAETTER.md', sh);

// ---------------------------------------------------------------- Einzelbilder
const ordered = [...GRAPHICS].sort((x, y) => x.priority - y.priority || GRAPHICS.indexOf(x) - GRAPHICS.indexOf(y));
let md = `# ChatGPT-Prompts für Einzelbilder

Automatisch erzeugt (\`npm run gfx:docs\`). Schneller geht es mit \`docs/CHATGPT_SAMMELBLAETTER.md\` (${sheets.length} Prompts) oder vollautomatisch mit \`npm run gfx:generate\` (siehe README). Diese Einzel-Prompts eignen sich, um einzelne Motive in höherer Qualität nachzuarbeiten. Dateien exakt wie angegeben benennen, nach \`gfx-incoming/\` legen, \`npm run gfx:import\`.

## Start-Prompt (zuerst senden)

${START}
`;
let n = 0;
for (const p of [1, 2, 3] as const) {
  md += `\n## ${['', 'Priorität 1', 'Priorität 2', 'Priorität 3'][p]}\n`;
  for (const a of ordered.filter((x) => x.priority === p)) {
    md += `\n### ${++n}. ${a.label}\nDateiname: \`${fileName(a)}\` · ${chatSize(a)} · Zielgröße ${a.size[0]}×${a.size[1]}\n\n\`\`\`\nErstelle ein Bild im Format ${chatSize(a)}.\n${describe(a)}\n${requirements(a).join('\n')}\nHalte dich an den vereinbarten Stil des Spiels „Mietshaus Tycoon“.\n\`\`\`\n`;
  }
}
writeFileSync('docs/CHATGPT_PROMPTS.md', md);
console.log(`docs/CHATGPT_SAMMELBLAETTER.md: ${sheets.length} Blätter · docs/CHATGPT_PROMPTS.md: ${n} Einzel-Prompts`);
