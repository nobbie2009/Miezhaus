import { describe, expect, it } from 'vitest';
import { applyAction } from '@/game/actions';
import { createGame } from '@/game/create';
import { ledgerBalance } from '@/game/ledger';
import { allViews, propertyView, rootOf } from '@/game/portfolio';
import { generateProperty, purchaseCosts, saleQuote } from '@/game/realestate';
import { advanceDays } from '@/game/simulation';
import { autoSpentThisMonth } from '@/game/automation';
import { Rng } from '@/utils/rng';
import { euro } from '@/utils/money';
import { exportSave, importSave, validateState } from '@/persistence/saveFile';

function richGame(seed = 5) {
  const s = createGame({ scenarioId: 'endless_linden', seed });
  s.unlocks.push('portfolio');
  // Startkapital erhöhen (über das Journal, damit der Kontostand konsistent bleibt)
  s.startCash += euro(900_000);
  s.cash += euro(900_000);
  return s;
}

describe('Portfolio', () => {
  it('Objekt-Sichten trennen Objektdaten und teilen Konto, Journal und IDs', () => {
    const s = richGame();
    const prop = generateProperty(s, new Rng(s));
    s.properties.push(prop);
    const v = propertyView(s, prop);
    expect(v.apartments).toBe(prop.apartments);
    expect(v.apartments).not.toBe(s.apartments);
    expect(v.ledger).toBe(s.ledger);
    expect(rootOf(v)).toBe(s);
    const cash = s.cash;
    v.cash -= 100;
    expect(s.cash).toBe(cash - 100);
    expect(allViews(s)).toHaveLength(2);
    const ids = new Set([...s.apartments, ...prop.apartments].map((a) => a.id));
    expect(ids.size).toBe(s.apartments.length + prop.apartments.length);
  });

  it('Kauf bucht Kaufpreis und Nebenkosten, Simulation läuft für beide Objekte', () => {
    const s = richGame();
    advanceDays(s, 1);
    if (!s.propertyMarket.length) advanceDays(s, 120);
    expect(s.propertyMarket.length).toBeGreaterThan(0);
    const o = s.propertyMarket[0];
    const costs = purchaseCosts(o);
    const cashBefore = s.cash;
    const r = applyAction(s, { type: 'buyProperty', offerId: o.id, loanAmount: Math.round(o.askingPrice * 0.6), loanYears: 25 });
    expect(r.ok).toBe(true);
    expect(s.properties).toHaveLength(1);
    expect(s.cash).toBe(cashBefore - costs.total + Math.round((o.askingPrice * 0.6) / 10000) * 10000);
    expect(ledgerBalance(s)).toBe(s.cash);
    const bId = s.properties[0].building.id;
    expect(s.ledger.filter((e) => e.propertyId === bId && e.category === 'property_purchase')).toHaveLength(1);
    advanceDays(s, 400);
    expect(ledgerBalance(s)).toBe(s.cash);
    // Mieten aus dem neuen Objekt fließen
    expect(s.ledger.some((e) => e.propertyId === bId && e.category === 'rent')).toBe(true);
    const snap = s.history[s.history.length - 1];
    expect(snap.units).toBe(s.apartments.length + s.properties[0].apartments.length);
    // Speichern/Laden mit Portfolio
    const back = importSave(exportSave(s));
    expect(back.ok).toBe(true);
    expect(back.state).toEqual(s);
    // Verkauf innerhalb der Spekulationsfrist ist steuerpflichtig
    const q = saleQuote(s, bId)!;
    expect(q.speculation).toBe(true);
    const sold = applyAction(s, { type: 'sellProperty', buildingId: bId });
    expect(sold.ok).toBe(true);
    expect(s.properties).toHaveLength(0);
    expect(ledgerBalance(s)).toBe(s.cash);
  });
});

