import type { Defect, GameState, Job } from '@/domain/schema';
import { DEFECT_TYPES } from '@/content/defects';
import { formatMoney } from '@/utils/money';
import type { Rng } from '@/utils/rng';
import { CONFIG } from './config';
import { nextId } from './ids';
import { post } from './ledger';
import { addMessage } from './messages';

/** Meldet einen versicherten Schaden. Die Versicherung prüft und entscheidet nach einigen Wochen. */
export function fileInsuranceClaim(s: GameState, d: Defect, j: Job, rng: Rng) {
  if (s.services.insurance === 'none' || d.insuranceClaimed) return;
  const def = DEFECT_TYPES[d.type];
  if (!def.insurable && !s.counters[`insured:${d.id}`]) return;
  d.insuranceClaimed = true;
  const deductible = CONFIG.costs.insuranceDeductible[s.services.insurance];
  // Grobe Fahrlässigkeit: stark verschlissenes Bauteil führt (im Basistarif) zu Kürzungen
  const comp = d.target.kind === 'component' ? s.building.components[d.target.key] : d.escalatedFrom ? null : null;
  const origin = d.escalatedFrom ? s.defects.find((x) => x.id === d.escalatedFrom) : null;
  const originComp = origin?.target.kind === 'component' ? s.building.components[origin.target.key] : comp;
  const neglected = originComp ? originComp.condition < 30 : false;
  const reduction = neglected ? (s.services.insurance === 'basic' ? 0.5 : 0.2) : 0;
  s.insuranceClaims.push({
    id: nextId(s, 'i'),
    defectId: d.id,
    jobId: j.id,
    description: def.label,
    amountClaimed: j.actualCost ?? j.estimatedCost,
    deductible,
    status: 'pending',
    filedDay: s.day,
    decisionDay: s.day + rng.int(14, 40),
    payout: 0,
    reduction,
  });
  addMessage(s, { category: 'finance', title: 'Schaden an Versicherung gemeldet', text: `${def.label}: ${formatMoney(j.actualCost ?? j.estimatedCost)} eingereicht. Selbstbeteiligung ${formatMoney(deductible)}. Die Versicherung prüft den Fall.`, link: { page: 'finance', id: null } });
}

export function processInsuranceClaims(s: GameState) {
  for (const c of s.insuranceClaims) {
    if (c.status !== 'pending' || c.decisionDay > s.day) continue;
    const payout = Math.max(0, Math.round((c.amountClaimed - c.deductible) * (1 - c.reduction)));
    if (payout <= 0) {
      c.status = 'rejected';
      addMessage(s, { category: 'finance', severity: 'warning', title: 'Versicherung zahlt nicht', text: `${c.description}: Der Schaden liegt unter der Selbstbeteiligung.` });
      continue;
    }
    c.status = 'paid';
    c.payout = payout;
    post(s, { category: 'insurance_payout', amount: payout, purpose: `Versicherungsleistung: ${c.description}`, ref: { type: 'insurance', id: c.id } });
    addMessage(s, {
      category: 'finance',
      severity: 'success',
      title: 'Versicherung hat gezahlt',
      text: `${c.description}: ${formatMoney(payout)} erstattet${c.reduction > 0 ? ` – gekürzt um ${Math.round(c.reduction * 100)} % wegen mangelhafter Instandhaltung` : ''}.`,
    });
  }
}
