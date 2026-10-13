import type { GameState } from '@/domain/schema';
import { formatPeriodLong, monthKey, toYmd } from '@/utils/date';
import { formatMoney, formatPercent } from '@/utils/money';
import { Rng } from '@/utils/rng';
import { generateComponentDefects, updateApartments, updateCare, wearComponents } from './components';
import { applyPendingIncreases } from './contracts';
import { escalateDefects } from './defects';
import { accumulateEnergy } from './energy';
import { expireDecisions, rollEvents } from './events';
import { annualTax, checkInsolvency, postGlobalMonthlyCosts, postPropertyMonthlyCosts, trackNegativeCash } from './finance';
import { allViews } from './portfolio';
import { runAutomation } from './automation';
import { accrueInvestments, monthlyInvestments } from './investments';
import { updatePropertyMarket } from './realestate';
import { checkScenario, evaluateAchievements, evaluateGoals } from './goals';
import { processInsuranceClaims } from './insurance';
import { caretakerRound, progressJobs } from './jobs';
import { addMessage } from './messages';
import { updateMarketMonthly } from './market';
import { autoDunning, createMonthlyClaims, processPayments, runUtilitySettlement } from './payments';
import { updatePhase } from './progression';
import { createSnapshot } from './snapshot';
import { updateTenantsDaily } from './tenants';
import { updateApplicants } from './applicants';

/**
 * Deterministischer Simulationsschritt über genau einen Spieltag.
 * Mutiert den übergebenen (bereits kopierten) Zustand.
 */
export function advanceDay(s: GameState): void {
  if (s.gameOver) return;
  const rng = new Rng(s);
  s.day += 1;
  const { day: dom, month, year } = toYmd(s.day);

  const views = allViews(s);
  // --- Monatsbeginn
  if (dom === 1) {
    for (const v of views) createMonthlyClaims(v, rng);
    if (month === 1) {
      const prev = s.counters.rentIndexRef ?? s.market.baseRentPerSqm;
      const delta = (s.market.baseRentPerSqm - prev) / Math.max(1, prev);
      s.counters.rentIndexRef = s.market.baseRentPerSqm;
      addMessage(s, { category: 'system', title: `Neuer Mietspiegel ${year}`, text: `Die ortsübliche Vergleichsmiete liegt jetzt bei ${formatMoney(s.market.baseRentPerSqm)} pro m² (Basis, ${delta >= 0 ? '+' : ''}${formatPercent(delta, 1)} gegenüber dem Vorjahr). Prüfen Sie mögliche Mietanpassungen unter „Verträge“.`, link: { page: 'contracts', id: null } });
    }
    if (month === 3) for (const v of views) runUtilitySettlement(v, year - 1);
  }
  if (month === 4 && dom === 30) annualTax(s, year - 1);

  // --- Tagesablauf je Objekt
  for (const v of views) {
    applyPendingIncreases(v);
    wearComponents(v);
    updateCare(v);
    generateComponentDefects(v, rng);
    updateApartments(v, rng);
    escalateDefects(v, rng);
    progressJobs(v, rng);
    caretakerRound(v, rng);
    updateTenantsDaily(v, rng);
    processPayments(v, rng);
    autoDunning(v);
    runAutomation(v, rng);
    updateApplicants(v, rng);
    accumulateEnergy(v);
    processInsuranceClaims(v);
    rollEvents(v, rng, v === s);
  }
  // --- Gemeinsame Abläufe
  accrueInvestments(s, rng);
  updatePropertyMarket(s, rng);
  expireDecisions(s, rng);

  trackNegativeCash(s);
  s.counters.monthMinCash = Math.min(s.counters.monthMinCash ?? s.cash, s.cash);
  checkInsolvency(s);
  evaluateGoals(s, false);
  if (s.day % 7 === 0) evaluateAchievements(s);

  // --- Monatsende (letzter Tag des Monats)
  if (toYmd(s.day + 1).day === 1) monthlyClose(s, monthKey(s.day), rng);
  checkScenario(s);
}

export function monthlyClose(s: GameState, period: string, rng: Rng) {
  if (s.history.some((h) => h.period === period)) return;
  for (const v of allViews(s)) {
    postPropertyMonthlyCosts(v, period);
    pruneHistory(v);
  }
  postGlobalMonthlyCosts(s, period);
  monthlyInvestments(s, rng, period);
  updateMarketMonthly(s, rng);
  const snap = createSnapshot(s, period);
  s.history.push(snap);
  s.counters.liquidStreak = (s.counters.monthMinCash ?? 0) >= 0 ? (s.counters.liquidStreak ?? 0) + 1 : 0;
  s.counters.positiveCfStreak = snap.operatingCashflow > 0 ? (s.counters.positiveCfStreak ?? 0) + 1 : 0;
  evaluateGoals(s, true);
  updatePhase(s);
  evaluateAchievements(s);
  const collection = snap.rentDue > 0 ? snap.rentCollected / snap.rentDue : 1;
  addMessage(s, {
    category: 'finance',
    severity: snap.operatingCashflow >= 0 ? 'info' : 'warning',
    title: `Monatsabschluss ${formatPeriodLong(period)}`,
    text: `Einnahmen ${formatMoney(snap.income)}, Ausgaben ${formatMoney(-snap.expenses)}. Operativer Cashflow ${formatMoney(snap.operatingCashflow)}, Investitionen ${formatMoney(-snap.investments)}. Mieteingang ${formatPercent(collection)} der Sollmiete. Kontostand ${formatMoney(snap.cash)}.`,
    link: { page: 'finance', id: null },
  });
  s.counters.monthMinCash = s.cash;
}

/** Hält den Spielstand schlank: alte, abgeschlossene Vorgänge werden entfernt (Buchungen bleiben vollständig). */
function pruneHistory(s: GameState) {
  const cut = s.day - 730;
  s.defects = s.defects.filter((d) => d.resolvedDay === null || d.resolvedDay > cut);
  s.jobs = s.jobs.filter((j) => (j.status !== 'done' && j.status !== 'cancelled') || (j.completedDay ?? s.day) > s.day - 1095);
  s.claims = s.claims.filter((c) => (c.status !== 'paid' && c.status !== 'written_off') || c.createdDay > s.day - 1095);
  s.insuranceClaims = s.insuranceClaims.filter((c) => c.status === 'pending' || c.decisionDay > cut);
  if (s.building.repairHistory.length > 300) s.building.repairHistory.splice(0, s.building.repairHistory.length - 300);
}

export type StopReason = 'done' | 'decision' | 'gameover' | 'critical';

/**
 * Mehrere Tage simulieren. Jeder Tag wird vollständig berechnet –
 * Zeitsprünge überspringen keine Abrechnungen oder Ereignisse.
 */
export function advanceDays(s: GameState, days: number, opts: { stopOnDecision?: boolean; stopOnCritical?: boolean } = {}): { days: number; reason: StopReason } {
  let n = 0;
  for (; n < days; n++) {
    if (s.gameOver) return { days: n, reason: 'gameover' };
    if (opts.stopOnDecision && s.decisions.length > 0) return { days: n, reason: 'decision' };
    const msgsBefore = s.messages.length;
    advanceDay(s);
    if (opts.stopOnCritical && s.messages.slice(msgsBefore).some((m) => m.severity === 'danger' && m.important)) return { days: n + 1, reason: 'critical' };
  }
  if (s.gameOver) return { days: n, reason: 'gameover' };
  return { days: n, reason: 'done' };
}
