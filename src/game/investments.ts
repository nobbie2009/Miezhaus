import type { GameState, Investment } from '@/domain/schema';
import { formatDate, toYmd } from '@/utils/date';
import { formatMoney, formatPercent } from '@/utils/money';
import type { Rng } from '@/utils/rng';
import { CONFIG } from './config';
import { nextId } from './ids';
import { post } from './ledger';
import { addMessage, log } from './messages';

const C = CONFIG.investments;

export const INVESTMENT_LABEL: Record<Investment['kind'], string> = {
  savings: 'Tagesgeld',
  fixed: 'Festgeld',
  etf: 'ETF-Depot (MSCI World)',
};

/** Variabler Tagesgeldzins – folgt dem Marktzins. */
export const savingsRate = (s: GameState) => Math.max(C.savingsMinRate, Math.round((s.market.interestRate - C.savingsSpread) * 10000) / 10000);
/** Festgeldzins für eine Laufzeit in Jahren. */
export const fixedRate = (s: GameState, years: number) => Math.round((savingsRate(s) + 0.003 + years * C.fixedPremiumPerYear) * 10000) / 10000;

const ref = (i: Investment) => ({ type: 'investment', id: i.id });

/** Nutzt den Sparer-Pauschbetrag und bucht die Abgeltungsteuer auf steuerpflichtige Erträge. */
function taxGain(s: GameState, i: Investment, taxableGain: number, what: string) {
  if (taxableGain <= 0) return 0;
  const key = `allowanceUsed-${toYmd(s.day).year}`;
  const used = s.counters[key] ?? 0;
  const free = Math.max(0, C.allowance - used);
  const covered = Math.min(free, taxableGain);
  s.counters[key] = used + covered;
  const tax = Math.round((taxableGain - covered) * C.capitalGainsTax);
  if (tax > 0) post(s, { category: 'capital_gains_tax', amount: -tax, purpose: `Abgeltungsteuer + Soli auf ${what}`, ref: ref(i) });
  return tax;
}

function savingsAccount(s: GameState): Investment {
  let acc = s.investments.find((x) => x.kind === 'savings');
  if (!acc) {
    acc = { id: nextId(s, 'inv'), kind: 'savings', name: 'Tagesgeldkonto', principal: 0, value: 0, annualRate: savingsRate(s), startDay: s.day, maturityDay: null, accrued: 0, history: [] };
    s.investments.push(acc);
  }
  return acc;
}

export type InvestResult = { ok: boolean; error?: string; message?: string };

function checkCash(s: GameState, amount: number): string | null {
  if (!Number.isInteger(amount) || amount < 10000) return 'Mindestbetrag 100 €.';
  if (s.cash - amount < 0) return 'Geldanlagen nur aus Guthaben – nicht über den Dispo.';
  return null;
}

export function deposit(s: GameState, kind: Investment['kind'], amount: number, years = 1): InvestResult {
  const err = checkCash(s, amount);
  if (err) return { ok: false, error: err };
  if (kind === 'savings') {
    const acc = savingsAccount(s);
    acc.principal += amount;
    acc.value += amount;
    post(s, { category: 'investment_deposit', amount: -amount, purpose: 'Einzahlung Tagesgeld', ref: ref(acc) });
    return { ok: true, message: `${formatMoney(amount)} auf das Tagesgeldkonto überwiesen (${formatPercent(savingsRate(s), 2)} p. a.).` };
  }
  if (kind === 'fixed') {
    if (![1, 2, 3, 5].includes(years)) return { ok: false, error: 'Laufzeit 1, 2, 3 oder 5 Jahre.' };
    if (amount < 500000) return { ok: false, error: 'Festgeld ab 5.000 €.' };
    const rate = fixedRate(s, years);
    const inv: Investment = { id: nextId(s, 'inv'), kind: 'fixed', name: `Festgeld ${years} J.`, principal: amount, value: amount, annualRate: rate, startDay: s.day, maturityDay: s.day + Math.round(years * 365.25), accrued: 0, history: [] };
    s.investments.push(inv);
    post(s, { category: 'investment_deposit', amount: -amount, purpose: `Anlage ${inv.name} (${formatPercent(rate, 2)} p. a.)`, ref: ref(inv) });
    return { ok: true, message: `Festgeld über ${formatMoney(amount)} bis ${formatDate(inv.maturityDay!)} angelegt.` };
  }
  let etf = s.investments.find((x) => x.kind === 'etf');
  if (!etf) {
    etf = { id: nextId(s, 'inv'), kind: 'etf', name: 'ETF-Depot', principal: 0, value: 0, annualRate: 0, startDay: s.day, maturityDay: null, accrued: 0, history: [] };
    s.investments.push(etf);
  }
  const fee = C.etfOrderFee;
  etf.principal += amount - fee;
  etf.value += amount - fee;
  post(s, { category: 'investment_deposit', amount: -amount, purpose: `ETF-Kauf (inkl. ${formatMoney(fee)} Ordergebühr)`, ref: ref(etf) });
  return { ok: true, message: `ETF-Anteile für ${formatMoney(amount - fee)} gekauft.` };
}

