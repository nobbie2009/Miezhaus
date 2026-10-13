import type { GameState, Loan } from '@/domain/schema';
import { formatMoney, mulCents } from '@/utils/money';
import { fromYmd, toYmd } from '@/utils/date';
import { CONFIG } from './config';
import { loanBalance, marketValue, persons, portfolioValue } from './derived';
import { allViews } from './portfolio';
import { emptyEnergyMonth } from './energy';
import { nextId } from './ids';
import { post } from './ledger';
import { addMessage, log } from './messages';

/** Annuität (monatliche Rate) für Darlehen in Cent. */
export function annuity(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12;
  if (r === 0) return Math.ceil(principal / months);
  return Math.ceil((principal * r) / (1 - Math.pow(1 + r, -months)));
}

/** Monatskosten eines Objekts (Energie, Betriebskosten, Dienstleistungen). Idempotent je Objekt und Periode. */
export function postPropertyMonthlyCosts(s: GameState, period: string) {
  const key = `costs-${period}`;
  if (s.counters[key]) return;
  s.counters[key] = 1;
  const c = CONFIG.costs;
  const sv = s.services;
  const ref = { type: 'month', id: period };
  const f = CONFIG.difficulty[s.settings.difficulty].costFactor;
  const fixed = (category: Parameters<typeof post>[1]['category'], amount: number, purpose: string) => {
    if (amount > 0) post(s, { category, amount: -mulCents(amount, f), purpose: `${purpose} ${period}`, ref });
  };
  // Energie & Wasser (aus der Verbrauchssimulation)
  const e = s.energyMonth;
  if (e.heatCost > 0) post(s, { category: 'heating', amount: -Math.round(e.heatCost), purpose: `Heizenergie ${period} (${Math.round(e.heatKwh + e.hotWaterKwh).toLocaleString('de-DE')} kWh)`, ref });
  if (e.elecCost > 0) post(s, { category: 'electricity', amount: -Math.round(e.elecCost), purpose: `Allgemeinstrom ${period} (${Math.round(e.commonKwh)} kWh)`, ref });
  if (e.waterCost > 0) post(s, { category: 'water', amount: -Math.round(e.waterCost), purpose: `Wasser/Abwasser ${period} (${e.waterM3.toFixed(1)} m³)`, ref });
  if (e.feedIn > 0) post(s, { category: 'feed_in', amount: Math.round(e.feedIn), purpose: `Einspeisevergütung ${period}`, ref });
  const waste = Math.round(persons(s) * c.wastePerPersonMonth * (s.building.amenities.includes('waste_sorting') ? 0.85 : 1)) + 2500;
  fixed('waste', waste, 'Müllgebühren');
  fixed('property_tax', c.propertyTaxMonthly, 'Grundsteuer');
  fixed('cleaning', c.cleaning[sv.cleaning], 'Treppenhausreinigung');
  fixed('garden', c.garden[sv.garden], 'Gartenpflege');
  fixed('caretaker', c.caretaker[sv.caretaker], 'Hausmeister');
  fixed('administration', sv.management === 'agency' ? c.management.agency * s.apartments.length : c.management[sv.management], sv.management === 'agency' ? 'Hausverwaltung' : 'Verwaltungssoftware');
  fixed('insurance', c.insurance[sv.insurance], 'Gebäudeversicherung');
  fixed('maintenance', sv.maintenancePlan ? c.maintenancePlan : 0, 'Wartungsvertrag');
  fixed('garden', sv.winterService ? c.winterService : 0, 'Winterdienst');
  fixed('administration', sv.tenantApp ? CONFIG.costs.tenantAppBase + CONFIG.costs.tenantAppPerUnit * s.apartments.length : 0, 'Mieter-App');
  s.energyHistory.push({ ...s.energyMonth, period, cost: Math.round(e.heatCost + e.elecCost + e.waterCost - e.feedIn) });
  if (s.energyHistory.length > 240) s.energyHistory.shift();
  s.energyMonth = emptyEnergyMonth();
}

/** Gemeinsame Monatskosten: Kontoführung, Dispozinsen, Kredite, Rahmenverträge. Idempotent je Periode. */
export function postGlobalMonthlyCosts(s: GameState, period: string) {
  const key = `global-${period}`;
  if (s.counters[key]) return;
  s.counters[key] = 1;
  const ref = { type: 'month', id: period };
  post(s, { category: 'other_expense', amount: -CONFIG.costs.bankFeesMonthly, purpose: `Kontoführung ${period}`, ref });
  const fw = s.automation.frameworkContracts.length;
  if (fw > 0) post(s, { category: 'administration', amount: -fw * CONFIG.costs.frameworkContractFee, purpose: `Rahmenverträge Handwerker (${fw}) ${period}`, ref });
  // Dispozinsen auf negative Salden (taggenau aufsummiert)
  const neg = s.counters.negativeCashSum ?? 0;
  if (neg > 0) {
    const interest = Math.round((neg * CONFIG.finance.overdraftInterest) / 365);
    if (interest > 0) post(s, { category: 'interest', amount: -interest, purpose: `Dispozinsen ${period}`, ref });
    s.counters.negativeCashSum = 0;
  }
  // Kredite
  for (const loan of s.loans) payLoanInstallment(s, loan, period);
}

