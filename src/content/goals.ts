import type { GameState, GoalState } from '@/domain/schema';
import {
  activeContracts,
  avgSatisfaction,
  backlogCost,
  buildingCondition,
  energyClassIndex,
  loanBalance,
  occupiedCount,
  openDefects,
  overdueReceivables,
  specificEnergyDemand,
} from '@/game/derived';
import { computeScore } from '@/game/score';
import { formatMoney } from '@/utils/money';
import { monthKey } from '@/utils/date';

/**
 * Zieldefinitionen. `evaluate` liefert den Fortschritt (0–1). Zähler-Ziele werden
 * zum Monatsabschluss fortgeschrieben (`monthly`), alle anderen täglich geprüft.
 */
export interface GoalDef {
  id: string;
  title: string;
  description: string;
  horizon: 'short' | 'mid' | 'long';
  monthly?: boolean;
  evaluate: (s: GameState, g: GoalState) => number;
}

const ratio = (v: number, target: number) => Math.max(0, Math.min(1, v / target));
const below = (v: number, target: number, start: number) => (v <= target ? 1 : Math.max(0, Math.min(0.99, (start - v) / Math.max(1, start - target))));

/** Zähler für aufeinanderfolgende Monate fortschreiben. */
const streak = (g: GoalState, ok: boolean, need: number) => {
  g.counter = ok ? g.counter + 1 : 0;
  return ratio(g.counter, need);
};

const lastMonth = (s: GameState) => s.history[s.history.length - 1];

const satGoal = (target: number, horizon: GoalDef['horizon']): GoalDef => ({
  id: `sat_${target}`,
  title: `Zufriedenheit ${target} %`,
  description: `Durchschnittliche Mieterzufriedenheit von mindestens ${target} % zum Monatsende.`,
  horizon,
  monthly: true,
  evaluate: (s) => ratio(avgSatisfaction(s), target),
});

const backlogGoal = (k: number, horizon: GoalDef['horizon']): GoalDef => ({
  id: `backlog_${k}k`,
  title: `Reparaturstau unter ${k}.000 €`,
  description: `Instandhaltungsrückstand (offene Schäden und stark verschlissene Bauteile) unter ${formatMoney(k * 100000, { decimals: false })} senken.`,
  horizon,
  evaluate: (s, g) => {
    if (!g.counter) g.counter = Math.max(backlogCost(s), k * 100000 + 1);
    return below(backlogCost(s), k * 100000, g.counter);
  },
});

const condGoal = (target: number, horizon: GoalDef['horizon']): GoalDef => ({
  id: `condition_${target}`,
  title: `Gebäudezustand ${target} %`,
  description: `Den gewichteten Zustand aller Gebäudekomponenten auf mindestens ${target} % bringen.`,
  horizon,
  evaluate: (s, g) => {
    if (!g.counter) g.counter = Math.min(buildingCondition(s), target - 1);
    const v = buildingCondition(s);
    return v >= target ? 1 : Math.max(0, Math.min(0.99, (v - g.counter) / (target - g.counter)));
  },
});

