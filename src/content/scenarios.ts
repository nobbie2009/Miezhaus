import type { ComponentKey, GameMode, HeatingSystem, Services } from '@/domain/schema';
import { euro } from '@/utils/money';

export interface TenantSpec {
  archetype?: string;
  yearsAgo: number;
  /** Miete relativ zur Vergleichsmiete. */
  rentFactor: number;
  satisfaction?: number;
  /** Offene Rückstände in Monatsmieten (z. B. 1.5). */
  arrearsMonths?: number;
  stress?: number;
  reliability?: number;
  moveOutTendency?: number;
}

export interface AptSpec {
  area: number;
  rooms: number;
  balcony?: boolean;
  kitchen: number;
  bath: number;
  flooring: number;
  condition: number;
  smartThermostat?: boolean;
  status?: 'vacant_ready' | 'vacant_needs_renovation';
  tenant?: TenantSpec;
  defects?: { type: string; discovered: boolean }[];
}

export interface ScenarioDef {
  id: string;
  mode: GameMode;
  title: string;
  subtitle: string;
  description: string;
  difficultyLabel: 'Einsteiger' | 'Mittel' | 'Schwer' | 'Experte';
  start: { year: number; month: number };
  durationMonths: number | null;
  startCash: number;
  overdraftLimit: number;
  building: {
    name: string;
    address: string;
    city: string;
    yearBuilt: number;
    landValue: number;
    buildingClass: string;
    heatingSystem: HeatingSystem;
    heatingYear: number;
    insulationLevel: number;
    windowTier: number;
    cleanliness: number;
    outdoorCare: number;
    fireSafety: number;
    security: number;
    amenities?: string[];
  };
  components: Record<ComponentKey, number>;
  /** Pro Etage eine Liste von Wohnungen (Etage 0 = EG). */
  floors: AptSpec[][];
  componentDefects?: { key: ComponentKey; type: string; discovered: boolean }[];
  loans: { name: string; remaining: number; rate: number; yearsLeft: number; principal: number }[];
  services: Services;
  market: { baseRentPerSqm: number; energyPriceIndex: number; interestRate: number; energyTrend?: number };
  goals: string[];
  winGoals?: string[];
  startPhase?: number;
  utilityPerSqm?: number;
  intro: string[];
}

const SERVICES_BASIC: Services = { cleaning: 'tenants', garden: 'none', caretaker: 'none', management: 'self', insurance: 'basic', maintenancePlan: false, winterService: false };

/** Das Startgebäude aus der Spielbeschreibung: Lindenstraße 14, 10 Wohnungen. */
const LINDEN_FLOORS: AptSpec[][] = [
  [
    { area: 58, rooms: 2, kitchen: 1, bath: 1, flooring: 1, condition: 57, tenant: { archetype: 'quiet_longterm', yearsAgo: 14, rentFactor: 0.8, satisfaction: 84, reliability: 96 } },
    { area: 72, rooms: 3, balcony: true, kitchen: 1, bath: 0, flooring: 1, condition: 50, tenant: { archetype: 'temp_financial', yearsAgo: 3, rentFactor: 0.92, satisfaction: 55, arrearsMonths: 1.6, stress: 68, reliability: 62 } },
  ],
  [
    { area: 64, rooms: 2.5, balcony: true, kitchen: 1, bath: 1, flooring: 1, condition: 63, tenant: { archetype: 'busy_professional', yearsAgo: 3, rentFactor: 0.97, satisfaction: 63 } },
    { area: 78, rooms: 3, balcony: true, kitchen: 1, bath: 1, flooring: 1, condition: 58, tenant: { archetype: 'young_family', yearsAgo: 5, rentFactor: 0.9, satisfaction: 58 }, defects: [{ type: 'apt_mold', discovered: true }] },
  ],
  [
    { area: 64, rooms: 2.5, balcony: true, kitchen: 3, bath: 3, flooring: 3, condition: 93, smartThermostat: true, tenant: { archetype: 'demanding', yearsAgo: 1, rentFactor: 1.02, satisfaction: 74 } },
    { area: 78, rooms: 3, balcony: true, kitchen: 1, bath: 1, flooring: 2, condition: 61, tenant: { archetype: 'helpful_neighbor', yearsAgo: 9, rentFactor: 0.87, satisfaction: 76 } },
  ],
  [
    { area: 64, rooms: 2.5, balcony: true, kitchen: 0, bath: 0, flooring: 0, condition: 34, status: 'vacant_needs_renovation' },
    { area: 78, rooms: 3, balcony: true, kitchen: 2, bath: 1, flooring: 2, condition: 67, status: 'vacant_ready' },
  ],
  [
    { area: 52, rooms: 2, kitchen: 1, bath: 1, flooring: 1, condition: 64, tenant: { archetype: 'student', yearsAgo: 2, rentFactor: 0.95, satisfaction: 66 } },
    { area: 56, rooms: 2, kitchen: 1, bath: 1, flooring: 1, condition: 60, tenant: { archetype: 'frequent_caller', yearsAgo: 4, rentFactor: 0.93, satisfaction: 61 }, defects: [{ type: 'apt_faucet', discovered: false }] },
  ],
];

