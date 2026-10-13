import type { GameState } from '@/domain/schema';
import { addMessage, log } from './messages';
import { avgSatisfaction, buildingCondition, energyClassIndex, occupiedCount, openDefects } from './derived';

export interface PhaseDef {
  phase: number;
  title: string;
  description: string;
  unlocks: string[];
  unlockText: string[];
  requirement: string[];
}

export const PHASES: PhaseDef[] = [
  { phase: 1, title: 'Überleben', description: 'Mieteingänge sichern, dringende Schäden beheben, Liquidität erhalten, Leerstand vermeiden.', unlocks: [], unlockText: [], requirement: [] },
  {
    phase: 2,
    title: 'Stabilisierung',
    description: 'Reparaturstau abbauen, zuverlässige Dienstleister finden, Zufriedenheit verbessern.',
    unlocks: ['energy', 'maintenance_plan', 'software'],
    unlockText: ['Energie & Betriebskosten', 'Wartungsvertrag', 'Verwaltungssoftware (automatisches Mahnwesen)', 'Erste energetische Maßnahmen'],
    requirement: ['3 Monate in Folge kein negativer Kontostand', 'Keine bekannten kritischen Schäden'],
  },
  {
    phase: 3,
    title: 'Optimierung',
    description: 'Energieverbrauch senken, Wartung systematisieren, Renovierungen wirtschaftlich planen.',
    unlocks: ['caretaker', 'big_energy', 'portfolio'],
    unlockText: ['Hausmeister (Teilzeit/Vollzeit)', 'Immobilienmarkt: weitere Objekte kaufen', 'Fassadendämmung, Wärmepumpe, Fernwärme', 'Gemeinschaftsraum, Strangsanierung'],
    requirement: ['Mind. 80 % vermietet', 'Ø Zufriedenheit ≥ 58 %', '2 Monate in Folge positiver operativer Cashflow'],
  },
  {
    phase: 4,
    title: 'Professionalisierung',
    description: 'Verwaltung automatisieren, größere Modernisierungen und Finanzierungsstrategien.',
    unlocks: ['agency', 'solar'],
    unlockText: ['Externe Hausverwaltung', 'Photovoltaik', 'Begrünung'],
    requirement: ['Gebäudezustand ≥ 58 %', 'Ø Zufriedenheit ≥ 62 %', 'Mindestens 12 Monate gespielt'],
  },
  {
    phase: 5,
    title: 'Meisterschaft',
    description: 'Gebäude technisch und wirtschaftlich optimieren, Krisen überstehen, nachhaltig rentabel bleiben.',
    unlocks: ['master'],
    unlockText: ['Meisterziele', 'Expertenkennzahlen'],
    requirement: ['Gebäudezustand ≥ 72 %', 'Ø Zufriedenheit ≥ 70 %', 'Effizienzklasse D oder besser', 'Mindestens 24 Monate gespielt'],
  },
];

export function phaseRequirementsMet(s: GameState, phase: number): boolean {
  const months = s.history.length;
  switch (phase) {
    case 2:
      return (s.counters.liquidStreak ?? 0) >= 3 && !openDefects(s, { discoveredOnly: true }).some((d) => d.severity >= 3);
    case 3:
      return occupiedCount(s) / s.apartments.length >= 0.8 && avgSatisfaction(s) >= 58 && (s.counters.positiveCfStreak ?? 0) >= 2;
    case 4:
      return buildingCondition(s) >= 58 && avgSatisfaction(s) >= 62 && months >= 12;
    case 5:
      return buildingCondition(s) >= 72 && avgSatisfaction(s) >= 70 && energyClassIndex(s) <= 4 && months >= 24;
    default:
      return true;
  }
}

/** Beim Monatsabschluss: Phasenaufstieg prüfen. */
export function updatePhase(s: GameState) {
  while (s.phase < 5 && phaseRequirementsMet(s, s.phase + 1)) {
    s.phase += 1;
    const p = PHASES[s.phase - 1];
    for (const u of p.unlocks) if (!s.unlocks.includes(u)) s.unlocks.push(u);
    addMessage(s, { category: 'goal', severity: 'success', title: `Phase ${p.phase}: ${p.title}`, text: `${p.description} Neu freigeschaltet: ${p.unlockText.join(', ')}.`, important: true, link: { page: 'goals', id: null } });
    log(s, `Phase ${p.phase} (${p.title}) erreicht.`, 'goal');
  }
}

export const hasUnlock = (s: GameState, key: string) => s.unlocks.includes(key) || s.unlocks.includes('all');
