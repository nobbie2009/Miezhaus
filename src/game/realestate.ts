import type { ComponentKey, GameState, Property, PropertyOffer } from '@/domain/schema';
import { COMPONENT_KEYS } from '@/domain/schema';
import { COMPONENT_DEFECT_POOL, APARTMENT_DEFECT_POOL } from '@/content/defects';
import { DISTRICTS, PROPERTY_TEMPLATES, SELLERS, STREETS, type PropertyTemplate } from '@/content/properties';
import type { AptSpec, TenantSpec } from '@/content/scenarios';
import { formatDate } from '@/utils/date';
import { euro, formatMoney, formatPercent } from '@/utils/money';
import { clamp } from '@/utils/misc';
import type { Rng } from '@/utils/rng';
import { CONFIG } from './config';
import { buildBuilding, populateProperty, type PropertyDef } from './create';
import { backlogCost, buildingCondition, marketValue, totalArea } from './derived';
import { emptyEnergyMonth } from './energy';
import { loanQuote, takeLoan } from './finance';
import { nextId } from './ids';
import { post } from './ledger';
import { addMessage, log } from './messages';
import { allViews, propertyView, rootOf } from './portfolio';
import { hasUnlock } from './progression';

const RE = CONFIG.realEstate;

const pickRange = (rng: Rng, [a, b]: readonly [number, number]) => rng.range(a, b);
const pickInt = (rng: Rng, [a, b]: readonly [number, number]) => rng.int(a, b);

function makeDef(s: GameState, t: PropertyTemplate, rng: Rng): PropertyDef {
  const floorsN = pickInt(rng, t.floors);
  const perFloor = pickInt(rng, t.perFloor);
  const base = pickRange(rng, t.condition);
  const occupancy = pickRange(rng, t.occupancy);
  const location = Math.round(pickRange(rng, t.location) * 100) / 100;
  const year = pickInt(rng, t.years);
  const street = `${rng.pick(STREETS)} ${rng.int(2, 88)}`;
  const components = {} as Record<ComponentKey, number>;
  for (const k of COMPONENT_KEYS) components[k] = Math.round(clamp(base + rng.normal(0, 9), 10, 98));
  const floors: AptSpec[][] = [];
  for (let f = 0; f < floorsN; f++) {
    const row: AptSpec[] = [];
    for (let p = 0; p < perFloor; p++) {
      const idx = rng.int(0, t.areas.length - 1);
      const cond = Math.round(clamp(base + rng.normal(0, 12), 12, 98));
      const level = cond > 85 ? 3 : cond > 65 ? 2 : cond > 40 ? 1 : 0;
      const spec: AptSpec = {
        area: t.areas[idx] + rng.int(-4, 4),
        rooms: t.rooms[idx % t.rooms.length],
        balcony: f > 0 && rng.chance(t.balcony),
        kitchen: clamp(level + rng.int(-1, 1), 0, 3),
        bath: clamp(level + rng.int(-1, 1), 0, 3),
        flooring: clamp(level + rng.int(-1, 0), 0, 3),
        condition: cond,
      };
      if (rng.chance(occupancy)) {
        const tenant: TenantSpec = { yearsAgo: Math.round(rng.range(0.5, 16) * 10) / 10, rentFactor: pickRange(rng, t.rentFactor), satisfaction: rng.int(48, 76) };
        spec.tenant = tenant;
      } else spec.status = cond < CONFIG.apartments.needsRenovationBelow ? 'vacant_needs_renovation' : 'vacant_ready';
      if (rng.chance(0.25 + (100 - cond) / 250)) {
        const d = rng.weighted(APARTMENT_DEFECT_POOL.map((x) => ({ item: x.id, weight: x.weight })));
        spec.defects = [{ type: d, discovered: !!spec.tenant && rng.chance(0.4) }];
      }
      row.push(spec);
    }
    floors.push(row);
  }
  const componentDefects: PropertyDef['componentDefects'] = [];
  for (const k of COMPONENT_KEYS) {
    if (!rng.chance(components[k] < 45 ? 0.45 : components[k] < 65 ? 0.15 : 0.03)) continue;
    const pool = COMPONENT_DEFECT_POOL[k].filter((x) => !x.minSeverityCondition || components[k] < x.minSeverityCondition + 10);
    const d = rng.weighted(pool.map((x) => ({ item: x.id, weight: x.weight })));
    // Verkäufer verschweigen gern: die meisten Bauteilmängel sind verdeckt
    componentDefects.push({ key: k, type: d, discovered: rng.chance(0.25) });
  }
  const area = floors.flat().reduce((a, b) => a + b.area, 0);
  return {
    building: {
      name: street,
      address: street,
      city: rng.pick(DISTRICTS),
      yearBuilt: year,
      landValue: Math.round((area * euro(260) * location * rng.range(0.85, 1.15)) / 100000) * 100000,
      buildingClass: t.buildingClass,
      heatingSystem: rng.pick(t.heating),
      heatingYear: Math.min(new Date(s.day * 86400000).getUTCFullYear(), Math.max(year, 1985 + rng.int(0, 35))),
      insulationLevel: pickInt(rng, t.insulation),
      windowTier: pickInt(rng, t.windowTier),
      cleanliness: Math.round(clamp(base + rng.normal(0, 10), 20, 95)),
      outdoorCare: Math.round(clamp(base + rng.normal(0, 10), 20, 95)),
      fireSafety: Math.round(clamp(base + rng.normal(5, 8), 25, 95)),
      security: Math.round(clamp(base + rng.normal(5, 8), 25, 95)),
      amenities: [...(t.amenities ?? [])],
      locationFactor: location,
    },
    components,
    floors,
    componentDefects,
    utilityPerSqm: 350,
  };
}

