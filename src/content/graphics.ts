import { ARCHETYPES } from './tenants';
import { MEASURES } from './measures';
import { COMPONENT_ORDER, COMPONENTS } from './components';

/**
 * Manifest aller optionalen Grafiken. Dateien liegen unter public/gfx/<pfad>.<endung>
 * (Endung: webp, png oder svg – in dieser Reihenfolge gesucht). Fehlt eine Datei,
 * zeichnet das Spiel die bisherige Vektorgrafik. Diese Liste ist die Grundlage für docs/GRAFIKEN.md.
 */
export type GfxKind = 'texture' | 'sprite' | 'portrait' | 'illustration' | 'icon' | 'background';

export interface GfxAsset {
  id: string;
  /** Pfad relativ zu public/gfx ohne Endung */
  path: string;
  kind: GfxKind;
  group: string;
  label: string;
  /** Empfohlene Größe in Pixeln */
  size: [number, number];
  /** Kachelbar (nahtlos wiederholbar) */
  tileable?: boolean;
  /** Transparenter Hintergrund nötig */
  transparent?: boolean;
  priority: 1 | 2 | 3;
  usage: string;
}

const A: GfxAsset[] = [];
const add = (a: GfxAsset) => A.push(a);

// ---------------------------------------------------------------- Gebäude-Texturen
const tex = (id: string, label: string, usage: string, priority: 1 | 2 | 3 = 1, size: [number, number] = [256, 256]) =>
  add({ id: `tex.${id}`, path: `textures/${id}`, kind: 'texture', group: 'Gebäude-Texturen', label, size, tileable: true, priority, usage });

tex('facade_good', 'Fassadenputz – gepflegt', 'Fassade bei Zustand ≥ 70 %');
tex('facade_worn', 'Fassadenputz – abgenutzt', 'Fassade bei Zustand 45–69 %');
tex('facade_damaged', 'Fassadenputz – beschädigt (Risse, Abplatzungen, Flecken)', 'Fassade bei Zustand < 45 %');
tex('facade_insulated', 'Fassade gedämmt (glatter, heller Oberputz)', 'Fassade ab Dämmstufe 2', 2);
tex('roof_good', 'Dachziegel – intakt', 'Dach bei Zustand ≥ 70 %');
tex('roof_worn', 'Dachziegel – verwittert, Moos', 'Dach bei Zustand 45–69 %');
tex('roof_damaged', 'Dachziegel – lückenhaft, verschoben', 'Dach bei Zustand < 45 %');
tex('basement', 'Kellermauerwerk / Sockel (Naturstein oder Ziegel)', 'Sockelzone unter der Erdlinie');
tex('basement_damp', 'Kellermauerwerk feucht (Ausblühungen)', 'Sockel bei Kellerzustand < 50 % oder Feuchteschaden', 2);
tex('stairwell', 'Treppenhaus-Achse (Glasbausteine/Putzband)', 'Senkrechter Streifen Treppenhaus in der Fassade', 2, [128, 256]);
tex('ground_grass', 'Rasen gepflegt', 'Boden vor dem Haus, gute Pflege', 2, [256, 64]);
tex('ground_dry', 'Rasen verwildert/trocken', 'Boden vor dem Haus, schlechte Pflege', 2, [256, 64]);
tex('ground_snow', 'Boden verschneit', 'Boden im Winter', 2, [256, 64]);

// ---------------------------------------------------------------- Himmel
for (const [s, l] of [['spring', 'Frühling'], ['summer', 'Sommer'], ['autumn', 'Herbst'], ['winter', 'Winter']] as const)
  add({ id: `bg.sky_${s}`, path: `backgrounds/sky_${s}`, kind: 'background', group: 'Hintergründe', label: `Himmel ${l} (ggf. mit Stadtsilhouette)`, size: [1600, 900], priority: 2, usage: 'Hintergrund der Gebäudeansicht, wird proportional beschnitten' });
add({ id: 'bg.start', path: 'backgrounds/start', kind: 'background', group: 'Hintergründe', label: 'Startbildschirm (Straßenszene)', size: [1920, 1080], priority: 3, usage: 'Hintergrund des Hauptmenüs, sehr dezent/unscharf darstellbar' });

