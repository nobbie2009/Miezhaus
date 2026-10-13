import type { Traits } from '@/domain/schema';
import { euro } from '@/utils/money';

/**
 * Mieter-Archetypen. Sie beschreiben Lebenssituationen und Vorlieben – keine Vorurteile.
 * Zahlungsverhalten wird individuell gewürfelt und hängt nicht an Namen oder Herkunft.
 */
export interface Archetype {
  id: string;
  label: string;
  description: string;
  household: [number, number];
  income: [number, number];
  occupations: string[];
  traits: Partial<Record<keyof Traits, [number, number]>>;
  needs: { id: string; chance: number }[];
  petChance: number;
  energyFactor: [number, number];
  stress: [number, number];
  stayYears: [number, number];
  weight: number;
}

const T = (min: number, max: number): [number, number] => [min, max];

export const ARCHETYPES: Archetype[] = [
  {
    id: 'quiet_longterm',
    label: 'Ruhiger Langzeitmieter',
    description: 'Schätzt Beständigkeit, meldet sich selten, bleibt gerne lange.',
    household: [1, 2],
    income: [euro(2300), euro(3600)],
    occupations: ['Verwaltungsangestellte:r', 'Bibliothekar:in', 'Rentner:in', 'Buchhalter:in', 'Technische:r Zeichner:in'],
    traits: { tidiness: T(60, 90), noiseSensitivity: T(55, 85), communicativeness: T(20, 50), moveOutTendency: T(5, 25), constructionTolerance: T(30, 60) },
    needs: [{ id: 'quiet', chance: 0.7 }, { id: 'low_rent', chance: 0.3 }],
    petChance: 0.25,
    energyFactor: T(0.85, 1.05),
    stress: T(0, 15),
    stayYears: [6, 15],
    weight: 3,
  },
  {
    id: 'young_family',
    label: 'Junge Familie',
    description: 'Braucht Platz, freut sich über Fahrradkeller und Hof, etwas lauter.',
    household: [3, 5],
    income: [euro(3400), euro(5600)],
    occupations: ['Erzieher:in & Mechatroniker:in', 'Pflegefachkraft & Lehrer:in', 'Ingenieur:in', 'Physiotherapeut:in', 'Elektriker:in'],
    traits: { noiseSensitivity: T(20, 50), community: T(55, 85), renovationDemands: T(40, 70), constructionTolerance: T(30, 60), moveOutTendency: T(20, 45) },
    needs: [{ id: 'rooms', chance: 0.9 }, { id: 'garden', chance: 0.5 }, { id: 'bike_storage', chance: 0.5 }, { id: 'laundry', chance: 0.4 }],
    petChance: 0.3,
    energyFactor: T(1.0, 1.3),
    stress: T(5, 30),
    stayYears: [4, 10],
    weight: 2.5,
  },
  {
    id: 'busy_professional',
    label: 'Beruflich stark eingespannt',
    description: 'Zahlt zuverlässig, erwartet aber schnelle Reaktionen und moderne Ausstattung.',
    household: [1, 2],
    income: [euro(4200), euro(7200)],
    occupations: ['Unternehmensberater:in', 'Softwareentwickler:in', 'Ärztin/Arzt', 'Projektleiter:in', 'Anwältin/Anwalt'],
    traits: { renovationDemands: T(60, 90), communicativeness: T(50, 80), frugality: T(10, 40), constructionTolerance: T(20, 50), moveOutTendency: T(35, 65) },
    needs: [{ id: 'modern', chance: 0.8 }, { id: 'balcony', chance: 0.5 }, { id: 'quick_service', chance: 0.7 }],
    petChance: 0.1,
    energyFactor: T(0.8, 1.1),
    stress: T(0, 10),
    stayYears: [2, 6],
    weight: 2,
  },
  {
    id: 'student',
    label: 'Preisbewusster Student',
    description: 'Kleines Budget, tolerant gegenüber Altbaucharme, zieht nach dem Studium oft weiter.',
    household: [1, 3],
    income: [euro(1100), euro(2200)],
    occupations: ['Studierende:r (Maschinenbau)', 'Studierende:r (Medizin)', 'Auszubildende:r', 'Studentische WG', 'Doktorand:in'],
    traits: { frugality: T(70, 95), tidiness: T(25, 60), noiseSensitivity: T(10, 40), constructionTolerance: T(50, 85), moveOutTendency: T(50, 85), renovationDemands: T(10, 40) },
    needs: [{ id: 'low_rent', chance: 0.9 }, { id: 'bike_storage', chance: 0.6 }],
    petChance: 0.05,
    energyFactor: T(0.9, 1.3),
    stress: T(10, 40),
    stayYears: [1, 4],
    weight: 2,
  },
  {
    id: 'handy',
    label: 'Handwerklich begabt',
    description: 'Repariert Kleinigkeiten gerne selbst und hilft auch mal im Haus.',
    household: [1, 3],
    income: [euro(2600), euro(4000)],
    occupations: ['Tischler:in', 'Kfz-Mechatroniker:in', 'Installateur:in', 'Hausmeister:in im Ruhestand', 'Bühnenbauer:in'],
    traits: { diy: T(75, 98), constructionTolerance: T(60, 90), community: T(50, 80), renovationDemands: T(20, 50) },
    needs: [{ id: 'basement', chance: 0.5 }, { id: 'garden', chance: 0.3 }],
    petChance: 0.3,
    energyFactor: T(0.9, 1.1),
    stress: T(0, 20),
    stayYears: [4, 12],
    weight: 1.2,
  },
  {
    id: 'demanding',
    label: 'Anspruchsvoller Mieter',
    description: 'Hat hohe Erwartungen an Zustand und Service – zahlt dafür auch mehr.',
    household: [1, 3],
    income: [euro(3800), euro(6800)],
    occupations: ['Architekt:in', 'Zahnärztin/Zahnarzt', 'Marketingleiter:in', 'Galerist:in', 'Steuerberater:in'],
    traits: { renovationDemands: T(80, 98), communicativeness: T(70, 95), noiseSensitivity: T(60, 90), constructionTolerance: T(5, 30), tidiness: T(70, 95) },
    needs: [{ id: 'modern', chance: 0.95 }, { id: 'quiet', chance: 0.6 }, { id: 'balcony', chance: 0.6 }, { id: 'quick_service', chance: 0.9 }],
    petChance: 0.15,
    energyFactor: T(0.9, 1.2),
    stress: T(0, 10),
    stayYears: [2, 7],
    weight: 1,
  },
  {
    id: 'helpful_neighbor',
    label: 'Hilfsbereiter Nachbar',
    description: 'Kennt alle im Haus, nimmt Pakete an und schlichtet Streit.',
    household: [1, 2],
    income: [euro(2000), euro(3400)],
    occupations: ['Rentner:in', 'Sozialarbeiter:in', 'Krankenpfleger:in', 'Busfahrer:in', 'Verkäufer:in'],
    traits: { community: T(80, 98), tidiness: T(55, 85), communicativeness: T(60, 90), moveOutTendency: T(5, 25) },
    needs: [{ id: 'community', chance: 0.8 }, { id: 'garden', chance: 0.4 }],
    petChance: 0.35,
    energyFactor: T(0.85, 1.05),
    stress: T(0, 20),
    stayYears: [6, 15],
    weight: 1.3,
  },
  {
    id: 'temp_financial',
    label: 'Vorübergehend finanziell klamm',
    description: 'Gerade in einer schwierigen Phase – mit Entgegenkommen oft ein treuer Mieter.',
    household: [1, 4],
    income: [euro(1600), euro(2900)],
    occupations: ['Selbstständige:r (Gastronomie)', 'Berufswiedereinsteiger:in', 'Alleinerziehend, Teilzeit', 'Freiberufler:in (Grafik)', 'Umschüler:in'],
    traits: { frugality: T(70, 95), communicativeness: T(30, 70), moveOutTendency: T(15, 40) },
    needs: [{ id: 'low_rent', chance: 0.95 }],
    petChance: 0.2,
    energyFactor: T(0.8, 1.05),
    stress: T(45, 75),
    stayYears: [3, 8],
    weight: 1.1,
  },
  {
    id: 'gardener',
    label: 'Begeisterte Hobbygärtnerin',
    description: 'Pflegt Hof und Beete mit Hingabe, wenn man sie lässt.',
    household: [1, 2],
    income: [euro(2200), euro(3800)],
    occupations: ['Floristin/Florist', 'Landschaftsarchitekt:in', 'Lehrer:in', 'Rentner:in', 'Biologe/Biologin'],
    traits: { ecoAwareness: T(70, 95), community: T(55, 85), tidiness: T(55, 85), diy: T(50, 80) },
    needs: [{ id: 'garden', chance: 0.95 }, { id: 'eco', chance: 0.6 }],
    petChance: 0.3,
    energyFactor: T(0.75, 0.95),
    stress: T(0, 20),
    stayYears: [5, 12],
    weight: 0.9,
  },
  {
    id: 'high_energy',
    label: 'Hoher Energieverbrauch',
    description: 'Heizt gern warm, arbeitet viel von zu Hause – Heizkosten sind ein Thema.',
    household: [1, 3],
    income: [euro(2600), euro(4800)],
    occupations: ['Streamer:in', 'Fotograf:in', 'IT-Administrator:in', 'Übersetzer:in', 'Musiker:in'],
    traits: { ecoAwareness: T(5, 35), noiseSensitivity: T(30, 60), frugality: T(20, 50) },
    needs: [{ id: 'warm', chance: 0.9 }],
    petChance: 0.25,
    energyFactor: T(1.35, 1.75),
    stress: T(0, 25),
    stayYears: [2, 7],
    weight: 0.9,
  },
  {
    id: 'frequent_caller',
    label: 'Ruft häufig an',
    description: 'Meldet jede Kleinigkeit – das ist anstrengend, verhindert aber teure Folgeschäden.',
    household: [1, 3],
    income: [euro(2200), euro(4200)],
    occupations: ['Sachbearbeiter:in', 'Qualitätsprüfer:in', 'Rentner:in', 'Bankkauffrau/-mann', 'Apotheker:in'],
    traits: { communicativeness: T(88, 100), tidiness: T(60, 90), renovationDemands: T(50, 80), noiseSensitivity: T(50, 85) },
    needs: [{ id: 'quick_service', chance: 0.95 }, { id: 'quiet', chance: 0.5 }],
    petChance: 0.2,
    energyFactor: T(0.9, 1.15),
    stress: T(0, 20),
    stayYears: [3, 10],
    weight: 0.9,
  },
];

