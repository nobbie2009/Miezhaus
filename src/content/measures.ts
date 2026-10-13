import type { Apartment, GameState, HeatingSystem, Trade } from '@/domain/schema';
import { euro } from '@/utils/money';
import { clamp } from '@/utils/misc';

/**
 * Renovierungs- und Modernisierungsmaßnahmen. Jede Maßnahme verändert konkrete Spielwerte.
 * Kosten sind Basiswerte und werden vom Materialpreisindex und Dienstleister beeinflusst.
 */
export type MeasureScope = 'apartment' | 'building';
export type MeasureCategory = 'renovation' | 'energy' | 'comfort' | 'safety' | 'technical';

export interface MeasureDef {
  id: string;
  label: string;
  description: string;
  scope: MeasureScope;
  category: MeasureCategory;
  trade: Trade;
  unlockPhase: number;
  baseCost: (s: GameState, apt?: Apartment) => number;
  days: (s: GameState, apt?: Apartment) => number;
  noise: 0 | 1 | 2 | 3;
  /** Wohnung muss leer stehen. */
  requiresVacant?: boolean;
  /** Wohnung ist während der Arbeiten nicht vermietbar / nicht nutzbar. */
  blocksApartment?: boolean;
  /** Zählt als Modernisierung (Modernisierungsumlage möglich). Anteil der Kosten. */
  modernizationShare: number;
  /** Förderfähig bei aktivem Förderprogramm. */
  subsidyEligible?: boolean;
  /** Unsicherheit der Kostenschätzung (± Anteil). */
  uncertainty: number;
  materials: string[];
  effects: string[];
  /** Gibt einen Grund zurück, warum die Maßnahme nicht möglich ist, sonst null. */
  unavailable: (s: GameState, apt?: Apartment) => string | null;
  apply: (s: GameState, apt?: Apartment) => void;
}

const has = (s: GameState, a: string) => s.building.amenities.includes(a);
const addAmenity = (s: GameState, a: string) => {
  if (!has(s, a)) s.building.amenities.push(a);
};
const totalArea = (s: GameState) => s.apartments.reduce((a, b) => a + b.area, 0);
const footprint = (s: GameState) => totalArea(s) / Math.max(1, s.building.floors) * 1.15;
const comp = (s: GameState, k: keyof GameState['building']['components']) => s.building.components[k]!;

const heatingMeasure = (id: string, system: HeatingSystem, label: string, cost: number, description: string, phase: number): MeasureDef => ({
  id,
  label,
  description,
  scope: 'building',
  category: 'energy',
  trade: 'heating',
  unlockPhase: phase,
  baseCost: () => cost,
  days: () => (system === 'heat_pump' ? 12 : 7),
  noise: 1,
  modernizationShare: system === 'gas_condensing' ? 0.5 : 0.8,
  subsidyEligible: system !== 'gas_condensing',
  uncertainty: 0.12,
  materials: ['Wärmeerzeuger', 'Pumpengruppe', 'Abgas-/Hydraulikanbindung'],
  effects: ['Neue Heizungsanlage (Zustand 100 %)', 'Deutlich geringere Heizkosten', 'Während des Umbaus keine Wärme – im Winter Unmut'],
  unavailable: (s) => (s.building.heatingSystem === system ? 'Diese Anlage ist bereits installiert.' : null),
  apply: (s) => {
    s.building.heatingSystem = system;
    const h = comp(s, 'heating');
    h.condition = 100;
    h.tier = system === 'gas_condensing' ? 4 : 5;
    h.installedYear = new Date(s.day * 86400000).getUTCFullYear();
    h.lastRenewalDay = s.day;
    h.lastMaintenanceDay = s.day;
  },
});