export const GOALS: GoalDef[] = [
  {
    id: 'first_rent',
    title: 'Erste Mieteingänge sichern',
    description: 'Mindestens 90 % der Sollmiete des ersten vollen Monats einnehmen.',
    horizon: 'short',
    evaluate: (s) => {
      const period = monthKey(s.day);
      const claims = s.claims.filter((c) => c.kind === 'rent' && c.period === period);
      const due = claims.reduce((a, c) => a + c.amount, 0);
      const paid = claims.reduce((a, c) => a + c.paid, 0);
      const h = s.history.find((x) => x.rentDue > 0);
      if (h && h.rentCollected / Math.max(1, h.rentDue) >= 0.9) return 1;
      return due > 0 ? Math.min(0.99, ratio(paid / due, 0.9)) : 0;
    },
  },
  {
    id: 'fix_urgent',
    title: 'Dringende Schäden beheben',
    description: 'Alle bekannten erheblichen und kritischen Schäden beauftragen bzw. beheben.',
    horizon: 'short',
    evaluate: (s, g) => {
      const open = openDefects(s, { discoveredOnly: true }).filter((d) => d.severity >= 2 && !d.jobId).length;
      g.counter = Math.max(g.counter, open);
      return open === 0 ? 1 : 1 - open / Math.max(1, g.counter);
    },
  },
  {
    id: 'liquid_3',
    title: 'Drei Monate liquide',
    description: 'Drei Monate in Folge ohne negativen Kontostand.',
    horizon: 'short',
    monthly: true,
    evaluate: (s, g) => streak(g, (s.counters.monthMinCash ?? 0) >= 0, 3),
  },
  {
    id: 'liquid_6',
    title: 'Sechs Monate liquide',
    description: 'Sechs Monate in Folge ohne negativen Kontostand.',
    horizon: 'mid',
    monthly: true,
    evaluate: (s, g) => streak(g, (s.counters.monthMinCash ?? 0) >= 0, 6),
  },
  {
    id: 'full_occupancy',
    title: 'Volles Haus',
    description: 'Alle Wohnungen sind vermietet.',
    horizon: 'short',
    evaluate: (s) => ratio(occupiedCount(s), s.apartments.length),
  },
  {
    id: 'occupancy_90',
    title: 'Vermietungsquote 90 %',
    description: 'Mindestens 90 % der Wohnungen zum Monatsende vermietet.',
    horizon: 'mid',
    monthly: true,
    evaluate: (s) => ratio(occupiedCount(s) / s.apartments.length, 0.9),
  },
  satGoal(60, 'short'),
  satGoal(65, 'mid'),
  satGoal(70, 'mid'),
  satGoal(72, 'mid'),
  satGoal(80, 'long'),
  backlogGoal(5, 'mid'),
  backlogGoal(10, 'mid'),
  backlogGoal(15, 'mid'),
  condGoal(65, 'mid'),
  condGoal(70, 'long'),
  condGoal(85, 'long'),
  {
    id: 'payment_98',
    title: 'Zahlungsquote 98 %',
    description: 'In den letzten drei Monaten mindestens 98 % der Sollmiete eingenommen.',
    horizon: 'mid',
    monthly: true,
    evaluate: (s) => {
      const h = s.history.slice(-3);
      if (h.length < 3) return ratio(h.length, 3) * 0.5;
      const due = h.reduce((a, x) => a + x.rentDue, 0);
      const col = h.reduce((a, x) => a + x.rentCollected, 0);
      return ratio(col / Math.max(1, due), 0.98);
    },
  },
  {
    id: 'surplus_6',
    title: 'Sechs Monate Überschuss',
    description: 'Sechs Monate in Folge mit positivem operativem Cashflow.',
    horizon: 'mid',
    monthly: true,
    evaluate: (s, g) => streak(g, (lastMonth(s)?.operatingCashflow ?? -1) > 0, 6),
  },
  {
    id: 'arrears_2k',
    title: 'Rückstände unter 2.000 €',
    description: 'Überfällige Mietforderungen zum Monatsende unter 2.000 €.',
    horizon: 'mid',
    monthly: true,
    evaluate: (s, g) => {
      if (!g.counter) g.counter = Math.max(overdueReceivables(s), 200001);
      return below(overdueReceivables(s), 200000, g.counter);
    },
  },
  {
    id: 'caretaker',
    title: 'Hausmeister einstellen',
    description: 'Einen Hausmeister beschäftigen, der Kleinreparaturen übernimmt und Mängel früh erkennt.',
    horizon: 'mid',
    evaluate: (s) => (s.services.caretaker !== 'none' ? 1 : 0),
  },
  {
    id: 'energy_30',
    title: 'Energiebedarf −30 %',
    description: 'Endenergiebedarf (kWh/m²·a, Standardklima) um 30 % gegenüber Spielstart senken.',
    horizon: 'long',
    evaluate: (s) => ratio((s.counters.startEnergyDemand - specificEnergyDemand(s)) / Math.max(1, s.counters.startEnergyDemand), 0.3),
  },
  {
    id: 'energy_35',
    title: 'Energiebedarf −35 %',
    description: 'Endenergiebedarf um 35 % gegenüber Spielstart senken.',
    horizon: 'long',
    evaluate: (s) => ratio((s.counters.startEnergyDemand - specificEnergyDemand(s)) / Math.max(1, s.counters.startEnergyDemand), 0.35),
  },
  {
    id: 'class_c',
    title: 'Effizienzklasse C',
    description: 'Das Gebäude erreicht mindestens Energieeffizienzklasse C.',
    horizon: 'long',
    evaluate: (s) => (energyClassIndex(s) <= 3 ? 1 : Math.max(0, Math.min(0.99, (8 - energyClassIndex(s)) / 5))),
  },
  {
    id: 'loan_repaid',
    title: 'Einen Kredit tilgen',
    description: 'Mindestens ein Darlehen vollständig zurückzahlen.',
    horizon: 'long',
    evaluate: (s) => {
      if ((s.counters.loansRepaid ?? 0) > 0) return 1;
      const l = s.loans.filter((x) => x.remaining > 0).sort((a, b) => a.remaining / a.principal - b.remaining / b.principal)[0];
      return l ? Math.min(0.99, 1 - l.remaining / l.principal) : loanBalance(s) === 0 && s.loans.length ? 1 : 0;
    },
  },
  {
    id: 'full_renovation',
    title: 'Vollständig saniert',
    description: 'Gebäudezustand ≥ 85 % und alle Wohnungen ≥ 80 %.',
    horizon: 'long',
    evaluate: (s) => {
      const b = Math.min(1, buildingCondition(s) / 85);
      const a = s.apartments.filter((x) => x.condition >= 80).length / s.apartments.length;
      return Math.min(1, (b + a) / 2) === 1 ? 1 : Math.min(0.99, (b + a) / 2);
    },
  },
  {
    id: 'stable_24',
    title: 'Langfristig stabil',
    description: '24 Monate in Folge eine Gesamtbewertung von mindestens 600 Punkten.',
    horizon: 'long',
    monthly: true,
    evaluate: (s, g) => streak(g, computeScore(s).total >= 600, 24),
  },
  {
    id: 'contracts_stable',
    title: 'Treue Mieter',
    description: 'Fünf Mietverhältnisse laufen seit mindestens drei Jahren.',
    horizon: 'long',
    evaluate: (s) => ratio(activeContracts(s).filter((c) => s.day - c.startDay >= 3 * 365).length, 5),
  },
];