/** Erzeugt ein vollständiges Objekt (mit Mietern) für ein Kaufangebot. */
export function generateProperty(s: GameState, rng: Rng, templateId?: string): Property {
  const root = rootOf(s);
  const t = templateId ? PROPERTY_TEMPLATES.find((x) => x.id === templateId)! : rng.weighted(PROPERTY_TEMPLATES.map((x) => ({ item: x, weight: x.weight })));
  const def = makeDef(root, t, rng);
  const bId = nextId(root, 'obj');
  const prop: Property = {
    building: buildBuilding(def, bId),
    apartments: [],
    tenants: [],
    contracts: [],
    claims: [],
    defects: [],
    jobs: [],
    services: { cleaning: 'tenants', garden: 'none', caretaker: 'none', management: 'self', insurance: 'basic', maintenancePlan: false, winterService: false, tenantApp: false },
    insuranceClaims: [],
    applicants: [],
    energyMonth: emptyEnergyMonth(),
    energyHistory: [],
    counters: {},
    purchaseDay: root.day,
    purchasePrice: 0,
  };
  const view = propertyView(root, prop);
  populateProperty(view, def, rng, { aptPrefix: `${bId}-`, startDay: root.day, arrears: false });
  // Bestandsmängel entstanden „vor einiger Zeit“
  for (const d of prop.defects) d.createdDay = root.day - rng.int(10, 120);
  prop.counters.startEnergyDemand = 0;
  return prop;
}

function makeOffer(s: GameState, rng: Rng): PropertyOffer {
  const prop = generateProperty(s, rng);
  const view = propertyView(s, prop);
  const value = marketValue(view);
  // Verkäufer verlangen meist etwas mehr; Not- und Erbschaftsverkäufe sind günstiger
  const seller = rng.pick(SELLERS);
  const motivated = /Erben|Insolvenz/.test(seller);
  const asking = Math.round((value * rng.range(motivated ? 0.82 : 0.95, motivated ? 1.0 : 1.18)) / 500000) * 500000;
  const pitchT = PROPERTY_TEMPLATES.find((t) => t.buildingClass === prop.building.buildingClass);
  return {
    id: nextId(s, 'offer'),
    listedDay: s.day,
    expiresDay: s.day + RE.offerLifetimeDays + rng.int(-15, 15),
    askingPrice: Math.max(asking, prop.building.landValue),
    advertisedCondition: Math.round(clamp(buildingCondition(view) + rng.range(3, 14))),
    surveyed: false,
    seller,
    pitch: pitchT ? rng.pick(pitchT.pitch) : 'Interessantes Renditeobjekt.',
    property: prop,
  };
}

