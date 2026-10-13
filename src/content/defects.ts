import type { ComponentKey, Trade } from '@/domain/schema';
import { euro } from '@/utils/money';

export type ApartmentArea = 'kitchen' | 'bath' | 'general' | 'heating' | 'windows' | 'electric';

export interface DefectType {
  id: string;
  label: string;
  /** Bauteil oder Wohnungsbereich. */
  scope: 'component' | 'apartment';
  component?: ComponentKey;
  area?: ApartmentArea;
  severity: 1 | 2 | 3;
  repairCost: number;
  trade: Trade;
  repairDays: number;
  description: string;
  /** Eskalation zu einem Folgeschaden nach x Tagen ohne Reparaturauftrag. */
  escalation?: { afterDays: number; to: string; text: string };
  /** Mietminderung in Prozent der Bruttomiete betroffener Wohnungen. */
  rentReduction?: number;
  /** Macht eine Wohnung unbewohnbar. */
  uninhabitable?: boolean;
  /** Betrifft das ganze Haus (z. B. Heizungsausfall). */
  buildingWide?: boolean;
  /** Zufriedenheitsabzug für Betroffene. */
  satisfactionPenalty: number;
  /** Zusätzlicher Abzug in der Heizperiode. */
  winterPenalty?: number;
  /** Zusätzlicher Energieverbrauch (Faktor). */
  energyLoss?: number;
  insurable?: boolean;
  /** Wird i. d. R. erst durch Mieter oder Inspektion entdeckt. */
  hiddenChance: number;
  safety?: number;
  /** Mieter mit Heimwerker-Neigung können den Mangel selbst beheben. */
  diyFixable?: boolean;
}

const d = (t: DefectType) => t;

