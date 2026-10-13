import type { Claim, Contract, GameState, Tenant } from '@/domain/schema';
import { allocateCents, formatMoney } from '@/utils/money';
import { daysInYear, fromYmd, monthKey, monthKeyOf, toYmd } from '@/utils/date';
import { clamp } from '@/utils/misc';
import type { Rng } from '@/utils/rng';
import { ALLOCATABLE_CATEGORIES, CONFIG } from './config';
import { rentReductionFor } from './defects';
import { apartmentLabel, claimOutstanding } from './derived';
import { nextId } from './ids';
import { post } from './ledger';
import { addMessage, log } from './messages';
import { addMood } from './tenants';

const tenantById = (s: GameState, id: string) => s.tenants.find((t) => t.id === id);

/**
 * Erzeugt die Mietforderungen für den laufenden Monat. Idempotent:
 * Pro Vertrag und Monat existiert höchstens eine Mietforderung.
 */
export function createMonthlyClaims(s: GameState, rng: Rng) {
  const period = monthKey(s.day);
  const { year, month } = toYmd(s.day);
  for (const c of s.contracts) {
    if (c.status === 'ended' || c.startDay > s.day) continue;
    if (c.endDay !== null && c.endDay < s.day) continue;
    if (s.claims.some((x) => x.contractId === c.id && x.period === period && x.kind === 'rent')) continue;
    const t = tenantById(s, c.tenantId);
    const a = s.apartments.find((x) => x.id === c.apartmentId);
    if (!t || !a) continue;
    const red = rentReductionFor(s, a);
    const gross = c.netRent + c.utilityPrepayment;
    const reduction = Math.round(gross * red.rate);
    const [netPart, utilPart] = allocateCents(gross - reduction, [c.netRent, c.utilityPrepayment]);
    const dueDay = fromYmd(year, month, c.dueDay);
    const claim: Claim = {
      id: nextId(s, 'f'),
      kind: 'rent',
      contractId: c.id,
      tenantId: t.id,
      apartmentId: a.id,
      period,
      createdDay: s.day,
      dueDay,
      netRent: netPart,
      utilities: utilPart,
      amount: gross - reduction,
      paid: 0,
      status: gross - reduction > 0 ? 'open' : 'paid',
      dunningLevel: 0,
      lastDunningDay: null,
      payments: [],
      plannedPayDay: null,
      plannedFraction: 1,
      note: red.rate > 0 ? `Mietminderung ${Math.round(red.rate * 100)} %: ${red.reasons.join(', ')}` : '',
    };
    planPayment(s, claim, t, rng);
    s.claims.push(claim);
    if (red.rate > 0) {
      addMessage(s, {
        category: 'finance',
        severity: 'warning',
        title: `Mietminderung ${apartmentLabel(a)}`,
        text: `${t.name} mindert die Miete für ${period} um ${formatMoney(reduction)} (${Math.round(red.rate * 100)} %). Grund: ${red.reasons.join(', ')}.`,
        tenantId: t.id,
        apartmentId: a.id,
        link: { page: 'contracts', id: c.id },
      });
    }
  }
}

/** Legt fest, wann und wie viel ein Mieter auf eine neue Forderung zahlt (deterministisch über RNG). */
export function planPayment(s: GameState, claim: Claim, t: Tenant, rng: Rng) {
  const bonus = CONFIG.difficulty[s.settings.difficulty].paymentBonus;
  const r = clamp(t.paymentReliability + bonus - t.financialStress * 0.55 + (t.satisfaction - 60) * 0.1, 3, 99) / 100;
  const u = rng.next();
  if (u < r) {
    claim.plannedPayDay = claim.dueDay - rng.int(0, 2);
    claim.plannedFraction = 1;
  } else if (u < r + (1 - r) * 0.55) {
    claim.plannedPayDay = claim.dueDay + rng.int(4, 21);
    claim.plannedFraction = 1;
  } else {
    claim.plannedPayDay = claim.dueDay + rng.int(0, 12);
    claim.plannedFraction = t.financialStress > 75 ? 0 : Math.round(rng.range(0.3, 0.8) * 100) / 100;
  }
}

