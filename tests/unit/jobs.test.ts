import { describe, expect, it } from 'vitest';
import { createGame } from '@/game/create';
import { applyAction } from '@/game/actions';
import { offersFor, specFor } from '@/game/jobs';
import { advanceDays } from '@/game/simulation';
import { createDefect, escalateDefects } from '@/game/defects';
import { ledgerBalance } from '@/game/ledger';
import { Rng } from '@/utils/rng';

const game = (seed = 21) => createGame({ scenarioId: 'endless_linden', seed });

function offer(s: ReturnType<typeof game>, req: Parameters<typeof specFor>[1]) {
  const spec = specFor(s, req);
  if ('error' in spec) throw new Error(spec.error);
  return offersFor(s, spec).sort((a, b) => b.reliability - a.reliability)[0];
}

describe('Reparaturen & Renovierungen', () => {
  it('Reparatur behebt den Schaden und bucht die Kosten', () => {
    const s = game();
    const d = s.defects.find((x) => x.type === 'stairwell_light')!;
    const o = offer(s, { kind: 'repair', defectId: d.id });
    const r = applyAction(s, { type: 'createJob', request: { kind: 'repair', defectId: d.id }, contractorId: o.contractorId });
    expect(r.ok).toBe(true);
    const job = s.jobs.find((j) => j.defectIds.includes(d.id))!;
    advanceDays(s, 30);
    expect(job.status).toBe('done');
    expect(d.resolvedDay).not.toBeNull();
    const posted = s.ledger.filter((e) => e.ref?.type === 'job' && e.ref.id === job.id).reduce((a, e) => a + e.amount, 0);
    expect(-posted).toBe(job.actualCost);
    expect(ledgerBalance(s)).toBe(s.cash);
  });

  it('Doppelte Beauftragung (Doppelklick) wird verhindert', () => {
    const s = game();
    const d = s.defects.find((x) => x.type === 'stairwell_light')!;
    const o = offer(s, { kind: 'repair', defectId: d.id });
    const a = { type: 'createJob' as const, request: { kind: 'repair' as const, defectId: d.id }, contractorId: o.contractorId };
    expect(applyAction(s, a).ok).toBe(true);
    expect(applyAction(s, a).ok).toBe(false);
    expect(s.jobs.filter((j) => j.defectIds.includes(d.id)).length).toBe(1);
  });

  it('Renovierung belastet die Liquidität (Abschlag + Schlussrechnung)', () => {
    const s = game();
    const apt = s.apartments.find((a) => a.status === 'vacant_needs_renovation')!;
    const req = { kind: 'measure' as const, measureId: 'apt_paint', apartmentId: apt.id };
    const o = offer(s, req);
    const cash = s.cash;
    applyAction(s, { type: 'createJob', request: req, contractorId: o.contractorId });
    const job = s.jobs[s.jobs.length - 1];
    advanceDays(s, 1 + o.startDay - s.day);
    expect(job.paid).toBe(Math.round(job.estimatedCost * 0.3));
    advanceDays(s, 40);
    expect(job.status).toBe('done');
    const jobCost = -s.ledger.filter((e) => e.ref?.id === job.id).reduce((a, e) => a + e.amount, 0);
    expect(jobCost).toBe(job.actualCost);
    expect(apt.condition).toBeGreaterThanOrEqual(50);
    expect(['vacant_ready', 'uninhabitable']).toContain(apt.status);
    expect(s.cash).toBeLessThan(cash + 1_000_000);
  });

  it('Maßnahmen in bewohnten Wohnungen, die Leerstand erfordern, sind gesperrt', () => {
    const s = game();
    const apt = s.apartments.find((a) => a.status === 'rented')!;
    const spec = specFor(s, { kind: 'measure', measureId: 'apt_full', apartmentId: apt.id });
    expect('error' in spec).toBe(true);
  });

  it('Folgeschäden entstehen nur unbehandelt und nach Ablauf der Frist', () => {
    const s = game();
    const rng = new Rng(s);
    const d = createDefect(s, 'heating_fault', { kind: 'component', key: 'heating' }, { cause: 'Test' })!;
    // Frist noch nicht erreicht
    escalateDefects(s, rng);
    expect(s.defects.some((x) => x.type === 'heating_failure')).toBe(false);
    // Mit Auftrag: Eskalation wird aufgeschoben
    s.day = d.escalateAtDay!;
    const o = offer(s, { kind: 'repair', defectId: d.id });
    s.contractors.find((c) => c.id === o.contractorId)!.waitDays = 30;
    applyAction(s, { type: 'createJob', request: { kind: 'repair', defectId: d.id }, contractorId: o.contractorId });
    escalateDefects(s, rng);
    expect(s.defects.some((x) => x.type === 'heating_failure' && x.resolvedDay === null)).toBe(false);
    // Ohne Auftrag nach Frist: Folgeschaden
    const s2 = game(2);
    const d2 = createDefect(s2, 'heating_fault', { kind: 'component', key: 'heating' }, { cause: 'Test' })!;
    s2.day = d2.escalateAtDay!;
    escalateDefects(s2, new Rng(s2));
    expect(s2.defects.some((x) => x.type === 'heating_failure' && x.escalatedFrom === d2.id)).toBe(true);
  });

  it('Wartung verbessert den Bauteilzustand', () => {
    const s = game();
    const before = s.building.components.heating!.condition;
    const o = offer(s, { kind: 'maintenance', component: 'heating' });
    applyAction(s, { type: 'createJob', request: { kind: 'maintenance', component: 'heating' }, contractorId: o.contractorId });
    advanceDays(s, 20);
    expect(s.building.components.heating!.lastMaintenanceDay).not.toBeNull();
    expect(s.building.components.heating!.condition).toBeGreaterThan(before - 2);
  });
});
