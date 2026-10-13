import type { Apartment, Applicant, Contract, GameState, Tenant, Traits } from '@/domain/schema';
import { ARCHETYPES, ARCHETYPE_BY_ID, NAMES, NEED_LABEL, type Archetype } from '@/content/tenants';
import { DEFECT_TYPES } from '@/content/defects';
import { TEXTS } from '@/content/texts';
import { addMonths, firstOfMonth, formatDate } from '@/utils/date';
import { clamp } from '@/utils/misc';
import { formatMoney } from '@/utils/money';
import type { Rng } from '@/utils/rng';
import { CONFIG } from './config';
import { defectPenaltyFor, discoverDefect, resolveDefect } from './defects';
import {
  apartmentLabel,
  comparableRent,
  energyClassIndex,
  estimatedAnnualHeatingCost,
  totalArea,
} from './derived';
import { nextId } from './ids';
import { addMessage, fill, log } from './messages';
import { post } from './ledger';
import { MEASURE_BY_ID } from '@/content/measures';

// ------------------------------------------------------------------ Generierung

export interface PersonBase {
  name: string;
  archetype: string;
  householdSize: number;
  occupation: string;
  monthlyIncome: number;
  creditScore: number;
  pets: boolean;
  traits: Traits;
  needs: string[];
  paymentReliability: number;
  financialStress: number;
  energyFactor: number;
  expectedStayYears: number;
}

const TRAIT_KEYS: (keyof Traits)[] = ['tidiness', 'noiseSensitivity', 'ecoAwareness', 'renovationDemands', 'communicativeness', 'frugality', 'community', 'constructionTolerance', 'diy', 'moveOutTendency'];

export function generatePerson(rng: Rng, opts: { archetype?: string; apt?: Apartment } = {}): PersonBase {
  let arch: Archetype;
  if (opts.archetype) arch = ARCHETYPE_BY_ID[opts.archetype];
  else {
    arch = rng.weighted(
      ARCHETYPES.map((a) => {
        let w = a.weight;
        if (opts.apt) {
          // Größere Wohnungen ziehen eher größere Haushalte an
          if (opts.apt.rooms >= 4 && a.household[0] >= 3) w *= 2.5;
          if (opts.apt.rooms <= 2 && a.household[0] >= 3) w *= 0.15;
          if (opts.apt.area < 50 && a.id === 'student') w *= 1.8;
        }
        return { item: a, weight: w };
      }),
    );
  }
  const traits = {} as Traits;
  for (const k of TRAIT_KEYS) {
    const [lo, hi] = arch.traits[k] ?? [20, 80];
    traits[k] = Math.round(rng.range(lo, hi));
  }
  const household = rng.int(arch.household[0], arch.household[1]);
  const income = Math.round(rng.range(arch.income[0], arch.income[1]) / 1000) * 1000;
  // Zahlungsverhalten individuell – nicht an Herkunft oder Namen gekoppelt
  const reliability = clamp(Math.round(rng.normal(80, 14)), 25, 99);
  const stress = Math.round(rng.range(arch.stress[0], arch.stress[1]));
  // Bonität ist ein verrauschtes Signal der tatsächlichen Zuverlässigkeit und der finanziellen Lage
  const credit = clamp(Math.round(reliability * 0.7 + (100 - stress) * 0.3 + rng.normal(0, 8)), 5, 99);
  const needs = arch.needs.filter((n) => rng.chance(n.chance)).map((n) => n.id);
  return {
    name: `${rng.pick(NAMES.first)} ${rng.pick(NAMES.last)}`,
    archetype: arch.id,
    householdSize: household,
    occupation: rng.pick(arch.occupations),
    monthlyIncome: income,
    creditScore: credit,
    pets: rng.chance(arch.petChance),
    traits,
    needs,
    paymentReliability: reliability,
    financialStress: stress,
    energyFactor: Math.round(rng.range(arch.energyFactor[0], arch.energyFactor[1]) * 100) / 100,
    expectedStayYears: Math.round(rng.range(arch.stayYears[0], arch.stayYears[1]) * 10) / 10,
  };
}