/** Verbucht eine Zahlung auf eine Forderung. Überzahlungen sind ausgeschlossen. */
export function payClaim(s: GameState, claim: Claim, amount: number, via = 'Überweisung'): number {
  const outstanding = claimOutstanding(claim);
  const pay = Math.min(Math.round(amount), outstanding);
  if (pay <= 0 || claim.status === 'written_off') return 0;
  const tenant = tenantById(s, claim.tenantId);
  const ledgerIds: string[] = [];
  if (claim.kind === 'rent') {
    const [rentPart, utilPart] = allocateCents(pay, [claim.netRent, claim.utilities]);
    if (rentPart > 0) ledgerIds.push(post(s, { category: 'rent', amount: rentPart, purpose: `Miete ${claim.period} – ${tenant?.name ?? ''} (${via})`, apartmentId: claim.apartmentId, ref: { type: 'claim', id: claim.id } }).id);
    if (utilPart > 0) ledgerIds.push(post(s, { category: 'utilities_prepayment', amount: utilPart, purpose: `NK-Vorauszahlung ${claim.period} – ${tenant?.name ?? ''}`, apartmentId: claim.apartmentId, ref: { type: 'claim', id: claim.id } }).id);
  } else {
    ledgerIds.push(post(s, { category: claim.kind === 'utility_settlement' ? 'utility_settlement' : 'compensation', amount: pay, purpose: `${claim.kind === 'utility_settlement' ? 'NK-Nachzahlung' : 'Schadensersatz'} ${claim.period} – ${tenant?.name ?? ''}`, apartmentId: claim.apartmentId, ref: { type: 'claim', id: claim.id } }).id);
  }
  claim.paid += pay;
  claim.payments.push({ day: s.day, amount: pay, ledgerIds });
  claim.status = claim.paid >= claim.amount ? 'paid' : 'partial';
  return pay;
}

/** Tägliche Zahlungseingänge. */
export function processPayments(s: GameState, rng: Rng) {
  for (const claim of s.claims) {
    if (claim.status !== 'open' && claim.status !== 'partial') continue;
    const t = tenantById(s, claim.tenantId);
    if (!t) continue;
    if (claim.plannedPayDay !== null && s.day >= claim.plannedPayDay) {
      const amount = claim.plannedFraction >= 1 ? claimOutstanding(claim) : Math.round(claim.amount * claim.plannedFraction);
      claim.plannedPayDay = null;
      if (amount > 0) payClaim(s, claim, amount);
      continue;
    }
    if (claim.plannedPayDay !== null || s.day <= claim.dueDay) continue;
    // Rückstände: Zahlungsbereitschaft steigt mit Mahnstufe, sinkt mit finanzieller Belastung
    const former = t.status === 'former';
    let p = (t.paymentReliability / 100) * 0.022 * (1 + claim.dunningLevel * 0.9) * (1 - t.financialStress / 130);
    if (former) p = claim.dunningLevel >= 3 ? 0.012 : 0.002;
    if (rng.chance(p)) {
      const out = claimOutstanding(claim);
      payClaim(s, claim, t.financialStress > 60 || former ? Math.ceil(out / 2) : out, former ? 'Inkasso' : 'Überweisung');
    }
  }
  // Ratenzahlungen laufen jeweils am 10. des Monats
  const { day } = toYmd(s.day);
  if (day === 10) {
    for (const c of s.contracts) {
      if (!c.paymentPlan || c.status === 'ended') continue;
      const t = tenantById(s, c.tenantId);
      if (!t) continue;
      let budget = c.paymentPlan.monthlyAmount;
      if (!rng.chance(clamp(t.paymentReliability + 10 - t.financialStress * 0.3, 10, 98) / 100)) continue;
      const arrears = s.claims.filter((x) => x.contractId === c.id && (x.status === 'open' || x.status === 'partial') && x.dueDay < s.day - 20).sort((a, b) => a.dueDay - b.dueDay);
      for (const cl of arrears) {
        if (budget <= 0) break;
        budget -= payClaim(s, cl, budget, 'Ratenzahlung');
      }
      if (!arrears.length) {
        c.paymentPlan = null;
        c.changes.push({ day: s.day, text: 'Ratenzahlung abgeschlossen – alle Rückstände beglichen.' });
        addMood(t, s.day, 'Schulden beglichen', 4, 60);
        addMessage(s, { category: 'finance', severity: 'success', title: `Ratenzahlung abgeschlossen: ${t.name}`, text: 'Alle Rückstände sind beglichen. Der Mieter ist erleichtert und dankbar für das Entgegenkommen.', tenantId: t.id });
      }
    }
  }
}

// --------------------------------------------------------------- Mahnwesen

