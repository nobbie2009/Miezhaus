import type { GameState, Snapshot } from '@/domain/schema';
import { entriesInPeriod, summarize } from './ledger';
import { allViews } from './portfolio';
import {
  activeTenants,
  portfolioValue,
  avgSatisfaction,
  backlogCost,
  buildingCondition,
  equity,
  loanBalance,
  occupiedCount,
  receivablesByAge,
  targetRent,
  vacancyRate,
} from './derived';
import { computeScore } from './score';

const sumBy = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);

/** Monatsabschluss-Kennzahlen – ausschließlich aus Buchungen und Spielzustand berechnet. */
export function createSnapshot(s: GameState, period: string): Snapshot {
  const entries = entriesInPeriod(s, period);
  const sum = summarize(entries);
  // Kennzahlen über das gesamte Portfolio
  const views = allViews(s);
  const rentClaims = views.flatMap((v) => v.claims.filter((c) => c.kind === 'rent' && c.period === period));
  const ages = views.map((v) => receivablesByAge(v));
  const age = { d30: sumBy(ages, (a) => a.d30), d60: sumBy(ages, (a) => a.d60), d90: sumBy(ages, (a) => a.d90), over90: sumBy(ages, (a) => a.over90) };
  const energies = views.map((v) => v.energyHistory.find((e) => e.period === period)).filter((e) => !!e);
  const units = sumBy(views, (v) => v.apartments.length);
  const occupied = sumBy(views, (v) => occupiedCount(v));
  const tenantsN = sumBy(views, (v) => activeTenants(v).length);
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
    occupied,
    units,
    vacancyRate: views.length === 1 ? vacancyRate(s) : 1 - occupied / Math.max(1, units),
    avgSatisfaction: views.length === 1 ? avgSatisfaction(s) : sumBy(views, (v) => avgSatisfaction(v) * activeTenants(v).length) / Math.max(1, tenantsN),
    buildingCondition: views.length === 1 ? buildingCondition(s) : sumBy(views, (v) => buildingCondition(v) * v.apartments.length) / Math.max(1, units),
    backlogCost: sumBy(views, (v) => backlogCost(v)),
    energyKwh: sumBy(energies, (e) => e.heatKwh + e.hotWaterKwh + e.commonKwh),
    energyCost: sumBy(energies, (e) => e.cost),
    waterM3: sumBy(energies, (e) => e.waterM3),
    marketValue: portfolioValue(s),
    loanBalance: loanBalance(s),
    equity: equity(s),
    netRentMonthly: sumBy(views, (v) => targetRent(v)),
    score: computeScore(s).total,
  };
}
