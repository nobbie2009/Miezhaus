/**
 * Geldbeträge werden im gesamten Spiel als ganzzahlige Cent-Beträge geführt.
 * Alle Rechenoperationen mit Faktoren runden explizit auf ganze Cent.
 */
export type Cents = number;

export const euro = (value: number): Cents => Math.round(value * 100);

/** Multipliziert einen Cent-Betrag mit einem Faktor und rundet kaufmännisch auf ganze Cent. */
export const mulCents = (amount: Cents, factor: number): Cents => {
  const r = Math.round(amount * factor);
  return Object.is(r, -0) ? 0 : r;
};

/** Verteilt einen Betrag auf Gewichte, sodass die Summe exakt erhalten bleibt (Largest-Remainder). */
export function allocateCents(total: Cents, weights: number[]): Cents[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0 || weights.length === 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const floored = raw.map((r) => Math.floor(r));
  let rest = total - floored.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; rest > 0 && k < order.length; k++, rest--) floored[order[k].i] += 1;
  return floored;
}

export const sumCents = (values: Cents[]): Cents => values.reduce((a, b) => a + b, 0);

const fmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const fmt0 = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export const formatMoney = (cents: Cents, opts: { decimals?: boolean } = {}): string =>
  (opts.decimals === false ? fmt0 : fmt).format(cents / 100);

export const formatMoneyShort = (cents: Cents): string => {
  const v = cents / 100;
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio. €`;
  if (abs >= 10_000) return `${(v / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} T€`;
  return fmt0.format(v);
};

export const formatPercent = (v: number, digits = 0): string =>
  `${(v * 100).toLocaleString('de-DE', { maximumFractionDigits: digits, minimumFractionDigits: digits })} %`;

export const formatNumber = (v: number, digits = 0): string =>
  v.toLocaleString('de-DE', { maximumFractionDigits: digits, minimumFractionDigits: digits });