export const DUNNING_LABEL = ['Keine', 'Zahlungserinnerung', 'Mahnung', 'Anwaltliche Mahnung'];

export function canDun(s: GameState, claim: Claim): { ok: boolean; reason?: string; nextLevel: number } {
  const next = claim.dunningLevel + 1;
  if (claim.status !== 'open' && claim.status !== 'partial') return { ok: false, reason: 'Forderung ist nicht offen.', nextLevel: next };
  if (claim.dueDay >= s.day) return { ok: false, reason: 'Forderung ist noch nicht fällig.', nextLevel: next };
  if (next > 3) return { ok: false, reason: 'Höchste Mahnstufe erreicht.', nextLevel: next };
  if (claim.lastDunningDay !== null && s.day - claim.lastDunningDay < 7) return { ok: false, reason: 'Letzte Mahnung ist weniger als 7 Tage her.', nextLevel: next };
  return { ok: true, nextLevel: next };
}

export function dun(s: GameState, claim: Claim, auto = false): { ok: boolean; error?: string } {
  const chk = canDun(s, claim);
  if (!chk.ok) return { ok: false, error: chk.reason };
  claim.dunningLevel = chk.nextLevel;
  claim.lastDunningDay = s.day;
  const t = tenantById(s, claim.tenantId);
  if (chk.nextLevel === 3) post(s, { category: 'legal', amount: -CONFIG.dunning.legalCost, purpose: `Anwaltliche Mahnung ${claim.period} (${t?.name ?? ''})`, apartmentId: claim.apartmentId, ref: { type: 'claim', id: claim.id } });
  if (t && t.status !== 'former') {
    const hadReduction = claim.note !== '';
    const penalty = [0, -1, -3, -7][chk.nextLevel] * (hadReduction ? 2 : 1);
    addMood(t, s.day, DUNNING_LABEL[chk.nextLevel], penalty, 45);
  }
  log(s, `${DUNNING_LABEL[chk.nextLevel]} an ${t?.name ?? 'Mieter'} für ${claim.period} (${formatMoney(claimOutstanding(claim))})${auto ? ' – automatisch' : ''}.`, 'finance');
  return { ok: true };
}

export function autoDunning(s: GameState) {
  if (!s.settings.autoDunning || s.services.management === 'self') return;
  const cfg = CONFIG.dunning;
  for (const c of s.claims) {
    if (c.status !== 'open' && c.status !== 'partial') continue;
    const age = s.day - c.dueDay;
    if ((c.dunningLevel === 0 && age >= cfg.reminderAfterDays) || (c.dunningLevel === 1 && age >= cfg.noticeAfterDays)) dun(s, c, true);
  }
}

export function contractArrears(s: GameState, c: Contract): number {
  return s.claims.filter((x) => x.contractId === c.id && (x.status === 'open' || x.status === 'partial') && x.dueDay < s.day).reduce((a, x) => a + claimOutstanding(x), 0);
}

// --------------------------------------------------------------- Nebenkostenabrechnung

export interface SettlementLine {
  contractId: string;
  tenantName: string;
  apartment: string;
  allocated: number;
  prepaid: number;
  balance: number;
}