export function createTenant(s: GameState, p: PersonBase, aptId: string, moveInDay: number, satisfaction = 72): Tenant {
  const t: Tenant = {
    id: nextId(s, 't'),
    name: p.name,
    archetype: p.archetype,
    householdSize: p.householdSize,
    occupation: p.occupation,
    monthlyIncome: p.monthlyIncome,
    creditScore: p.creditScore,
    pets: p.pets,
    traits: p.traits,
    needs: p.needs,
    satisfaction,
    factors: {},
    moods: [],
    paymentReliability: p.paymentReliability,
    financialStress: p.financialStress,
    energyFactor: p.energyFactor,
    apartmentId: aptId,
    moveInDay,
    noticeDay: null,
    moveOutDay: null,
    moveOutReason: null,
    status: 'active',
    lastComplaintDay: null,
    complaints: 0,
    thanks: 0,
    referralGiven: false,
  };
  s.tenants.push(t);
  return t;
}

export function createContract(s: GameState, a: Apartment, t: Tenant, netRent: number, utilityPrepayment: number, startDay: number, opts: { depositHeld?: number; specialTerms?: string[]; lastIncrease?: number | null } = {}): Contract {
  const deposit = netRent * CONFIG.rent.depositMonths;
  const c: Contract = {
    id: nextId(s, 'v'),
    apartmentId: a.id,
    tenantId: t.id,
    startDay,
    endDay: null,
    netRent,
    utilityPrepayment,
    deposit,
    depositHeld: opts.depositHeld ?? deposit,
    dueDay: CONFIG.rent.dueDay,
    specialTerms: opts.specialTerms ?? [],
    status: 'active',
    noticeDay: null,
    endedDay: null,
    terminatedBy: null,
    lastRentIncreaseDay: opts.lastIncrease ?? null,
    rentHistory: [{ day: startDay, netRent, utilityPrepayment, reason: 'Vertragsbeginn' }],
    changes: [{ day: s.day, text: `Mietvertrag geschlossen: ${formatMoney(netRent)} netto kalt + ${formatMoney(utilityPrepayment)} NK-Vorauszahlung.` }],
    pendingIncrease: null,
    paymentPlan: null,
  };
  s.contracts.push(c);
  a.tenantId = t.id;
  a.contractId = c.id;
  a.status = 'rented';
  a.listing = null;
  return c;
}

export function tenantFromApplicant(s: GameState, ap: Applicant, apt: Apartment): Tenant {
  return createTenant(
    s,
    {
      name: ap.name,
      archetype: ap.archetype,
      householdSize: ap.householdSize,
      occupation: ap.occupation,
      monthlyIncome: ap.monthlyIncome,
      creditScore: ap.creditScore,
      pets: ap.pets,
      traits: ap.traits,
      needs: ap.needs,
      paymentReliability: ap.paymentReliability,
      financialStress: 10,
      energyFactor: ap.energyFactor,
      expectedStayYears: ap.expectedStayYears,
    },
    apt.id,
    s.day,
    74,
  );
}

// ------------------------------------------------------------------ Zufriedenheit

export function apartmentOf(s: GameState, t: Tenant) {
  return t.apartmentId ? s.apartments.find((a) => a.id === t.apartmentId) ?? null : null;
}
export function contractOfTenant(s: GameState, t: Tenant) {
  return s.contracts.find((c) => c.tenantId === t.id && c.status !== 'ended') ?? null;
}

/** Geschätzte monatliche Heizkosten einer Wohnung in Cent. */
export function apartmentHeatingCost(s: GameState, a: Apartment, energyFactor = 1): number {
  const share = a.area / Math.max(1, totalArea(s));
  return Math.round((estimatedAnnualHeatingCost(s) * share * energyFactor * (a.smartThermostat ? 0.92 : 1)) / 12);
}

