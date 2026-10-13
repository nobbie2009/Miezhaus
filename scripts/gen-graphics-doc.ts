/** Erzeugt docs/GRAFIKEN.md aus dem Grafik-Manifest: npx vite-node scripts/gen-graphics-doc.ts */
import { writeFileSync } from 'node:fs';
import { GRAPHICS } from '../src/content/graphics';

const groups = [...new Set(GRAPHICS.map((g) => g.group))];
const prio = { 1: 'P1 – wichtig', 2: 'P2 – schön', 3: 'P3 – optional' };
let md = `# Grafiken & Texturen für Mietshaus Tycoon

Diese Datei wird aus \`src/content/graphics.ts\` erzeugt (\`npx vite-node scripts/gen-graphics-doc.ts\`).

Alle Grafiken sind **optional**. Das Spiel sucht beim Start nach \`public/gfx/<Pfad>.webp\`, dann \`.png\`, dann \`.svg\`.
Fehlt eine Datei, wird die eingebaute Vektor-Zeichnung verwendet. Nach dem Ablegen genügt ein Neuladen der Seite;
unter *Einstellungen → Grafiken & Texturen* sieht man, welche Dateien erkannt wurden.

Insgesamt **${GRAPHICS.length} Grafiken** – davon ${GRAPHICS.filter((g) => g.priority === 1).length} mit Priorität 1, ${GRAPHICS.filter((g) => g.priority === 2).length} mit Priorität 2.

## Stilvorgaben

- **Perspektive:** reine Frontalansicht (Fassadenansicht, keine Isometrie), Licht von oben links, weiche Schatten nach rechts unten.
- **Stil:** moderner, leicht illustrierter Flat-/Semi-Flat-Look, klare Kanten, wenig Rauschen. Alles muss auch klein (≈ 40 px) noch lesbar sein.
- **Farben:** warme, gedeckte Töne (Putz beige/ocker, Ziegel rotbraun, Holz braun). Keine reinen Schwarztöne – das Spiel hat auch einen Dunkelmodus.
- **Zustände:** Varianten (gut/abgenutzt/beschädigt) zeigen dasselbe Motiv in unterschiedlichem Zustand – gleiche Farbwelt, gleiche Kachelgröße.
- **Texturen** müssen **nahtlos kachelbar** sein (links/rechts und oben/unten), ohne auffällige Wiederholungsmuster.
- **Sprites** mit **transparentem Hintergrund**, Motiv füllt das Format nahezu aus (wenige px Rand).
- **Fenster-Sprites:** nur Rahmen, Sprossen, Fensterbank – die **Glasfläche transparent** lassen; das Spiel färbt das Glas je nach Wohnungsstatus (bewohnt = warmes Licht, leer = hellblau, Renovierung = orange).
- **Porträts:** quadratisch, Kopf/Schulter, neutraler oder leicht farbiger Hintergrund, freundlicher Ausdruck, einheitlicher Stil. Bitte vielfältig (Alter, Geschlecht, Herkunft, Kleidung) und **ohne Klischees** – Archetypen beschreiben Lebenssituationen, nicht Menschengruppen. Drei Varianten je Archetyp, gerne bunt gemischt.
- **Ereignis-Illustrationen:** Querformat 12:5, Motiv mittig (wird ggf. beschnitten), ohne Text.
- **Formate:** WebP (bevorzugt) oder PNG; Logo/Icons auch SVG. Dateinamen exakt wie unten, Kleinbuchstaben.
- **Auflösung:** Angegebene Größen sind Empfehlungen (Retina-tauglich). Texturen werden im Spiel kleiner dargestellt (Fassade 128 px Kachel, Dach 96 px).

## Liste
`;
for (const g of groups) {
  const items = GRAPHICS.filter((a) => a.group === g);
  md += `\n### ${g} (${items.length})\n\n| Datei (unter public/gfx/) | Inhalt | Größe (px) | Eigenschaften | Priorität | Verwendung |\n|---|---|---|---|---|---|\n`;
  for (const a of items) {
    const props = [a.tileable ? 'kachelbar' : '', a.transparent ? 'transparent' : ''].filter(Boolean).join(', ') || '–';
    md += `| \`${a.path}.webp\` | ${a.label} | ${a.size[0]}×${a.size[1]} | ${props} | ${prio[a.priority]} | ${a.usage} |\n`;
  }
}
md += `\n## Ablage & Deployment\n\n- Entwicklung: Dateien nach \`public/gfx/…\` legen.\n- Docker: Dateien vor dem Build nach \`public/gfx/\` legen **oder** zur Laufzeit einbinden, z. B. in \`docker-compose.yml\`:\n  \`\`\`yaml\n  volumes:\n    - ./gfx:/usr/share/nginx/html/gfx:ro\n  \`\`\`\n`;
writeFileSync('docs/GRAFIKEN.md', md);
console.log(`docs/GRAFIKEN.md: ${GRAPHICS.length} Einträge`);