export const DEFECT_TYPES: Record<string, DefectType> = Object.fromEntries(
  [
    // --- Dach
    d({ id: 'roof_tiles', label: 'Lose Dachziegel', scope: 'component', component: 'roof', severity: 1, repairCost: euro(950), trade: 'roofing', repairDays: 2, description: 'Einige Ziegel sind verrutscht. Noch dicht, aber bei Regen droht Nässe.', escalation: { afterDays: 45, to: 'roof_leak', text: 'Durch die losen Ziegel ist Wasser eingedrungen.' }, satisfactionPenalty: 0, hiddenChance: 0.6 }),
    d({ id: 'roof_leak', label: 'Dach undicht', scope: 'component', component: 'roof', severity: 2, repairCost: euro(2900), trade: 'roofing', repairDays: 4, description: 'Bei Regen tropft es im Dachgeschoss. Die Dämmung saugt sich voll.', escalation: { afterDays: 30, to: 'apt_water_damage', text: 'Das undichte Dach hat einen Wasserschaden im Dachgeschoss verursacht.' }, satisfactionPenalty: 4, energyLoss: 0.05, hiddenChance: 0.1, rentReduction: 0.1, insurable: false }),
    // --- Fassade
    d({ id: 'facade_cracks', label: 'Risse im Putz', scope: 'component', component: 'facade', severity: 1, repairCost: euro(1900), trade: 'painting', repairDays: 4, description: 'Haarrisse und abplatzender Putz an der Wetterseite.', escalation: { afterDays: 120, to: 'facade_moisture', text: 'Durch die Risse ist Feuchtigkeit ins Mauerwerk gezogen.' }, satisfactionPenalty: 1, hiddenChance: 0.3 }),
    d({ id: 'facade_moisture', label: 'Feuchtes Mauerwerk', scope: 'component', component: 'facade', severity: 2, repairCost: euro(4800), trade: 'general', repairDays: 6, description: 'Feuchte Wände an der Außenseite, erste Ausblühungen.', escalation: { afterDays: 90, to: 'apt_mold', text: 'Die Feuchtigkeit hat in einer Wohnung zu Schimmel geführt.' }, satisfactionPenalty: 2, energyLoss: 0.04, hiddenChance: 0.2 }),
    d({ id: 'graffiti', label: 'Graffiti an der Fassade', scope: 'component', component: 'facade', severity: 1, repairCost: euro(450), trade: 'painting', repairDays: 1, description: 'Schmierereien am Eingangsbereich.', satisfactionPenalty: 2, hiddenChance: 0 }),
    // --- Fenster
    d({ id: 'window_draft', label: 'Undichte Fenster', scope: 'component', component: 'windows', severity: 1, repairCost: euro(700), trade: 'general', repairDays: 2, description: 'Spürbare Zugluft an mehreren Fenstern. Heizenergie geht verloren.', escalation: { afterDays: 75, to: 'apt_mold', text: 'Kondenswasser an den undichten Fenstern hat Schimmel verursacht.' }, satisfactionPenalty: 2, winterPenalty: 3, energyLoss: 0.06, hiddenChance: 0.2 }),
    // --- Heizung
    d({ id: 'heating_fault', label: 'Heizungsstörung', scope: 'component', component: 'heating', severity: 2, repairCost: euro(680), trade: 'heating', repairDays: 1, description: 'Der Brenner geht sporadisch auf Störung. Einige Wohnungen bleiben kühl.', escalation: { afterDays: 18, to: 'heating_failure', text: 'Die ungelöste Störung hat zum Totalausfall der Heizung geführt.' }, buildingWide: true, satisfactionPenalty: 2, winterPenalty: 6, energyLoss: 0.08, hiddenChance: 0.05 }),
    d({ id: 'heating_failure', label: 'Heizungsausfall', scope: 'component', component: 'heating', severity: 3, repairCost: euro(2600), trade: 'heating', repairDays: 2, description: 'Die Heizung ist komplett ausgefallen. Kein Warmwasser, keine Wärme.', buildingWide: true, satisfactionPenalty: 8, winterPenalty: 26, rentReduction: 0.25, hiddenChance: 0 }),
    d({ id: 'heating_inefficient', label: 'Heizung schlecht eingestellt', scope: 'component', component: 'heating', severity: 1, repairCost: euro(320), trade: 'heating', repairDays: 1, description: 'Verrußter Brenner und falsche Heizkurve treiben den Verbrauch.', energyLoss: 0.1, satisfactionPenalty: 0, hiddenChance: 0.8 }),
    // --- Leitungen
    d({ id: 'pipe_corrosion', label: 'Korrodierte Wasserleitung', scope: 'component', component: 'pipes', severity: 1, repairCost: euro(650), trade: 'plumbing', repairDays: 2, description: 'Erste Warnzeichen: bräunliches Wasser, feuchte Stelle am Steigstrang.', escalation: { afterDays: 60, to: 'pipe_burst', text: 'Die korrodierte Leitung ist geplatzt.' }, satisfactionPenalty: 1, hiddenChance: 0.55 }),
    d({ id: 'pipe_burst', label: 'Rohrbruch', scope: 'component', component: 'pipes', severity: 3, repairCost: euro(3900), trade: 'plumbing', repairDays: 3, description: 'Ein Rohr ist geplatzt. Wasser läuft in die Decke.', buildingWide: true, satisfactionPenalty: 5, insurable: true, hiddenChance: 0 }),
    // --- Elektrik
    d({ id: 'electrical_fault', label: 'Sicherungen lösen aus', scope: 'component', component: 'electrical', severity: 1, repairCost: euro(380), trade: 'electric', repairDays: 1, description: 'Im Hausflur und Keller fallen regelmäßig Sicherungen.', escalation: { afterDays: 50, to: 'electrical_hazard', text: 'Aus dem harmlosen Fehler ist ein gefährlicher Mangel geworden.' }, satisfactionPenalty: 2, hiddenChance: 0.2, safety: 5 }),
    d({ id: 'electrical_hazard', label: 'Gefährlicher Elektromangel', scope: 'component', component: 'electrical', severity: 3, repairCost: euro(2300), trade: 'electric', repairDays: 2, description: 'Verschmorte Klemme im Verteiler. Brandgefahr!', buildingWide: true, satisfactionPenalty: 6, hiddenChance: 0.1, safety: 30, insurable: false }),
    // --- Sanitär
    d({ id: 'sanitary_clog', label: 'Fallrohr verstopft', scope: 'component', component: 'sanitary', severity: 1, repairCost: euro(420), trade: 'plumbing', repairDays: 1, description: 'Das Abwasser läuft im Strang langsam ab.', escalation: { afterDays: 21, to: 'sanitary_backflow', text: 'Die Verstopfung hat einen Rückstau im Keller ausgelöst.' }, satisfactionPenalty: 2, hiddenChance: 0.2 }),
    d({ id: 'sanitary_backflow', label: 'Abwasser-Rückstau', scope: 'component', component: 'sanitary', severity: 2, repairCost: euro(1900), trade: 'plumbing', repairDays: 2, description: 'Abwasser steht im Keller. Es riecht im ganzen Haus.', buildingWide: true, satisfactionPenalty: 7, hiddenChance: 0, rentReduction: 0.05 }),
    // --- Treppenhaus
    d({ id: 'stairwell_wear', label: 'Abgenutztes Treppenhaus', scope: 'component', component: 'stairwell', severity: 1, repairCost: euro(1250), trade: 'painting', repairDays: 3, description: 'Abgestoßene Wände, ausgetretene Stufenkanten, verblasster Anstrich.', satisfactionPenalty: 2, hiddenChance: 0 }),
    d({ id: 'stairwell_light', label: 'Treppenhausbeleuchtung defekt', scope: 'component', component: 'stairwell', severity: 1, repairCost: euro(190), trade: 'electric', repairDays: 1, description: 'Mehrere Lampen und der Zeitschalter funktionieren nicht.', satisfactionPenalty: 3, hiddenChance: 0, safety: 8 }),
    d({ id: 'door_lock', label: 'Haustür schließt nicht', scope: 'component', component: 'stairwell', severity: 1, repairCost: euro(340), trade: 'general', repairDays: 1, description: 'Der Türschließer ist defekt, die Haustür bleibt offen stehen.', satisfactionPenalty: 3, hiddenChance: 0, safety: 10 }),
    // --- Keller
    d({ id: 'basement_moisture', label: 'Feuchter Keller', scope: 'component', component: 'basement', severity: 1, repairCost: euro(950), trade: 'general', repairDays: 2, description: 'Muffiger Geruch, feuchte Wände in den Kellerabteilen.', escalation: { afterDays: 100, to: 'basement_mold', text: 'Im feuchten Keller hat sich Schimmel ausgebreitet.' }, satisfactionPenalty: 1, hiddenChance: 0.35 }),
    d({ id: 'basement_mold', label: 'Schimmel im Keller', scope: 'component', component: 'basement', severity: 2, repairCost: euro(3400), trade: 'general', repairDays: 5, description: 'Großflächiger Schimmel. Mieter beklagen verdorbene Lagergüter.', satisfactionPenalty: 4, hiddenChance: 0 }),
    // --- Außen
    d({ id: 'outdoor_waste', label: 'Verwahrloster Müllplatz', scope: 'component', component: 'outdoor', severity: 1, repairCost: euro(260), trade: 'garden', repairDays: 1, description: 'Überquellende Tonnen, Sperrmüll im Hof.', escalation: { afterDays: 30, to: 'pests', text: 'Der verwahrloste Müllplatz hat Ratten angelockt.' }, satisfactionPenalty: 3, hiddenChance: 0, diyFixable: true }),
    d({ id: 'pests', label: 'Ungeziefer im Hof', scope: 'component', component: 'outdoor', severity: 2, repairCost: euro(780), trade: 'garden', repairDays: 2, description: 'Ratten wurden im Hof und im Keller gesichtet.', buildingWide: true, satisfactionPenalty: 7, hiddenChance: 0 }),
    d({ id: 'outdoor_damage', label: 'Beschädigter Zuweg', scope: 'component', component: 'outdoor', severity: 1, repairCost: euro(720), trade: 'general', repairDays: 2, description: 'Gehwegplatten haben sich gehoben, der Zaun ist schief.', satisfactionPenalty: 1, hiddenChance: 0, safety: 4 }),
    d({ id: 'storm_debris', label: 'Sturmschäden im Außenbereich', scope: 'component', component: 'outdoor', severity: 1, repairCost: euro(540), trade: 'garden', repairDays: 1, description: 'Abgebrochene Äste und umgestürzte Mülltonnen.', satisfactionPenalty: 2, hiddenChance: 0, insurable: true }),
    // --- Wohnungen
    d({ id: 'apt_faucet', label: 'Tropfender Wasserhahn', scope: 'apartment', area: 'bath', severity: 1, repairCost: euro(130), trade: 'plumbing', repairDays: 1, description: 'Der Wasserhahn tropft unaufhörlich.', satisfactionPenalty: 2, hiddenChance: 0.3, diyFixable: true }),
    d({ id: 'apt_drain', label: 'Abfluss verstopft', scope: 'apartment', area: 'kitchen', severity: 1, repairCost: euro(160), trade: 'plumbing', repairDays: 1, description: 'Spüle läuft kaum noch ab.', satisfactionPenalty: 3, hiddenChance: 0.1, diyFixable: true }),
    d({ id: 'apt_appliance', label: 'Herd defekt', scope: 'apartment', area: 'kitchen', severity: 1, repairCost: euro(480), trade: 'electric', repairDays: 1, description: 'Zwei Kochplatten funktionieren nicht mehr.', satisfactionPenalty: 4, hiddenChance: 0 }),
    d({ id: 'apt_door', label: 'Wohnungstür klemmt', scope: 'apartment', area: 'general', severity: 1, repairCost: euro(230), trade: 'general', repairDays: 1, description: 'Die Tür schließt schwer, das Schloss hakt.', satisfactionPenalty: 2, hiddenChance: 0.2, diyFixable: true, safety: 3 }),
    d({ id: 'apt_mold', label: 'Schimmel in der Wohnung', scope: 'apartment', area: 'general', severity: 2, repairCost: euro(1700), trade: 'painting', repairDays: 4, description: 'Schwarze Flecken in Ecken und hinter Möbeln.', escalation: { afterDays: 90, to: 'apt_mold_severe', text: 'Der Schimmelbefall hat sich massiv ausgebreitet.' }, satisfactionPenalty: 9, rentReduction: 0.1, hiddenChance: 0.25 }),
    d({ id: 'apt_mold_severe', label: 'Starker Schimmelbefall', scope: 'apartment', area: 'general', severity: 3, repairCost: euro(4400), trade: 'general', repairDays: 8, description: 'Gesundheitsgefährdender Befall. Teile der Wohnung sind nicht nutzbar.', satisfactionPenalty: 18, rentReduction: 0.3, hiddenChance: 0 }),
    d({ id: 'apt_heater', label: 'Heizkörper wird nicht warm', scope: 'apartment', area: 'heating', severity: 1, repairCost: euro(290), trade: 'heating', repairDays: 1, description: 'Ventil klemmt oder Luft im System.', satisfactionPenalty: 1, winterPenalty: 7, hiddenChance: 0.2, diyFixable: true, rentReduction: 0 }),
    d({ id: 'apt_window', label: 'Fenster schließt nicht', scope: 'apartment', area: 'windows', severity: 1, repairCost: euro(270), trade: 'general', repairDays: 1, description: 'Ein Fensterflügel hat sich verzogen.', satisfactionPenalty: 2, winterPenalty: 3, energyLoss: 0.01, hiddenChance: 0.1 }),
    d({ id: 'apt_water_damage', label: 'Wasserschaden', scope: 'apartment', area: 'general', severity: 3, repairCost: euro(5400), trade: 'general', repairDays: 9, description: 'Durchnässte Decke und Wände. Trocknung und Sanierung nötig.', satisfactionPenalty: 20, uninhabitable: true, rentReduction: 1, insurable: true, hiddenChance: 0 }),
    d({ id: 'apt_socket', label: 'Steckdosen ohne Funktion', scope: 'apartment', area: 'electric', severity: 1, repairCost: euro(170), trade: 'electric', repairDays: 1, description: 'Ein Stromkreis in der Wohnung ist tot.', satisfactionPenalty: 3, hiddenChance: 0, safety: 4 }),
    d({ id: 'apt_tiles', label: 'Silikonfugen undicht', scope: 'apartment', area: 'bath', severity: 1, repairCost: euro(310), trade: 'plumbing', repairDays: 1, description: 'An der Dusche dringt Wasser hinter die Fliesen.', escalation: { afterDays: 100, to: 'apt_mold', text: 'Hinter den undichten Fugen hat sich Schimmel gebildet.' }, satisfactionPenalty: 1, hiddenChance: 0.5, diyFixable: true }),
  ].map((t) => [t.id, t]),
);

