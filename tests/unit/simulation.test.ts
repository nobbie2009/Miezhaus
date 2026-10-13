import { describe, expect, it } from 'vitest';
import { createGame } from '@/game/create';
import { advanceDay, advanceDays } from '@/game/simulation';
import { ledgerBalance } from '@/game/ledger';
import { applyAction } from '@/game/actions';
import { rentIncreaseCheck } from '@/game/contracts';
import { comparableRent } from '@/game/derived';
import { maxNewLeaseRent } from '@/game/applicants';
import { SCENARIOS } from '@/content/scenarios';
import { GameStateSchema } from '@/domain/schema';

describe('Simulation & Zeit', () => {
  it('Monatsabschlüsse sind reproduzierbar (gleicher Seed → gleiches Ergebnis)', () => {
    const a = createGame({ scenarioId: 'endless_linden', seed: 99 });
    const b = createGame({ scenarioId: 'endless_linden', seed: 99 });
    b.saveId = a.saveId;
    advanceDays(a, 200);
    advanceDays(b, 200);
    expect(a.history).toEqual(b.history);
    expect(a.ledger).toEqual(b.ledger);
    expect(a.cash).toBe(b.cash);
  });

  it('Zeitbeschleunigung überspringt keine Simulationsschritte', () => {
    const a = createGame({ scenarioId: 'endless_linden', seed: 5 });
    const b = structuredClone(a);
    advanceDays(a, 95);
    for (let i = 0; i < 95; i++) advanceDay(b);
    expect(a.day).toBe(b.day);
    expect(a.history.length).toBe(3);
    expect(a).toEqual(b);
  });

  it('Jeder Monat wird genau einmal abgeschlossen', () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 8 });
    advanceDays(s, 400);
    const periods = s.history.map((h) => h.period);
    expect(new Set(periods).size).toBe(periods.length);
    expect(periods.length).toBe(13);
    const costKeys = Object.keys(s.counters).filter((k) => k.startsWith('costs-'));
    expect(costKeys.length).toBe(13);
  });

  it('Kontostand bleibt über Jahre identisch mit dem Buchungsjournal', () => {
    for (const sc of SCENARIOS) {
      const s = createGame({ scenarioId: sc.id, seed: 4 });
      advanceDays(s, 365 * 2);
      expect(ledgerBalance(s), sc.id).toBe(s.cash);
      expect(s.ledger.every((e) => Number.isInteger(e.amount))).toBe(true);
      expect(GameStateSchema.safeParse(s).success, sc.id).toBe(true);
    }
  });

  it('Insolvenz entsteht nicht durch doppelte Buchungen', () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 12 });
    advanceDays(s, 365 * 3);
    // Keine Monatskosten doppelt gebucht
    const monthly = s.ledger.filter((e) => e.ref?.type === 'month');
    const keys = monthly.map((e) => `${e.ref!.id}:${e.category}:${e.purpose}`);
    expect(new Set(keys).size).toBe(keys.length);
    // Keine Mietforderung doppelt bezahlt
    for (const c of s.claims) expect(c.paid).toBeLessThanOrEqual(c.amount);
    const ids = s.ledger.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('Insolvenz tritt erst nach anhaltender Überschreitung des Dispos ein', () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 3 });
    const delta = -s.overdraftLimit - 4_000_000 - s.cash;
    s.cash += delta;
    s.startCash += delta;
    advanceDays(s, 10);
    expect(s.gameOver).toBeNull();
    expect(s.daysBelowOverdraft).toBeGreaterThan(0);
    advanceDays(s, 60);
    expect(s.gameOver?.kind).toBe('insolvency');
  });

  it('Mieterhöhung respektiert Vergleichsmiete, Kappung und Sperrfrist', () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 6 });
    const c = s.contracts.find((x) => rentIncreaseCheck(s, x).allowed && rentIncreaseCheck(s, x).maxByComparable > x.netRent)!;
    const chk = rentIncreaseCheck(s, c);
    expect(applyAction(s, { type: 'rentIncrease', contractId: c.id, newRent: chk.maxByComparable + 10000, kind: 'comparable' }).ok).toBe(false);
    expect(applyAction(s, { type: 'rentIncrease', contractId: c.id, newRent: chk.maxByComparable, kind: 'comparable' }).ok).toBe(true);
    expect(applyAction(s, { type: 'rentIncrease', contractId: c.id, newRent: chk.maxByComparable, kind: 'comparable' }).ok).toBe(false);
    advanceDays(s, 100);
    expect(c.netRent).toBe(chk.maxByComparable);
    expect(rentIncreaseCheck(s, c).allowed).toBe(false);
  });

  it('Neuvermietung: Inserat, Bewerber, Vertrag', () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 31 });
    const apt = s.apartments.find((a) => a.status === 'vacant_ready')!;
    expect(applyAction(s, { type: 'listApartment', aptId: apt.id, askingRent: maxNewLeaseRent(s, apt) + 5000, utilityPrepayment: 25000 }).ok).toBe(false);
    expect(applyAction(s, { type: 'listApartment', aptId: apt.id, askingRent: Math.round(comparableRent(s, apt) * 0.95), utilityPrepayment: 25000 }).ok).toBe(true);
    let tries = 0;
    while (!s.applicants.some((x) => x.apartmentId === apt.id) && tries++ < 60) advanceDay(s);
    const ap = s.applicants.find((x) => x.apartmentId === apt.id)!;
    expect(ap).toBeTruthy();
    let res = applyAction(s, { type: 'offerLease', applicantId: ap.id, netRent: Math.min(ap.maxRent, apt.listing!.askingRent), utilityPrepayment: 25000 });
    expect(res.ok).toBe(true);
    if (apt.status !== 'rented') {
      // abgelehnt: anderen Bewerber versuchen
      while (!s.applicants.some((x) => x.apartmentId === apt.id && !x.declined) && tries++ < 120) advanceDay(s);
      const ap2 = s.applicants.find((x) => x.apartmentId === apt.id && !x.declined)!;
      res = applyAction(s, { type: 'offerLease', applicantId: ap2.id, netRent: Math.min(ap2.maxRent, apt.listing!.askingRent), utilityPrepayment: 25000 });
    }
    if (apt.status === 'rented') {
      expect(apt.tenantId).toBeTruthy();
      expect(s.contracts.some((c) => c.apartmentId === apt.id && c.status === 'active')).toBe(true);
    }
  });

  it('Mieter reagieren auf Zustand: offene Mängel senken die Zufriedenheit', () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 2 });
    const fam = s.tenants.find((t) => t.archetype === 'young_family')!;
    expect(fam.factors).toBeDefined();
    advanceDays(s, 5);
    expect(fam.factors['Mängel']).toBeLessThan(0);
  });
});
