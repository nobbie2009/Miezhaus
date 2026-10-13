import type { Apartment, ComponentKey, GameState } from '@/domain/schema';
import { COMPONENTS } from '@/content/components';
import { DEFECT_TYPES } from '@/content/defects';
import { mulCents } from '@/utils/money';
import { clamp } from '@/utils/misc';
import { CONFIG } from './config';
import { STANDARD_DEGREE_DAYS } from './weather';

/**
 * Abgeleitete Kennzahlen. Reine Funktionen ohne Seiteneffekte –
 * UI, Warnungen, Bewertung und Statistik greifen ausschließlich hierauf zurück.
 */

export const totalArea = (s: GameState) => s.apartments.reduce((a, b) => a + b.area, 0);

export function buildingCondition(s: GameState): number {
  let sum = 0;
  let w = 0;
  for (const k of Object.keys(s.building.components) as ComponentKey[]) {
    const c = s.building.components[k]!;
    sum += c.condition * COMPONENTS[k].weight;
    w += COMPONENTS[k].weight;
  }
  return w ? sum / w : 0;
}

export function componentDefectPenalty(s: GameState, key: ComponentKey): number {
  return s.defects.filter((d) => d.resolvedDay === null && d.target.kind === 'component' && d.target.key === key).reduce((a, d) => a + d.severity * 4, 0);
}

/** Optische Attraktivität des Hauses 0–100. */
export function buildingAttractiveness(s: GameState): number {
  const c = s.building.components;
  const base =
    c.facade!.condition * 0.3 +
    c.stairwell!.condition * 0.25 +
    c.outdoor!.condition * 0.15 +
    s.building.cleanliness * 0.2 +
    s.building.outdoorCare * 0.1;
  const am = s.building.amenities;
  const bonus = (am.includes('garden') ? 4 : 0) + (am.includes('greening') ? 4 : 0) + (am.includes('community_room') ? 2 : 0) + (am.includes('intercom') ? 1 : 0);
  const defects = s.defects.filter((d) => d.resolvedDay === null && d.discovered && d.target.kind === 'component' && ['facade', 'stairwell', 'outdoor'].includes(d.target.key)).length;
  return clamp(base + bonus - defects * 4);
}

// ----------------------------------------------------------------- Energie

export function heatingEfficiency(s: GameState): number {
  const sys = s.building.heatingSystem;
  const base = CONFIG.energy.heating[sys].efficiency;
  const cond = s.building.components.heating!.condition;
  if (sys === 'heat_pump') {
    const lvl = s.building.insulationLevel;
    const cop = lvl >= 2 ? base : lvl === 1 ? base - 0.4 : base - 0.8;
    return cop * (0.85 + 0.15 * cond / 100);
  }
  return base * (0.86 + 0.14 * cond / 100);
}

export function openDefectEnergyLoss(s: GameState): number {
  return s.defects.filter((d) => d.resolvedDay === null).reduce((a, d) => a + (DEFECT_TYPES[d.type]?.energyLoss ?? 0), 0);
}

/** Wärmeverlustkoeffizient in kWh je m² und Kelvin-Gradtag. */
export function heatLossCoefficient(s: GameState): number {
  const b = s.building;
  const e = CONFIG.energy;
  const win = b.components.windows!;
  const condPenalty =
    ((100 - win.condition) / 100) * 0.12 + ((100 - b.components.roof!.condition) / 100) * 0.06 + ((100 - b.components.facade!.condition) / 100) * 0.05;
  const thermoShare = s.apartments.filter((a) => a.smartThermostat).length / Math.max(1, s.apartments.length);
  return (
    e.heatLossPerSqmKd *
    e.insulationFactor[b.insulationLevel] *
    e.windowTierFactor[win.tier - 1] *
    (1 + condPenalty + openDefectEnergyLoss(s)) *
    (b.amenities.includes('hydraulic_balancing') ? 0.93 : 1) *
    (1 - 0.08 * thermoShare)
  );
}