export const APARTMENT_DEFECT_POOL: { id: string; weight: number; area: ApartmentArea }[] = [
  { id: 'apt_faucet', weight: 4, area: 'bath' },
  { id: 'apt_drain', weight: 3, area: 'kitchen' },
  { id: 'apt_appliance', weight: 2, area: 'kitchen' },
  { id: 'apt_door', weight: 2, area: 'general' },
  { id: 'apt_heater', weight: 3, area: 'heating' },
  { id: 'apt_window', weight: 2, area: 'windows' },
  { id: 'apt_socket', weight: 2, area: 'electric' },
  { id: 'apt_tiles', weight: 3, area: 'bath' },
  { id: 'apt_mold', weight: 1, area: 'general' },
];

/** Entstehende Schäden je Bauteil (bei Verschleiß). Gewichtet. */
export const COMPONENT_DEFECT_POOL: Record<ComponentKey, { id: string; weight: number; minSeverityCondition?: number }[]> = {
  roof: [{ id: 'roof_tiles', weight: 3 }, { id: 'roof_leak', weight: 1, minSeverityCondition: 35 }],
  facade: [{ id: 'facade_cracks', weight: 3 }, { id: 'facade_moisture', weight: 1, minSeverityCondition: 35 }],
  windows: [{ id: 'window_draft', weight: 1 }],
  pipes: [{ id: 'pipe_corrosion', weight: 4 }, { id: 'pipe_burst', weight: 1, minSeverityCondition: 30 }],
  electrical: [{ id: 'electrical_fault', weight: 4 }, { id: 'electrical_hazard', weight: 1, minSeverityCondition: 25 }],
  heating: [{ id: 'heating_inefficient', weight: 2 }, { id: 'heating_fault', weight: 3 }, { id: 'heating_failure', weight: 1, minSeverityCondition: 30 }],
  sanitary: [{ id: 'sanitary_clog', weight: 3 }, { id: 'sanitary_backflow', weight: 1, minSeverityCondition: 30 }],
  stairwell: [{ id: 'stairwell_wear', weight: 2 }, { id: 'stairwell_light', weight: 2 }, { id: 'door_lock', weight: 2 }],
  basement: [{ id: 'basement_moisture', weight: 3 }, { id: 'basement_mold', weight: 1, minSeverityCondition: 30 }],
  outdoor: [{ id: 'outdoor_waste', weight: 3 }, { id: 'outdoor_damage', weight: 2 }],
};

export const SEVERITY_LABEL = ['', 'gering', 'erheblich', 'kritisch'];