const LINDEN = {
  name: 'Lindenstraße 14',
  address: 'Lindenstraße 14',
  city: 'Altstadt-Nord',
  yearBuilt: 1961,
  landValue: euro(185000),
  buildingClass: 'Mehrfamilienhaus, Nachkriegsbau (Klasse M2)',
  heatingSystem: 'gas_old' as HeatingSystem,
  heatingYear: 1999,
  insulationLevel: 0,
  windowTier: 2,
  cleanliness: 55,
  outdoorCare: 50,
  fireSafety: 52,
  security: 55,
};

const LINDEN_COMPONENTS: Record<ComponentKey, number> = { roof: 52, facade: 58, windows: 50, pipes: 56, electrical: 61, heating: 45, sanitary: 59, stairwell: 46, basement: 56, outdoor: 52 };

/** Hilfsfunktion für generische Häuser. */
function floorsOf(n: number, perFloor: number, base: Omit<AptSpec, 'area' | 'rooms'>, areas: number[], rooms: number[]): AptSpec[][] {
  const out: AptSpec[][] = [];
  for (let f = 0; f < n; f++) {
    const row: AptSpec[] = [];
    for (let p = 0; p < perFloor; p++) row.push({ ...base, area: areas[p % areas.length], rooms: rooms[p % rooms.length] });
    out.push(row);
  }
  return out;
}

const T = (archetype: string | undefined, yearsAgo: number, rentFactor: number, extra: Partial<TenantSpec> = {}): TenantSpec => ({ archetype, yearsAgo, rentFactor, ...extra });