// ---------------------------------------------------------------- Sprites
const spr = (id: string, label: string, size: [number, number], usage: string, priority: 1 | 2 | 3 = 2) =>
  add({ id: `spr.${id}`, path: `sprites/${id}`, kind: 'sprite', group: 'Gebäude-Objekte (Sprites)', label, size, transparent: true, priority, usage });

spr('window_old', 'Fenster alt (Holzrahmen, Sprossen) – Glasfläche transparent lassen', [160, 168], 'Fensterrahmen bei Qualitätsstufe 1–2 (Glasfarbe zeigt Wohnungsstatus)', 1);
spr('window_new', 'Fenster neu (weißer Kunststoffrahmen) – Glasfläche transparent', [160, 168], 'Fensterrahmen ab Qualitätsstufe 3', 1);
spr('balcony', 'Balkongeländer', [416, 48], 'Unter den Fenstern von Wohnungen mit Balkon');
spr('door_entrance', 'Haustür', [112, 184], 'Hauseingang', 1);
spr('door_entrance_new', 'Haustür modern mit Klingelanlage', [112, 184], 'Hauseingang nach Sicherheitsmodernisierung', 3);
spr('door_broken', 'Haustür beschädigt/offen', [112, 184], 'Haustür bei Defekt „Haustür schließt nicht“', 3);
spr('chimney', 'Schornstein', [64, 144], 'Dach (bei Öl/Gas mit Rauch animiert)');
spr('smoke', 'Rauchwolke', [96, 96], 'Über dem Schornstein in der Heizperiode', 3);
spr('solar_panels', 'Photovoltaik-Feld (Draufsicht schräg)', [320, 120], 'Auf dem Dach nach PV-Installation');
spr('heat_pump', 'Wärmepumpen-Außengerät', [136, 120], 'Neben dem Haus bei Wärmepumpe');
spr('boiler_ok', 'Heizkessel (läuft)', [144, 104], 'Keller, Heizung in Ordnung', 1);
spr('boiler_broken', 'Heizkessel (Störung/Ausfall)', [144, 104], 'Keller, bei Heizungsausfall', 1);
spr('tree_spring', 'Baum Frühling', [160, 240], 'Links neben dem Haus');
spr('tree_summer', 'Baum Sommer', [160, 240], 'Links neben dem Haus');
spr('tree_autumn', 'Baum Herbst', [160, 240], 'Links neben dem Haus');
spr('tree_winter', 'Baum Winter (kahl)', [160, 240], 'Links neben dem Haus');
spr('bins', 'Mülltonnen ordentlich', [120, 80], 'Rechts neben dem Haus');
spr('bins_overflow', 'Mülltonnen überquellend, Müllsäcke', [140, 80], 'Bei schlechter Außenpflege');
spr('bikes', 'Fahrradständer mit Rädern', [140, 80], 'Nach Ausstattung „Fahrradstellplätze“', 3);
spr('flowers', 'Blumenbeet', [140, 48], 'Nach Ausstattung „Garten“', 3);
spr('scaffold', 'Baugerüst (kachelbar, transparent)', [128, 128], 'Bei Arbeiten an Fassade/Dach/Fenstern', 2);
spr('graffiti', 'Graffiti-Schmiererei', [160, 64], 'Bei Vandalismus-Schaden', 3);
spr('mold_spot', 'Feuchte-/Schimmelfleck', [96, 64], 'Kellersockel bei Feuchte', 3);
spr('crack', 'Putzriss', [96, 128], 'Fassade bei schlechtem Zustand', 3);
spr('rat', 'Ratte', [48, 32], 'Bei Ungeziefer-Schaden', 3);
spr('sign_for_rent', 'Schild „Zu vermieten“', [120, 40], 'Am Fenster inserierter Wohnungen', 3);

// ---------------------------------------------------------------- Porträts
for (const a of ARCHETYPES)
  for (const v of [1, 2, 3])
    add({ id: `portrait.${a.id}_${v}`, path: `portraits/${a.id}_${v}`, kind: 'portrait', group: 'Mieterporträts', label: `${a.label} – Variante ${v}`, size: [256, 256], priority: v === 1 ? 1 : 2, usage: `Mieter- und Bewerberkarten (Archetyp ${a.id})` });

