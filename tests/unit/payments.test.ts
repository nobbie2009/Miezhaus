import { describe, expect, it } from 'vitest';
import { createGame } from '@/game/create';
import { createMonthlyClaims, payClaim, dun } from '@/game/payments';
import { ledgerBalance } from '@/game/ledger';
import { claimOutstanding, receivablesByAge } from '@/game/derived';
import { advanceDays } from '@/game/simulation';
import { applyAction } from '@/game/actions';
import { Rng } from '@/utils/rng';
import { fromYmd } from '@/utils/date';

const game = (seed = 11) => createGame({ scenarioId: 'endless_linden', seed });

describe('Mietzahlungen', () => {
  it('bucht eine Mietzahlung korrekt ins Journal', () => {
    const s = game();
    const claim = s.claims.find((c) => c.kind === 'rent' && c.status === 'open' && c.createdDay === s.day)!;
    const before = s.cash;
    const paid = payClaim(s, claim, claim.amount);
    expect(paid).toBe(claim.amount);
    expect(s.cash - before).toBe(claim.amount);
    const entries = s.ledger.filter((e) => e.ref?.id === claim.id);
    expect(entries.reduce((a, e) => a + e.amount, 0)).toBe(claim.amount);
    expect(entries.map((e) => e.category).sort()).toEqual(['rent', 'utilities_prepayment']);
    expect(claim.status).toBe('paid');
    expect(ledgerBalance(s)).toBe(s.cash);
  });

  it('verhindert doppelte Mietforderungen und Überzahlungen', () => {
    const s = game();
    const n = s.claims.length;
    createMonthlyClaims(s, new Rng(s));
    createMonthlyClaims(s, new Rng(s));
    expect(s.claims.length).toBe(n);
    const claim = s.claims.find((c) => c.status === 'open' && c.createdDay === s.day)!;
    payClaim(s, claim, claim.amount);
    const cash = s.cash;
    expect(payClaim(s, claim, claim.amount)).toBe(0);
    expect(s.cash).toBe(cash);
  });

  it('Teilzahlungen reduzieren die Forderung korrekt', () => {
    const s = game();
    const claim = s.claims.find((c) => c.status === 'open' && c.createdDay === s.day)!;
    const part = Math.round(claim.amount * 0.4);
    payClaim(s, claim, part);
    expect(claim.status).toBe('partial');
    expect(claimOutstanding(claim)).toBe(claim.amount - part);
    payClaim(s, claim, claim.amount);
    expect(claim.status).toBe('paid');
    expect(claim.paid).toBe(claim.amount);
  });

  it('berechnet Mietrückstände nach Alter', () => {
    const s = game();
    const age = receivablesByAge(s);
    // Startgebäude: Mieter in 0.2 ist ~1,6 Monate im Rückstand
    const overdue = s.claims.filter((c) => c.dueDay < s.day && c.status !== 'paid').reduce((a, c) => a + claimOutstanding(c), 0);
    expect(age.d30 + age.d60 + age.d90 + age.over90).toBe(overdue);
    expect(overdue).toBeGreaterThan(0);
  });

  it('Mahnungen erzeugen kein Geld und basieren auf offenen Forderungen', () => {
    const s = game();
    const overdue = s.claims.find((c) => c.dueDay < s.day && c.status !== 'paid')!;
    const cash = s.cash;
    expect(dun(s, overdue).ok).toBe(true);
    expect(s.cash).toBe(cash);
    const fresh = s.claims.find((c) => c.dueDay > s.day)!;
    expect(dun(s, fresh).ok).toBe(false);
  });

  it('erstellt jeden Monat genau eine Mietforderung je Vertrag', () => {
    const s = game(3);
    advanceDays(s, 120);
    const keys = s.claims.filter((c) => c.kind === 'rent').map((c) => `${c.contractId}:${c.period}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('Ratenzahlung lässt sich nur bei Rückständen vereinbaren', () => {
    const s = game();
    const c = s.contracts.find((x) => s.claims.some((cl) => cl.contractId === x.id && cl.dueDay < s.day && cl.status !== 'paid'))!;
    expect(applyAction(s, { type: 'paymentPlan', contractId: c.id, monthlyAmount: 10 }).ok).toBe(false);
    expect(applyAction(s, { type: 'paymentPlan', contractId: c.id, monthlyAmount: 30000 }).ok).toBe(true);
    const other = s.contracts.find((x) => !s.claims.some((cl) => cl.contractId === x.id && cl.dueDay < s.day && cl.status !== 'paid'))!;
    expect(applyAction(s, { type: 'paymentPlan', contractId: other.id, monthlyAmount: 30000 }).ok).toBe(false);
  });

  it('Nebenkostenabrechnung verteilt Kosten und bleibt journalkonsistent', () => {
    const s = game(5);
    advanceDays(s, fromYmd(2028, 3, 2) - s.day);
    expect(s.counters['settlement-2027']).toBe(1);
    expect(s.messages.some((m) => m.title.includes('Betriebskostenabrechnung 2027'))).toBe(true);
    expect(ledgerBalance(s)).toBe(s.cash);
  });
});