export function needSatisfied(s: GameState, t: Tenant, a: Apartment, need: string): number {
  const am = s.building.amenities;
  switch (need) {
    case 'quiet': {
      const neighborsLoud = s.tenants.filter((o) => o.id !== t.id && o.status !== 'former' && o.apartmentId && (o.householdSize >= 3 || o.pets) && s.apartments.find((x) => x.id === o.apartmentId)?.floor === a.floor + 1).length;
      return neighborsLoud ? -3 : a.floor === s.building.floors - 1 ? 3 : 1;
    }
    case 'low_rent': {
      const c = contractOfTenant(s, t);
      if (!c) return 0;
      const r = c.netRent / Math.max(1, comparableRent(s, a));
      return r < 0.95 ? 4 : r > 1.05 ? -4 : 0;
    }
    case 'rooms':
      return a.rooms >= t.householdSize ? 3 : -6;
    case 'garden':
      return am.includes('garden') || s.building.outdoorCare > 75 ? 3 : -3;
    case 'bike_storage':
      return am.includes('bike_storage') ? 3 : -3;
    case 'laundry':
      return am.includes('laundry_room') ? 2 : -2;
    case 'modern':
      return a.kitchen + a.bath >= 5 ? 4 : a.kitchen + a.bath <= 2 ? -5 : 0;
    case 'balcony':
      return a.balcony ? 3 : -4;
    case 'quick_service': {
      const waiting = s.defects.some((d) => d.resolvedDay === null && d.discovered && !d.jobId && d.target.kind === 'apartment' && d.target.apartmentId === a.id && s.day - (d.discoveredDay ?? s.day) > 5);
      return waiting ? -5 : s.services.caretaker !== 'none' ? 3 : 0;
    }
    case 'basement':
      return s.building.components.basement!.condition > 60 ? 2 : -3;
    case 'community':
      return am.includes('community_room') ? 4 : 0;
    case 'eco': {
      const idx = energyClassIndex(s);
      return (idx <= 3 ? 3 : idx >= 6 ? -3 : 0) + (am.includes('solar') || am.includes('greening') ? 2 : 0);
    }
    case 'warm': {
      const ratio = apartmentHeatingCost(s, a, t.energyFactor) / Math.max(1, a.area * 160);
      return ratio < 1 ? 3 : -4;
    }
    default:
      return 0;
  }
}

export interface SatisfactionResult {
  target: number;
  factors: Record<string, number>;
}

export function computeSatisfaction(s: GameState, t: Tenant): SatisfactionResult {
  const a = apartmentOf(s, t);
  const c = contractOfTenant(s, t);
  if (!a || !c) return { target: t.satisfaction, factors: t.factors };
  const tr = t.traits;
  const f: Record<string, number> = {};
  const comp = comparableRent(s, a);
  const ratio = c.netRent / Math.max(1, comp);
  f.Miete = clamp(-(ratio - 1) * 70 * (0.5 + tr.frugality / 100), -25, 10);
  f.Wohnungszustand = (a.condition - 60) * 0.22 * (0.5 + tr.renovationDemands / 100);
  f.Ausstattung = (a.kitchen + a.bath + a.flooring - 4.5) * 1.6 * (0.3 + tr.renovationDemands / 100);
  const b = s.building;
  f.Sauberkeit = (b.cleanliness - 60) * 0.12 * (0.5 + tr.tidiness / 100) + (b.outdoorCare - 60) * 0.04;
  f.Mängel = -defectPenaltyFor(s, a, t);
  let noise = 0;
  for (const j of s.jobs) {
    if (j.status !== 'in_progress' || j.noise === 0) continue;
    let mult = 1;
    if (j.target.kind === 'apartment') {
      const aptId = j.target.apartmentId;
      const ja = s.apartments.find((x) => x.id === aptId);
      if (ja?.id === a.id) mult = 3;
      else if (ja && Math.abs(ja.floor - a.floor) <= 1) mult = 1.5;
      else mult = 0.6;
    }
    noise += j.noise * mult;
  }
  f.Baulärm = -noise * 3.5 * (tr.noiseSensitivity / 100) * (1 - tr.constructionTolerance / 100) * 1.6;
  const heatRatio = apartmentHeatingCost(s, a, t.energyFactor) / Math.max(1, a.area * 160);
  f.Heizkosten = clamp(-(heatRatio - 1) * 8 * ((tr.frugality + tr.ecoAwareness) / 100), -9, 4);
  f.Sicherheit = ((b.fireSafety + b.security) / 2 - 60) * 0.08;
  f.Bedürfnisse = t.needs.reduce((acc, n) => acc + needSatisfied(s, t, a, n), 0);
  f.Gemeinschaft = (b.amenities.includes('community_room') ? 3 : 0) * (tr.community / 100) + (b.amenities.includes('garden') ? 1 : 0);
  const svc = s.services;
  f.Service = (svc.caretaker === 'fulltime' ? 5 : svc.caretaker === 'parttime' ? 3 : 0) + (svc.management === 'agency' ? 2 : svc.management === 'software' ? 1 : 0) + (svc.tenantApp ? 1.5 * (0.5 + tr.communicativeness / 100) : 0) - (svc.cleaning === 'none' ? 1 : 0);
  f.Stimmung = t.moods.filter((m) => m.untilDay >= s.day).reduce((acc, m) => acc + m.value, 0);
  const target = clamp(CONFIG.satisfaction.base + Object.values(f).reduce((x, y) => x + y, 0));
  for (const k of Object.keys(f)) f[k] = Math.round(f[k] * 10) / 10 + 0;
  return { target, factors: f };
}