// ---------------------------------------------------------------- Ereignisse
const EVENT_ILL: [string, string][] = [
  ['storm', 'Sturm über dem Haus'],
  ['heavy_rain', 'Starkregen, Wasser im Hof'],
  ['frost', 'Strenger Frost, Eiszapfen'],
  ['heatwave', 'Hitzewelle'],
  ['energy_price_shock', 'Steigende Energiepreise (Zähler/Rechnung)'],
  ['material_price_rise', 'Baustoffe werden teurer'],
  ['new_contractor', 'Neuer Handwerksbetrieb'],
  ['subsidy_program', 'Förderprogramm (Fördermittelbescheid)'],
  ['energy_audit', 'Energieberater mit Wärmebildkamera'],
  ['neighbor_conflict', 'Streit im Treppenhaus'],
  ['community_party', 'Hoffest'],
  ['tenant_job_loss', 'Mieter in finanzieller Sorge'],
  ['fire_inspection', 'Brandschutz-Begehung'],
  ['kitchen_request', 'Wunsch nach neuer Küche'],
  ['garden_volunteer', 'Mieterin pflegt den Hof'],
  ['diy_stairwell', 'Mieter streicht das Treppenhaus'],
  ['vandalism', 'Vandalismus am Eingang'],
  ['bridge_loan', 'Gespräch mit der Bank'],
  ['chimney_sweep', 'Schornsteinfeger'],
  ['pipe_warning', 'Korrodiertes Wasserrohr'],
  ['insurance_offer', 'Versicherungsmakler'],
  ['helpful_neighbor', 'Nachbarschaftshilfe'],
  ['investor_inquiry', 'Investor besichtigt das Haus'],
  ['press_praise', 'Zeitungsartikel über das Haus'],
];
for (const [id, label] of EVENT_ILL)
  add({ id: `event.${id}`, path: `events/${id}`, kind: 'illustration', group: 'Ereignis-Illustrationen', label, size: [1200, 500], priority: ['storm', 'frost', 'heavy_rain', 'neighbor_conflict', 'tenant_job_loss', 'energy_price_shock'].includes(id) ? 2 : 3, usage: 'Kopfbild im Entscheidungsdialog und in der Ereignisliste' });
add({ id: 'event.generic', path: 'events/generic', kind: 'illustration', group: 'Ereignis-Illustrationen', label: 'Allgemeines Ereignis (Briefkasten/Hausflur)', size: [1200, 500], priority: 2, usage: 'Fallback für Ereignisse ohne eigenes Bild' });

// ---------------------------------------------------------------- Maßnahmen & Bauteile
for (const m of MEASURES)
  add({ id: `measure.${m.id}`, path: `measures/${m.id}`, kind: 'illustration', group: 'Maßnahmen-Bilder', label: m.label, size: [640, 320], priority: 3, usage: 'Karte im Renovierungskatalog (Vorher/Nachher-Gefühl)' });
for (const k of COMPONENT_ORDER)
  add({ id: `component.${k}`, path: `components/icon_${k}`, kind: 'icon', group: 'Bauteil-Icons', label: COMPONENTS[k].label, size: [128, 128], transparent: true, priority: 3, usage: 'Bauteilliste in der Gebäudeansicht' });

// ---------------------------------------------------------------- Marke
add({ id: 'ui.logo', path: 'ui/logo', kind: 'icon', group: 'Logo & Oberfläche', label: 'Spiellogo (quadratisch)', size: [512, 512], transparent: true, priority: 1, usage: 'Startbildschirm, Seitenleiste' });
add({ id: 'ui.logo_wide', path: 'ui/logo_wide', kind: 'icon', group: 'Logo & Oberfläche', label: 'Schriftzug „Mietshaus Tycoon“', size: [1200, 300], transparent: true, priority: 2, usage: 'Startbildschirm (ersetzt den Text-Titel)' });

export const GRAPHICS: GfxAsset[] = A;
export const GRAPHIC_BY_ID: Record<string, GfxAsset> = Object.fromEntries(A.map((a) => [a.id, a]));
export const GFX_EXTENSIONS = ['webp', 'png', 'svg'] as const;
export const GFX_BASE = '/gfx/';