export function withdraw(s: GameState, investmentId: string, amount: number | 'all'): InvestResult {
  const i = s.investments.find((x) => x.id === investmentId);
  if (!i) return { ok: false, error: 'Anlage nicht gefunden.' };
  if (i.kind === 'fixed') return { ok: false, error: 'Festgeld ist bis zum Laufzeitende gebunden.' };
  const amt = amount === 'all' ? i.value : Math.min(i.value, Math.round(amount));
  if (amt <= 0) return { ok: false, error: 'Kein Guthaben.' };
  if (i.kind === 'savings') {
    i.value -= amt;
    i.principal = Math.min(i.principal, i.value);
    post(s, { category: 'investment_withdrawal', amount: amt, purpose: 'Auszahlung Tagesgeld', ref: ref(i) });
    return { ok: true, message: `${formatMoney(amt)} vom Tagesgeld auf das Mietkonto übertragen.` };
  }
  // ETF: anteiliger Gewinn wird realisiert
  const share = amt / i.value;
  const costBasis = Math.round(i.principal * share);
  const gain = amt - costBasis;
  i.value -= amt;
  i.principal -= costBasis;
  const fee = C.etfOrderFee;
  post(s, { category: 'investment_withdrawal', amount: amt - fee - Math.max(0, gain), purpose: `ETF-Verkauf (Einstand, abzgl. ${formatMoney(fee)} Ordergebühr)`, ref: ref(i) });
  if (gain > 0) post(s, { category: 'investment_income', amount: gain, purpose: 'Realisierter Kursgewinn ETF', ref: ref(i) });
  else if (gain < 0) log(s, `ETF-Verkauf mit Verlust von ${formatMoney(-gain)}.`, 'finance');
  const tax = taxGain(s, i, Math.round(Math.max(0, gain) * (1 - C.etfPartialExemption)), 'ETF-Kursgewinn');
  if (i.value <= 0) s.investments = s.investments.filter((x) => x.id !== i.id);
  return { ok: true, message: `ETF-Anteile für ${formatMoney(amt)} verkauft${gain > 0 ? `, Gewinn ${formatMoney(gain)}, Steuer ${formatMoney(tax)}` : gain < 0 ? `, Verlust ${formatMoney(-gain)}` : ''}.` };
}

/** Tägliche Zinsabgrenzung und Fälligkeiten. */
export function accrueInvestments(s: GameState, rng: Rng) {
  void rng;
  for (const i of [...s.investments]) {
    if (i.kind === 'etf') continue;
    if (i.kind === 'savings') i.annualRate = savingsRate(s);
    i.accrued += (i.value * i.annualRate) / 365;
    if (i.kind === 'fixed' && i.maturityDay !== null && s.day >= i.maturityDay) {
      const interest = Math.round(i.accrued);
      post(s, { category: 'investment_withdrawal', amount: i.principal, purpose: `Rückzahlung ${i.name}`, ref: ref(i) });
      if (interest > 0) post(s, { category: 'investment_income', amount: interest, purpose: `Zinsen ${i.name}`, ref: ref(i) });
      const tax = taxGain(s, i, interest, `Zinsen ${i.name}`);
      s.investments = s.investments.filter((x) => x.id !== i.id);
      addMessage(s, { category: 'finance', severity: 'success', title: `${i.name} fällig`, text: `${formatMoney(i.principal)} plus ${formatMoney(interest)} Zinsen (abzgl. ${formatMoney(tax)} Steuer) wurden dem Mietkonto gutgeschrieben.`, link: { page: 'finance', id: null } });
    }
  }
}

/** Monatsende: Tagesgeldzinsen gutschreiben, ETF-Kurs fortschreiben. */
export function monthlyInvestments(s: GameState, rng: Rng, period: string) {
  for (const i of s.investments) {
    if (i.kind === 'savings') {
      const interest = Math.floor(i.accrued);
      i.accrued -= interest;
      if (interest > 0) {
        // Zinsen werden auf dem Tagesgeldkonto gutgeschrieben (Zinseszins), Steuer vom Mietkonto
        i.value += interest;
        post(s, { category: 'investment_income', amount: interest, purpose: `Tagesgeldzinsen ${period}`, ref: ref(i) });
        post(s, { category: 'investment_deposit', amount: -interest, purpose: `Zinsgutschrift Tagesgeld ${period}`, ref: ref(i) });
        taxGain(s, i, interest, `Tagesgeldzinsen ${period}`);
      }
    } else if (i.kind === 'etf' && i.value > 0) {
      const crash = s.market.modifiers.some((m) => m.kind === 'energy' && m.value > 0.2) ? -0.01 : 0;
      const r = rng.normal(C.etfMonthlyMean + crash, C.etfMonthlySd);
      i.value = Math.max(0, Math.round(i.value * (1 + r)));
      if (r < -0.08) addMessage(s, { category: 'finance', severity: 'warning', title: 'Kursrutsch an den Börsen', text: `Ihr ETF-Depot hat im ${period} ${formatPercent(-r, 1)} verloren und steht bei ${formatMoney(i.value)}. Langfristig gleichen sich Schwankungen meist aus – verkaufen Sie nicht überstürzt.`, link: { page: 'finance', id: null } });
    }
    i.history.push({ day: s.day, value: i.value });
    if (i.history.length > 120) i.history.splice(0, i.history.length - 120);
  }
}