/** Endenergiebedarf in kWh/(m²·a) unter Standardklima – vergleichbar mit einem Energieausweis. */
export function specificEnergyDemand(s: GameState): number {
  const heat = heatLossCoefficient(s) * STANDARD_DEGREE_DAYS + 15;
  return heat / heatingEfficiency(s);
}

export const ENERGY_CLASSES: { label: string; max: number; value: number; rent: number }[] = [
  { label: 'A+', max: 30, value: 1.08, rent: 0.08 },
  { label: 'A', max: 50, value: 1.06, rent: 0.07 },
  { label: 'B', max: 75, value: 1.04, rent: 0.05 },
  { label: 'C', max: 100, value: 1.02, rent: 0.03 },
  { label: 'D', max: 130, value: 1.0, rent: 0.01 },
  { label: 'E', max: 160, value: 0.98, rent: -0.01 },
  { label: 'F', max: 200, value: 0.95, rent: -0.03 },
  { label: 'G', max: 250, value: 0.92, rent: -0.05 },
  { label: 'H', max: Infinity, value: 0.89, rent: -0.07 },
];

export const energyClassOf = (kwh: number) => ENERGY_CLASSES.find((c) => kwh < c.max) ?? ENERGY_CLASSES[ENERGY_CLASSES.length - 1];
export const energyClass = (s: GameState) => energyClassOf(specificEnergyDemand(s));
export const energyClassIndex = (s: GameState) => ENERGY_CLASSES.indexOf(energyClass(s));

export function energyPrice(s: GameState): number {
  const mod = s.market.modifiers.filter((m) => m.kind === 'energy' && m.untilDay >= s.day).reduce((a, m) => a * m.value, 1);
  return s.market.energyPriceIndex * mod;
}

/** Heizkostenpreis je kWh Nutzwärme in Cent (Bruchteile). */
export function heatPricePerKwh(s: GameState): number {
  const sys = s.building.heatingSystem;
  return CONFIG.energy.heating[sys].pricePerKwh * energyPrice(s) / heatingEfficiency(s);
}

/** Geschätzte jährliche Heizkosten (Standardklima) in Cent. */
export function estimatedAnnualHeatingCost(s: GameState): number {
  const kwh = (heatLossCoefficient(s) * STANDARD_DEGREE_DAYS + 15) * totalArea(s);
  return Math.round(kwh * heatPricePerKwh(s));
}

// ----------------------------------------------------------------- Mieten

export function materialIndex(s: GameState): number {
  return s.market.materialIndex * s.market.modifiers.filter((m) => m.kind === 'material' && m.untilDay >= s.day).reduce((a, m) => a * m.value, 1);
}

export function rentIndex(s: GameState): number {
  return s.market.modifiers.filter((m) => m.kind === 'rent' && m.untilDay >= s.day).reduce((a, m) => a * m.value, 1);
}

export function apartmentQualityFactor(s: GameState, a: Apartment): number {
  const cls = energyClass(s);
  const am = s.building.amenities;
  const amenityBonus =
    (am.includes('bike_storage') ? 0.01 : 0) +
    (am.includes('laundry_room') ? 0.01 : 0) +
    (am.includes('community_room') ? 0.015 : 0) +
    (am.includes('garden') ? 0.015 : 0) +
    (am.includes('intercom') ? 0.01 : 0) +
    (am.includes('greening') ? 0.01 : 0);
  const attr = (buildingAttractiveness(s) - 60) / 100 * 0.12;
  const floorAdj = a.floor === 0 ? -0.02 : a.floor >= s.building.floors - 1 ? 0.01 : 0;
  return (
    0.72 +
    a.condition * 0.0022 +
    (a.kitchen + a.bath + a.flooring) * 0.035 +
    (a.balcony ? 0.04 : 0) +
    cls.rent +
    attr +
    amenityBonus +
    floorAdj +
    (a.smartThermostat ? 0.005 : 0)
  );
}