function payLoanInstallment(s: GameState, loan: Loan, period: string) {
  if (loan.remaining <= 0) return;
  const interest = Math.round((loan.remaining * loan.annualRate) / 12);
  const principal = Math.min(loan.remaining, Math.max(0, loan.monthlyPayment - interest));
  if (interest > 0) post(s, { category: 'interest', amount: -interest, purpose: `Zinsen ${loan.name} ${period}`, ref: { type: 'loan', id: loan.id } });
  if (principal > 0) post(s, { category: 'loan_principal', amount: -principal, purpose: `Tilgung ${loan.name} ${period}`, ref: { type: 'loan', id: loan.id } });
  loan.remaining -= principal;
  loan.paidMonths += 1;
  if (loan.remaining <= 0) {
    s.counters.loansRepaid = (s.counters.loansRepaid ?? 0) + 1;
    addMessage(s, { category: 'finance', severity: 'success', title: `${loan.name} vollständig getilgt`, text: 'Der Kredit ist zurückgezahlt. Die monatliche Belastung entfällt.', important: true });
  }
}

export function trackNegativeCash(s: GameState) {
  if (s.cash < 0) s.counters.negativeCashSum = (s.counters.negativeCashSum ?? 0) - s.cash;
}

// ------------------------------------------------------------ Kredite

export interface LoanQuote {
  maxAmount: number;
  annualRate: number;
  monthlyPayment: number;
  ltvAfter: number;
  totalInterest: number;
}

export function loanQuote(s: GameState, amount: number, years: number): LoanQuote {
  const value = portfolioValue(s);
  const maxAmount = Math.max(0, Math.floor((value * CONFIG.finance.maxLoanToValue - loanBalance(s)) / 100000) * 100000);
  const ltvAfter = (loanBalance(s) + amount) / Math.max(1, value);
  const annualRate = Math.round((s.market.interestRate + 0.004 + Math.max(0, ltvAfter - 0.5) * 0.04 + (years > 15 ? 0.003 : 0) + (s.daysBelowOverdraft > 0 ? CONFIG.finance.loanRiskPremium : 0)) * 10000) / 10000;
  const months = years * 12;
  const monthlyPayment = amount > 0 ? annuity(amount, annualRate, months) : 0;
  return { maxAmount, annualRate, monthlyPayment, ltvAfter, totalInterest: monthlyPayment * months - amount };
}

export function takeLoan(s: GameState, amount: number, years: number, purpose: string, kind: Loan['kind'] = 'bank', rateOverride?: number): { ok: boolean; error?: string; loan?: Loan } {
  amount = Math.round(amount / 10000) * 10000;
  if (amount < 500000) return { ok: false, error: 'Mindestbetrag 5.000 €.' };
  if (years < 1 || years > 30) return { ok: false, error: 'Laufzeit 1–30 Jahre.' };
  const q = loanQuote(s, amount, years);
  if (kind === 'bank' && amount > q.maxAmount) return { ok: false, error: `Die Bank finanziert höchstens ${formatMoney(q.maxAmount)} (Beleihungsgrenze ${Math.round(CONFIG.finance.maxLoanToValue * 100)} % des Marktwerts).` };
  const rate = rateOverride ?? q.annualRate;
  const loan: Loan = {
    id: nextId(s, 'k'),
    name: kind === 'subsidy' ? 'Förderkredit' : kind === 'bank' && rateOverride ? 'Überbrückungskredit' : `Bankdarlehen ${s.loans.length + 1}`,
    kind,
    principal: amount,
    remaining: amount,
    annualRate: rate,
    termMonths: years * 12,
    monthlyPayment: annuity(amount, rate, years * 12),
    startDay: s.day,
    paidMonths: 0,
    purpose,
  };
  s.loans.push(loan);
  post(s, { category: 'loan_disbursement', amount, purpose: `Auszahlung ${loan.name} (${(rate * 100).toFixed(2)} % p. a.)`, ref: { type: 'loan', id: loan.id } });
  log(s, `Kredit aufgenommen: ${formatMoney(amount)} zu ${(rate * 100).toFixed(2)} %, Rate ${formatMoney(loan.monthlyPayment)}.`, 'finance');
  return { ok: true, loan };
}

