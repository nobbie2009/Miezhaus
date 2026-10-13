import type { ComponentKey, GameState, LedgerCategory, LedgerEntry } from '@/domain/schema';
import { monthKey } from '@/utils/date';
import { nextId } from './ids';

/**
 * Das Buchungsjournal ist die einzige Stelle, an der sich der Kontostand ändert.
 * Alle Finanzberichte werden aus den Buchungen abgeleitet.
 */
export interface PostInput {
  category: LedgerCategory;
  amount: number; // vorzeichenbehaftet in Cent: + Einnahme, − Ausgabe
  purpose: string;
  apartmentId?: string | null;
  componentKey?: ComponentKey | null;
  ref?: { type: string; id: string } | null;
}

export function post(s: GameState, input: PostInput): LedgerEntry {
  if (!Number.isInteger(input.amount)) throw new Error(`Buchungsbetrag muss ganzzahlig (Cent) sein: ${input.amount}`);
  const entry: LedgerEntry = {
    id: nextId(s, 'b'),
    day: s.day,
    category: input.category,
    amount: input.amount,
    apartmentId: input.apartmentId ?? null,
    componentKey: input.componentKey ?? null,
    purpose: input.purpose,
    status: 'posted',
    ref: input.ref ?? null,
    propertyId: s.building.id,
  };
  s.ledger.push(entry);
  s.cash += input.amount;
  return entry;
}

/** Prüft, ob für eine Referenz bereits eine Buchung existiert (Schutz vor Doppelbuchungen). */
export const hasPostingFor = (s: GameState, refType: string, refId: string, category?: LedgerCategory) =>
  s.ledger.some((e) => e.ref?.type === refType && e.ref.id === refId && (!category || e.category === category) && e.status === 'posted');

export const INCOME_CATEGORIES: LedgerCategory[] = [
  'rent',
  'utilities_prepayment',
  'utility_settlement',
  'insurance_payout',
  'subsidy',
  'compensation',
  'sale',
  'deposit_offset',
  'loan_disbursement',
  'other_income',
  'feed_in',
  'property_sale',
  'investment_withdrawal',
  'investment_income',
];

/** Investitionen (nicht operativ). */
export const INVESTMENT_CATEGORIES: LedgerCategory[] = ['renovation', 'modernization', 'property_purchase', 'purchase_costs', 'property_sale'];
/** Finanzierung. */
export const FINANCING_CATEGORIES: LedgerCategory[] = ['loan_disbursement', 'loan_principal', 'investment_deposit', 'investment_withdrawal'];

export const CATEGORY_LABEL: Record<LedgerCategory, string> = {
  rent: 'Nettomiete',
  utilities_prepayment: 'Nebenkostenvorauszahlung',
  utility_settlement: 'Nachzahlung Nebenkosten',
  insurance_payout: 'Versicherungsleistung',
  subsidy: 'Fördermittel',
  compensation: 'Entschädigung',
  sale: 'Verkaufserlös',
  deposit_offset: 'Kautionsverrechnung',
  loan_disbursement: 'Kreditauszahlung',
  other_income: 'Sonstige Einnahmen',
  feed_in: 'Einspeisevergütung',
  maintenance: 'Wartung & Instandhaltung',
  repair: 'Reparaturen',
  renovation: 'Renovierung',
  modernization: 'Modernisierung',
  heating: 'Heizenergie',
  water: 'Wasser/Abwasser',
  electricity: 'Allgemeinstrom',
  waste: 'Müllentsorgung',
  cleaning: 'Reinigung',
  garden: 'Gartenpflege',
  insurance: 'Versicherungen',
  administration: 'Verwaltung',
  caretaker: 'Hausmeister',
  interest: 'Zinsen',
  loan_principal: 'Tilgung',
  tax: 'Steuern',
  property_tax: 'Grundsteuer',
  legal: 'Rechtsberatung',
  marketing: 'Inserate',
  damage: 'Schadensbeseitigung',
  utility_refund: 'NK-Guthaben an Mieter',
  other_expense: 'Sonstige Ausgaben',
  property_purchase: 'Immobilienkauf',
  purchase_costs: 'Erwerbsnebenkosten',
  property_sale: 'Immobilienverkauf',
  investment_deposit: 'Einzahlung Geldanlage',
  investment_withdrawal: 'Auszahlung Geldanlage',
  investment_income: 'Zinsen & Erträge',
  capital_gains_tax: 'Abgeltung-/Spekulationssteuer',
};

export const isIncome = (c: LedgerCategory) => INCOME_CATEGORIES.includes(c);

export function entriesInPeriod(s: GameState, period: string): LedgerEntry[] {
  return s.ledger.filter((e) => e.status === 'posted' && monthKey(e.day) === period);
}

export function entriesBetween(s: GameState, fromDay: number, toDayExclusive: number): LedgerEntry[] {
  return s.ledger.filter((e) => e.status === 'posted' && e.day >= fromDay && e.day < toDayExclusive);
}

export interface PeriodSummary {
  income: number;
  expenses: number;
  operatingIncome: number;
  operatingExpenses: number;
  operatingCashflow: number;
  investments: number;
  financing: number;
  net: number;
  byCategory: Partial<Record<LedgerCategory, number>>;
}

export function summarize(entries: LedgerEntry[]): PeriodSummary {
  const byCategory: Partial<Record<LedgerCategory, number>> = {};
  let income = 0;
  let expenses = 0;
  let investments = 0;
  let financing = 0;
  for (const e of entries) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    if (e.amount >= 0) income += e.amount;
    else expenses += e.amount;
    if (INVESTMENT_CATEGORIES.includes(e.category)) investments += e.amount;
    if (FINANCING_CATEGORIES.includes(e.category)) financing += e.amount;
  }
  const operatingTotal = income + expenses - investments - financing;
  const operatingIncome = entries.filter((e) => e.amount > 0 && !FINANCING_CATEGORIES.includes(e.category) && !INVESTMENT_CATEGORIES.includes(e.category)).reduce((a, b) => a + b.amount, 0);
  return {
    income,
    expenses,
    operatingIncome,
    operatingExpenses: operatingTotal - operatingIncome,
    operatingCashflow: operatingTotal,
    investments,
    financing,
    net: income + expenses,
    byCategory,
  };
}

/** Kontrollrechnung: Kontostand muss Startkapital + Summe aller Buchungen entsprechen. */
export const ledgerBalance = (s: GameState) => s.startCash + s.ledger.reduce((a, e) => (e.status === 'posted' ? a + e.amount : a), 0);
