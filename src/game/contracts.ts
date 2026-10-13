import type { Contract, GameState } from '@/domain/schema';
import { TEXTS } from '@/content/texts';
import { addMonths, firstOfMonth, formatDate, monthsBetween } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import type { Rng } from '@/utils/rng';
import { CONFIG } from './config';
import { apartmentLabel, comparableRent } from './derived';
import { post } from './ledger';
import { addMessage, fill, log } from './messages';
import { contractArrears } from './payments';
import { addMood } from './tenants';

/**
 * Vereinfachtes Mietrecht für die Spielsimulation – keine rechtsverbindliche Beratung.
 */
export interface RentIncreaseCheck {
  allowed: boolean;
  reasons: string[];
  currentRent: number;
  comparable: number;
  /** Höchstmiete nach Vergleichsmiete und Kappungsgrenze. */
  maxByComparable: number;
  /** Möglicher Modernisierungszuschlag pro Monat. */
  maxModernization: number;
  earliestDay: number;
}

export function rentIncreaseCheck(s: GameState, c: Contract): RentIncreaseCheck {
  const a = s.apartments.find((x) => x.id === c.apartmentId)!;
  const comparable = comparableRent(s, a);
  const reasons: string[] = [];
  const ref = c.lastRentIncreaseDay ?? c.startDay;
  const earliestDay = addMonths(ref, CONFIG.rent.minMonthsBetweenIncreases);
  // Kappungsgrenze: Miete vor 3 Jahren (oder bei Vertragsbeginn) * 1,2
  const threeYearsAgo = addMonths(s.day, -12 * CONFIG.rent.cappingYears);
  const hist = [...c.rentHistory].filter((h) => h.day <= threeYearsAgo).sort((x, y) => y.day - x.day)[0] ?? c.rentHistory[0];
  const cap = Math.round(hist.netRent * (1 + CONFIG.rent.cappingLimit));
  const maxByComparable = Math.max(c.netRent, Math.min(comparable, cap));
  const modCap = Math.round(a.area * CONFIG.rent.modernizationCapPerSqm);
  const maxModernization = Math.min(Math.round((a.modernizationPool * CONFIG.rent.modernizationRate) / 12), modCap);
  if (c.status !== 'active') reasons.push('Der Vertrag ist gekündigt.');
  if (c.pendingIncrease) reasons.push('Es ist bereits eine Mieterhöhung angekündigt.');
  if (s.day < earliestDay && maxModernization <= 0) reasons.push(`Frühestens ab ${formatDate(earliestDay)} (12 Monate nach letzter Anpassung).`);
  if (maxByComparable <= c.netRent && maxModernization <= 0) reasons.push('Die Miete liegt bereits auf Höhe der Vergleichsmiete bzw. Kappungsgrenze.');
  return { allowed: reasons.length === 0, reasons, currentRent: c.netRent, comparable, maxByComparable: s.day >= earliestDay ? maxByComparable : c.netRent, maxModernization, earliestDay };
}