export function addMood(t: Tenant, day: number, reason: string, value: number, days: number) {
  const existing = t.moods.find((m) => m.reason === reason && m.untilDay >= day);
  if (existing) {
    existing.value = Math.sign(value) === Math.sign(existing.value) ? (Math.abs(value) > Math.abs(existing.value) ? value : existing.value) : existing.value + value;
    existing.untilDay = Math.max(existing.untilDay, day + days);
  } else t.moods.push({ reason, value, untilDay: day + days });
}

// ------------------------------------------------------------------ Tagesverhalten

export function updateTenantsDaily(s: GameState, rng: Rng) {
  for (const t of s.tenants) {
    if (t.status === 'former') continue;
    const a = apartmentOf(s, t);
    if (!a) continue;
    t.moods = t.moods.filter((m) => m.untilDay >= s.day);
    const res = computeSatisfaction(s, t);
    t.factors = res.factors;
    t.satisfaction = clamp(t.satisfaction + (res.target - t.satisfaction) * CONFIG.satisfaction.dailyInertia);
    t.financialStress = clamp(t.financialStress - 0.06);

    reportDefects(s, t, a, rng);
    maybeComplain(s, t, a, rng);
    if (t.status === 'active') maybeGiveNotice(s, t, a, rng);
    if (t.moveOutDay !== null && s.day >= t.moveOutDay) moveOut(s, t, rng);
  }
}

function defectVars(type: string) {
  const def = DEFECT_TYPES[type];
  return { defect: def.label, defectLower: def.label.toLowerCase(), desc: def.description };
}

function reportDefects(s: GameState, t: Tenant, a: Apartment, rng: Rng) {
  for (const d of s.defects) {
    if (d.discovered || d.resolvedDay !== null) continue;
    const def = DEFECT_TYPES[d.type];
    if (d.target.kind === 'apartment' && d.target.apartmentId === a.id) {
      // Mit Mieter-App melden auch zurückhaltende Mieter Schäden schneller (Foto + zwei Klicks)
      const p = (0.06 + (t.traits.communicativeness / 100) * 0.35 + (d.severity - 1) * 0.2) * (s.services.tenantApp ? 1.6 : 1) + (s.services.tenantApp ? 0.05 : 0);
      if (!rng.chance(p)) continue;
      if (def.diyFixable && rng.chance((t.traits.diy / 100) * 0.45)) {
        d.discovered = true;
        d.discoveredDay = s.day;
        d.reportedBy = t.id;
        resolveDefect(s, d, `von ${t.name} selbst repariert`);
        addMood(t, s.day, 'Selbst repariert', 1, 30);
        addMessage(s, { category: 'tenant', severity: 'success', title: `${t.name}: kleine Reparatur selbst erledigt`, text: fill(rng.pick(TEXTS.diyFixed), defectVars(d.type)), tenantId: t.id, apartmentId: a.id });
        continue;
      }
      d.discovered = true;
      d.discoveredDay = s.day;
      d.reportedBy = t.id;
      const early = t.traits.communicativeness > 80 && d.severity === 1;
      const tpl = d.severity >= 3 ? TEXTS.defectReportUrgent : early ? TEXTS.defectReportEarly : TEXTS.defectReport;
      addMessage(s, {
        category: 'tenant',
        severity: d.severity >= 3 ? 'danger' : d.severity === 2 ? 'warning' : 'info',
        title: `${t.name} meldet: ${def.label}`,
        text: fill(rng.pick(tpl), defectVars(d.type)),
        tenantId: t.id,
        apartmentId: a.id,
        defectId: d.id,
        link: { page: 'repairs', id: d.id },
        important: d.severity >= 2,
      });
      if (early) s.counters.earlyReports = (s.counters.earlyReports ?? 0) + 1;
    } else if (d.target.kind === 'component' && def.severity <= 2) {
      // Versteckte Gebäudemängel bemerken aufmerksame Mieter gelegentlich
      const p = (t.traits.communicativeness / 100) * 0.004;
      if (!rng.chance(p)) continue;
      discoverDefect(s, d, `Hinweis von ${t.name}.`);
      addMessage(s, { category: 'tenant', title: `Hinweis von ${t.name}`, text: fill(rng.pick(TEXTS.noticeHidden), defectVars(d.type)), tenantId: t.id, defectId: d.id, link: { page: 'repairs', id: d.id } });
    }
  }
}

