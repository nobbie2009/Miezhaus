import type { GameState } from '@/domain/schema';
import { applyAction } from '@/game/actions';
import { applicantFit, maxNewLeaseRent } from '@/game/applicants';
import { comparableRent, defectsOfApartment } from '@/game/derived';
import { rentIncreaseCheck } from '@/game/contracts';
import { offersFor, specFor, type JobRequest } from '@/game/jobs';
import { canDun } from '@/game/payments';
import { advanceDay } from '@/game/simulation';
import { toYmd } from '@/utils/date';
import { CONFIG } from '@/game/config';

function bestOffer(s: GameState, req: JobRequest, minQuality = 3) {
  const spec = specFor(s, req);
  if ('error' in spec) return null;
  const offers = offersFor(s, spec);
  return offers.filter((o) => o.quality >= minQuality).sort((a, b) => a.price - b.price)[0] ?? offers[0] ?? null;
}

export type Bot = (s: GameState) => void;

/** Vernünftige Strategie: Schäden zeitnah reparieren, Wartung, faire Mieten, Leerstand vermeiden. */
export const reasonableBot: Bot = (s) => {
  for (const d of [...s.decisions]) applyAction(s, { type: 'resolveDecision', decisionId: d.id, optionId: d.options.find((o) => o.id === 'support' || o.id === 'talk' || o.id === 'fixed' || o.id === 'yes')?.id ?? d.defaultOptionId });
  const reserve = 300000;
  // Schäden
  for (const d of s.defects.filter((x) => x.resolvedDay === null && x.discovered && !x.jobId).sort((a, b) => b.severity - a.severity)) {
    const o = bestOffer(s, { kind: 'repair', defectId: d.id });
    if (o && (s.cash > reserve + o.price || d.severity >= 2)) applyAction(s, { type: 'createJob', request: { kind: 'repair', defectId: d.id }, contractorId: o.contractorId });
  }
  const { month, day } = toYmd(s.day);
  // Wartung im Sommer
  if (day === 5 && [5, 6, 7, 8].includes(month)) {
    for (const key of ['heating', 'roof', 'pipes', 'electrical', 'stairwell', 'outdoor'] as const) {
      const c = s.building.components[key]!;
      if (c.lastMaintenanceDay !== null && s.day - c.lastMaintenanceDay < 330) continue;
      const o = bestOffer(s, { kind: 'maintenance', component: key });
      if (o && s.cash > reserve + o.price) applyAction(s, { type: 'createJob', request: { kind: 'maintenance', component: key }, contractorId: o.contractorId });
    }
  }
  // Größere Erneuerungen bei stark verschlissenen Bauteilen
  if (day === 15) {
    const map: Record<string, string> = { heating: 'heating_condensing', roof: 'roof_renovation', windows: 'windows_replace', electrical: 'electrical_renewal', stairwell: 'stairwell_upgrade', facade: 'facade_renewal', basement: 'basement_seal' };
    for (const [key, measureId] of Object.entries(map)) {
      const c = s.building.components[key as keyof typeof s.building.components]!;
      if (c.condition > 38) continue;
      if (key === 'heating' && ![5, 6, 7, 8].includes(month)) continue;
      const o = bestOffer(s, { kind: 'measure', measureId });
      if (!o) continue;
      if (s.cash < o.price * 0.4 + reserve) {
        const amount = Math.ceil((o.price + reserve - s.cash) / 100000) * 100000;
        applyAction(s, { type: 'takeLoan', amount: Math.max(amount, 500000), years: 15 });
      }
      if (s.cash > o.price * 0.4 + reserve) applyAction(s, { type: 'createJob', request: { kind: 'measure', measureId }, contractorId: o.contractorId });
    }
  }
  if (s.services.cleaning === 'tenants' && s.building.cleanliness < 45) applyAction(s, { type: 'setService', key: 'cleaning', value: 'biweekly' });
  if (s.services.garden === 'none' && s.building.outdoorCare < 35) applyAction(s, { type: 'setService', key: 'garden', value: 'monthly' });
  // Wohnungen
  for (const a of s.apartments) {
    if (a.status === 'vacant_needs_renovation') {
      const measureId = a.condition < 40 ? 'apt_full' : 'apt_paint';
      const o = bestOffer(s, { kind: 'measure', measureId, apartmentId: a.id }) ?? bestOffer(s, { kind: 'measure', measureId: 'apt_paint', apartmentId: a.id });
      if (!o) continue;
      if (s.cash < o.price * 0.4 + reserve && measureId === 'apt_full') applyAction(s, { type: 'takeLoan', amount: Math.max(500000, Math.ceil(o.price / 100000) * 100000), years: 15 });
      applyAction(s, { type: 'createJob', request: { kind: 'measure', measureId, apartmentId: a.id }, contractorId: o.contractorId });
    }
    if (a.status === 'vacant_ready' && !a.listing) {
      for (const d of defectsOfApartment(s, a.id)) void d;
      applyAction(s, { type: 'inspectApartment', aptId: a.id });
      applyAction(s, { type: 'listApartment', aptId: a.id, askingRent: Math.round(comparableRent(s, a) * 0.98), utilityPrepayment: Math.round(a.area * CONFIG.rent.defaultUtilityPerSqm * 1.2) });
    }
    if (a.listing) {
      const aps = s.applicants.filter((x) => x.apartmentId === a.id && x.maxRent >= a.listing!.askingRent);
      const best = aps.sort((x, y) => applicantFit(s, y, a).score - applicantFit(s, x, a).score)[0];
      if (best && applicantFit(s, best, a).score > 0.45) applyAction(s, { type: 'offerLease', applicantId: best.id, netRent: a.listing.askingRent, utilityPrepayment: a.listing.utilityPrepayment });
    }
  }
  // Mahnwesen
  for (const c of s.claims) if (c.dueDay < s.day - 12 && canDun(s, c).ok && c.dunningLevel < 2) applyAction(s, { type: 'dun', claimId: c.id });
  // Mieterhöhung moderat einmal im Jahr
  if (day === 20 && month === 2) {
    for (const c of s.contracts.filter((x) => x.status === 'active')) {
      const chk = rentIncreaseCheck(s, c);
      if (chk.allowed && chk.maxByComparable > c.netRent * 1.03) applyAction(s, { type: 'rentIncrease', contractId: c.id, newRent: Math.min(chk.maxByComparable, Math.round(c.netRent * 1.08)), kind: 'comparable' });
    }
  }
};

