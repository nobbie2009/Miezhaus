import type { GameState } from '@/domain/schema';
import { DEFECT_TYPES } from '@/content/defects';
import { formatMoney } from '@/utils/money';
import { formatDate } from '@/utils/date';
import { targetLabel } from './defects';
import { activeContracts, apartmentLabel, monthlyFixedCosts, monthlyLoanPayments, overdueReceivables } from './derived';
import { isHeatingSeason } from './weather';
import { annualEnergyCostEstimate } from './energy';

export interface Warning {
  id: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  text: string;
  action?: { label: string; page: string; id?: string | null };
}

export interface LiquidityForecast {
  cash: number;
  inflow: number;
  fixed: number;
  loans: number;
  energy: number;
  jobs: number;
  projected: number;
  collectionRate: number;
}

/** Liquiditätsprognose für die nächsten 30 Tage auf Basis konkreter Zahlen. */
export function liquidityForecast(s: GameState): LiquidityForecast {
  const recent = s.history.slice(-3);
  const due = recent.reduce((a, h) => a + h.rentDue, 0);
  const col = recent.reduce((a, h) => a + h.rentCollected, 0);
  const collectionRate = due > 0 ? Math.min(1, col / due) : 0.95;
  const gross = activeContracts(s).reduce((a, c) => a + c.netRent + c.utilityPrepayment, 0);
  const inflow = Math.round(gross * collectionRate);
  const fixed = monthlyFixedCosts(s) + 2500 + Math.round(s.tenants.filter((t) => t.status !== 'former').reduce((a, t) => a + t.householdSize, 0) * 1150);
  const loans = monthlyLoanPayments(s);
  const e = annualEnergyCostEstimate(s);
  const lastEnergy = s.energyHistory[s.energyHistory.length - 1]?.cost;
  const energy = Math.round(lastEnergy ?? (e.heating + e.electricity) / 12);
  const horizon = s.day + 30;
  const jobs = s.jobs
    .filter((j) => (j.status === 'in_progress' || (j.status === 'scheduled' && j.startDay <= horizon)))
    .reduce((a, j) => a + Math.max(0, j.estimatedCost - j.paid), 0);
  return { cash: s.cash, inflow, fixed, loans, energy, jobs, projected: s.cash + inflow - fixed - loans - energy - jobs, collectionRate };
}

