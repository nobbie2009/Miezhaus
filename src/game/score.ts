import type { GameState } from '@/domain/schema';
import { clamp } from '@/utils/misc';
import {
  avgSatisfaction,
  backlogCost,
  buildingCondition,
  energyClassIndex,
  equityRatio,
  marketValue,
  monthlyFixedCosts,
  monthlyLoanPayments,
  vacancyRate,
} from './derived';

/**
 * Gesamtbewertung 0–1000. Bewertet nicht nur Mieteinnahmen, sondern Stabilität,
 * Substanz, Zufriedenheit, Effizienz und Widerstandsfähigkeit.
 */
export interface ScoreBreakdown {
  total: number;
  parts: { key: string; label: string; value: number; max: number; hint: string }[];
}

export function computeScore(s: GameState): ScoreBreakdown {
  const monthlyOut = monthlyFixedCosts(s) + monthlyLoanPayments(s) + 150000;
  const bufferMonths = s.cash / Math.max(1, monthlyOut);
  const recent = s.history.slice(-6);
  const avgCf = recent.length ? recent.reduce((a, h) => a + h.operatingCashflow, 0) / recent.length : 0;
  const cond = buildingCondition(s);
  const backlogRatio = backlogCost(s) / Math.max(1, marketValue(s) * 0.15);
  const sat = avgSatisfaction(s);
  const eIdx = energyClassIndex(s);
  const vac = vacancyRate(s);
  const eq = equityRatio(s);
  const am = s.building.amenities;
  const eco = (['solar', 'greening', 'rainwater', 'waste_sorting'].filter((x) => am.includes(x)).length / 4) * 0.6 + (['heat_pump', 'district'].includes(s.building.heatingSystem) ? 0.4 : 0);
  const resilience = (s.services.insurance !== 'none' ? 0.35 : 0) + (s.services.maintenancePlan ? 0.25 : 0) + Math.min(1, Math.max(0, bufferMonths) / 4) * 0.4;
  const parts = [
    { key: 'liquidity', label: 'Finanzielle Stabilität', value: Math.round(clamp(bufferMonths / 3, 0, 1) * 120 + (avgCf > 0 ? Math.min(80, (avgCf / 300000) * 80) : 0)), max: 200, hint: `Liquiditätspuffer ${bufferMonths.toFixed(1)} Monate, Ø operativer Cashflow ${Math.round(avgCf / 100).toLocaleString('de-DE')} €` },
    { key: 'condition', label: 'Technischer Zustand', value: Math.round((cond / 100) * 150), max: 150, hint: `Gebäudezustand ${Math.round(cond)} %` },
    { key: 'maintenance', label: 'Instandhaltungsqualität', value: Math.round(clamp(1 - backlogRatio, 0, 1) * 100), max: 100, hint: `Instandhaltungsrückstand ${Math.round(backlogRatio * 100)} % der Toleranz` },
    { key: 'satisfaction', label: 'Mieterzufriedenheit', value: Math.round((sat / 100) * 150), max: 150, hint: `Ø ${Math.round(sat)} %` },
    { key: 'energy', label: 'Energieeffizienz', value: Math.round(((8 - eIdx) / 8) * 100), max: 100, hint: `Effizienzklasse-Index ${eIdx}` },
    { key: 'vacancy', label: 'Vermietungsquote', value: Math.round((1 - vac) * 100), max: 100, hint: `Leerstand ${Math.round(vac * 100)} %` },
    { key: 'debt', label: 'Verschuldung', value: Math.round(clamp(eq, 0, 1) * 100), max: 100, hint: `Eigenkapitalquote ${Math.round(eq * 100)} %` },
    { key: 'eco', label: 'Nachhaltigkeit', value: Math.round(eco * 50), max: 50, hint: 'Erneuerbare Wärme, PV, Begrünung, Ressourcen' },
    { key: 'resilience', label: 'Widerstandsfähigkeit', value: Math.round(resilience * 50), max: 50, hint: 'Versicherung, Wartungsvertrag, Rücklagen' },
  ];
  return { total: parts.reduce((a, p) => a + p.value, 0), parts };
}

export function scoreGrade(total: number): string {
  if (total >= 850) return 'Meistervermieter';
  if (total >= 720) return 'Ausgezeichnet';
  if (total >= 600) return 'Gut';
  if (total >= 450) return 'Solide';
  if (total >= 300) return 'Wackelig';
  return 'Kritisch';
}
