import { rootOf, viewById } from './portfolio';
import type { GameState } from '@/domain/schema';
import { MEASURE_BY_ID } from '@/content/measures';
import { CONFIG } from './config';
import { avgSatisfaction, buildingAttractiveness, buildingCondition, comparableRent, energyClass, marketValue, specificEnergyDemand } from './derived';
import { annualEnergyCostEstimate } from './energy';
import { activeSubsidyRate, offersFor, specFor, type JobRequest } from './jobs';
import { computeSatisfaction } from './tenants';

export interface Forecast {
  costMin: number;
  costMax: number;
  costEstimate: number;
  subsidy: number;
  days: number;
  before: Metrics;
  after: Metrics;
  annualEnergySaving: number;
  rentPotentialMonthly: number;
  modernizationSurchargeMonthly: number;
  paybackYears: number | null;
  liquidityAfter: number;
  notes: string[];
}

interface Metrics {
  comparableRent: number;
  annualEnergyCost: number;
  energyDemand: number;
  energyClass: string;
  marketValue: number;
  buildingCondition: number;
  attractiveness: number;
  satisfactionTarget: number;
}

function metrics(s: GameState): Metrics {
  const e = annualEnergyCostEstimate(s);
  const ts = s.tenants.filter((t) => t.status !== 'former' && t.apartmentId);
  return {
    comparableRent: s.apartments.reduce((a, ap) => a + comparableRent(s, ap), 0),
    annualEnergyCost: e.heating + e.electricity,
    energyDemand: specificEnergyDemand(s),
    energyClass: energyClass(s).label,
    marketValue: marketValue(s),
    buildingCondition: buildingCondition(s),
    attractiveness: buildingAttractiveness(s),
    satisfactionTarget: ts.length ? ts.reduce((a, t) => a + computeSatisfaction(s, t).target, 0) / ts.length : avgSatisfaction(s),
  };
}

/** Kosten-Nutzen-Prognose einer Maßnahme: Spielzustand vorher/nachher werden simuliert verglichen. */
export function forecastMeasure(s: GameState, req: JobRequest, contractorId?: string): Forecast | { error: string } {
  const spec = specFor(s, req);
  if ('error' in spec) return spec;
  const offers = offersFor(s, spec);
  const offer = offers.find((o) => o.contractorId === contractorId) ?? offers[0];
  if (!offer) return { error: 'Kein Dienstleister verfügbar.' };
  const before = metrics(s);
  // Objekt-Sichten (Proxy) sind nicht klonbar: Wurzel kopieren und dieselbe Sicht in der Kopie öffnen
  const sim: GameState = viewById(structuredClone(rootOf(s)), s.building.id);
  if (req.kind === 'measure') {
    const m = MEASURE_BY_ID[req.measureId];
    const apt = req.apartmentId ? sim.apartments.find((a) => a.id === req.apartmentId) : undefined;
    m.apply(sim, apt);
  } else if (req.kind === 'maintenance') {
    const c = sim.building.components[req.component]!;
    c.condition = Math.min(100, c.condition + 6);
  } else {
    sim.defects = sim.defects.map((d) => (d.id === req.defectId ? { ...d, resolvedDay: sim.day } : d));
  }
  const after = metrics(sim);
  const subsidy = spec.measure?.subsidyEligible ? Math.round(offer.price * activeSubsidyRate(s)) : 0;
  const net = offer.price - subsidy;
  const annualEnergySaving = before.annualEnergyCost - after.annualEnergyCost;
  const rentPotentialMonthly = after.comparableRent - before.comparableRent;
  const modShare = spec.measure?.modernizationShare ?? 0;
  const area = req.kind === 'measure' && req.apartmentId ? s.apartments.find((a) => a.id === req.apartmentId)?.area ?? 0 : s.apartments.reduce((a, b) => a + b.area, 0);
  const modernizationSurchargeMonthly = Math.min(Math.round((offer.price * modShare * CONFIG.rent.modernizationRate) / 12), Math.round(area * CONFIG.rent.modernizationCapPerSqm));
  // Vermieter profitiert von Energieeinsparung nur anteilig (Leerstand, Zufriedenheit) – Mietpotenzial zählt voll.
  const yearlyBenefit = annualEnergySaving * 0.25 + Math.max(rentPotentialMonthly, modernizationSurchargeMonthly) * 12;
  const notes: string[] = [];
  if (spec.blocksApartment) notes.push(`Wohnung ca. ${offer.days} Tage nicht nutzbar.`);
  if (spec.noise >= 2) notes.push(`Baulärm über ${offer.days} Tage – lärmempfindliche Mieter werden unzufrieden.`);
  if (spec.measure?.id.startsWith('heating_')) notes.push('Während des Heizungstauschs keine Wärme – möglichst außerhalb der Heizperiode planen.');
  if (subsidy > 0) notes.push(`Aktives Förderprogramm: ${Math.round(activeSubsidyRate(s) * 100)} % Zuschuss (${Math.round(subsidy / 100).toLocaleString('de-DE')} €).`);
  notes.push(`Kostenschätzung ±${Math.round(offer.uncertainty * 100)} % – Altbauten bergen Überraschungen.`);
  if (annualEnergySaving > 0) notes.push('Heizkosteneinsparungen kommen über die Nebenkosten vor allem den Mietern zugute.');
  return {
    costEstimate: offer.price,
    costMin: Math.round(offer.price * (1 - offer.uncertainty * 0.5)),
    costMax: Math.round(offer.price * (1 + offer.uncertainty * 1.5)),
    subsidy,
    days: offer.days,
    before,
    after,
    annualEnergySaving,
    rentPotentialMonthly,
    modernizationSurchargeMonthly,
    paybackYears: yearlyBenefit > 0 ? net / yearlyBenefit : null,
    liquidityAfter: s.cash - net,
    notes,
  };
}