/** Ortsübliche Vergleichsmiete (Nettokalt pro Monat) in Cent – vereinfachter Mietspiegel. */
export function comparableRent(s: GameState, a: Apartment): number {
  const perSqm = s.market.baseRentPerSqm * rentIndex(s) * apartmentQualityFactor(s, a);
  return Math.round((a.area * perSqm) / 100) * 100;
}

export const activeContracts = (s: GameState) => s.contracts.filter((c) => c.status !== 'ended');
export const contractOf = (s: GameState, a: Apartment) => (a.contractId ? s.contracts.find((c) => c.id === a.contractId) ?? null : null);
export const tenantOf = (s: GameState, a: Apartment) => (a.tenantId ? s.tenants.find((t) => t.id === a.tenantId) ?? null : null);

/** Monatliche Sollmiete (Nettokalt) aller laufenden Verträge. */
export const targetRent = (s: GameState) => activeContracts(s).reduce((a, c) => a + c.netRent, 0);
export const targetUtilities = (s: GameState) => activeContracts(s).reduce((a, c) => a + c.utilityPrepayment, 0);

export const occupiedCount = (s: GameState) => s.apartments.filter((a) => a.status === 'rented').length;
export const vacancyRate = (s: GameState) => 1 - occupiedCount(s) / Math.max(1, s.apartments.length);

export const activeTenants = (s: GameState) => s.tenants.filter((t) => t.status !== 'former');

export function avgSatisfaction(s: GameState): number {
  const ts = activeTenants(s);
  return ts.length ? ts.reduce((a, t) => a + t.satisfaction, 0) / ts.length : 0;
}

export const openClaims = (s: GameState) => s.claims.filter((c) => c.status === 'open' || c.status === 'partial');
export const claimOutstanding = (c: { amount: number; paid: number }) => Math.max(0, c.amount - c.paid);
export const totalReceivables = (s: GameState) => openClaims(s).reduce((a, c) => a + claimOutstanding(c), 0);
export const overdueReceivables = (s: GameState) => openClaims(s).filter((c) => c.dueDay < s.day).reduce((a, c) => a + claimOutstanding(c), 0);

export function receivablesByAge(s: GameState) {
  const r = { d30: 0, d60: 0, d90: 0, over90: 0 };
  for (const c of openClaims(s)) {
    if (c.dueDay >= s.day) continue;
    const age = s.day - c.dueDay;
    const v = claimOutstanding(c);
    if (age <= 30) r.d30 += v;
    else if (age <= 60) r.d60 += v;
    else if (age <= 90) r.d90 += v;
    else r.over90 += v;
  }
  return r;
}

export const loanBalance = (s: GameState) => s.loans.reduce((a, l) => a + l.remaining, 0);
export const monthlyLoanPayments = (s: GameState) => s.loans.filter((l) => l.remaining > 0).reduce((a, l) => a + Math.min(l.monthlyPayment, l.remaining + Math.round(l.remaining * l.annualRate / 12)), 0);

/** Verbindlichkeiten: offene Handwerkerrechnungen (laufende Aufträge, Restbetrag) + negativer Kontostand. */
export function liabilities(s: GameState): number {
  const jobs = s.jobs.filter((j) => j.status === 'in_progress').reduce((a, j) => a + Math.max(0, j.estimatedCost - j.paid), 0);
  return jobs + Math.max(0, -s.cash);
}

// ----------------------------------------------------------------- Rückstand & Wert

export function componentRenewalCost(s: GameState, key: ComponentKey): number {
  const area = totalArea(s);
  const n = s.apartments.length;
  const fp = (area / Math.max(1, s.building.floors)) * 1.15;
  const base: Record<ComponentKey, number> = {
    roof: 23000 * fp,
    facade: 4800 * area * 0.85,
    windows: 9800 * area,
    pipes: 1_400_000 + 620_000 * n,
    electrical: 900_000 + 190_000 * n,
    heating: 2_650_000,
    sanitary: 300_000 + 150_000 * n,
    stairwell: 520_000 + 38_000 * n,
    basement: 1_750_000,
    outdoor: 740_000,
  };
  return mulCents(Math.round(base[key]), materialIndex(s));
}