function maybeComplain(s: GameState, t: Tenant, a: Apartment, rng: Rng) {
  if (t.satisfaction > 48) return;
  if (t.lastComplaintDay !== null && s.day - t.lastComplaintDay < 35) return;
  if (!rng.chance(0.02 + (t.traits.communicativeness / 100) * 0.05)) return;
  const worst = Object.entries(t.factors).filter(([, v]) => v < -2).sort((x, y) => x[1] - y[1])[0];
  if (!worst) return;
  const [factor] = worst;
  const templates = TEXTS.complaint[factor] ?? TEXTS.complaint.Stimmung;
  const vars: Record<string, string> = {};
  if (factor === 'Mängel') {
    const d = s.defects.find((x) => x.resolvedDay === null && x.discovered && ((x.target.kind === 'apartment' && x.target.apartmentId === a.id) || DEFECT_TYPES[x.type].buildingWide));
    if (!d) return; // Keine Beschwerde über bereits behobene Mängel
    vars.defect = DEFECT_TYPES[d.type].label;
  }
  if (factor === 'Baulärm') {
    const j = s.jobs.find((x) => x.status === 'in_progress' && x.noise > 0);
    if (!j) return;
    vars.job = j.title;
  }
  t.lastComplaintDay = s.day;
  t.complaints += 1;
  addMessage(s, {
    category: 'tenant',
    severity: 'warning',
    title: `Beschwerde von ${t.name} (${apartmentLabel(a)})`,
    text: `${fill(rng.pick(templates), vars)} (Zufriedenheit: ${Math.round(t.satisfaction)} %)`,
    tenantId: t.id,
    apartmentId: a.id,
    link: { page: 'tenants', id: t.id },
  });
}

function maybeGiveNotice(s: GameState, t: Tenant, a: Apartment, rng: Rng) {
  const cfg = CONFIG.satisfaction;
  const tendency = 0.5 + t.traits.moveOutTendency / 100;
  let pUnhappy = 0;
  if (t.satisfaction < cfg.moveOutThreshold) pUnhappy = ((cfg.moveOutThreshold - t.satisfaction) / cfg.moveOutThreshold) * cfg.moveOutDailyBase * tendency;
  const yearsStayed = (s.day - t.moveInDay) / 365;
  // Natürliche Fluktuation – geringer bei langen, zufriedenen Mietverhältnissen
  let natural = (cfg.naturalMoveOutPerYear / 365) * tendency * (t.satisfaction > 70 ? 0.6 : 1) * (yearsStayed > 8 ? 0.6 : 1);
  if (a.rooms < t.householdSize) natural *= 2;
  if (rng.chance(pUnhappy)) {
    const worst = Object.entries(t.factors).sort((x, y) => x[1] - y[1])[0];
    giveNotice(s, t, 'unhappy', worst ? worst[0] : 'Unzufriedenheit', rng);
  } else if (rng.chance(natural)) {
    giveNotice(s, t, 'natural', 'persönliche Gründe', rng);
  }
}

export function giveNotice(s: GameState, t: Tenant, kind: 'unhappy' | 'natural', reason: string, rng: Rng) {
  const c = contractOfTenant(s, t);
  const a = apartmentOf(s, t);
  if (!c || !a || t.status !== 'active') return;
  const moveOut = addMonths(firstOfMonth(s.day), 3) - 1;
  t.status = 'moving_out';
  t.noticeDay = s.day;
  t.moveOutDay = moveOut;
  t.moveOutReason = kind === 'unhappy' ? `Unzufriedenheit (${reason})` : 'Persönliche Gründe';
  c.status = 'notice';
  c.noticeDay = s.day;
  c.endDay = moveOut;
  c.terminatedBy = 'tenant';
  c.changes.push({ day: s.day, text: `Kündigung durch Mieter zum ${formatDate(moveOut)}.` });
  if (c.pendingIncrease) c.pendingIncrease = null;
  const tpl = kind === 'unhappy' ? TEXTS.noticeGiven.unhappy : TEXTS.noticeGiven.natural;
  addMessage(s, {
    category: 'tenant',
    severity: kind === 'unhappy' ? 'danger' : 'warning',
    title: `Kündigung: ${t.name} (${apartmentLabel(a)})`,
    text: fill(rng.pick(tpl), { date: formatDate(moveOut), reason }),
    tenantId: t.id,
    apartmentId: a.id,
    link: { page: 'apartments', id: a.id },
    important: true,
  });
  log(s, `${t.name} kündigt ${apartmentLabel(a)} zum ${formatDate(moveOut)} (${t.moveOutReason}).`, 'tenant');
  s.counters.notices = (s.counters.notices ?? 0) + 1;
}