export const ARCHETYPE_BY_ID: Record<string, Archetype> = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a]));

export const NEED_LABEL: Record<string, string> = {
  quiet: 'Ruhige Lage',
  low_rent: 'Günstige Miete',
  rooms: 'Viel Platz',
  garden: 'Hof/Garten',
  bike_storage: 'Fahrradstellplatz',
  laundry: 'Waschkeller',
  modern: 'Moderne Ausstattung',
  balcony: 'Balkon',
  quick_service: 'Schneller Service',
  basement: 'Trockener Keller',
  community: 'Gute Nachbarschaft',
  eco: 'Nachhaltiges Haus',
  warm: 'Günstige Heizkosten',
};

export const TRAIT_LABEL: Record<keyof Traits, string> = {
  tidiness: 'Ordnungsliebe',
  noiseSensitivity: 'Geräuschempfindlichkeit',
  ecoAwareness: 'Umweltbewusstsein',
  renovationDemands: 'Renovierungsansprüche',
  communicativeness: 'Kommunikationsbereitschaft',
  frugality: 'Sparsamkeit',
  community: 'Gemeinschaftssinn',
  constructionTolerance: 'Toleranz gegenüber Baustellen',
  diy: 'Heimwerker-Bereitschaft',
  moveOutTendency: 'Umzugsneigung',
};

