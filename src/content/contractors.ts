import type { Trade } from '@/domain/schema';

export interface ContractorTemplate {
  name: string;
  trade: Trade;
  priceFactor: number;
  quality: number;
  reliability: number;
  waitDays: number;
  description: string;
  /** Erst durch Ereignis verfügbar. */
  hidden?: boolean;
}

export const CONTRACTOR_TEMPLATES: ContractorTemplate[] = [
  { name: 'Rohrfix Schneider', trade: 'plumbing', priceFactor: 0.85, quality: 2, reliability: 62, waitDays: 1, description: 'Günstig und schnell da, arbeitet aber nicht immer sauber.' },
  { name: 'Sanitär Brinkmann & Söhne', trade: 'plumbing', priceFactor: 1.1, quality: 4, reliability: 88, waitDays: 4, description: 'Traditionsbetrieb, gründlich und termintreu.' },
  { name: 'AquaTec Haustechnik', trade: 'plumbing', priceFactor: 1.3, quality: 5, reliability: 95, waitDays: 7, description: 'Premiumanbieter für komplexe Leitungssanierungen.', hidden: true },
  { name: 'Elektro Voltmann', trade: 'electric', priceFactor: 0.9, quality: 3, reliability: 74, waitDays: 2, description: 'Solide Arbeit zu fairen Preisen.' },
  { name: 'Lichtblick Elektrotechnik', trade: 'electric', priceFactor: 1.15, quality: 5, reliability: 90, waitDays: 5, description: 'Meisterbetrieb, spezialisiert auf Altbau-Elektrik und PV.' },
  { name: 'Malerbetrieb Farbenfroh', trade: 'painting', priceFactor: 0.8, quality: 2, reliability: 58, waitDays: 1, description: 'Sehr günstig, gelegentlich unzuverlässig.' },
  { name: 'Maler Kowalczyk', trade: 'painting', priceFactor: 1.0, quality: 4, reliability: 84, waitDays: 3, description: 'Sauber, ordentlich, mit Liebe zum Detail.' },
  { name: 'Dachdeckerei Hochfirst', trade: 'roofing', priceFactor: 1.0, quality: 4, reliability: 80, waitDays: 6, description: 'Erfahrener Dachdecker mit vollem Auftragsbuch.' },
  { name: 'Dach & Wand Express', trade: 'roofing', priceFactor: 0.88, quality: 2, reliability: 60, waitDays: 2, description: 'Kommt schnell, Qualität schwankt.' },
  { name: 'Wärmewerk Heizungsbau', trade: 'heating', priceFactor: 1.05, quality: 4, reliability: 86, waitDays: 3, description: 'Spezialist für Brennwerttechnik und Wärmepumpen.' },
  { name: 'Heizungsnotdienst 24', trade: 'heating', priceFactor: 1.35, quality: 3, reliability: 92, waitDays: 0, description: 'Rund um die Uhr erreichbar – zum Notdiensttarif.' },
  { name: 'Thermo Petersen', trade: 'heating', priceFactor: 0.9, quality: 3, reliability: 70, waitDays: 4, description: 'Kleiner Betrieb, faire Preise, manchmal Engpässe.' },
  { name: 'Glanzwerk Gebäudereinigung', trade: 'cleaning', priceFactor: 1.0, quality: 4, reliability: 85, waitDays: 2, description: 'Zuverlässige Treppenhausreinigung.' },
  { name: 'Grünwerk Gartenpflege', trade: 'garden', priceFactor: 0.95, quality: 3, reliability: 78, waitDays: 3, description: 'Pflegt Höfe und Grünanlagen.' },
  { name: 'Hofgrün Landschaftsbau', trade: 'garden', priceFactor: 1.2, quality: 5, reliability: 88, waitDays: 6, description: 'Gestaltet anspruchsvolle Außenanlagen.' },
  { name: 'Hausservice Allround Kaya', trade: 'general', priceFactor: 0.9, quality: 3, reliability: 76, waitDays: 1, description: 'Kann vieles ein bisschen – ideal für kleine Reparaturen.' },
  { name: 'Bautrupp Albrecht GmbH', trade: 'general', priceFactor: 1.05, quality: 4, reliability: 82, waitDays: 5, description: 'Generalunternehmer für Sanierungen und Ausbau.' },
  { name: 'Handwerkerkollektiv Werkbank', trade: 'general', priceFactor: 1.0, quality: 5, reliability: 91, waitDays: 6, description: 'Genossenschaftlich organisiert, exzellente Arbeit.', hidden: true },
];

/** Welche Gewerke dürfen welche Arbeiten übernehmen. */
export const TRADE_CAN_DO: Record<Trade, Trade[]> = {
  plumbing: ['plumbing'],
  electric: ['electric'],
  painting: ['painting', 'general'],
  roofing: ['roofing'],
  heating: ['heating', 'plumbing'],
  cleaning: ['cleaning'],
  garden: ['garden', 'general'],
  general: ['general'],
};