/** Täglich: Angebote erscheinen und verschwinden. */
export function updatePropertyMarket(s: GameState, rng: Rng) {
  if (!hasUnlock(s, 'portfolio')) return;
  const before = s.propertyMarket.length;
  s.propertyMarket = s.propertyMarket.filter((o) => o.expiresDay >= s.day);
  if (s.propertyMarket.length < before) log(s, 'Ein Immobilienangebot wurde anderweitig verkauft.', 'market');
  const next = s.counters.nextOfferDay ?? s.day;
  if (s.day < next || s.propertyMarket.length >= RE.maxOffers) return;
  const o = makeOffer(s, rng);
  s.propertyMarket.push(o);
  s.counters.nextOfferDay = s.day + rng.int(RE.offerIntervalDays[0], RE.offerIntervalDays[1]);
  addMessage(s, {
    category: 'system',
    title: `Neues Immobilienangebot: ${o.property.building.name}`,
    text: `${o.property.apartments.length} Wohnungen, ${Math.round(totalArea(propertyView(s, o.property)))} m², Baujahr ${o.property.building.yearBuilt}, ${o.property.building.city}. Kaufpreis ${formatMoney(o.askingPrice)} (${o.seller}). Angebot gültig bis ${formatDate(o.expiresDay)}.`,
    link: { page: 'portfolio', id: o.id },
  });
}

export const surveyCost = (o: PropertyOffer) => Math.round((RE.surveyBase + o.askingPrice * RE.surveyRate) / 1000) * 1000;

export interface PurchaseCosts {
  price: number;
  transferTax: number;
  notary: number;
  broker: number;
  total: number;
}

export function purchaseCosts(o: PropertyOffer, price = o.askingPrice): PurchaseCosts {
  const transferTax = Math.round(price * RE.transferTax);
  const notary = Math.round(price * RE.notary);
  const broker = /Makler/.test(o.seller) ? Math.round(price * RE.broker) : 0;
  return { price, transferTax, notary, broker, total: price + transferTax + notary + broker };
}

/** Bausachverständiger: deckt verdeckte Mängel auf und ermittelt den tatsächlichen Zustand. */
export function surveyOffer(s: GameState, offerId: string): { ok: boolean; error?: string; message?: string } {
  const o = s.propertyMarket.find((x) => x.id === offerId);
  if (!o) return { ok: false, error: 'Angebot nicht mehr verfügbar.' };
  if (o.surveyed) return { ok: false, error: 'Das Gutachten liegt bereits vor.' };
  const cost = surveyCost(o);
  if (s.cash + s.overdraftLimit < cost) return { ok: false, error: 'Nicht genügend Liquidität.' };
  post(s, { category: 'purchase_costs', amount: -cost, purpose: `Bausachverständiger: Gutachten ${o.property.building.name}`, ref: { type: 'offer', id: o.id } });
  o.surveyed = true;
  let found = 0;
  for (const d of o.property.defects) {
    if (!d.discovered) {
      d.discovered = true;
      d.discoveredDay = s.day;
      found++;
    }
  }
  const view = propertyView(s, o.property);
  return { ok: true, message: `Gutachten erstellt: Zustand ${Math.round(buildingCondition(view))} % (Exposé: ${o.advertisedCondition} %), ${found} verdeckte Mängel, Instandhaltungsstau ca. ${formatMoney(backlogCost(view))}.` };
}

export interface BuyOptions {
  offerId: string;
  /** Angebotener Kaufpreis (Verhandlung), Standard: Angebotspreis */
  price?: number;
  loanAmount: number;
  loanYears: number;
}

/** Wahrscheinlichkeit, dass der Verkäufer ein Gebot annimmt. */
export function bidAcceptance(o: PropertyOffer, price: number): number {
  const ratio = price / o.askingPrice;
  if (ratio >= 1) return 1;
  const motivated = /Erben|Insolvenz/.test(o.seller);
  return clamp((ratio - (motivated ? 0.86 : 0.9)) / (motivated ? 0.14 : 0.1), 0, 1);
}