const FIRST = ['Anna', 'Ben', 'Clara', 'Deniz', 'Elif', 'Finn', 'Greta', 'Hamid', 'Ida', 'Jonas', 'Katarzyna', 'Luca', 'Mia', 'Noah', 'Olga', 'Paul', 'Quang', 'Rosa', 'Samir', 'Tilda', 'Umut', 'Vera', 'Wim', 'Xenia', 'Yusuf', 'Zoe', 'Marta', 'Lars', 'Amira', 'Theo', 'Nele', 'Kofi', 'Hanna', 'Jakob', 'Leyla', 'Mats', 'Sofia', 'Emil', 'Aylin', 'Henrik', 'Ines', 'Malik', 'Ronja', 'Tobias', 'Valentina', 'Dragan', 'Frieda', 'Oskar', 'Chiara', 'Milan'];
const LAST = ['Müller', 'Schmidt', 'Yılmaz', 'Nowak', 'Becker', 'Hoffmann', 'Nguyen', 'Schulz', 'Kowalski', 'Wagner', 'Petrović', 'Fischer', 'Weber', 'Meyer', 'Rossi', 'Koch', 'Richter', 'Demir', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Popescu', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Şahin', 'Werner', 'Krause', 'Mensah', 'Lehmann', 'Kaiser', 'Fuchs', 'Peters', 'Haddad', 'Lindqvist', 'Vogel', 'Jansen', 'Bauer', 'Kaya', 'Albrecht', 'Ivanova', 'Engel', 'Horvat', 'Brandt', 'Sommer'];

export const NAMES = { first: FIRST, last: LAST };
