import type { ComponentKey, Trade } from '@/domain/schema';
import { euro } from '@/utils/money';

export interface ComponentMeta {
  key: ComponentKey;
  label: string;
  description: string;
  trade: Trade;
  /** Kosten einer Wartung / Inspektion. */
  maintenanceCost: number;
  maintenanceGain: number;
  maintenanceLabel: string;
  maintenanceDays: number;
  /** Lebensdauer in Jahren als Orientierung. */
  lifespan: number;
  /** Gewicht für den Gesamtzustand. */
  weight: number;
}

export const COMPONENTS: Record<ComponentKey, ComponentMeta> = {
  roof: { key: 'roof', label: 'Dach', description: 'Eindeckung, Dachstuhl, Rinnen. Schützt vor Nässe und Wärmeverlust.', trade: 'roofing', maintenanceCost: euro(480), maintenanceGain: 5, maintenanceLabel: 'Dachcheck & Rinnenreinigung', maintenanceDays: 1, lifespan: 45, weight: 1.4 },
  facade: { key: 'facade', label: 'Fassade', description: 'Putz, Anstrich, ggf. Dämmung. Prägt den ersten Eindruck.', trade: 'painting', maintenanceCost: euro(2400), maintenanceGain: 10, maintenanceLabel: 'Risse ausbessern & Anstrich auffrischen', maintenanceDays: 5, lifespan: 40, weight: 1.1 },
  windows: { key: 'windows', label: 'Fenster', description: 'Dichtheit und Wärmeschutz. Undichte Fenster fördern Zugluft und Schimmel.', trade: 'general', maintenanceCost: euro(850), maintenanceGain: 7, maintenanceLabel: 'Dichtungen tauschen & Beschläge einstellen', maintenanceDays: 2, lifespan: 35, weight: 1.0 },
  pipes: { key: 'pipes', label: 'Wasserleitungen', description: 'Steig- und Fallleitungen. Korrosion führt zu Leckagen und Wasserschäden.', trade: 'plumbing', maintenanceCost: euro(380), maintenanceGain: 5, maintenanceLabel: 'Leitungsspülung & Druckprüfung', maintenanceDays: 1, lifespan: 50, weight: 1.2 },
  electrical: { key: 'electrical', label: 'Elektroinstallation', description: 'Verteiler, Steigleitungen, Absicherung. Mängel sind sicherheitsrelevant.', trade: 'electric', maintenanceCost: euro(420), maintenanceGain: 5, maintenanceLabel: 'E-Check (Prüfung nach DGUV V3)', maintenanceDays: 1, lifespan: 45, weight: 1.1 },
  heating: { key: 'heating', label: 'Heizungsanlage', description: 'Wärmeerzeuger, Pumpen, Verteilung. Bestimmt Heizkosten und Ausfallrisiko.', trade: 'heating', maintenanceCost: euro(340), maintenanceGain: 7, maintenanceLabel: 'Jahreswartung der Heizung', maintenanceDays: 1, lifespan: 22, weight: 1.5 },
  sanitary: { key: 'sanitary', label: 'Sanitäranlagen', description: 'Abwasser, Fallrohre, Hebeanlage. Verstopfungen führen zu Rückstau.', trade: 'plumbing', maintenanceCost: euro(420), maintenanceGain: 6, maintenanceLabel: 'Rohrreinigung & Kamerabefahrung', maintenanceDays: 1, lifespan: 40, weight: 0.9 },
  stairwell: { key: 'stairwell', label: 'Treppenhaus', description: 'Gemeinsamer Eingang, Beleuchtung, Briefkästen. Visitenkarte des Hauses.', trade: 'painting', maintenanceCost: euro(1400), maintenanceGain: 14, maintenanceLabel: 'Ausbessern & Teilanstrich', maintenanceDays: 3, lifespan: 15, weight: 0.8 },
  basement: { key: 'basement', label: 'Keller', description: 'Abstellräume, Hausanschlüsse. Feuchtigkeit führt zu Schimmel und Lagerproblemen.', trade: 'general', maintenanceCost: euro(650), maintenanceGain: 8, maintenanceLabel: 'Entfeuchten & Lüftung prüfen', maintenanceDays: 2, lifespan: 60, weight: 0.7 },
  outdoor: { key: 'outdoor', label: 'Außenbereich', description: 'Hof, Garten, Müllplatz, Zuwege. Ungepflegt zieht er Müll und Ungeziefer an.', trade: 'garden', maintenanceCost: euro(420), maintenanceGain: 25, maintenanceLabel: 'Grundpflege & Rückschnitt', maintenanceDays: 1, lifespan: 20, weight: 0.6 },
};

export const COMPONENT_ORDER: ComponentKey[] = ['roof', 'facade', 'windows', 'heating', 'pipes', 'sanitary', 'electrical', 'stairwell', 'basement', 'outdoor'];

export const TRADE_LABEL: Record<Trade, string> = {
  plumbing: 'Sanitärbetrieb',
  electric: 'Elektriker',
  painting: 'Maler',
  roofing: 'Dachdecker',
  heating: 'Heizungsbauer',
  cleaning: 'Gebäudereinigung',
  garden: 'Gartenpflege',
  general: 'Allround-Handwerker',
};

export const LEVEL_LABEL = ['einfach', 'standard', 'gehoben', 'modern'];