describe('Geldanlagen', () => {
  it('Tagesgeld verzinst, Festgeld ist gebunden, ETF schwankt – alles über das Journal', () => {
    const s = richGame(9);
    expect(applyAction(s, { type: 'invest', kind: 'savings', amount: euro(50_000) }).ok).toBe(true);
    expect(applyAction(s, { type: 'invest', kind: 'fixed', amount: euro(20_000), years: 1 }).ok).toBe(true);
    expect(applyAction(s, { type: 'invest', kind: 'etf', amount: euro(30_000) }).ok).toBe(true);
    expect(applyAction(s, { type: 'invest', kind: 'etf', amount: s.cash + euro(1) }).ok).toBe(false);
    const fixed = s.investments.find((i) => i.kind === 'fixed')!;
    expect(applyAction(s, { type: 'withdrawInvestment', investmentId: fixed.id, amount: 'all' }).ok).toBe(false);
    advanceDays(s, 400);
    const savings = s.investments.find((i) => i.kind === 'savings')!;
    expect(savings.value).toBeGreaterThan(euro(50_000));
    expect(s.investments.some((i) => i.kind === 'fixed')).toBe(false); // fällig und ausgezahlt
    expect(s.ledger.some((e) => e.category === 'investment_income')).toBe(true);
    const etf = s.investments.find((i) => i.kind === 'etf')!;
    expect(applyAction(s, { type: 'withdrawInvestment', investmentId: etf.id, amount: 'all' }).ok).toBe(true);
    expect(s.investments.some((i) => i.kind === 'etf')).toBe(false);
    expect(ledgerBalance(s)).toBe(s.cash);
  });
});

describe('Mieter-App & Automatik', () => {
  it('vergibt Reparaturen automatisch innerhalb der Regeln', () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 3 });
    applyAction(s, { type: 'setService', key: 'tenantApp', value: true });
    applyAction(s, { type: 'setAutomation', patch: { autoRepair: true, maxAutoCost: euro(800), monthlyBudget: euro(2000), minCashReserve: 0, includeCritical: false } });
    advanceDays(s, 60);
    const autoJobs = s.counters.autoJobs ?? 0;
    expect(autoJobs).toBeGreaterThan(0);
    for (const j of s.jobs.filter((x) => x.kind === 'repair')) {
      if (j.urgency !== 'critical') expect(j.estimatedCost).toBeLessThanOrEqual(euro(800));
    }
    expect(autoSpentThisMonth(s)).toBeLessThanOrEqual(euro(2000));
    expect(applyAction(s, { type: 'setAutomation', patch: { lettingRentFactor: 5 } }).ok).toBe(false);
  });

  it('„Alle beauftragen“ vergibt für jeden bekannten Schaden einen Auftrag', () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 4 });
    const open = s.defects.filter((d) => d.discovered && d.resolvedDay === null && !d.jobId).length;
    expect(open).toBeGreaterThan(0);
    const r = applyAction(s, { type: 'repairAll' });
    expect(r.ok).toBe(true);
    expect(s.defects.filter((d) => d.discovered && d.resolvedDay === null && !d.jobId).length).toBe(0);
  });

  it('Rahmenvertrag senkt Preise', () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 4 });
    const c = s.contractors.find((x) => x.reliability >= 60)!;
    expect(applyAction(s, { type: 'toggleFramework', contractorId: c.id }).ok).toBe(true);
    expect(s.automation.frameworkContracts).toContain(c.id);
  });

  it('migriert v1-Spielstände', () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 1 });
    const old = structuredClone(s) as unknown as Record<string, unknown>;
    old.schemaVersion = 1;
    for (const k of ['properties', 'propertyMarket', 'investments', 'automation', 'purchaseDay', 'purchasePrice']) delete old[k];
    delete (old.building as Record<string, unknown>).locationFactor;
    delete (old.services as Record<string, unknown>).tenantApp;
    for (const e of old.ledger as Record<string, unknown>[]) delete e.propertyId;
    for (const m of old.messages as Record<string, unknown>[]) delete m.propertyId;
    const r = validateState(old);
    expect(r.errors).toEqual([]);
    expect(r.state!.properties).toEqual([]);
    expect(r.state!.services.tenantApp).toBe(false);
  });
});
