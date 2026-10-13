import type { Apartment, Building, Claim, ComponentKey, GameState } from '@/domain/schema';
import { COMPONENT_KEYS } from '@/domain/schema';
import { CONTRACTOR_TEMPLATES } from '@/content/contractors';
import { SCENARIO_BY_ID, type SandboxOptions, type ScenarioDef } from '@/content/scenarios';
import { addMonths, fromYmd, monthKey, toYmd } from '@/utils/date';
import { allocateCents } from '@/utils/money';
import { clamp } from '@/utils/misc';
import { Rng, seedFromString } from '@/utils/rng';
import { CONFIG, type Difficulty } from './config';
import { comparableRent, specificEnergyDemand } from './derived';
import { emptyEnergyMonth } from './energy';
import { annuity } from './finance';
import { nextId } from './ids';
import { addMessage } from './messages';
import { createMonthlyClaims } from './payments';
import { PHASES } from './progression';
import { createContract, createTenant, generatePerson } from './tenants';
import { createDefect } from './defects';

export const SCHEMA_VERSION = 1;

export interface NewGameOptions {
  scenarioId: string;
  seed?: number;
  saveName?: string;
  difficulty?: Difficulty;
  eventFrequency?: number;
  sandbox?: SandboxOptions;
}

function tierFor(def: ScenarioDef, key: ComponentKey): number {
  if (key === 'windows') return def.building.windowTier;
  if (key === 'heating') return def.building.heatingSystem === 'gas_condensing' ? 4 : def.building.heatingSystem === 'heat_pump' || def.building.heatingSystem === 'district' ? 5 : 2;
  return def.building.yearBuilt >= 1980 ? 3 : 2;
}