export function computeWarnings(s: GameState): Warning[] {
  const w: Warning[] = [];
  const f = liquidityForecast(s);
  if (s.cash < -s.overdraftLimit) {
    w.push({ id: 'overdraft', severity: 'danger', title: 'Dispositionsrahmen überschritten', text: `Kontostand ${formatMoney(s.cash)} – seit ${s.daysBelowOverdraft} Tagen über dem Dispo. Insolvenz droht nach 45 Tagen.`, action: { label: 'Finanzierung prüfen', page: 'finance' } });
  } else if (s.cash < 0) {
    w.push({ id: 'negative', severity: 'warning', title: 'Konto im Dispo', text: `Kontostand ${formatMoney(s.cash)}. Es fallen ${11.5} % Dispozinsen an.`, action: { label: 'Finanzen öffnen', page: 'finance' } });
  }
  if (f.projected < 0)
    w.push({
      id: 'liquidity',
      severity: f.projected < -s.overdraftLimit ? 'danger' : 'warning',
      title: 'Die Liquidität wird knapp',
      text: `Prognose in 30 Tagen: ${formatMoney(f.projected)} (Konto ${formatMoney(f.cash)} + erwartete Mieten ${formatMoney(f.inflow)} − Fixkosten ${formatMoney(f.fixed)} − Kredite ${formatMoney(f.loans)} − Energie ${formatMoney(f.energy)} − Aufträge ${formatMoney(f.jobs)}).`,
      action: { label: 'Kredit oder Einsparungen prüfen', page: 'finance' },
    });
  if (s.decisions.length) w.push({ id: 'decisions', severity: 'warning', title: `${s.decisions.length} Entscheidung(en) offen`, text: s.decisions.map((d) => d.title).join(' · '), action: { label: 'Entscheiden', page: 'events' } });
  for (const d of s.defects.filter((x) => x.resolvedDay === null && x.discovered && !x.jobId)) {
    const def = DEFECT_TYPES[d.type];
    if (d.severity >= 3) w.push({ id: `crit-${d.id}`, severity: 'danger', title: `${def.label} (${targetLabel(s, d.target)})`, text: `Kritischer Schaden seit ${s.day - (d.discoveredDay ?? s.day)} Tagen ohne Auftrag.${def.rentReduction ? ` Mietminderung bis ${Math.round(def.rentReduction * 100)} %.` : ''}`, action: { label: 'Reparatur beauftragen', page: 'repairs', id: d.id } });
    else if (d.escalateAtDay !== null && d.escalateAtDay - s.day <= 14 && def.escalation)
      w.push({ id: `esc-${d.id}`, severity: 'warning', title: `Folgeschaden droht: ${def.label}`, text: `Ohne Reparatur entsteht in ca. ${Math.max(0, d.escalateAtDay - s.day)} Tagen: ${DEFECT_TYPES[def.escalation.to].label}.`, action: { label: 'Reparatur beauftragen', page: 'repairs', id: d.id } });
  }
  const heat = s.building.components.heating!;
  if (isHeatingSeason(s.day) && heat.condition < 35 && !s.jobs.some((j) => j.target.kind === 'component' && j.target.key === 'heating' && j.status !== 'done' && j.status !== 'cancelled'))
    w.push({ id: 'heating', severity: 'warning', title: 'Heizung ausfallgefährdet', text: `Zustand ${Math.round(heat.condition)} % in der Heizperiode. Ausfälle bei Frost sind wahrscheinlich – Wartung oder Austausch planen.`, action: { label: 'Gebäude ansehen', page: 'building' } });
  const overdue = overdueReceivables(s);
  if (overdue > 0) w.push({ id: 'arrears', severity: overdue > 300000 ? 'warning' : 'info', title: 'Offene Mietforderungen', text: `${formatMoney(overdue)} überfällig.`, action: { label: 'Mahnwesen', page: 'contracts' } });
  for (const a of s.apartments.filter((x) => x.status === 'vacant_ready' && !x.listing)) w.push({ id: `vac-${a.id}`, severity: 'info', title: `${apartmentLabel(a)} steht leer`, text: 'Bezugsfertig, aber nicht inseriert – jeder Tag Leerstand kostet Miete und Nebenkosten.', action: { label: 'Inserieren', page: 'apartments', id: a.id } });
  for (const t of s.tenants.filter((x) => x.status === 'moving_out' && x.moveOutDay !== null && x.moveOutDay - s.day <= 30)) w.push({ id: `mo-${t.id}`, severity: 'info', title: `${t.name} zieht aus`, text: `Auszug am ${formatDate(t.moveOutDay!)}.`, action: { label: 'Mieter', page: 'tenants', id: t.id } });
  for (const t of s.tenants.filter((x) => x.status === 'active' && x.satisfaction < 35)) {
    const worst = Object.entries(t.factors).sort((a, b) => a[1] - b[1])[0];
    w.push({ id: `sat-${t.id}`, severity: 'warning', title: `Kündigungsgefahr: ${t.name}`, text: `Zufriedenheit ${Math.round(t.satisfaction)} %. Größtes Problem: ${worst ? `${worst[0]} (${worst[1]})` : 'unbekannt'}.`, action: { label: 'Mieter ansehen', page: 'tenants', id: t.id } });
  }
  if (s.services.insurance === 'none') w.push({ id: 'insurance', severity: 'info', title: 'Keine Gebäudeversicherung', text: 'Rohrbruch- und Sturmschäden müssen Sie vollständig selbst tragen.', action: { label: 'Dienstleister', page: 'staff' } });
  if (s.endDay !== null && s.endDay - s.day <= 60) w.push({ id: 'deadline', severity: 'warning', title: 'Szenario-Frist läuft ab', text: `Noch ${s.endDay - s.day} Tage bis ${formatDate(s.endDay)}.`, action: { label: 'Ziele', page: 'goals' } });
  const order = { danger: 0, warning: 1, info: 2 };
  return w.sort((a, b) => order[a.severity] - order[b.severity]);
}