/** Jährliche Betriebskostenabrechnung für das Vorjahr. */
export function runUtilitySettlement(s: GameState, year: number) {
  const key = `settlement-${year}`;
  if (s.counters[key]) return; // bereits abgerechnet
  s.counters[key] = 1;
  const start = fromYmd(year, 1, 1);
  const end = fromYmd(year + 1, 1, 1);
  const days = daysInYear(year);
  let costs = 0;
  for (const e of s.ledger) {
    if (e.status !== 'posted' || e.day < start || e.day >= end) continue;
    if (!(ALLOCATABLE_CATEGORIES as readonly string[]).includes(e.category)) continue;
    const share = e.category === 'caretaker' ? CONFIG.costs.caretakerAllocatableShare : 1;
    costs += Math.round(-e.amount * share);
  }
  if (costs <= 0) return;
  const totalAreaDays = s.apartments.reduce((a, b) => a + b.area, 0) * days;
  const lines: SettlementLine[] = [];
  let allocatedSum = 0;
  for (const c of s.contracts) {
    const from = Math.max(start, c.startDay);
    const to = Math.min(end, (c.endedDay ?? c.endDay ?? end) + 1, end);
    const overlap = to - from;
    if (overlap <= 0) continue;
    const a = s.apartments.find((x) => x.id === c.apartmentId);
    const t = tenantById(s, c.tenantId);
    if (!a || !t) continue;
    const allocated = Math.round((costs * a.area * overlap) / totalAreaDays);
    const prepaid = s.claims
      .filter((x) => x.contractId === c.id && x.kind === 'rent' && x.period >= monthKeyOf(year, 1) && x.period <= monthKeyOf(year, 12))
      .reduce((acc, x) => acc + (x.amount > 0 ? Math.round((x.paid * x.utilities) / x.amount) : 0), 0);
    allocatedSum += allocated;
    const balance = allocated - prepaid;
    lines.push({ contractId: c.id, tenantName: t.name, apartment: apartmentLabel(a), allocated, prepaid, balance });
    if (balance > 0) {
      const claim: Claim = {
        id: nextId(s, 'f'),
        kind: 'utility_settlement',
        contractId: c.id,
        tenantId: t.id,
        apartmentId: a.id,
        period: `${year}-NK`,
        createdDay: s.day,
        dueDay: s.day + 30,
        netRent: 0,
        utilities: balance,
        amount: balance,
        paid: 0,
        status: 'open',
        dunningLevel: 0,
        lastDunningDay: null,
        payments: [],
        plannedPayDay: null,
        plannedFraction: 1,
        note: `Betriebskostenabrechnung ${year}`,
      };
      if (t.status !== 'former') {
        const r = clamp(t.paymentReliability - t.financialStress * 0.4, 10, 99) / 100;
        claim.plannedPayDay = s.day + Math.round(10 + (1 - r) * 30);
        claim.plannedFraction = r > 0.5 ? 1 : 0.5;
      }
      s.claims.push(claim);
      if (t.status !== 'former' && balance > c.utilityPrepayment) addMood(t, s.day, 'Hohe Nebenkostennachzahlung', -6, 90);
    } else if (balance < 0) {
      post(s, { category: 'utility_refund', amount: balance, purpose: `NK-Guthaben ${year} an ${t.name}`, apartmentId: a.id, ref: { type: 'settlement', id: `${year}-${c.id}` } });
      if (t.status !== 'former') addMood(t, s.day, 'Nebenkostenguthaben', 3, 60);
    }
    // Vorauszahlung anpassen
    if (c.status !== 'ended' && overlap > 60) {
      const monthly = Math.round((allocated * days) / overlap / 12 / 500) * 500;
      if (monthly > 0 && Math.abs(monthly - c.utilityPrepayment) >= 500) {
        c.changes.push({ day: s.day, text: `NK-Vorauszahlung angepasst: ${formatMoney(c.utilityPrepayment)} → ${formatMoney(monthly)}.` });
        c.rentHistory.push({ day: s.day, netRent: c.netRent, utilityPrepayment: monthly, reason: `Anpassung nach NK-Abrechnung ${year}` });
        c.utilityPrepayment = monthly;
      }
    }
  }
  const vacancyShare = costs - allocatedSum;
  const nach = lines.filter((l) => l.balance > 0).reduce((a, l) => a + l.balance, 0);
  const guth = lines.filter((l) => l.balance < 0).reduce((a, l) => a - l.balance, 0);
  addMessage(s, {
    category: 'finance',
    severity: 'info',
    title: `Betriebskostenabrechnung ${year} erstellt`,
    text: `Umlagefähige Kosten: ${formatMoney(costs)}. Auf Mieter verteilt: ${formatMoney(allocatedSum)}. Leerstandsanteil (trägt der Vermieter): ${formatMoney(vacancyShare)}. Nachzahlungen: ${formatMoney(nach)}, Guthaben: ${formatMoney(guth)}. Die Vorauszahlungen wurden angepasst.`,
    link: { page: 'finance', id: null },
    important: true,
  });
  s.counters[`settlementVacancy-${year}`] = vacancyShare;
}

export function writeOff(s: GameState, claim: Claim): { ok: boolean; error?: string } {
  if (claim.status !== 'open' && claim.status !== 'partial') return { ok: false, error: 'Forderung ist nicht offen.' };
  const out = claimOutstanding(claim);
  claim.status = 'written_off';
  claim.plannedPayDay = null;
  s.counters.writeOffs = (s.counters.writeOffs ?? 0) + out;
  log(s, `Forderung ${claim.period} über ${formatMoney(out)} ausgebucht.`, 'finance');
  return { ok: true };
}