export const SCENARIOS: ScenarioDef[] = [
  {
    id: 'endless_linden',
    mode: 'endless',
    title: 'Lindenstraße 14',
    subtitle: 'Endlosmodus – das klassische Startgebäude',
    description: 'Ein Nachkriegsbau mit zehn Wohnungen: eine modernisiert, eine leer, eine renovierungsbedürftig, ein Mieter im Rückstand, eine alte Gasheizung und ein Dach, das bald einen Check braucht.',
    difficultyLabel: 'Einsteiger',
    start: { year: 2027, month: 1 },
    durationMonths: null,
    startCash: euro(22000),
    overdraftLimit: euro(15000),
    building: LINDEN,
    components: LINDEN_COMPONENTS,
    floors: LINDEN_FLOORS,
    componentDefects: [
      { key: 'stairwell', type: 'stairwell_light', discovered: true },
      { key: 'heating', type: 'heating_inefficient', discovered: false },
      { key: 'roof', type: 'roof_tiles', discovered: false },
    ],
    loans: [{ name: 'Hypothek Sparkasse', remaining: euro(320000), rate: 0.029, yearsLeft: 18, principal: euro(450000) }],
    services: SERVICES_BASIC,
    market: { baseRentPerSqm: euro(8.6), energyPriceIndex: 1, interestRate: 0.038 },
    goals: ['first_rent', 'fix_urgent', 'liquid_3', 'full_occupancy', 'sat_70', 'backlog_10k', 'payment_98', 'surplus_6', 'caretaker', 'energy_30', 'loan_repaid', 'full_renovation', 'stable_24', 'contracts_stable'],
    intro: [
      'Sie übernehmen die Lindenstraße 14 – zehn Wohnungen, ein solider Nachkriegsbau mit Sanierungsstau.',
      'Wohnung 3.2 ist bezugsfertig und sollte schnell inseriert werden. Wohnung 3.1 muss vorher renoviert werden.',
      'Familie in 1.2 meldet Schimmel, im Treppenhaus ist die Beleuchtung defekt, und der Mieter in 0.2 ist mit der Miete im Rückstand.',
      'Die Gasheizung von 1999 ist alt – im Winter steigt das Ausfallrisiko. Ein Dachcheck wäre mittelfristig sinnvoll.',
    ],
  },
  // ---------------------------------------------------------------- Kampagne
  {
    id: 'c1_inherited',
    mode: 'campaign',
    title: 'Das geerbte Altbauhaus',
    subtitle: 'Kampagne 1 – Gründerzeitcharme mit Tücken',
    description: 'Ihre Großtante hat Ihnen ein Gründerzeithaus hinterlassen: schuldenfrei, aber seit Jahrzehnten kaum instand gehalten. Die Altmieter zahlen wenig, lieben das Haus aber.',
    difficultyLabel: 'Einsteiger',
    start: { year: 2027, month: 3 },
    durationMonths: 36,
    startCash: euro(38000),
    overdraftLimit: euro(20000),
    building: { name: 'Wilhelmstraße 7', address: 'Wilhelmstraße 7', city: 'Südstadt', yearBuilt: 1908, landValue: euro(240000), buildingClass: 'Gründerzeit-Altbau (Klasse A1)', heatingSystem: 'oil_old', heatingYear: 1991, insulationLevel: 0, windowTier: 1, cleanliness: 60, outdoorCare: 40, fireSafety: 40, security: 50 },
    components: { roof: 41, facade: 46, windows: 36, pipes: 43, electrical: 37, heating: 42, sanitary: 48, stairwell: 58, basement: 39, outdoor: 45 },
    floors: [
      [
        { area: 84, rooms: 3, kitchen: 1, bath: 1, flooring: 2, condition: 55, tenant: T('quiet_longterm', 22, 0.72, { satisfaction: 78, reliability: 95 }) },
        { area: 76, rooms: 3, kitchen: 0, bath: 0, flooring: 1, condition: 38, status: 'vacant_needs_renovation' },
      ],
      [
        { area: 96, rooms: 4, balcony: true, kitchen: 1, bath: 1, flooring: 2, condition: 58, tenant: T('young_family', 6, 0.82, { satisfaction: 66 }) },
        { area: 88, rooms: 3.5, balcony: true, kitchen: 1, bath: 1, flooring: 2, condition: 60, tenant: T('gardener', 11, 0.78, { satisfaction: 72 }) },
      ],
      [
        { area: 96, rooms: 4, balcony: true, kitchen: 2, bath: 1, flooring: 2, condition: 62, tenant: T('handy', 8, 0.8, { satisfaction: 70 }) },
        { area: 88, rooms: 3.5, balcony: true, kitchen: 1, bath: 1, flooring: 2, condition: 57, tenant: T('helpful_neighbor', 15, 0.75, { satisfaction: 80 }) },
      ],
      [
        { area: 70, rooms: 2.5, kitchen: 1, bath: 1, flooring: 1, condition: 52, tenant: T('student', 2, 0.9, { satisfaction: 60 }) },
        { area: 66, rooms: 2, kitchen: 1, bath: 1, flooring: 1, condition: 63, status: 'vacant_ready' },
      ],
    ],
    componentDefects: [
      { key: 'roof', type: 'roof_tiles', discovered: true },
      { key: 'electrical', type: 'electrical_fault', discovered: true },
      { key: 'basement', type: 'basement_moisture', discovered: false },
    ],
    loans: [],
    services: { ...SERVICES_BASIC, insurance: 'none' },
    market: { baseRentPerSqm: euro(9.4), energyPriceIndex: 1, interestRate: 0.036 },
    goals: ['first_rent', 'fix_urgent', 'full_occupancy', 'condition_65', 'sat_65', 'liquid_3', 'backlog_10k'],
    winGoals: ['condition_65', 'full_occupancy', 'sat_65'],
    intro: [
      'Die Wilhelmstraße 7 ist schuldenfrei – aber Dach, Elektrik und Fenster sind am Ende ihrer Lebensdauer.',
      'Ziel: Innerhalb von 3 Jahren Gebäudezustand 65 %, alle Wohnungen vermietet und Ø Zufriedenheit 65 %.',
      'Tipp: Das Haus ist nicht versichert. Ein Kredit auf das schuldenfreie Haus ist günstig zu haben.',
    ],
  },
  {
    id: 'c2_insolvent',
    mode: 'campaign',
    title: 'Die fast insolvente Hausverwaltung',
    subtitle: 'Kampagne 2 – Rettung in letzter Minute',
    description: 'Die vorige Verwaltung hat das Haus heruntergewirtschaftet: hohe Kreditrate, Mietrückstände, Leerstand und eine teure externe Verwaltung. Das Konto ist fast leer.',
    difficultyLabel: 'Schwer',
    start: { year: 2027, month: 2 },
    durationMonths: 24,
    startCash: euro(2800),
    overdraftLimit: euro(18000),
    building: { name: 'Am Stadtpark 23', address: 'Am Stadtpark 23', city: 'Weststadt', yearBuilt: 1972, landValue: euro(210000), buildingClass: 'Mehrfamilienhaus 70er (Klasse M3)', heatingSystem: 'gas_old', heatingYear: 2004, insulationLevel: 1, windowTier: 2, cleanliness: 40, outdoorCare: 35, fireSafety: 60, security: 48 },
    components: { roof: 62, facade: 55, windows: 56, pipes: 58, electrical: 60, heating: 55, sanitary: 54, stairwell: 42, basement: 60, outdoor: 40 },
    floors: [
      [
        { area: 62, rooms: 2, kitchen: 1, bath: 1, flooring: 1, condition: 60, tenant: T(undefined, 4, 0.98, { arrearsMonths: 2.2, stress: 70, reliability: 55, satisfaction: 45 }) },
        { area: 62, rooms: 2, kitchen: 1, bath: 1, flooring: 1, condition: 58, status: 'vacant_ready' },
        { area: 48, rooms: 1.5, kitchen: 1, bath: 1, flooring: 1, condition: 56, tenant: T('student', 1, 1.0, { satisfaction: 52 }) },
      ],
      [
        { area: 74, rooms: 3, balcony: true, kitchen: 1, bath: 1, flooring: 1, condition: 61, tenant: T('young_family', 6, 0.95, { satisfaction: 50 }) },
        { area: 74, rooms: 3, balcony: true, kitchen: 1, bath: 1, flooring: 1, condition: 45, status: 'vacant_needs_renovation' },
        { area: 48, rooms: 1.5, kitchen: 2, bath: 1, flooring: 2, condition: 70, tenant: T('busy_professional', 2, 1.04, { satisfaction: 48 }) },
      ],
      [
        { area: 74, rooms: 3, balcony: true, kitchen: 1, bath: 1, flooring: 1, condition: 63, tenant: T('quiet_longterm', 12, 0.86, { satisfaction: 58 }) },
        { area: 74, rooms: 3, balcony: true, kitchen: 1, bath: 1, flooring: 1, condition: 59, tenant: T('temp_financial', 3, 0.95, { arrearsMonths: 1.3, stress: 62, satisfaction: 47 }) },
        { area: 48, rooms: 1.5, kitchen: 1, bath: 1, flooring: 1, condition: 60, status: 'vacant_ready' },
      ],
      [
        { area: 74, rooms: 3, balcony: true, kitchen: 1, bath: 1, flooring: 1, condition: 57, tenant: T(undefined, 5, 0.97, { satisfaction: 50 }) },
        { area: 74, rooms: 3, balcony: true, kitchen: 1, bath: 1, flooring: 1, condition: 62, tenant: T('frequent_caller', 7, 0.92, { satisfaction: 44 }) },
        { area: 48, rooms: 1.5, kitchen: 1, bath: 1, flooring: 1, condition: 58, tenant: T(undefined, 2, 1.0, { arrearsMonths: 0.6, satisfaction: 50 }) },
      ],
    ],
    componentDefects: [
      { key: 'stairwell', type: 'door_lock', discovered: true },
      { key: 'outdoor', type: 'outdoor_waste', discovered: true },
      { key: 'sanitary', type: 'sanitary_clog', discovered: true },
    ],
    loans: [{ name: 'Annuitätendarlehen Volksbank', remaining: euro(540000), rate: 0.041, yearsLeft: 22, principal: euro(600000) }],
    services: { cleaning: 'weekly', garden: 'biweekly', caretaker: 'none', management: 'agency', insurance: 'comfort', maintenancePlan: false, winterService: true },
    market: { baseRentPerSqm: euro(8.9), energyPriceIndex: 1.05, interestRate: 0.041 },
    goals: ['first_rent', 'liquid_3', 'liquid_6', 'surplus_6', 'arrears_2k', 'full_occupancy', 'sat_60'],
    winGoals: ['surplus_6', 'arrears_2k', 'liquid_6'],
    startPhase: 2,
    intro: [
      'Am Stadtpark 23: 12 Wohnungen, 3 davon leer, mehrere Mieter im Rückstand – und nur 2.800 € auf dem Konto.',
      'Die externe Verwaltung, wöchentliche Reinigung und der Gartendienst kosten viel Geld. Prüfen Sie unter „Personal“, was Sie wirklich brauchen.',
      'Ziel innerhalb von 2 Jahren: 6 Monate Überschuss in Folge, Rückstände unter 2.000 € und 6 Monate durchgehend liquide.',
    ],
  },
  {
    id: 'c3_postwar',
    mode: 'campaign',
    title: 'Der unsanierte Nachkriegsbau',
    subtitle: 'Kampagne 3 – Reparaturstau abbauen',
    description: 'Ein schlichter Bau aus den 50ern mit kleinen Wohnungen. Fast jedes Bauteil ist verschlissen, ständig geht etwas kaputt.',
    difficultyLabel: 'Mittel',
    start: { year: 2027, month: 4 },
    durationMonths: 48,
    startCash: euro(42000),
    overdraftLimit: euro(20000),
    building: { name: 'Gartenweg 3', address: 'Gartenweg 3', city: 'Nordviertel', yearBuilt: 1954, landValue: euro(160000), buildingClass: 'Nachkriegsbau, einfache Ausstattung (Klasse M1)', heatingSystem: 'oil_old', heatingYear: 1994, insulationLevel: 0, windowTier: 2, cleanliness: 50, outdoorCare: 45, fireSafety: 45, security: 50 },
    components: { roof: 38, facade: 40, windows: 42, pipes: 34, electrical: 36, heating: 38, sanitary: 37, stairwell: 40, basement: 42, outdoor: 45 },
    floors: floorsOf(4, 3, { kitchen: 1, bath: 1, flooring: 1, condition: 50, tenant: T(undefined, 5, 0.92) }, [52, 46, 60], [2, 1.5, 2.5]).map((row, f) =>
      row.map((a, p) => (f === 1 && p === 1 ? { ...a, condition: 32, tenant: undefined, status: 'vacant_needs_renovation' as const } : f === 3 && p === 2 ? { ...a, tenant: undefined, status: 'vacant_ready' as const } : a)),
    ),
    componentDefects: [
      { key: 'pipes', type: 'pipe_corrosion', discovered: true },
      { key: 'electrical', type: 'electrical_fault', discovered: true },
      { key: 'facade', type: 'facade_cracks', discovered: true },
      { key: 'roof', type: 'roof_tiles', discovered: false },
      { key: 'basement', type: 'basement_moisture', discovered: true },
    ],
    loans: [{ name: 'Hypothek', remaining: euro(140000), rate: 0.031, yearsLeft: 12, principal: euro(260000) }],
    services: SERVICES_BASIC,
    market: { baseRentPerSqm: euro(8.2), energyPriceIndex: 1, interestRate: 0.038 },
    goals: ['fix_urgent', 'liquid_3', 'backlog_15k', 'condition_70', 'sat_65', 'full_occupancy', 'caretaker'],
    winGoals: ['backlog_15k', 'condition_70'],
    intro: ['Gartenweg 3: zwölf kleine Wohnungen, alles ist alt. Leitungen und Elektrik zeigen bereits Warnzeichen.', 'Ziel innerhalb von 4 Jahren: Instandhaltungsrückstand unter 15.000 € und Gebäudezustand 70 %.'],
  },
  {
    id: 'c4_energy',
    mode: 'campaign',
    title: 'Die steigenden Energiekosten',
    subtitle: 'Kampagne 4 – Raus aus der Kostenfalle',
    description: 'Die Ölheizung verschlingt ein Vermögen, die Energiepreise steigen weiter. Die Mieter stöhnen unter den Nebenkosten.',
    difficultyLabel: 'Mittel',
    start: { year: 2027, month: 5 },
    durationMonths: 36,
    startCash: euro(55000),
    overdraftLimit: euro(20000),
    building: { name: 'Bergstraße 41', address: 'Bergstraße 41', city: 'Hanglage-Ost', yearBuilt: 1968, landValue: euro(200000), buildingClass: 'Mehrfamilienhaus 60er (Klasse M2)', heatingSystem: 'oil_old', heatingYear: 1988, insulationLevel: 0, windowTier: 1, cleanliness: 60, outdoorCare: 55, fireSafety: 58, security: 58 },
    components: { roof: 55, facade: 50, windows: 40, pipes: 62, electrical: 64, heating: 40, sanitary: 63, stairwell: 60, basement: 60, outdoor: 55 },
    floors: floorsOf(5, 2, { kitchen: 1, bath: 1, flooring: 2, condition: 62, tenant: T(undefined, 6, 0.93) }, [68, 74], [3, 3]).map((row, f) => row.map((a, p) => (f === 2 && p === 0 ? { ...a, tenant: T('high_energy', 2, 0.95) } : f === 0 && p === 1 ? { ...a, tenant: T('gardener', 7, 0.88) } : a))),
    componentDefects: [{ key: 'windows', type: 'window_draft', discovered: true }],
    loans: [{ name: 'Hypothek', remaining: euro(260000), rate: 0.033, yearsLeft: 16, principal: euro(380000) }],
    services: SERVICES_BASIC,
    market: { baseRentPerSqm: euro(8.8), energyPriceIndex: 1.45, interestRate: 0.037, energyTrend: 0.004 },
    goals: ['liquid_3', 'energy_30', 'energy_35', 'class_c', 'sat_65', 'surplus_6'],
    winGoals: ['energy_35', 'sat_65'],
    startPhase: 2,
    utilityPerSqm: euro(4.2),
    intro: ['Bergstraße 41: Ölheizung von 1988, einfach verglaste Fenster und ein Energiepreisindex von 1,45 – Tendenz steigend.', 'Ziel innerhalb von 3 Jahren: Endenergiebedarf um 35 % senken und Ø Zufriedenheit 65 %.', 'Tipp: Achten Sie auf Förderprogramme und planen Sie den Heizungstausch für den Sommer.'],
  },
  {
    id: 'c5_fluctuation',
    mode: 'campaign',
    title: 'Das Haus mit hoher Mieterfluktuation',
    subtitle: 'Kampagne 5 – Ein Zuhause schaffen',
    description: 'Niemand bleibt lange: schmutziges Treppenhaus, kaum Service, anonyme Nachbarschaft. Ständige Wechsel kosten Geld und Nerven.',
    difficultyLabel: 'Mittel',
    start: { year: 2027, month: 6 },
    durationMonths: 24,
    startCash: euro(30000),
    overdraftLimit: euro(15000),
    building: { name: 'Ringstraße 112', address: 'Ringstraße 112', city: 'Bahnhofsviertel', yearBuilt: 1985, landValue: euro(170000), buildingClass: 'Mehrfamilienhaus 80er (Klasse M3)', heatingSystem: 'gas_condensing', heatingYear: 2012, insulationLevel: 1, windowTier: 3, cleanliness: 22, outdoorCare: 25, fireSafety: 62, security: 40 },
    components: { roof: 68, facade: 52, windows: 66, pipes: 65, electrical: 66, heating: 62, sanitary: 63, stairwell: 32, basement: 58, outdoor: 30 },
    floors: floorsOf(5, 2, { kitchen: 1, bath: 1, flooring: 1, condition: 55, tenant: T(undefined, 1, 1.0, { satisfaction: 42, moveOutTendency: 75 }) }, [55, 66], [2, 2.5]).map((row, f) => row.map((a, p) => (f === 4 && p === 1 ? { ...a, tenant: undefined, status: 'vacant_ready' as const } : f === 1 && p === 0 ? { ...a, tenant: undefined, status: 'vacant_ready' as const } : a))),
    componentDefects: [
      { key: 'stairwell', type: 'stairwell_wear', discovered: true },
      { key: 'outdoor', type: 'outdoor_waste', discovered: true },
      { key: 'stairwell', type: 'door_lock', discovered: true },
    ],
    loans: [{ name: 'Hypothek', remaining: euro(310000), rate: 0.032, yearsLeft: 20, principal: euro(400000) }],
    services: { ...SERVICES_BASIC, cleaning: 'none' },
    market: { baseRentPerSqm: euro(8.7), energyPriceIndex: 1, interestRate: 0.037 },
    goals: ['liquid_3', 'sat_65', 'sat_72', 'occupancy_90', 'caretaker', 'full_occupancy'],
    winGoals: ['sat_72', 'occupancy_90'],
    intro: ['Ringstraße 112: Die Mieter sind unzufrieden und zum Absprung bereit.', 'Ziel innerhalb von 2 Jahren: Ø Zufriedenheit 72 % und mindestens 90 % Vermietung zum Monatsende.', 'Tipp: Sauberkeit, Sicherheit und schnelle Reparaturen wirken sofort.'],
  },
  {
    id: 'c6_core',
    mode: 'campaign',
    title: 'Die umfassende Kernsanierung',
    subtitle: 'Kampagne 6 – Das große Projekt',
    description: 'Sie haben ein heruntergekommenes Haus mit viel Eigenkapital gekauft. Die Hälfte steht leer. Jetzt geht es um die komplette Kernsanierung – ohne die verbliebenen Mieter zu vergraulen.',
    difficultyLabel: 'Experte',
    start: { year: 2027, month: 3 },
    durationMonths: 60,
    startCash: euro(165000),
    overdraftLimit: euro(30000),
    building: { name: 'Kastanienallee 9', address: 'Kastanienallee 9', city: 'Prenzelhöhe', yearBuilt: 1930, landValue: euro(290000), buildingClass: 'Altbau der 30er (Klasse A2)', heatingSystem: 'oil_old', heatingYear: 1986, insulationLevel: 0, windowTier: 1, cleanliness: 45, outdoorCare: 30, fireSafety: 35, security: 40 },
    components: { roof: 32, facade: 35, windows: 30, pipes: 30, electrical: 28, heating: 33, sanitary: 35, stairwell: 38, basement: 36, outdoor: 30 },
    floors: floorsOf(5, 2, { kitchen: 0, bath: 0, flooring: 1, condition: 30, status: 'vacant_needs_renovation' }, [70, 82], [2.5, 3]).map((row, f) => row.map((a, p) => ((f + p) % 2 === 0 ? { ...a, condition: 52, kitchen: 1, bath: 1, status: undefined, tenant: T(undefined, 8, 0.78, { satisfaction: 55 }) } : a))),
    componentDefects: [
      { key: 'electrical', type: 'electrical_hazard', discovered: true },
      { key: 'pipes', type: 'pipe_corrosion', discovered: true },
      { key: 'roof', type: 'roof_leak', discovered: true },
    ],
    loans: [],
    services: { ...SERVICES_BASIC, insurance: 'basic' },
    market: { baseRentPerSqm: euro(10.4), energyPriceIndex: 1, interestRate: 0.036 },
    goals: ['fix_urgent', 'condition_85', 'class_c', 'full_occupancy', 'sat_70', 'full_renovation'],
    winGoals: ['condition_85', 'class_c', 'full_occupancy'],
    startPhase: 3,
    intro: ['Kastanienallee 9: begehrte Lage, aber Elektrik, Leitungen und Dach sind am Ende. Fünf Wohnungen stehen leer.', 'Ziel innerhalb von 5 Jahren: Gebäudezustand 85 %, Effizienzklasse C und alle Wohnungen vermietet.', 'Achtung: Der gefährliche Elektromangel muss sofort behoben werden.'],
  },
  // ---------------------------------------------------------------- Herausforderungen
  {
    id: 'ch_tight',
    mode: 'challenge',
    title: 'Knappe Kasse',
    subtitle: 'Herausforderung – 1.500 € Startkapital',
    description: 'Das Startgebäude, aber fast ohne Geld und mit kleinem Dispo. Halten Sie das Konto sechs Monate am Stück im Plus.',
    difficultyLabel: 'Schwer',
    start: { year: 2027, month: 1 },
    durationMonths: 9,
    startCash: euro(1500),
    overdraftLimit: euro(8000),
    building: LINDEN,
    components: LINDEN_COMPONENTS,
    floors: LINDEN_FLOORS,
    componentDefects: [{ key: 'stairwell', type: 'stairwell_light', discovered: true }],
    loans: [{ name: 'Hypothek Sparkasse', remaining: euro(320000), rate: 0.029, yearsLeft: 18, principal: euro(450000) }],
    services: SERVICES_BASIC,
    market: { baseRentPerSqm: euro(8.6), energyPriceIndex: 1, interestRate: 0.038 },
    goals: ['liquid_3', 'liquid_6', 'first_rent'],
    winGoals: ['liquid_6'],
    intro: ['Nur 1.500 € auf dem Konto. Jeder Euro zählt.', 'Ziel innerhalb von 9 Monaten: sechs Monate in Folge ohne negativen Kontostand.'],
  },
  {
    id: 'ch_backlog',
    mode: 'challenge',
    title: 'Reparaturstau',
    subtitle: 'Herausforderung – alles auf einmal',
    description: 'Zehn offene Schäden, Folgeschäden drohen. Bauen Sie den Rückstand innerhalb eines Jahres ab.',
    difficultyLabel: 'Mittel',
    start: { year: 2027, month: 9 },
    durationMonths: 12,
    startCash: euro(48000),
    overdraftLimit: euro(15000),
    building: LINDEN,
    components: { ...LINDEN_COMPONENTS, heating: 38, pipes: 44, roof: 45 },
    floors: LINDEN_FLOORS,
    componentDefects: [
      { key: 'stairwell', type: 'stairwell_light', discovered: true },
      { key: 'stairwell', type: 'stairwell_wear', discovered: true },
      { key: 'heating', type: 'heating_fault', discovered: true },
      { key: 'roof', type: 'roof_tiles', discovered: true },
      { key: 'pipes', type: 'pipe_corrosion', discovered: true },
      { key: 'facade', type: 'facade_cracks', discovered: true },
      { key: 'outdoor', type: 'outdoor_waste', discovered: true },
      { key: 'basement', type: 'basement_moisture', discovered: true },
      { key: 'sanitary', type: 'sanitary_clog', discovered: true },
    ],
    loans: [{ name: 'Hypothek Sparkasse', remaining: euro(320000), rate: 0.029, yearsLeft: 18, principal: euro(450000) }],
    services: SERVICES_BASIC,
    market: { baseRentPerSqm: euro(8.6), energyPriceIndex: 1, interestRate: 0.038 },
    goals: ['fix_urgent', 'backlog_5k', 'sat_60'],
    winGoals: ['backlog_5k'],
    intro: ['Überall Baustellen. Priorisieren Sie nach Dringlichkeit – manche Schäden eskalieren bald.', 'Ziel innerhalb von 12 Monaten: Instandhaltungsrückstand unter 5.000 €.'],
  },
  {
    id: 'ch_winter',
    mode: 'challenge',
    title: 'Winterkrise',
    subtitle: 'Herausforderung – eine marode Heizung im November',
    description: 'Die Heizung pfeift aus dem letzten Loch, der Winter steht vor der Tür. Bringen Sie die Mieter bei Laune.',
    difficultyLabel: 'Mittel',
    start: { year: 2027, month: 11 },
    durationMonths: 5,
    startCash: euro(16000),
    overdraftLimit: euro(15000),
    building: { ...LINDEN, heatingYear: 1989, heatingSystem: 'oil_old' },
    components: { ...LINDEN_COMPONENTS, heating: 24, pipes: 40 },
    floors: LINDEN_FLOORS,
    componentDefects: [{ key: 'heating', type: 'heating_fault', discovered: true }],
    loans: [{ name: 'Hypothek Sparkasse', remaining: euro(320000), rate: 0.029, yearsLeft: 18, principal: euro(450000) }],
    services: SERVICES_BASIC,
    market: { baseRentPerSqm: euro(8.6), energyPriceIndex: 1.1, interestRate: 0.038 },
    goals: ['fix_urgent', 'sat_60', 'liquid_3'],
    winGoals: ['sat_60', 'liquid_3'],
    intro: ['Ölheizung von 1989, Zustand 24 % – sie läuft schon jetzt nur noch mit Störungen.', 'Ziel bis Ende März: Ø Zufriedenheit 60 % und drei Monate in Folge liquide.'],
  },
];

export const SCENARIO_BY_ID: Record<string, ScenarioDef> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

export interface SandboxOptions {
  startCash: number;
  buildingCondition: number;
  occupancy: number;
  difficulty: 'easy' | 'normal' | 'hard';
  eventFrequency: number;
  loan: number;
  allUnlocked: boolean;
  seed?: number;
}

export const DEFAULT_SANDBOX: SandboxOptions = { startCash: euro(50000), buildingCondition: 55, occupancy: 0.8, difficulty: 'normal', eventFrequency: 1, loan: euro(250000), allUnlocked: true };