export const GOAL_BY_ID: Record<string, GoalDef> = Object.fromEntries(GOALS.map((g) => [g.id, g]));

export const DEFAULT_GOALS = ['first_rent', 'fix_urgent', 'liquid_3', 'full_occupancy', 'sat_70', 'backlog_10k', 'payment_98', 'surplus_6', 'caretaker', 'energy_30', 'loan_repaid', 'full_renovation', 'stable_24', 'contracts_stable'];

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  check: (s: GameState) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_lease', title: 'Erster Mietvertrag', description: 'Einen neuen Mieter gefunden.', icon: 'key', check: (s) => (s.counters.newLeases ?? 0) >= 1 },
  { id: 'full_house', title: 'Volles Haus', description: 'Alle Wohnungen gleichzeitig vermietet.', icon: 'home', check: (s) => occupiedCount(s) === s.apartments.length },
  { id: 'one_year', title: 'Ein Jahr geschafft', description: 'Zwölf Monate als Vermieter überstanden.', icon: 'calendar', check: (s) => s.history.length >= 12 },
  { id: 'five_years', title: 'Fünf Jahre', description: '60 Monate erfolgreich bewirtschaftet.', icon: 'award', check: (s) => s.history.length >= 60 },
  { id: 'beloved', title: 'Beliebter Vermieter', description: 'Ø Zufriedenheit von 85 % erreicht.', icon: 'heart', check: (s) => avgSatisfaction(s) >= 85 && occupiedCount(s) > 0 },
  { id: 'renovator', title: 'Sanierungsprofi', description: 'Zehn Renovierungen oder Modernisierungen abgeschlossen.', icon: 'hammer', check: (s) => (s.counters.measuresDone ?? 0) >= 10 },
  { id: 'green_b', title: 'Grüne Hausnummer', description: 'Energieeffizienzklasse B oder besser.', icon: 'leaf', check: (s) => energyClassIndex(s) <= 2 },
  { id: 'solar', title: 'Sonnenkraftwerk', description: 'Photovoltaikanlage in Betrieb genommen.', icon: 'sun', check: (s) => s.building.amenities.includes('solar') },
  { id: 'debt_free', title: 'Schuldenfrei', description: 'Alle Kredite zurückgezahlt.', icon: 'landmark', check: (s) => s.loans.length > 0 && loanBalance(s) === 0 },
  { id: 'caretaker', title: 'Hausmeister an Bord', description: 'Einen Hausmeister eingestellt.', icon: 'wrench', check: (s) => s.services.caretaker !== 'none' },
  { id: 'thanks10', title: 'Mieterliebling', description: 'Zehn Dankesnachrichten erhalten.', icon: 'smile', check: (s) => (s.counters.thanks ?? 0) >= 10 },
  { id: 'no_arrears', title: 'Pünktlich bezahlt', description: 'Sechs Monate in Folge ohne überfällige Forderungen zum Monatsende.', icon: 'check', check: (s) => s.history.length >= 6 && s.history.slice(-6).every((h) => h.arrears === 0) },
  { id: 'score750', title: 'Musterhaus', description: 'Gesamtbewertung von 750 Punkten erreicht.', icon: 'star', check: (s) => computeScore(s).total >= 750 },
  { id: 'referral', title: 'Mundpropaganda', description: 'Ein Mieter hat das Haus weiterempfohlen.', icon: 'megaphone', check: (s) => (s.counters.referrals ?? 0) >= 1 },
  { id: 'master', title: 'Meisterschaft', description: 'Phase 5 erreicht.', icon: 'crown', check: (s) => s.phase >= 5 },
];