/** Kündigt eine Mieterhöhung an. Wirksam zum Monatsersten nach Ablauf der Frist. */
export function announceRentIncrease(s: GameState, c: Contract, newRent: number, kind: 'comparable' | 'modernization', rng: Rng): { ok: boolean; error?: string } {
  const chk = rentIncreaseCheck(s, c);
  if (c.status !== 'active') return { ok: false, error: 'Der Vertrag ist gekündigt.' };
  if (c.pendingIncrease) return { ok: false, error: 'Es ist bereits eine Mieterhöhung angekündigt.' };
  newRent = Math.round(newRent / 100) * 100;
  if (newRent <= c.netRent) return { ok: false, error: 'Die neue Miete muss höher sein als die aktuelle.' };
  const limit = kind === 'comparable' ? chk.maxByComparable : c.netRent + chk.maxModernization;
  if (kind === 'comparable' && s.day < chk.earliestDay) return { ok: false, error: chk.reasons[0] ?? 'Noch nicht zulässig.' };
  if (newRent > limit) return { ok: false, error: `Höchstens ${formatMoney(limit)} zulässig (${kind === 'comparable' ? 'Vergleichsmiete/Kappungsgrenze' : 'Modernisierungsumlage'}).` };
  const t = s.tenants.find((x) => x.id === c.tenantId)!;
  const a = s.apartments.find((x) => x.id === c.apartmentId)!;
  const effectiveDay = addMonths(firstOfMonth(s.day), 3);
  c.pendingIncrease = { newRent, effectiveDay, announcedDay: s.day, kind, modernizationUsed: kind === 'modernization' ? Math.round(((newRent - c.netRent) * 12) / CONFIG.rent.modernizationRate) : 0 };
  c.changes.push({ day: s.day, text: `Mieterhöhung angekündigt: ${formatMoney(c.netRent)} → ${formatMoney(newRent)} zum ${formatDate(effectiveDay)} (${kind === 'comparable' ? 'Vergleichsmiete' : 'Modernisierung'}).` });
  // Reaktion des Mieters
  const pct = (newRent - c.netRent) / c.netRent;
  const affordability = (newRent + c.utilityPrepayment) / Math.max(1, t.monthlyIncome);
  const severity = pct * 100 * (0.4 + t.traits.frugality / 100) * (kind === 'modernization' ? 0.6 : 1) + (affordability > 0.4 ? 6 : 0);
  addMood(t, s.day, 'Mieterhöhung', -Math.round(severity), 150);
  const critical = severity > 6 || t.satisfaction < 50;
  addMessage(s, {
    category: 'tenant',
    severity: critical ? 'warning' : 'info',
    title: `${t.name} zur Mieterhöhung`,
    text: fill(rng.pick(critical ? TEXTS.rentIncreaseCritical : TEXTS.rentIncreaseAccept), {}),
    tenantId: t.id,
    apartmentId: a.id,
    link: { page: 'contracts', id: c.id },
  });
  log(s, `Mieterhöhung für ${apartmentLabel(a)} angekündigt (+${Math.round(pct * 100)} %).`, 'contract');
  return { ok: true };
}

export function applyPendingIncreases(s: GameState) {
  for (const c of s.contracts) {
    const p = c.pendingIncrease;
    if (!p || p.effectiveDay > s.day) continue;
    if (c.status !== 'active') {
      c.pendingIncrease = null;
      continue;
    }
    const a = s.apartments.find((x) => x.id === c.apartmentId)!;
    c.rentHistory.push({ day: s.day, netRent: p.newRent, utilityPrepayment: c.utilityPrepayment, reason: p.kind === 'comparable' ? 'Anpassung an Vergleichsmiete' : 'Modernisierungsumlage' });
    c.changes.push({ day: s.day, text: `Neue Nettokaltmiete wirksam: ${formatMoney(p.newRent)}.` });
    c.netRent = p.newRent;
    c.lastRentIncreaseDay = s.day;
    if (p.kind === 'modernization') a.modernizationPool = Math.max(0, a.modernizationPool - p.modernizationUsed);
    c.pendingIncrease = null;
  }
}

export function agreePaymentPlan(s: GameState, c: Contract, monthlyAmount: number): { ok: boolean; error?: string } {
  const arrears = contractArrears(s, c);
  if (arrears <= 0) return { ok: false, error: 'Es bestehen keine Rückstände.' };
  if (c.paymentPlan) return { ok: false, error: 'Es besteht bereits eine Ratenzahlung.' };
  if (monthlyAmount < Math.ceil(arrears / 12)) return { ok: false, error: `Die Rate muss mindestens ${formatMoney(Math.ceil(arrears / 12))} betragen (max. 12 Monate Laufzeit).` };
  c.paymentPlan = { monthlyAmount: Math.round(monthlyAmount), startDay: s.day };
  c.changes.push({ day: s.day, text: `Ratenzahlung vereinbart: ${formatMoney(monthlyAmount)} monatlich für Rückstände von ${formatMoney(arrears)}.` });
  const t = s.tenants.find((x) => x.id === c.tenantId);
  if (t) {
    addMood(t, s.day, 'Ratenzahlung vereinbart', 5, 120);
    t.financialStress = Math.max(0, t.financialStress - 12);
  }
  return { ok: true };
}