/** Auszug: Vertrag beenden, Kaution abrechnen, Wohnung freigeben. */
export function moveOut(s: GameState, t: Tenant, _rng: Rng) {
  const a = apartmentOf(s, t);
  const c = s.contracts.find((x) => x.tenantId === t.id && x.status !== 'ended');
  if (!a) return;
  let depositLeft = c?.depositHeld ?? 0;
  const notes: string[] = [];
  if (c) {
    // Offene Forderungen mit der Kaution verrechnen
    const claims = s.claims.filter((x) => x.contractId === c.id && (x.status === 'open' || x.status === 'partial')).sort((x, y) => x.dueDay - y.dueDay);
    for (const cl of claims) {
      if (depositLeft <= 0) break;
      const amt = Math.min(depositLeft, cl.amount - cl.paid);
      if (amt <= 0) continue;
      const e = post(s, { category: 'deposit_offset', amount: amt, purpose: `Kautionsverrechnung ${cl.period} (${t.name})`, apartmentId: a.id, ref: { type: 'claim', id: cl.id } });
      cl.paid += amt;
      cl.payments.push({ day: s.day, amount: amt, ledgerIds: [e.id] });
      cl.status = cl.paid >= cl.amount ? 'paid' : 'partial';
      depositLeft -= amt;
      notes.push(`${formatMoney(amt)} mit Rückstand ${cl.period} verrechnet`);
    }
    // Übermäßige Abnutzung: Schadensersatz aus der Kaution
    if (a.condition < 40 && t.traits.tidiness < 45 && depositLeft > 0) {
      const dmg = Math.min(depositLeft, Math.round(c.netRent * 0.8));
      post(s, { category: 'deposit_offset', amount: dmg, purpose: `Schadensersatz bei Auszug (${t.name})`, apartmentId: a.id, ref: { type: 'contract', id: c.id } });
      depositLeft -= dmg;
      notes.push(`${formatMoney(dmg)} Schadensersatz einbehalten`);
    }
    c.depositHeld = 0;
    c.status = 'ended';
    c.endedDay = s.day;
    c.paymentPlan = null;
    c.changes.push({ day: s.day, text: `Vertrag beendet. Kaution ausgezahlt: ${formatMoney(depositLeft)}.` });
  }
  t.status = 'former';
  t.apartmentId = null;
  if (s.counters[`gardener:${t.id}`]) {
    s.counters.gardenVolunteer = 0;
    delete s.counters[`gardener:${t.id}`];
  }
  a.tenantId = null;
  a.contractId = null;
  a.status = a.condition < CONFIG.apartments.needsRenovationBelow ? 'vacant_needs_renovation' : 'vacant_ready';
  if (s.defects.some((d) => d.resolvedDay === null && d.target.kind === 'apartment' && d.target.apartmentId === a.id && DEFECT_TYPES[d.type].uninhabitable)) a.status = 'uninhabitable';
  // Bei Auszug werden versteckte Mängel bei der Wohnungsübergabe sichtbar
  for (const d of s.defects.filter((x) => x.resolvedDay === null && !x.discovered && x.target.kind === 'apartment' && x.target.apartmentId === a.id)) {
    discoverDefect(s, d, 'Bei der Wohnungsübergabe festgestellt.');
  }
  addMessage(s, {
    category: 'tenant',
    severity: 'warning',
    title: `${t.name} ist ausgezogen`,
    text: `${apartmentLabel(a)} steht jetzt leer (Zustand ${Math.round(a.condition)} %). ${notes.join(', ')}${notes.length ? '. ' : ''}${a.status === 'vacant_needs_renovation' ? 'Die Wohnung muss vor einer Neuvermietung renoviert werden.' : 'Die Wohnung kann inseriert werden.'}`,
    apartmentId: a.id,
    link: { page: 'apartments', id: a.id },
    important: true,
  });
  log(s, `${t.name} ist aus ${apartmentLabel(a)} ausgezogen.`, 'tenant');
  s.counters.moveOuts = (s.counters.moveOuts ?? 0) + 1;
}

export function describeNeed(n: string) {
  return NEED_LABEL[n] ?? n;
}

export const measureLabel = (id: string | null) => (id ? MEASURE_BY_ID[id]?.label ?? id : '');