export function buyProperty(s: GameState, opts: BuyOptions, rng: Rng): { ok: boolean; error?: string; message?: string; accepted?: boolean } {
  if (!hasUnlock(s, 'portfolio')) return { ok: false, error: 'Der Immobilienmarkt wird in Phase 3 freigeschaltet.' };
  const o = s.propertyMarket.find((x) => x.id === opts.offerId);
  if (!o) return { ok: false, error: 'Angebot nicht mehr verfügbar.' };
  const price = Math.round((opts.price ?? o.askingPrice) / 100000) * 100000;
  if (price < o.askingPrice * 0.75) return { ok: false, error: 'Das Gebot ist zu niedrig – der Verkäufer verhandelt nicht.' };
  const costs = purchaseCosts(o, price);
  const loan = Math.max(0, Math.round(opts.loanAmount / 10000) * 10000);
  if (loan > price) return { ok: false, error: 'Die Bank finanziert höchstens den Kaufpreis – Nebenkosten müssen aus Eigenkapital bezahlt werden.' };
  if (s.cash + loan - costs.total < 0) return { ok: false, error: `Eigenkapital reicht nicht: benötigt ${formatMoney(costs.total - loan)}, verfügbar ${formatMoney(Math.max(0, s.cash))}.` };
  if (price < o.askingPrice) {
    const key = `bid-${o.id}`;
    if (s.counters[key]) return { ok: false, error: 'Der Verkäufer hat bereits ein Gebot abgelehnt und verhandelt nicht weiter.' };
    if (!rng.chance(bidAcceptance(o, price))) {
      s.counters[key] = 1;
      return { ok: true, accepted: false, message: `${o.seller} lehnt Ihr Gebot von ${formatMoney(price)} ab. Zum Angebotspreis ${formatMoney(o.askingPrice)} können Sie weiterhin kaufen.` };
    }
  }
  const prop = o.property;
  const view = propertyView(s, prop);
  prop.purchaseDay = s.day;
  prop.purchasePrice = price;
  prop.services.insurance = 'basic';
  s.properties.push(prop);
  if (loan > 0) {
    const q = loanQuote(s, loan, opts.loanYears);
    if (loan > q.maxAmount) {
      s.properties = s.properties.filter((p) => p !== prop);
      return { ok: false, error: `Die Bank finanziert höchstens ${formatMoney(q.maxAmount)} (Beleihungsgrenze).` };
    }
    const r = takeLoan(view, loan, opts.loanYears, `Kauf ${prop.building.name}`);
    if (!r.ok) {
      s.properties = s.properties.filter((p) => p !== prop);
      return { ok: false, error: r.error };
    }
    r.loan!.name = `Hypothek ${prop.building.name}`;
  }
  s.propertyMarket = s.propertyMarket.filter((x) => x.id !== o.id);
  const ref = { type: 'property', id: prop.building.id };
  post(view, { category: 'property_purchase', amount: -price, purpose: `Kaufpreis ${prop.building.name}`, ref });
  post(view, { category: 'purchase_costs', amount: -costs.transferTax, purpose: `Grunderwerbsteuer (${formatPercent(RE.transferTax, 1)})`, ref });
  post(view, { category: 'purchase_costs', amount: -costs.notary, purpose: 'Notar und Grundbuch', ref });
  if (costs.broker) post(view, { category: 'purchase_costs', amount: -costs.broker, purpose: `Maklerprovision (${formatPercent(RE.broker, 2)})`, ref });
  // Ab Übergabe: Mieter sind informiert, Schäden gelten als bekannt, sobald gemeldet
  prop.counters.rentIndexRef = s.market.baseRentPerSqm;
  s.counters.propertiesBought = (s.counters.propertiesBought ?? 0) + 1;
  addMessage(view, {
    category: 'finance',
    severity: 'success',
    title: `Kaufvertrag beurkundet: ${prop.building.name}`,
    text: `Kaufpreis ${formatMoney(price)} zzgl. ${formatMoney(costs.total - price)} Nebenkosten${loan ? `, finanziert mit ${formatMoney(loan)} Hypothek` : ''}. ${prop.apartments.length} Wohnungen gehen mit allen Mietverträgen auf Sie über. Wechseln Sie oben in der Objektauswahl zum neuen Haus.`,
    important: true,
    link: { page: 'portfolio', id: null },
  });
  log(s, `Immobilie gekauft: ${prop.building.name} für ${formatMoney(price)}.`, 'finance');
  return { ok: true, accepted: true, message: `${prop.building.name} gehört jetzt Ihnen.` };
}