export function createGame(opts: NewGameOptions): GameState {
  const base = SCENARIO_BY_ID[opts.sandbox ? 'endless_linden' : opts.scenarioId];
  if (!base) throw new Error(`Unbekanntes Szenario: ${opts.scenarioId}`);
  const def: ScenarioDef = structuredClone(base);
  const sb = opts.sandbox;
  if (sb) applySandbox(def, sb);
  const seed = (opts.seed ?? sb?.seed ?? seedFromString(`${def.id}-${Date.now()}`)) >>> 0;
  const startDay = fromYmd(def.start.year, def.start.month, 1);
  const floors = def.floors.length;

  const components = {} as Building['components'];
  for (const key of COMPONENT_KEYS) {
    components[key] = {
      key,
      condition: clamp(def.components[key]),
      tier: tierFor(def, key),
      installedYear: key === 'heating' ? def.building.heatingYear : def.building.yearBuilt,
      lastMaintenanceDay: null,
      lastRenewalDay: null,
    };
  }

  const s: GameState = {
    schemaVersion: SCHEMA_VERSION,
    saveId: `save-${seed.toString(36)}-${Date.now().toString(36)}`,
    saveName: opts.saveName ?? def.title,
    scenarioId: sb ? 'sandbox' : def.id,
    mode: sb ? 'sandbox' : def.mode,
    seed,
    rng: seed,
    startDay,
    day: startDay,
    endDay: def.durationMonths ? addMonths(startDay, def.durationMonths) - 1 : null,
    cash: def.startCash,
    startCash: def.startCash,
    overdraftLimit: def.overdraftLimit,
    daysBelowOverdraft: 0,
    building: {
      id: 'b1',
      name: def.building.name,
      address: def.building.address,
      city: def.building.city,
      yearBuilt: def.building.yearBuilt,
      landValue: def.building.landValue,
      buildingClass: def.building.buildingClass,
      floors,
      heatingSystem: def.building.heatingSystem,
      insulationLevel: def.building.insulationLevel,
      components,
      amenities: [...(def.building.amenities ?? [])],
      cleanliness: def.building.cleanliness,
      outdoorCare: def.building.outdoorCare,
      fireSafety: def.building.fireSafety,
      security: def.building.security,
      repairHistory: [],
      modernizationHistory: [],
    },
    apartments: [],
    tenants: [],
    contracts: [],
    claims: [],
    ledger: [],
    loans: [],
    contractors: [],
    defects: [],
    jobs: [],
    services: { ...def.services },
    insuranceClaims: [],
    applicants: [],
    decisions: [],
    messages: [],
    history: [],
    energyMonth: emptyEnergyMonth(),
    energyHistory: [],
    market: { baseRentPerSqm: def.market.baseRentPerSqm, energyPriceIndex: def.market.energyPriceIndex, materialIndex: 1, interestRate: def.market.interestRate, demandIndex: 1, modifiers: [] },
    goals: def.goals.map((id) => ({ id, progress: 0, status: 'active' as const, completedDay: null, counter: 0 })),
    achievements: [],
    phase: def.startPhase ?? 1,
    unlocks: [],
    counters: { energyTrend: def.market.energyTrend ?? 0 },
    eventCooldowns: {},
    settings: { difficulty: opts.difficulty ?? sb?.difficulty ?? 'normal', eventFrequency: opts.eventFrequency ?? sb?.eventFrequency ?? 1, autoPauseOnDecision: true, autoDunning: true },
    tutorialStep: 0,
    idCounter: 0,
    gameOver: null,
    log: [],
  };
  const rng = new Rng(s);
  for (const p of PHASES) if (p.phase <= s.phase) s.unlocks.push(...p.unlocks);
  if (sb?.allUnlocked) s.unlocks.push('all');
  // Erste Ereignisse nicht sofort
  s.eventCooldowns.energy_price_shock = startDay;

  for (const t of CONTRACTOR_TEMPLATES.filter((c) => !c.hidden)) {
    s.contractors.push({ id: nextId(s, 'c'), name: t.name, trade: t.trade, priceFactor: t.priceFactor, quality: t.quality, reliability: t.reliability, waitDays: t.waitDays, jobsDone: 0, available: true, busyUntil: 0, description: t.description });
  }

  // Wohnungen
  def.floors.forEach((row, f) =>
    row.forEach((spec, p) => {
      const a: Apartment = {
        id: `apt-${f}-${p + 1}`,
        number: `${f}.${p + 1}`,
        floor: f,
        position: p,
        area: spec.area,
        rooms: spec.rooms,
        layout: spec.rooms >= 4 ? 'Familienwohnung' : spec.rooms >= 3 ? 'Dreizimmerwohnung' : spec.rooms >= 2 ? 'Zweizimmerwohnung' : 'Apartment',
        balcony: !!spec.balcony,
        kitchen: spec.kitchen,
        bath: spec.bath,
        flooring: spec.flooring,
        condition: clamp(spec.condition),
        smartThermostat: !!spec.smartThermostat,
        status: spec.tenant ? 'rented' : spec.status ?? (spec.condition < CONFIG.apartments.needsRenovationBelow ? 'vacant_needs_renovation' : 'vacant_ready'),
        tenantId: null,
        contractId: null,
        lastRenovationDay: spec.condition > 85 ? startDay - 400 : null,
        listing: null,
        modernizationPool: 0,
        blockedUntil: null,
      };
      s.apartments.push(a);
    }),
  );

  // Mieter & Verträge
  const utilPerSqm = def.utilityPerSqm ?? euro35;
  def.floors.forEach((row, f) =>
    row.forEach((spec, p) => {
      if (!spec.tenant) return;
      const a = s.apartments.find((x) => x.id === `apt-${f}-${p + 1}`)!;
      const ts = spec.tenant;
      const person = generatePerson(rng, { archetype: ts.archetype, apt: a });
      if (ts.reliability !== undefined) person.paymentReliability = ts.reliability;
      if (ts.stress !== undefined) person.financialStress = ts.stress;
      if (ts.moveOutTendency !== undefined) person.traits.moveOutTendency = ts.moveOutTendency;
      if (person.householdSize > a.rooms + 1) person.householdSize = Math.max(1, Math.floor(a.rooms));
      const moveIn = startDay - Math.round(ts.yearsAgo * 365) - rng.int(0, 60);
      const t = createTenant(s, person, a.id, moveIn, ts.satisfaction ?? 65);
      const rent = Math.round((comparableRent(s, a) * ts.rentFactor) / 1000) * 1000;
      const util = Math.round((a.area * utilPerSqm) / 500) * 500;
      const lastIncrease = ts.yearsAgo > 2 ? startDay - rng.int(300, 700) : null;
      const c = createContract(s, a, t, rent, util, moveIn, { lastIncrease });
      c.changes = [{ day: moveIn, text: 'Mietvertrag geschlossen (Bestandsvertrag).' }];
      if (lastIncrease) c.rentHistory.push({ day: lastIncrease, netRent: rent, utilityPrepayment: util, reason: 'Letzte Mietanpassung' });
      if (ts.arrearsMonths) addStartArrears(s, c.id, ts.arrearsMonths, startDay);
      if (spec.defects)
        for (const d of spec.defects) {
          const created = createDefect(s, d.type, { kind: 'apartment', apartmentId: a.id }, { cause: 'Bestehender Mangel bei Übernahme.', discovered: d.discovered, reportedBy: d.discovered ? t.id : null, silent: true });
          if (created && d.discovered) created.discoveredDay = startDay - 6;
        }
    }),
  );
  def.floors.forEach((row, f) =>
    row.forEach((spec, p) => {
      if (spec.tenant || !spec.defects) return;
      for (const d of spec.defects) createDefect(s, d.type, { kind: 'apartment', apartmentId: `apt-${f}-${p + 1}` }, { cause: 'Bestehender Mangel bei Übernahme.', discovered: d.discovered, silent: true });
    }),
  );
  for (const d of def.componentDefects ?? []) {
    const created = createDefect(s, d.type, { kind: 'component', key: d.key }, { cause: 'Bestehender Mangel bei Übernahme.', discovered: d.discovered, silent: true });
    if (created) {
      created.createdDay = startDay - 20;
      if (created.escalateAtDay) created.escalateAtDay -= 20;
      if (d.discovered) created.discoveredDay = startDay - 10;
    }
  }

  for (const l of def.loans) {
    const months = l.yearsLeft * 12;
    s.loans.push({ id: nextId(s, 'k'), name: l.name, kind: 'initial', principal: l.principal, remaining: l.remaining, annualRate: l.rate, termMonths: months, monthlyPayment: annuity(l.remaining, l.rate, months), startDay, paidMonths: 0, purpose: 'Bestandsfinanzierung' });
  }

  s.counters.startEnergyDemand = specificEnergyDemand(s);
  s.counters.monthMinCash = s.cash;
  s.counters.rentIndexRef = s.market.baseRentPerSqm;
  createMonthlyClaims(s, rng);

  addMessage(s, {
    category: 'system',
    severity: 'info',
    title: `Willkommen in der ${def.building.name}`,
    text: def.intro.join(' '),
    important: true,
    link: { page: 'goals', id: null },
  });
  if (s.endDay) addMessage(s, { category: 'goal', title: 'Szenarioziel', text: `Sie haben Zeit bis ${new Date(s.endDay * 86400000).toLocaleDateString('de-DE')}. Die Szenarioziele finden Sie unter „Ziele & Erfolge“.`, link: { page: 'goals', id: null } });
  return s;
}