export const MEASURES: MeasureDef[] = [
  // ---------- Wohnungen
  {
    id: 'apt_paint',
    label: 'Wände streichen',
    description: 'Malerarbeiten in allen Räumen. Frischer Eindruck, schnell und günstig.',
    scope: 'apartment',
    category: 'renovation',
    trade: 'painting',
    unlockPhase: 1,
    baseCost: (_s, a) => euro(19) * (a?.area ?? 60),
    days: (_s, a) => Math.ceil((a?.area ?? 60) / 22),
    noise: 1,
    blocksApartment: false,
    modernizationShare: 0,
    uncertainty: 0.08,
    materials: ['Dispersionsfarbe', 'Abdeckmaterial', 'Spachtelmasse'],
    effects: ['Wohnungszustand +22 (max. 88)', 'Attraktivität steigt'],
    unavailable: (_s, a) => (a && a.condition >= 88 ? 'Die Wände sind in sehr gutem Zustand.' : null),
    apply: (_s, a) => {
      if (a) a.condition = Math.max(a.condition, Math.min(88, a.condition + 22));
    },
  },
  {
    id: 'apt_floor',
    label: 'Böden erneuern',
    description: 'Neues Vinyl- oder Parkettboden in Wohn- und Schlafräumen.',
    scope: 'apartment',
    category: 'renovation',
    trade: 'general',
    unlockPhase: 1,
    baseCost: (_s, a) => euro(58) * (a?.area ?? 60),
    days: (_s, a) => Math.ceil((a?.area ?? 60) / 14),
    noise: 2,
    requiresVacant: true,
    blocksApartment: true,
    modernizationShare: 0,
    uncertainty: 0.12,
    materials: ['Bodenbelag', 'Trittschalldämmung', 'Sockelleisten'],
    effects: ['Bodenbeläge +1 Stufe', 'Wohnungszustand +10'],
    unavailable: (_s, a) => (a && a.flooring >= 3 ? 'Die Böden sind bereits modern.' : null),
    apply: (_s, a) => {
      if (!a) return;
      a.flooring = Math.min(3, a.flooring + 1);
      a.condition = clamp(a.condition + 10);
    },
  },
  {
    id: 'apt_kitchen',
    label: 'Küche erneuern',
    description: 'Neue Einbauküche mit energieeffizienten Geräten.',
    scope: 'apartment',
    category: 'comfort',
    trade: 'general',
    unlockPhase: 1,
    baseCost: (_s, a) => euro(5200) + euro(25) * (a?.area ?? 60),
    days: () => 5,
    noise: 1,
    blocksApartment: true,
    modernizationShare: 0.3,
    uncertainty: 0.1,
    materials: ['Küchenzeile', 'Elektrogeräte', 'Arbeitsplatte'],
    effects: ['Küche auf Stufe „modern“', 'Höhere Vergleichsmiete'],
    unavailable: (_s, a) => (a && a.kitchen >= 3 ? 'Die Küche ist bereits modern.' : null),
    apply: (_s, a) => {
      if (a) a.kitchen = 3;
    },
  },
  {
    id: 'apt_bath',
    label: 'Bad modernisieren',
    description: 'Neue Sanitärobjekte, Fliesen, bodengleiche Dusche.',
    scope: 'apartment',
    category: 'comfort',
    trade: 'plumbing',
    unlockPhase: 1,
    baseCost: () => euro(10400),
    days: () => 14,
    noise: 3,
    requiresVacant: true,
    blocksApartment: true,
    modernizationShare: 0.35,
    uncertainty: 0.18,
    materials: ['Fliesen', 'Sanitärkeramik', 'Armaturen', 'Abdichtung'],
    effects: ['Bad auf Stufe „modern“', 'Weniger Schäden im Bad', 'Höhere Vergleichsmiete'],
    unavailable: (_s, a) => (a && a.bath >= 3 ? 'Das Bad ist bereits modern.' : null),
    apply: (_s, a) => {
      if (!a) return;
      a.bath = 3;
      a.condition = clamp(a.condition + 6);
    },
  },
  {
    id: 'apt_full',
    label: 'Komplettsanierung der Wohnung',
    description: 'Böden, Wände, Küche, Bad und Elektrik – die Wohnung ist danach wie neu.',
    scope: 'apartment',
    category: 'renovation',
    trade: 'general',
    unlockPhase: 1,
    baseCost: (_s, a) => euro(560) * (a?.area ?? 60),
    days: (_s, a) => 30 + Math.ceil((a?.area ?? 60) / 6),
    noise: 3,
    requiresVacant: true,
    blocksApartment: true,
    modernizationShare: 0.4,
    uncertainty: 0.22,
    materials: ['Komplettpaket Innenausbau', 'Elektro-Unterverteilung', 'Sanitär', 'Bodenbeläge'],
    effects: ['Zustand 97 %', 'Küche, Bad, Böden modern', 'Deutlich höhere Vergleichsmiete', 'Viele Interessenten'],
    unavailable: (_s, a) => (a && a.condition > 90 && a.kitchen >= 3 && a.bath >= 3 && a.flooring >= 3 ? 'Die Wohnung ist bereits komplett saniert.' : null),
    apply: (_s, a) => {
      if (!a) return;
      a.condition = 97;
      a.kitchen = 3;
      a.bath = 3;
      a.flooring = 3;
    },
  },
  {
    id: 'apt_thermostat',
    label: 'Smarte Thermostate',
    description: 'Programmierbare Heizkörperthermostate senken den Verbrauch der Wohnung.',
    scope: 'apartment',
    category: 'energy',
    trade: 'heating',
    unlockPhase: 2,
    baseCost: (_s, a) => euro(90) * Math.ceil(a?.rooms ?? 3) + euro(120),
    days: () => 1,
    noise: 0,
    modernizationShare: 0.6,
    subsidyEligible: true,
    uncertainty: 0.05,
    materials: ['Funk-Thermostate', 'Gateway'],
    effects: ['Heizenergie der Wohnung −8 %', 'Umweltbewusste Mieter freuen sich'],
    unavailable: (_s, a) => (a?.smartThermostat ? 'Bereits installiert.' : null),
    apply: (_s, a) => {
      if (a) a.smartThermostat = true;
    },
  },
  // ---------- Gebäude: Komfort & Gemeinschaft
  {
    id: 'stairwell_upgrade',
    label: 'Treppenhaus aufwerten',
    description: 'Neuer Anstrich, Bodenbelag, Briefkastenanlage und Beleuchtung.',
    scope: 'building',
    category: 'comfort',
    trade: 'painting',
    unlockPhase: 1,
    baseCost: (s) => euro(5200) + euro(380) * s.apartments.length,
    days: () => 8,
    noise: 2,
    modernizationShare: 0,
    uncertainty: 0.1,
    materials: ['Farbe', 'Treppenbelag', 'Briefkastenanlage', 'LED-Leuchten'],
    effects: ['Treppenhaus Zustand 98 %', 'Bessere Attraktivität des Hauses', 'Zufriedenheit aller Mieter steigt'],
    unavailable: (s) => (comp(s, 'stairwell').condition > 92 ? 'Das Treppenhaus ist in Topzustand.' : null),
    apply: (s) => {
      const c = comp(s, 'stairwell');
      c.condition = 98;
      c.tier = Math.min(5, c.tier + 1);
      c.lastRenewalDay = s.day;
    },
  },
  {
    id: 'outdoor_design',
    label: 'Außenbereich gestalten',
    description: 'Neue Bepflanzung, Sitzbank, eingehauster Müllplatz.',
    scope: 'building',
    category: 'comfort',
    trade: 'garden',
    unlockPhase: 1,
    baseCost: () => euro(7400),
    days: () => 6,
    noise: 1,
    modernizationShare: 0,
    uncertainty: 0.1,
    materials: ['Pflanzen', 'Pflaster', 'Mülltonnenhaus', 'Sitzbank'],
    effects: ['Außenbereich Zustand 95 %, langsamerer Verfall', 'Hof als Treffpunkt (+Gemeinschaft)'],
    unavailable: (s) => (has(s, 'garden') && comp(s, 'outdoor').condition > 85 ? 'Der Außenbereich ist bereits gestaltet.' : null),
    apply: (s) => {
      const c = comp(s, 'outdoor');
      c.condition = 95;
      c.tier = Math.min(5, c.tier + 1);
      s.building.outdoorCare = 95;
      addAmenity(s, 'garden');
    },
  },
  {
    id: 'bike_storage',
    label: 'Fahrradstellplätze schaffen',
    description: 'Überdachte, abschließbare Fahrradbügel im Hof.',
    scope: 'building',
    category: 'comfort',
    trade: 'general',
    unlockPhase: 1,
    baseCost: () => euro(3600),
    days: () => 3,
    noise: 1,
    modernizationShare: 0.5,
    uncertainty: 0.08,
    materials: ['Fahrradbügel', 'Überdachung'],
    effects: ['Neue Ausstattung „Fahrradstellplätze“', 'Wichtig für Studierende und Familien'],
    unavailable: (s) => (has(s, 'bike_storage') ? 'Bereits vorhanden.' : null),
    apply: (s) => addAmenity(s, 'bike_storage'),
  },
  {
    id: 'laundry_room',
    label: 'Waschkeller verbessern',
    description: 'Gemeinschaftswaschküche mit Anschlüssen, Trockenraum und Lüftung.',
    scope: 'building',
    category: 'comfort',
    trade: 'plumbing',
    unlockPhase: 2,
    baseCost: () => euro(6300),
    days: () => 5,
    noise: 1,
    modernizationShare: 0.5,
    uncertainty: 0.12,
    materials: ['Anschlüsse', 'Lüfter', 'Trockengestelle'],
    effects: ['Neue Ausstattung „Waschkeller“', 'Keller Zustand +12'],
    unavailable: (s) => (has(s, 'laundry_room') ? 'Bereits vorhanden.' : null),
    apply: (s) => {
      addAmenity(s, 'laundry_room');
      comp(s, 'basement').condition = clamp(comp(s, 'basement').condition + 12);
    },
  },
  {
    id: 'community_room',
    label: 'Gemeinschaftsraum einrichten',
    description: 'Ehemaliger Trockenboden wird zum Treffpunkt für Hausbewohner.',
    scope: 'building',
    category: 'comfort',
    trade: 'general',
    unlockPhase: 3,
    baseCost: () => euro(14500),
    days: () => 14,
    noise: 2,
    modernizationShare: 0.3,
    uncertainty: 0.15,
    materials: ['Möbel', 'Teeküche', 'Beleuchtung'],
    effects: ['Neue Ausstattung „Gemeinschaftsraum“', 'Gemeinschaftssinn und Zufriedenheit steigen', 'Weniger Nachbarschaftskonflikte'],
    unavailable: (s) => (has(s, 'community_room') ? 'Bereits vorhanden.' : null),
    apply: (s) => addAmenity(s, 'community_room'),
  },
  // ---------- Sicherheit
  {
    id: 'fire_safety',
    label: 'Brandschutz nachrüsten',
    description: 'Rauchwarnmelder in allen Wohnungen, Feuerlöscher, Fluchtwegbeschilderung.',
    scope: 'building',
    category: 'safety',
    trade: 'electric',
    unlockPhase: 1,
    baseCost: (s) => euro(1200) + euro(160) * s.apartments.length,
    days: () => 2,
    noise: 0,
    modernizationShare: 0,
    uncertainty: 0.05,
    materials: ['Rauchwarnmelder', 'Feuerlöscher', 'Schilder'],
    effects: ['Brandschutz +35', 'Sicherheit für alle Mieter'],
    unavailable: (s) => (s.building.fireSafety >= 90 ? 'Der Brandschutz ist auf aktuellem Stand.' : null),
    apply: (s) => {
      s.building.fireSafety = clamp(s.building.fireSafety + 35);
    },
  },
  {
    id: 'security_upgrade',
    label: 'Haustür & Gegensprechanlage',
    description: 'Neue Haustür mit Sicherheitsschloss und Video-Gegensprechanlage.',
    scope: 'building',
    category: 'safety',
    trade: 'electric',
    unlockPhase: 2,
    baseCost: (s) => euro(3800) + euro(260) * s.apartments.length,
    days: () => 3,
    noise: 1,
    modernizationShare: 0.6,
    uncertainty: 0.08,
    materials: ['Haustür', 'Sprechanlage', 'Verkabelung'],
    effects: ['Sicherheit +30', 'Weniger Vandalismus'],
    unavailable: (s) => (s.building.security >= 90 ? 'Die Sicherheit ist bereits hoch.' : null),
    apply: (s) => {
      s.building.security = clamp(s.building.security + 30);
      addAmenity(s, 'intercom');
    },
  },
  // ---------- Technik
  {
    id: 'electrical_renewal',
    label: 'Elektrik erneuern',
    description: 'Neue Steigleitungen, Zählerschrank und FI-Schutzschalter.',
    scope: 'building',
    category: 'technical',
    trade: 'electric',
    unlockPhase: 2,
    baseCost: (s) => euro(9000) + euro(1900) * s.apartments.length,
    days: () => 12,
    noise: 2,
    modernizationShare: 0.3,
    uncertainty: 0.18,
    materials: ['Kabel', 'Zählerschrank', 'FI-Schalter'],
    effects: ['Elektrik Zustand 100 %', 'Kaum noch Ausfälle', 'Brandschutz +10'],
    unavailable: (s) => (comp(s, 'electrical').condition > 90 ? 'Die Elektrik ist neuwertig.' : null),
    apply: (s) => {
      const c = comp(s, 'electrical');
      c.condition = 100;
      c.tier = 4;
      c.lastRenewalDay = s.day;
      s.building.fireSafety = clamp(s.building.fireSafety + 10);
    },
  },
  {
    id: 'pipe_renewal',
    label: 'Strangsanierung',
    description: 'Erneuerung aller Wasser- und Abwasserstränge. Laut und aufwendig, aber nachhaltig.',
    scope: 'building',
    category: 'technical',
    trade: 'plumbing',
    unlockPhase: 3,
    baseCost: (s) => euro(14000) + euro(6200) * s.apartments.length,
    days: () => 35,
    noise: 3,
    modernizationShare: 0.2,
    uncertainty: 0.25,
    materials: ['Edelstahlrohre', 'Abwasserrohre', 'Brandschutzmanschetten'],
    effects: ['Leitungen & Sanitär Zustand 100 %', 'Kein Rohrbruchrisiko mehr', 'Mehrere Wochen Baulärm'],
    unavailable: (s) => (comp(s, 'pipes').condition > 92 && comp(s, 'sanitary').condition > 92 ? 'Die Leitungen sind neuwertig.' : null),
    apply: (s) => {
      for (const k of ['pipes', 'sanitary'] as const) {
        const c = comp(s, k);
        c.condition = 100;
        c.tier = 4;
        c.lastRenewalDay = s.day;
      }
    },
  },
  {
    id: 'basement_seal',
    label: 'Keller abdichten',
    description: 'Horizontalsperre und Außenabdichtung gegen aufsteigende Feuchtigkeit.',
    scope: 'building',
    category: 'technical',
    trade: 'general',
    unlockPhase: 2,
    baseCost: () => euro(17500),
    days: () => 14,
    noise: 2,
    modernizationShare: 0,
    uncertainty: 0.2,
    materials: ['Injektionscreme', 'Bitumendickbeschichtung', 'Drainage'],
    effects: ['Keller Zustand 96 %', 'Feuchte- und Schimmelrisiko stark reduziert'],
    unavailable: (s) => (comp(s, 'basement').condition > 90 ? 'Der Keller ist trocken.' : null),
    apply: (s) => {
      const c = comp(s, 'basement');
      c.condition = 96;
      c.tier = 4;
      c.lastRenewalDay = s.day;
    },
  },
  {
    id: 'roof_renovation',
    label: 'Dach sanieren & dämmen',
    description: 'Neueindeckung mit Aufsparrendämmung. Dicht für Jahrzehnte.',
    scope: 'building',
    category: 'energy',
    trade: 'roofing',
    unlockPhase: 2,
    baseCost: (s) => euro(230) * footprint(s),
    days: () => 24,
    noise: 3,
    modernizationShare: 0.6,
    subsidyEligible: true,
    uncertainty: 0.2,
    materials: ['Dachziegel', 'Dämmung', 'Unterspannbahn', 'Rinnen'],
    effects: ['Dach Zustand 100 %', 'Dämmstufe mindestens 1', 'Weniger Wärmeverlust, kein Sturmschaden-Risiko'],
    unavailable: (s) => (comp(s, 'roof').condition > 92 && s.building.insulationLevel >= 1 ? 'Das Dach ist bereits saniert.' : null),
    apply: (s) => {
      const c = comp(s, 'roof');
      c.condition = 100;
      c.tier = 5;
      c.lastRenewalDay = s.day;
      s.building.insulationLevel = Math.max(s.building.insulationLevel, 1);
    },
  },
  {
    id: 'facade_renewal',
    label: 'Fassade erneuern',
    description: 'Putz ausbessern und neuer Anstrich – ohne Dämmung.',
    scope: 'building',
    category: 'renovation',
    trade: 'painting',
    unlockPhase: 1,
    baseCost: (s) => euro(48) * totalArea(s) * 0.85,
    days: () => 18,
    noise: 2,
    modernizationShare: 0,
    uncertainty: 0.15,
    materials: ['Gerüst', 'Putz', 'Fassadenfarbe'],
    effects: ['Fassade Zustand 94 %', 'Starke Wirkung auf die Attraktivität'],
    unavailable: (s) => (comp(s, 'facade').condition > 90 ? 'Die Fassade ist in sehr gutem Zustand.' : null),
    apply: (s) => {
      const c = comp(s, 'facade');
      c.condition = 94;
      c.lastRenewalDay = s.day;
    },
  },
  {
    id: 'facade_insulation',
    label: 'Fassade dämmen (WDVS)',
    description: 'Wärmedämmverbundsystem mit neuem Oberputz. Die größte Einzelmaßnahme gegen Wärmeverlust.',
    scope: 'building',
    category: 'energy',
    trade: 'general',
    unlockPhase: 3,
    baseCost: (s) => euro(175) * totalArea(s) * 0.85,
    days: () => 40,
    noise: 3,
    modernizationShare: 0.9,
    subsidyEligible: true,
    uncertainty: 0.18,
    materials: ['Gerüst', 'Dämmplatten', 'Armierung', 'Oberputz'],
    effects: ['Dämmstufe +1 (mind. 2)', 'Fassade Zustand 100 %', 'Heizbedarf sinkt um 20–30 %'],
    unavailable: (s) => (s.building.insulationLevel >= 3 ? 'Das Haus ist bereits optimal gedämmt.' : null),
    apply: (s) => {
      s.building.insulationLevel = Math.min(3, Math.max(2, s.building.insulationLevel + 1));
      const c = comp(s, 'facade');
      c.condition = 100;
      c.tier = 5;
      c.lastRenewalDay = s.day;
    },
  },
  {
    id: 'windows_replace',
    label: 'Fenster austauschen',
    description: 'Dreifach verglaste Kunststofffenster in allen Wohnungen.',
    scope: 'building',
    category: 'energy',
    trade: 'general',
    unlockPhase: 2,
    baseCost: (s) => euro(98) * totalArea(s),
    days: (s) => 6 + s.apartments.length * 2,
    noise: 2,
    modernizationShare: 0.85,
    subsidyEligible: true,
    uncertainty: 0.1,
    materials: ['Fensterelemente', 'Anschlussbänder', 'Fensterbänke'],
    effects: ['Fenster Zustand 100 %, Stufe 5', 'Weniger Zugluft und Schimmel', 'Heizbedarf sinkt deutlich'],
    unavailable: (s) => (comp(s, 'windows').tier >= 5 && comp(s, 'windows').condition > 90 ? 'Die Fenster sind neu.' : null),
    apply: (s) => {
      const c = comp(s, 'windows');
      c.condition = 100;
      c.tier = 5;
      c.lastRenewalDay = s.day;
    },
  },
  // ---------- Energie & Betriebskosten
  heatingMeasure('heating_condensing', 'gas_condensing', 'Gas-Brennwertkessel einbauen', euro(26500), 'Moderner Brennwertkessel. Bewährt, vergleichsweise günstig.', 2),
  heatingMeasure('heating_heatpump', 'heat_pump', 'Wärmepumpe installieren', euro(64000), 'Luft-Wasser-Wärmepumpe. Hohe Investition, sehr effizient – am besten mit gedämmter Hülle.', 3),
  heatingMeasure('heating_district', 'district', 'Fernwärme anschließen', euro(31000), 'Anschluss an das städtische Fernwärmenetz. Wenig Wartung, stabile Preise.', 3),
  {
    id: 'hydraulic_balance',
    label: 'Hydraulischer Abgleich',
    description: 'Heizkörper werden optimal mit Wärme versorgt, die Pumpe arbeitet effizient.',
    scope: 'building',
    category: 'energy',
    trade: 'heating',
    unlockPhase: 2,
    baseCost: (s) => euro(900) + euro(260) * s.apartments.length,
    days: () => 3,
    noise: 0,
    modernizationShare: 0.7,
    subsidyEligible: true,
    uncertainty: 0.08,
    materials: ['Voreinstellbare Ventile'],
    effects: ['Heizenergie −7 %', 'Gleichmäßige Wärme in allen Wohnungen'],
    unavailable: (s) => (has(s, 'hydraulic_balancing') ? 'Bereits durchgeführt.' : null),
    apply: (s) => addAmenity(s, 'hydraulic_balancing'),
  },
  {
    id: 'efficient_pumps',
    label: 'Hocheffizienzpumpen',
    description: 'Tausch der alten Heizungs- und Zirkulationspumpen.',
    scope: 'building',
    category: 'energy',
    trade: 'heating',
    unlockPhase: 2,
    baseCost: () => euro(1450),
    days: () => 1,
    noise: 0,
    modernizationShare: 0.5,
    uncertainty: 0.05,
    materials: ['Hocheffizienzpumpen'],
    effects: ['Allgemeinstrom −25 %'],
    unavailable: (s) => (has(s, 'efficient_pumps') ? 'Bereits installiert.' : null),
    apply: (s) => addAmenity(s, 'efficient_pumps'),
  },
  {
    id: 'led_lighting',
    label: 'LED-Beleuchtung & Bewegungsmelder',
    description: 'Sparsame Beleuchtung in Treppenhaus, Keller und Außenbereich.',
    scope: 'building',
    category: 'energy',
    trade: 'electric',
    unlockPhase: 1,
    baseCost: (s) => euro(900) + euro(110) * s.apartments.length,
    days: () => 2,
    noise: 0,
    modernizationShare: 0.5,
    uncertainty: 0.05,
    materials: ['LED-Leuchten', 'Bewegungsmelder'],
    effects: ['Allgemeinstrom −35 %', 'Sicherheit +5'],
    unavailable: (s) => (has(s, 'led_lighting') ? 'Bereits installiert.' : null),
    apply: (s) => {
      addAmenity(s, 'led_lighting');
      s.building.security = clamp(s.building.security + 5);
    },
  },
  {
    id: 'waste_sorting',
    label: 'Mülltrennung verbessern',
    description: 'Wertstoffinseln, Biotonne und Infotafeln. Weniger Restmüll, geringere Gebühren.',
    scope: 'building',
    category: 'energy',
    trade: 'garden',
    unlockPhase: 2,
    baseCost: () => euro(1600),
    days: () => 1,
    noise: 0,
    modernizationShare: 0,
    uncertainty: 0.05,
    materials: ['Behälter', 'Beschilderung'],
    effects: ['Müllgebühren −15 %', 'Außenbereich verwahrlost langsamer'],
    unavailable: (s) => (has(s, 'waste_sorting') ? 'Bereits umgesetzt.' : null),
    apply: (s) => addAmenity(s, 'waste_sorting'),
  },
  {
    id: 'rainwater',
    label: 'Regenwassernutzung',
    description: 'Zisterne für Gartenbewässerung und Toilettenspülung im Erdgeschoss.',
    scope: 'building',
    category: 'energy',
    trade: 'plumbing',
    unlockPhase: 3,
    baseCost: () => euro(7900),
    days: () => 6,
    noise: 2,
    modernizationShare: 0.5,
    subsidyEligible: true,
    uncertainty: 0.15,
    materials: ['Zisterne', 'Pumpe', 'Leitungen'],
    effects: ['Wasserverbrauch −9 %', 'Nachhaltigkeit steigt'],
    unavailable: (s) => (has(s, 'rainwater') ? 'Bereits vorhanden.' : null),
    apply: (s) => addAmenity(s, 'rainwater'),
  },
  {
    id: 'solar_pv',
    label: 'Photovoltaikanlage',
    description: 'Solaranlage mit ca. 24 kWp auf dem Dach. Deckt Allgemeinstrom, Überschuss wird eingespeist.',
    scope: 'building',
    category: 'energy',
    trade: 'electric',
    unlockPhase: 4,
    baseCost: () => euro(33500),
    days: () => 6,
    noise: 1,
    modernizationShare: 0,
    subsidyEligible: true,
    uncertainty: 0.1,
    materials: ['Module', 'Wechselrichter', 'Unterkonstruktion'],
    effects: ['Solarstrom für Allgemeinflächen (und Wärmepumpe)', 'Einspeisevergütung als Einnahme'],
    unavailable: (s) => (has(s, 'solar') ? 'Bereits installiert.' : comp(s, 'roof').condition < 60 ? 'Das Dach muss zuerst saniert werden (Zustand mind. 60 %).' : null),
    apply: (s) => addAmenity(s, 'solar'),
  },
  {
    id: 'green_roof',
    label: 'Begrünung von Hof und Garagendach',
    description: 'Extensive Begrünung, Insektenhotel, Hochbeete für Bewohner.',
    scope: 'building',
    category: 'energy',
    trade: 'garden',
    unlockPhase: 4,
    baseCost: () => euro(12800),
    days: () => 8,
    noise: 1,
    modernizationShare: 0.2,
    subsidyEligible: true,
    uncertainty: 0.12,
    materials: ['Substrat', 'Pflanzen', 'Hochbeete'],
    effects: ['Hitzeschutz im Sommer', 'Zufriedenheit umweltbewusster Mieter steigt', 'Attraktivität +'],
    unavailable: (s) => (has(s, 'greening') ? 'Bereits umgesetzt.' : null),
    apply: (s) => addAmenity(s, 'greening'),
  },
];

export const MEASURE_BY_ID: Record<string, MeasureDef> = Object.fromEntries(MEASURES.map((m) => [m.id, m]));

export const AMENITY_LABEL: Record<string, string> = {
  bike_storage: 'Fahrradstellplätze',
  laundry_room: 'Waschkeller',
  community_room: 'Gemeinschaftsraum',
  garden: 'Gestalteter Garten',
  hydraulic_balancing: 'Hydraulischer Abgleich',
  efficient_pumps: 'Hocheffizienzpumpen',
  led_lighting: 'LED-Beleuchtung',
  waste_sorting: 'Mülltrennung',
  rainwater: 'Regenwassernutzung',
  solar: 'Photovoltaik',
  greening: 'Begrünung',
  intercom: 'Gegensprechanlage',
  elevator: 'Aufzug',
};

export const CATEGORY_LABEL: Record<MeasureCategory, string> = {
  renovation: 'Renovierung',
  energy: 'Energie & Nachhaltigkeit',
  comfort: 'Komfort & Gemeinschaft',
  safety: 'Sicherheit',
  technical: 'Haustechnik',
};