export interface SaleQuote {
  price: number;
  costs: number;
  gain: number;
  tax: number;
  speculation: boolean;
  net: number;
}

export function saleQuote(s: GameState, buildingId: string): SaleQuote | null {
  const root = rootOf(s);
  const prop = root.properties.find((p) => p.building.id === buildingId);
  if (!prop) return null;
  const view = propertyView(root, prop);
  const price = Math.round(marketValue(view) * 0.98 / 100000) * 100000;
  const costs = Math.round(price * RE.saleCosts);
  const speculation = root.day - prop.purchaseDay < RE.speculationDays;
  const gain = price - costs - prop.purchasePrice;
  const tax = speculation && gain > 0 ? Math.round(gain * CONFIG.finance.taxRate) : 0;
  return { price, costs, gain, tax, speculation, net: price - costs - tax };
}

export function sellProperty(s: GameState, buildingId: string): { ok: boolean; error?: string; message?: string } {
  const root = rootOf(s);
  const prop = root.properties.find((p) => p.building.id === buildingId);
  if (!prop) return { ok: false, error: 'Nur zugekaufte Objekte können verkauft werden.' };
  if (prop.jobs.some((j) => j.status === 'in_progress')) return { ok: false, error: 'Während laufender Bauarbeiten ist kein Verkauf möglich.' };
  const q = saleQuote(root, buildingId)!;
  const view = propertyView(root, prop);
  const ref = { type: 'property', id: prop.building.id };
  // Offene Aufträge storniert, offene Forderungen gehen an den Käufer über
  for (const j of prop.jobs) if (j.status === 'scheduled') j.status = 'cancelled';
  post(view, { category: 'property_sale', amount: q.price, purpose: `Verkaufserlös ${prop.building.name}`, ref });
  post(view, { category: 'purchase_costs', amount: -q.costs, purpose: 'Notar, Energieausweis und Vermarktung', ref });
  if (q.tax > 0) post(view, { category: 'tax', amount: -q.tax, purpose: `Steuer auf Veräußerungsgewinn (Spekulationsfrist)`, ref });
  root.properties = root.properties.filter((p) => p !== prop);
  addMessage(root, {
    category: 'finance',
    severity: 'success',
    title: `${prop.building.name} verkauft`,
    text: `Erlös ${formatMoney(q.price)}, Kosten ${formatMoney(q.costs)}${q.tax ? `, Steuer ${formatMoney(q.tax)} (Verkauf innerhalb von 10 Jahren)` : ', steuerfrei nach Ablauf der Spekulationsfrist'}. Gewinn gegenüber Kaufpreis ${formatMoney(q.gain)}. Tipp: Freiwerdende Mittel können Hypotheken tilgen.`,
    important: true,
    link: { page: 'portfolio', id: null },
  });
  return { ok: true, message: `Verkauft für ${formatMoney(q.price)}.` };
}

/** Kennzahlen eines Objekts für die Portfolio-Übersicht. */
export function propertySummaries(s: GameState) {
  return allViews(s).map((v) => {
    const units = v.apartments.length;
    const rented = v.apartments.filter((a) => a.status === 'rented').length;
    const rent = v.contracts.filter((c) => c.status !== 'ended').reduce((a, c) => a + c.netRent, 0);
    const value = marketValue(v);
    return { id: v.building.id, name: v.building.name, city: v.building.city, units, rented, rent, value, condition: buildingCondition(v), grossYield: (rent * 12) / Math.max(1, value), purchaseDay: v.purchaseDay, purchasePrice: v.purchasePrice, isMain: v === rootOf(s) };
  });
}