export function repayLoan(s: GameState, loanId: string, amount: number): { ok: boolean; error?: string } {
  const loan = s.loans.find((l) => l.id === loanId);
  if (!loan || loan.remaining <= 0) return { ok: false, error: 'Kredit nicht gefunden.' };
  amount = Math.min(Math.round(amount), loan.remaining);
  const fee = Math.round(amount * CONFIG.finance.earlyRepaymentFee);
  if (amount <= 0) return { ok: false, error: 'Betrag ungültig.' };
  if (s.cash < amount + fee) return { ok: false, error: 'Nicht genügend Guthaben für die Sondertilgung (Dispo nicht nutzbar).' };
  post(s, { category: 'loan_principal', amount: -amount, purpose: `Sondertilgung ${loan.name}`, ref: { type: 'loan', id: loan.id } });
  if (fee > 0) post(s, { category: 'interest', amount: -fee, purpose: `Vorfälligkeitsentgelt ${loan.name}`, ref: { type: 'loan', id: loan.id } });
  loan.remaining -= amount;
  const left = loan.termMonths - loan.paidMonths;
  if (loan.remaining > 0 && left > 0) loan.monthlyPayment = annuity(loan.remaining, loan.annualRate, left);
  if (loan.remaining <= 0) {
    s.counters.loansRepaid = (s.counters.loansRepaid ?? 0) + 1;
    addMessage(s, { category: 'finance', severity: 'success', title: `${loan.name} vollständig getilgt`, text: 'Durch die Sondertilgung ist der Kredit vollständig zurückgezahlt.' });
  }
  return { ok: true };
}

// ------------------------------------------------------------ Steuern

/** Vereinfachte Einkommensteuer auf den Vorjahresüberschuss (Spielmechanik). */
export function annualTax(s: GameState, year: number) {
  const key = `tax-${year}`;
  if (s.counters[key]) return;
  s.counters[key] = 1;
  const start = fromYmd(year, 1, 1);
  const end = fromYmd(year + 1, 1, 1);
  if (s.startDay > start + 200) return; // Kein volles Steuerjahr gespielt
  const excluded = ['loan_disbursement', 'loan_principal', 'tax', 'modernization', 'property_purchase', 'purchase_costs', 'property_sale', 'investment_deposit', 'investment_withdrawal', 'investment_income', 'capital_gains_tax'];
  let result = 0;
  let modernization = 0;
  for (const e of s.ledger) {
    if (e.status !== 'posted' || e.day < start || e.day >= end) continue;
    if (e.category === 'modernization') modernization += -e.amount;
    if (excluded.includes(e.category)) continue;
    result += e.amount;
  }
  // Modernisierungen werden über 10 Jahre abgeschrieben, das Gebäude mit 2 % p. a.
  const depreciation = Math.round(modernization / 10) + allViews(s).reduce((a, v) => a + Math.round((marketValue(v) - v.building.landValue) * 0.02), 0);
  const taxable = result - depreciation;
  const tax = Math.max(0, Math.round(taxable * CONFIG.finance.taxRate));
  if (tax > 0) post(s, { category: 'tax', amount: -tax, purpose: `Steuer auf Vermietungsüberschuss ${year}`, ref: { type: 'tax', id: String(year) } });
  addMessage(s, {
    category: 'finance',
    severity: tax > 0 ? 'warning' : 'info',
    title: `Steuerbescheid ${year}`,
    text: `Überschuss vor Abschreibung: ${formatMoney(result)}. Abschreibungen: ${formatMoney(depreciation)}. Zu versteuern: ${formatMoney(Math.max(0, taxable))}. Steuer (${Math.round(CONFIG.finance.taxRate * 100)} %, vereinfacht): ${formatMoney(tax)}.`,
    link: { page: 'finance', id: null },
  });
}

/** Prüft Zahlungsunfähigkeit. Insolvenz nur nach längerer Überschreitung des Dispositionsrahmens. */
export function checkInsolvency(s: GameState) {
  if (s.gameOver) return;
  if (s.cash < -s.overdraftLimit) {
    s.daysBelowOverdraft += 1;
    const left = CONFIG.finance.insolvencyGraceDays - s.daysBelowOverdraft;
    if (s.daysBelowOverdraft === 1 || s.daysBelowOverdraft === 15 || s.daysBelowOverdraft === 30)
      addMessage(s, {
        category: 'finance',
        severity: 'danger',
        title: 'Dispositionsrahmen überschritten!',
        text: `Kontostand ${formatMoney(s.cash)} liegt unter dem Dispo von −${formatMoney(s.overdraftLimit)}. Bleibt das so, droht in ${left} Tagen die Zahlungsunfähigkeit. Optionen: Kredit aufnehmen, Rückstände eintreiben, Aufträge verschieben, Dienstleistungen kündigen.`,
        link: { page: 'finance', id: null },
        important: true,
      });
    if (s.daysBelowOverdraft >= CONFIG.finance.insolvencyGraceDays) {
      s.gameOver = {
        kind: 'insolvency',
        day: s.day,
        title: 'Zahlungsunfähig',
        text: `Das Konto lag ${s.daysBelowOverdraft} Tage über dem Dispositionsrahmen hinaus im Minus (${formatMoney(s.cash)}). Die Bank hat die Kreditlinie gekündigt – das Haus muss zwangsverwaltet werden.`,
      };
    }
  } else s.daysBelowOverdraft = 0;
}

export const yearOf = (d: number) => toYmd(d).year;
