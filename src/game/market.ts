import type { GameState } from '@/domain/schema';
import { toYmd } from '@/utils/date';
import type { Rng } from '@/utils/rng';
import { clamp } from '@/utils/misc';

/** Monatliche Marktentwicklung: Mieten, Baupreise, Energie und Zinsen. */
export function updateMarketMonthly(s: GameState, rng: Rng) {
  const m = s.market;
  m.baseRentPerSqm = Math.round(m.baseRentPerSqm * (1 + 0.0016 + rng.range(-0.0008, 0.0008)));
  m.materialIndex = Math.round(m.materialIndex * (1 + 0.0018 + rng.range(-0.001, 0.0015)) * 10000) / 10000;
  const trend = s.counters.energyTrend ?? 0;
  const drift = (1 - m.energyPriceIndex) * 0.03 + trend + rng.range(-0.015, 0.015);
  m.energyPriceIndex = Math.round(clamp(m.energyPriceIndex * (1 + drift), 0.6, 3) * 10000) / 10000;
  const { month } = toYmd(s.day);
  if (month % 3 === 1) m.interestRate = Math.round(clamp(m.interestRate + rng.range(-0.0025, 0.0028), 0.01, 0.09) * 10000) / 10000;
  m.demandIndex = Math.round(clamp(m.demandIndex + rng.range(-0.02, 0.02) + (1 - m.demandIndex) * 0.05, 0.7, 1.3) * 1000) / 1000;
  m.modifiers = m.modifiers.filter((x) => x.untilDay >= s.day);
}
