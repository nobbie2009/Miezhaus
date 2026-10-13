import { describe, expect, it } from 'vitest';
import { allocateCents, euro, mulCents } from '@/utils/money';
import { addMonths, fromYmd, toYmd } from '@/utils/date';
import { Rng } from '@/utils/rng';

describe('Geld & Zeit', () => {
  it('rechnet in ganzen Cent', () => {
    expect(euro(12.345)).toBe(1235);
    expect(mulCents(1001, 0.5)).toBe(501);
    expect(Number.isInteger(mulCents(333, 1 / 3))).toBe(true);
  });
  it('verteilt Beträge ohne Rundungsverlust', () => {
    const parts = allocateCents(100001, [1, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100001);
    expect(allocateCents(0, [1, 2])).toEqual([0, 0]);
  });
  it('Kalender-Arithmetik ist korrekt', () => {
    const d = fromYmd(2027, 1, 31);
    expect(toYmd(addMonths(d, 1))).toEqual({ year: 2027, month: 2, day: 28 });
    expect(toYmd(fromYmd(2028, 2, 29)).day).toBe(29);
  });
  it('RNG ist deterministisch', () => {
    const a = new Rng({ rng: 42 });
    const b = new Rng({ rng: 42 });
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });
});
