import type { HeatingSystem } from '@/domain/schema';

/** Vorlagen für Kaufangebote auf dem Immobilienmarkt. */
export interface PropertyTemplate {
  id: string;
  label: string;
  buildingClass: string;
  years: [number, number];
  floors: [number, number];
  perFloor: [number, number];
  areas: number[];
  rooms: number[];
  heating: HeatingSystem[];
  insulation: [number, number];
  windowTier: [number, number];
  location: [number, number];
  /** Zustand der Bauteile (Bereich) */
  condition: [number, number];
  occupancy: [number, number];
  /** Mietniveau der Bestandsmieter relativ zur Vergleichsmiete */
  rentFactor: [number, number];
  balcony: number;
  amenities?: string[];
  pitch: string[];
  weight: number;
}

export const PROPERTY_TEMPLATES: PropertyTemplate[] = [
  {
    id: 'gruenderzeit',
    label: 'Gründerzeit-Altbau',
    buildingClass: 'Mehrfamilienhaus, Gründerzeit (Klasse A1)',
    years: [1889, 1912],
    floors: [4, 5],
    perFloor: [2, 2],
    areas: [86, 104, 92, 78],
    rooms: [3, 4, 3.5, 3],
    heating: ['gas_old', 'oil_old'],
    insulation: [0, 1],
    windowTier: [1, 3],
    location: [1.12, 1.4],
    condition: [42, 70],
    occupancy: [0.7, 1],
    rentFactor: [0.72, 0.95],
    balcony: 0.5,
    pitch: ['Stuckdecken und Dielenböden – begehrte Innenstadtlage.', 'Hohe Decken, Flügeltüren, Altbaucharme. Teilweise mit Altmietverträgen.', 'Liebhaberobjekt in gesuchter Lage, Modernisierungspotenzial.'],
    weight: 3,
  },
  {
    id: 'nachkrieg',
    label: 'Nachkriegsbau',
    buildingClass: 'Mehrfamilienhaus, Nachkriegsbau (Klasse M2)',
    years: [1952, 1969],
    floors: [3, 4],
    perFloor: [2, 3],
    areas: [48, 62, 56, 70],
    rooms: [2, 2.5, 2, 3],
    heating: ['gas_old', 'oil_old', 'district'],
    insulation: [0, 1],
    windowTier: [1, 3],
    location: [0.88, 1.06],
    condition: [40, 66],
    occupancy: [0.75, 1],
    rentFactor: [0.78, 0.98],
    balcony: 0.6,
    pitch: ['Solides Renditeobjekt mit kleinen, gut vermietbaren Wohnungen.', 'Grundsolide Substanz, ruhige Seitenstraße.', 'Erbengemeinschaft verkauft – schneller Abschluss gewünscht.'],
    weight: 4,
  },
  {
    id: 'siebziger',
    label: 'Wohnblock der 70er',
    buildingClass: 'Mehrfamilienhaus, Großtafelbau (Klasse M3)',
    years: [1968, 1980],
    floors: [4, 6],
    perFloor: [3, 3],
    areas: [54, 68, 76],
    rooms: [2, 3, 3],
    heating: ['district', 'gas_old'],
    insulation: [0, 2],
    windowTier: [2, 3],
    location: [0.78, 0.95],
    condition: [45, 68],
    occupancy: [0.7, 0.95],
    rentFactor: [0.85, 1],
    balcony: 0.9,
    pitch: ['Hohe Mietrendite, Stadtrandlage mit guter Anbindung.', 'Viele Einheiten zum günstigen Quadratmeterpreis.', 'Fernwärme, Aufzugvorbereitung, großzügige Balkone.'],
    weight: 3,
  },
  {
    id: 'neunziger',
    label: 'Stadthaus der 90er',
    buildingClass: 'Mehrfamilienhaus, 90er Jahre (Klasse M4)',
    years: [1991, 2002],
    floors: [3, 3],
    perFloor: [2, 2],
    areas: [62, 78, 84],
    rooms: [2.5, 3, 3.5],
    heating: ['gas_condensing', 'gas_old'],
    insulation: [1, 2],
    windowTier: [3, 3],
    location: [0.98, 1.12],
    condition: [58, 78],
    occupancy: [0.85, 1],
    rentFactor: [0.88, 1],
    balcony: 0.9,
    amenities: ['bike_storage'],
    pitch: ['Gepflegtes Objekt, geringer Instandhaltungsstau.', 'Ruhige Wohnstraße, familienfreundlich.', 'Solide Mieterstruktur, kaum Fluktuation.'],
    weight: 3,
  },
  {
    id: 'neubau',
    label: 'Neubau-Stadtvilla',
    buildingClass: 'Mehrfamilienhaus, Neubau KfW 55 (Klasse N1)',
    years: [2014, 2022],
    floors: [3, 3],
    perFloor: [2, 2],
    areas: [68, 82, 94],
    rooms: [2.5, 3, 4],
    heating: ['heat_pump', 'district'],
    insulation: [3, 3],
    windowTier: [5, 5],
    location: [1.05, 1.3],
    condition: [82, 95],
    occupancy: [0.9, 1],
    rentFactor: [0.92, 1.04],
    balcony: 1,
    amenities: ['bike_storage', 'garden'],
    pitch: ['Effizienzhaus mit Wärmepumpe – kaum Instandhaltung in den nächsten Jahren.', 'Hochwertige Ausstattung, Bestlage, geringe Rendite.', 'Energieeffizient und sofort renditestark – zum stolzen Preis.'],
    weight: 2,
  },
  {
    id: 'sanierungsfall',
    label: 'Sanierungsfall',
    buildingClass: 'Mehrfamilienhaus, 20er Jahre (Klasse A2)',
    years: [1922, 1938],
    floors: [3, 4],
    perFloor: [2, 2],
    areas: [64, 72, 80],
    rooms: [2.5, 3, 3],
    heating: ['oil_old'],
    insulation: [0, 0],
    windowTier: [1, 2],
    location: [1.05, 1.3],
    condition: [22, 42],
    occupancy: [0.4, 0.75],
    rentFactor: [0.7, 0.88],
    balcony: 0.3,
    pitch: ['Für Handwerker und Investoren: hohes Wertsteigerungspotenzial nach Sanierung.', 'Zwangsversteigerung abgewendet – Bank drängt auf Verkauf.', 'Viel Leerstand, viel Potenzial. Gutachten dringend empfohlen.'],
    weight: 2,
  },
];

export const STREETS = ['Ahornweg', 'Bahnhofstraße', 'Kastanienallee', 'Gartenstraße', 'Schillerstraße', 'Goethestraße', 'Mühlenweg', 'Parkstraße', 'Rosenstraße', 'Brunnenstraße', 'Am Stadtwall', 'Uhlandstraße', 'Hafenstraße', 'Kirchplatz', 'Wilhelmstraße', 'Birkenweg', 'Marktgasse', 'Lessingstraße', 'Eichendorffstraße', 'Talstraße'];
export const DISTRICTS = ['Altstadt-Süd', 'Neustadt', 'Westend', 'Südviertel', 'Am Hafen', 'Oststadt', 'Kreuzviertel', 'Nordpark', 'Bahnhofsviertel', 'Gartenstadt'];
export const SELLERS = ['Privatverkauf', 'Erbengemeinschaft', 'Immobilien Rösner GmbH (Makler)', 'Sparkassen-Immobilien', 'Wohnbau Nord AG', 'Bauträger Kessler', 'Insolvenzverwalter Dr. Haas'];