/** Vernachlässigung: keine Reparaturen, maximale Mieten. */
export const neglectBot: Bot = (s) => {
  for (const d of [...s.decisions]) applyAction(s, { type: 'resolveDecision', decisionId: d.id, optionId: d.defaultOptionId });
  for (const a of s.apartments) {
    if (a.status === 'vacant_ready' && !a.listing) applyAction(s, { type: 'listApartment', aptId: a.id, askingRent: maxNewLeaseRent(s, a), utilityPrepayment: Math.round(a.area * CONFIG.rent.defaultUtilityPerSqm) });
    if (a.listing) {
      const ap = s.applicants.find((x) => x.apartmentId === a.id);
      if (ap) applyAction(s, { type: 'offerLease', applicantId: ap.id, netRent: a.listing.askingRent, utilityPrepayment: a.listing.utilityPrepayment });
    }
  }
  const { month, day } = toYmd(s.day);
  if (day === 20) {
    for (const c of s.contracts.filter((x) => x.status === 'active')) {
      const chk = rentIncreaseCheck(s, c);
      if (chk.allowed) applyAction(s, { type: 'rentIncrease', contractId: c.id, newRent: chk.maxByComparable, kind: 'comparable' });
    }
  }
  void month;
};

export const idleBot: Bot = (s) => {
  for (const d of [...s.decisions]) applyAction(s, { type: 'resolveDecision', decisionId: d.id, optionId: d.defaultOptionId });
};

export function runBot(s: GameState, bot: Bot, days: number) {
  for (let i = 0; i < days && !s.gameOver; i++) {
    bot(s);
    advanceDay(s);
  }
  return s;
}