const euro35 = 350;

function addStartArrears(s: GameState, contractId: string, months: number, startDay: number) {
  const c = s.contracts.find((x) => x.id === contractId)!;
  const gross = c.netRent + c.utilityPrepayment;
  const full = Math.floor(months);
  const partial = months - full;
  const list: { offset: number; unpaidShare: number }[] = [];
  for (let i = 1; i <= full; i++) list.push({ offset: i, unpaidShare: 1 });
  if (partial > 0.05) list.push({ offset: full + 1, unpaidShare: partial });
  for (const it of list) {
    const day = addMonths(startDay, -it.offset);
    const { year, month } = toYmd(day);
    const [np, up] = allocateCents(gross, [c.netRent, c.utilityPrepayment]);
    const paid = Math.round(gross * (1 - it.unpaidShare));
    const claim: Claim = {
      id: nextId(s, 'f'),
      kind: 'rent',
      contractId: c.id,
      tenantId: c.tenantId,
      apartmentId: c.apartmentId,
      period: monthKey(day),
      createdDay: day,
      dueDay: fromYmd(year, month, CONFIG.rent.dueDay),
      netRent: np,
      utilities: up,
      amount: gross,
      paid,
      status: paid > 0 ? 'partial' : 'open',
      dunningLevel: it.offset >= 2 ? 1 : 0,
      lastDunningDay: it.offset >= 2 ? startDay - 20 : null,
      payments: paid > 0 ? [{ day: day + 10, amount: paid, ledgerIds: [] }] : [],
      plannedPayDay: null,
      plannedFraction: 1,
      note: 'Rückstand aus der Zeit vor der Übernahme',
    };
    s.claims.push(claim);
  }
}

function applySandbox(def: ScenarioDef, sb: SandboxOptions) {
  def.title = 'Sandbox';
  def.subtitle = 'Freies Spiel';
  def.mode = 'sandbox';
  def.startCash = sb.startCash;
  def.durationMonths = null;
  const keys = Object.keys(def.components) as ComponentKey[];
  const avg = keys.reduce((a, k) => a + def.components[k], 0) / keys.length;
  for (const k of keys) def.components[k] = clamp(Math.round(def.components[k] - avg + sb.buildingCondition), 5, 100);
  const aptDelta = sb.buildingCondition - avg;
  let idx = 0;
  const total = def.floors.reduce((a, r) => a + r.length, 0);
  const rentedTarget = Math.round(total * sb.occupancy);
  let rented = 0;
  def.floors = def.floors.map((row) =>
    row.map((a) => {
      idx++;
      const condition = clamp(Math.round(a.condition + aptDelta), 10, 100);
      const out = { ...a, condition };
      if (rented < rentedTarget) {
        rented++;
        const tenant = a.tenant ?? { yearsAgo: 2, rentFactor: 0.95 };
        return { ...out, tenant, status: undefined };
      }
      void idx;
      return { ...out, tenant: undefined, status: condition < CONFIG.apartments.needsRenovationBelow ? ('vacant_needs_renovation' as const) : ('vacant_ready' as const) };
    }),
  );
  def.loans = sb.loan > 0 ? [{ name: 'Hypothek', remaining: sb.loan, rate: 0.032, yearsLeft: 20, principal: sb.loan }] : [];
  def.goals = ['first_rent', 'liquid_3', 'full_occupancy', 'sat_70', 'backlog_10k', 'surplus_6', 'energy_30', 'full_renovation', 'stable_24'];
  def.winGoals = undefined;
  def.intro = ['Sandbox-Modus: freie Spielparameter. Viel Spaß beim Experimentieren!'];
}
