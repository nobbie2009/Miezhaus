import type { GameState, Snapshot } from '@/domain/schema';
import { entriesInPeriod, summarize } from './ledger';
import {
  avgSatisfaction,
  backlogCost,
  buildingCondition,
  equity,
  loanBalance,
  marketValue,
  occupiedCount,
  receivablesByAge,
  targetRent,
  vacancyRate,
} from './derived';
import { computeScore } from './score';

/** Monatsabschluss-Kennzahlen – ausschließlich aus Buchungen und Spielzustand berechnet. */
export function createSnapshot(s: GameState, period: string): Snapshot {
  const entries = entriesInPeriod(s, period);
  const sum = summarize(entries);
  const rentClaims = s.claims.filter((c) => c.kind === 'rent' && c.period === period);
  const age = receivablesByAge(s);
  const energy = s.energyHistory.find((e) => e.period === period);
  const repairCosts = 0 - ((sum.byCategory.repair ?? 0) + (sum.byCategory.maintenance ?? 0) + (sum.byCategory.damage ?? 0));
  return {
    period,
    day: s.day,
    cash: s.cash,
    income: sum.income,
    expenses: sum.expenses,
    operatingCashflow: sum.operatingCashflow,
    financingCashflow: sum.financing,
    investments: sum.investments,
    repairCosts,
    rentDue: rentClaims.reduce((a, c) => a + c.amount, 0),
    rentCollected: rentClaims.reduce((a, c) => a + c.paid, 0),
    arrears: age.d30 + age.d60 + age.d90 + age.over90,
    arrears30: age.d30,
    arrears60: age.d60,
    arrears90: age.d90,
    arrearsOver90: age.over90,
    occupied: occupiedCount(s),
    units: s.apartments.length,
    vacancyRate: vacancyRate(s),
    avgSatisfaction: avgSatisfaction(s),
    buildingCondition: buildingCondition(s),
    backlogCost: backlogCost(s),
    energyKwh: energy ? energy.heatKwh + energy.hotWaterKwh + energy.commonKwh : 0,
    energyCost: energy?.cost ?? 0,
    waterM3: energy?.waterM3 ?? 0,
    marketValue: marketValue(s),
    loanBalance: loanBalance(s),
    equity: equity(s),
    netRentMonthly: targetRent(s),
    score: computeScore(s).total,
  };
}