/** Außerordentliche Kündigung wegen Zahlungsverzug (vereinfacht: ab zwei Monatsmieten Rückstand). */
export function terminateForArrears(s: GameState, c: Contract): { ok: boolean; error?: string } {
  if (c.status !== 'active') return { ok: false, error: 'Der Vertrag ist bereits gekündigt.' };
  const arrears = contractArrears(s, c);
  const threshold = (c.netRent + c.utilityPrepayment) * CONFIG.dunning.terminationArrearsMonths;
  if (arrears < threshold) return { ok: false, error: `Kündigung erst ab ${formatMoney(threshold)} Rückstand möglich (aktuell ${formatMoney(arrears)}).` };
  const t = s.tenants.find((x) => x.id === c.tenantId)!;
  const a = s.apartments.find((x) => x.id === c.apartmentId)!;
  post(s, { category: 'legal', amount: -CONFIG.dunning.legalCost, purpose: `Fristlose Kündigung ${apartmentLabel(a)} (${t.name})`, apartmentId: a.id, ref: { type: 'contract', id: c.id } });
  const moveOut = s.day + 60;
  c.status = 'notice';
  c.noticeDay = s.day;
  c.endDay = moveOut;
  c.terminatedBy = 'landlord';
  c.changes.push({ day: s.day, text: `Fristlose Kündigung wegen Zahlungsverzug. Räumung bis ${formatDate(moveOut)}.` });
  t.status = 'moving_out';
  t.noticeDay = s.day;
  t.moveOutDay = moveOut;
  t.moveOutReason = 'Kündigung durch Vermieter (Zahlungsverzug)';
  for (const other of s.tenants) if (other.status === 'active' && other.id !== t.id) addMood(other, s.day, 'Unruhe im Haus', -1, 30);
  log(s, `Fristlose Kündigung an ${t.name} wegen ${formatMoney(arrears)} Rückstand.`, 'contract');
  return { ok: true };
}

/** Bietet einen Mietaufhebungsvertrag gegen Abfindung an. */
export function offerMutualTermination(s: GameState, c: Contract, compensation: number, rng: Rng): { ok: boolean; accepted?: boolean; error?: string } {
  if (c.status !== 'active') return { ok: false, error: 'Der Vertrag ist bereits gekündigt.' };
  const t = s.tenants.find((x) => x.id === c.tenantId)!;
  const months = compensation / Math.max(1, c.netRent);
  const p = Math.min(0.95, Math.max(0.03, (months - 1) * 0.18 + (60 - t.satisfaction) / 120 + t.traits.moveOutTendency / 250));
  const accepted = rng.chance(p);
  if (!accepted) {
    addMood(t, s.day, 'Auszug nahegelegt', -6, 90);
    c.changes.push({ day: s.day, text: `Aufhebungsangebot über ${formatMoney(compensation)} abgelehnt.` });
    return { ok: true, accepted: false };
  }
  post(s, { category: 'compensation', amount: -Math.round(compensation), purpose: `Abfindung Mietaufhebung (${t.name})`, apartmentId: c.apartmentId, ref: { type: 'contract', id: c.id } });
  const moveOut = addMonths(firstOfMonth(s.day), 2) - 1;
  c.status = 'notice';
  c.noticeDay = s.day;
  c.endDay = moveOut;
  c.terminatedBy = 'mutual';
  c.changes.push({ day: s.day, text: `Mietaufhebungsvertrag: Auszug zum ${formatDate(moveOut)}, Abfindung ${formatMoney(compensation)}.` });
  t.status = 'moving_out';
  t.noticeDay = s.day;
  t.moveOutDay = moveOut;
  t.moveOutReason = 'Mietaufhebungsvertrag';
  return { ok: true, accepted: true };
}

export const monthsRented = (s: GameState, c: Contract) => monthsBetween(c.startDay, s.day);