/** Instandhaltungsrückstand in Cent. */
export function backlogCost(s: GameState): number {
  let sum = 0;
  for (const d of s.defects) {
    if (d.resolvedDay !== null || !d.discovered) continue;
    if (d.jobId && s.jobs.find((j) => j.id === d.jobId && j.status !== 'cancelled')) continue;
    sum += mulCents(DEFECT_TYPES[d.type]?.repairCost ?? 0, materialIndex(s));
  }
  for (const k of Object.keys(s.building.components) as ComponentKey[]) {
    const c = s.building.components[k]!;
    if (c.condition < 55) sum += mulCents(componentRenewalCost(s, k), ((55 - c.condition) / 55) * 0.6);
  }
  for (const a of s.apartments) {
    if (a.condition < 50) sum += Math.round(((50 - a.condition) / 50) * a.area * 30000 * materialIndex(s));
  }
  return Math.round(sum);
}

export function marketValue(s: GameState): number {
  const annual = s.apartments.reduce((a, ap) => a + comparableRent(s, ap), 0) * 12;
  const cond = buildingCondition(s);
  const factor = (0.55 + 0.6 * cond / 100) * energyClass(s).value * (0.9 + 0.1 * s.market.demandIndex);
  const value = s.building.landValue + Math.round(annual * CONFIG.valuation.rentMultiplier * factor) - backlogCost(s);
  return Math.max(s.building.landValue, value);
}

export const equity = (s: GameState) => marketValue(s) + s.cash - loanBalance(s) - liabilities(s) + Math.min(0, 0);
export const equityRatio = (s: GameState) => {
  const assets = marketValue(s) + Math.max(0, s.cash);
  return assets > 0 ? equity(s) / assets : 0;
};

/** Laufende monatliche Fixkosten (ohne Energie/Reparaturen) in Cent. */
export function monthlyFixedCosts(s: GameState): number {
  const c = CONFIG.costs;
  const sv = s.services;
  const mgmt = sv.management === 'agency' ? c.management.agency * s.apartments.length : c.management[sv.management];
  return (
    c.propertyTaxMonthly +
    c.bankFeesMonthly +
    c.cleaning[sv.cleaning] +
    c.garden[sv.garden] +
    c.caretaker[sv.caretaker] +
    mgmt +
    c.insurance[sv.insurance] +
    (sv.maintenancePlan ? c.maintenancePlan : 0) +
    (sv.winterService ? c.winterService : 0)
  );
}

export function persons(s: GameState): number {
  return activeTenants(s).filter((t) => t.apartmentId).reduce((a, t) => a + t.householdSize, 0);
}

export const unreadMessages = (s: GameState) => s.messages.filter((m) => !m.read).length;

export function openDefects(s: GameState, opts: { discoveredOnly?: boolean } = {}) {
  return s.defects.filter((d) => d.resolvedDay === null && (!opts.discoveredOnly || d.discovered));
}

export const defectsOfApartment = (s: GameState, aptId: string) =>
  s.defects.filter((d) => d.resolvedDay === null && d.target.kind === 'apartment' && d.target.apartmentId === aptId);

export const activeJobs = (s: GameState) => s.jobs.filter((j) => j.status === 'scheduled' || j.status === 'in_progress');

export function apartmentLabel(a: Apartment) {
  return `Whg. ${a.number}`;
}

export function floorLabel(floor: number, floors: number) {
  if (floor === 0) return 'Erdgeschoss';
  if (floor === floors - 1 && floors > 3) return 'Dachgeschoss';
  return `${floor}. Obergeschoss`;
}
