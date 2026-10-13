import type { Apartment, ComponentKey, Contractor, Defect, GameState, Job, JobTarget, LedgerCategory, Trade } from '@/domain/schema';
import { COMPONENTS } from '@/content/components';
import { TRADE_CAN_DO } from '@/content/contractors';
import { DEFECT_TYPES } from '@/content/defects';
import { MEASURE_BY_ID, type MeasureDef } from '@/content/measures';
import { TEXTS } from '@/content/texts';
import { allocateCents, formatMoney, mulCents } from '@/utils/money';
import { clamp } from '@/utils/misc';
import type { Rng } from '@/utils/rng';
import { diff } from './components';
import { discoverDefect, resolveDefect, targetLabel } from './defects';
import { apartmentLabel, materialIndex } from './derived';
import { nextId } from './ids';
import { post } from './ledger';
import { addMessage, fill, log } from './messages';
import { addMood } from './tenants';
import { isHeatingSeason } from './weather';
import { fileInsuranceClaim } from './insurance';
import { allViews, rootOf } from './portfolio';
import { CONFIG } from './config';

export type JobRequest =
  | { kind: 'repair'; defectId: string }
  | { kind: 'maintenance'; component: ComponentKey }
  | { kind: 'measure'; measureId: string; apartmentId?: string };

export interface JobSpec {
  kind: Job['kind'];
  title: string;
  description: string;
  cause: string;
  trade: Trade;
  baseCost: number;
  baseDays: number;
  urgency: Job['urgency'];
  target: JobTarget;
  defectIds: string[];
  measure: MeasureDef | null;
  noise: 0 | 1 | 2 | 3;
  blocksApartment: boolean;
  uncertainty: number;
  materials: string[];
  effects: string[];
}

export interface Offer {
  contractorId: string;
  contractorName: string;
  quality: number;
  reliability: number;
  price: number;
  days: number;
  startDay: number;
  uncertainty: number;
  firstPayment: number;
}

const urgencyOf = (sev: number): Job['urgency'] => (sev >= 3 ? 'critical' : sev === 2 ? 'high' : 'normal');

export function specFor(s: GameState, req: JobRequest): JobSpec | { error: string } {
  if (req.kind === 'repair') {
    const d = s.defects.find((x) => x.id === req.defectId);
    if (!d || d.resolvedDay !== null) return { error: 'Der Schaden existiert nicht mehr.' };
    if (!d.discovered) return { error: 'Der Schaden ist noch nicht bekannt.' };
    if (d.jobId && s.jobs.some((j) => j.id === d.jobId && (j.status === 'scheduled' || j.status === 'in_progress'))) return { error: 'Für diesen Schaden ist bereits ein Auftrag erteilt.' };
    const def = DEFECT_TYPES[d.type];
    return {
      kind: 'repair',
      title: `${def.label} beheben`,
      description: def.description,
      cause: d.cause,
      trade: def.trade,
      baseCost: def.repairCost,
      baseDays: def.repairDays,
      urgency: urgencyOf(d.severity),
      target: d.target,
      defectIds: [d.id],
      measure: null,
      noise: d.severity >= 2 ? 1 : 0,
      blocksApartment: false,
      uncertainty: 0.12 + d.severity * 0.04,
      materials: ['Ersatzteile', 'Kleinmaterial'],
      effects: [`Schaden „${def.label}“ wird behoben`, ...(def.rentReduction ? ['Mietminderung entfällt'] : []), ...(def.escalation ? ['Verhindert Folgeschaden'] : [])],
    };
  }
  if (req.kind === 'maintenance') {
    const meta = COMPONENTS[req.component];
    const c = s.building.components[req.component]!;
    if (s.jobs.some((j) => j.kind === 'maintenance' && j.target.kind === 'component' && j.target.key === req.component && (j.status === 'scheduled' || j.status === 'in_progress')))
      return { error: 'Für dieses Bauteil ist bereits eine Wartung beauftragt.' };
    if (c.lastMaintenanceDay !== null && s.day - c.lastMaintenanceDay < 60) return { error: 'Das Bauteil wurde in den letzten 60 Tagen gewartet.' };
    const cost = req.component === 'heating' ? Math.max(meta.maintenanceCost, (CONFIG_HEATING_MAINT[s.building.heatingSystem] ?? meta.maintenanceCost)) : meta.maintenanceCost;
    return {
      kind: 'maintenance',
      title: meta.maintenanceLabel,
      description: `${meta.label}: ${meta.description}`,
      cause: `Vorbeugende Instandhaltung (Zustand ${Math.round(c.condition)} %).`,
      trade: meta.trade,
      baseCost: cost,
      baseDays: meta.maintenanceDays,
      urgency: 'low',
      target: { kind: 'component', key: req.component },
      defectIds: [],
      measure: null,
      noise: req.component === 'facade' || req.component === 'stairwell' ? 1 : 0,
      blocksApartment: false,
      uncertainty: 0.06,
      materials: ['Verschleißteile'],
      effects: [`${meta.label} Zustand +${meta.maintenanceGain} (abhängig von der Qualität)`, 'Verschleiß 12 Monate um 45 % reduziert', 'Versteckte Mängel werden entdeckt'],
    };
  }
  const m = MEASURE_BY_ID[req.measureId];
  if (!m) return { error: 'Unbekannte Maßnahme.' };
  if (s.phase < m.unlockPhase && !s.unlocks.includes('all')) return { error: `Wird in Phase ${m.unlockPhase} freigeschaltet.` };
  let apt: Apartment | undefined;
  if (m.scope === 'apartment') {
    apt = s.apartments.find((a) => a.id === req.apartmentId);
    if (!apt) return { error: 'Bitte eine Wohnung wählen.' };
    if (m.requiresVacant && (apt.status === 'rented' || apt.tenantId)) return { error: 'Die Wohnung muss dafür leer stehen.' };
    if (apt.status === 'renovating' || s.jobs.some((j) => j.target.kind === 'apartment' && j.target.apartmentId === apt!.id && j.blocksApartment && (j.status === 'scheduled' || j.status === 'in_progress')))
      if (m.blocksApartment) return { error: 'In der Wohnung läuft bereits eine Renovierung.' };
  }
  const reason = m.unavailable(s, apt);
  if (reason) return { error: reason };
  if (s.jobs.some((j) => j.measureId === m.id && (j.status === 'scheduled' || j.status === 'in_progress') && (m.scope === 'building' || (j.target.kind === 'apartment' && j.target.apartmentId === apt?.id))))
    return { error: 'Diese Maßnahme ist bereits beauftragt.' };
  return {
    kind: m.scope === 'building' ? 'modernization' : 'renovation',
    title: apt ? `${m.label} (${apartmentLabel(apt)})` : m.label,
    description: m.description,
    cause: 'Geplante Maßnahme',
    trade: m.trade,
    baseCost: m.baseCost(s, apt),
    baseDays: m.days(s, apt),
    urgency: 'low',
    target: apt ? { kind: 'apartment', apartmentId: apt.id } : { kind: 'building' },
    defectIds: [],
    measure: m,
    noise: m.noise,
    blocksApartment: !!m.blocksApartment,
    uncertainty: m.uncertainty,
    materials: m.materials,
    effects: m.effects,
  };
}

const CONFIG_HEATING_MAINT: Record<string, number> = { oil_old: 32000, gas_old: 26000, gas_condensing: 22000, heat_pump: 18000, district: 9000 };

export function eligibleContractors(s: GameState, trade: Trade): Contractor[] {
  const allowed = TRADE_CAN_DO[trade];
  return s.contractors.filter((c) => c.available && allowed.includes(c.trade));
}

export function activeSubsidyRate(s: GameState): number {
  return s.market.modifiers.filter((m) => m.kind === 'subsidy_energy' && m.untilDay >= s.day).reduce((a, m) => Math.max(a, m.value), 0);
}

export const hasFrameworkContract = (s: GameState, contractorId: string) => rootOf(s).automation.frameworkContracts.includes(contractorId);

export function offersFor(s: GameState, spec: JobSpec): Offer[] {
  const views = allViews(s);
  return eligibleContractors(s, spec.trade)
    .map((c) => {
      const tradeMatch = c.trade === spec.trade ? 1 : 1.08;
      const framework = hasFrameworkContract(s, c.id);
      const price = Math.round(mulCents(spec.baseCost, materialIndex(s) * c.priceFactor * diff(s).costFactor * tradeMatch * (framework ? 1 - CONFIG.costs.frameworkDiscount : 1)) / 1000) * 1000;
      // Auslastung über alle Objekte des Portfolios; Rahmenvertragspartner priorisieren Ihre Aufträge
      const load = views.reduce((acc, v) => acc + v.jobs.filter((j) => j.contractorId === c.id && (j.status === 'scheduled' || j.status === 'in_progress')).length, 0);
      const busy = framework ? Math.floor(load / 2) : load;
      const waitDays = framework ? Math.max(0, c.waitDays - 2) : c.waitDays;
      const days = Math.max(1, Math.round(spec.baseDays * (1.25 - c.quality * 0.07)));
      const firstPayment = spec.measure ? Math.round(price * 0.3) : 0;
      return {
        contractorId: c.id,
        contractorName: c.name,
        quality: c.quality,
        reliability: c.reliability,
        price,
        days,
        startDay: Math.max(s.day + waitDays + busy, framework ? 0 : c.busyUntil),
        uncertainty: Math.min(0.6, spec.uncertainty * (1.35 - c.quality * 0.1)),
        firstPayment,
      };
    })
    .sort((a, b) => a.price - b.price);
}

export function createJob(s: GameState, req: JobRequest, contractorId: string): { ok: true; job: Job } | { ok: false; error: string } {
  if (s.gameOver) return { ok: false, error: 'Das Spiel ist beendet.' };
  const spec = specFor(s, req);
  if ('error' in spec) return { ok: false, error: spec.error };
  const offer = offersFor(s, spec).find((o) => o.contractorId === contractorId);
  if (!offer) return { ok: false, error: 'Dieser Dienstleister kann den Auftrag nicht übernehmen.' };
  if (s.cash + s.overdraftLimit < offer.firstPayment) return { ok: false, error: 'Nicht genügend Liquidität für die Anzahlung (Kontostand + Dispo).' };
  const subsidy = spec.measure?.subsidyEligible ? activeSubsidyRate(s) : 0;
  const job: Job = {
    id: nextId(s, 'j'),
    kind: spec.kind,
    measureId: spec.measure?.id ?? (req.kind === 'maintenance' ? `maint:${req.component}` : null),
    defectIds: spec.defectIds,
    target: spec.target,
    title: spec.title,
    description: spec.description,
    cause: spec.cause,
    urgency: spec.urgency,
    trade: spec.trade,
    contractorId,
    estimatedCost: offer.price,
    uncertainty: offer.uncertainty,
    actualCost: null,
    estimatedDays: offer.days,
    workedDays: 0,
    createdDay: s.day,
    startDay: offer.startDay,
    completedDay: null,
    status: 'scheduled',
    paid: 0,
    materials: spec.materials,
    expectedEffects: spec.effects,
    noise: spec.noise,
    blocksApartment: spec.blocksApartment,
    subsidyRate: subsidy,
    delays: 0,
  };
  s.jobs.push(job);
  for (const id of spec.defectIds) {
    const d = s.defects.find((x) => x.id === id);
    if (d) d.jobId = job.id;
  }
  if (spec.blocksApartment && spec.target.kind === 'apartment') {
    const aptId = spec.target.apartmentId;
    const a = s.apartments.find((x) => x.id === aptId);
    if (a && a.status !== 'rented') {
      a.listing = null;
      s.applicants = s.applicants.filter((x) => x.apartmentId !== a.id);
    }
  }
  log(s, `Auftrag erteilt: ${job.title} an ${contractorName(s, contractorId)} (${formatMoney(offer.price)}).`, 'job');
  if (job.startDay <= s.day) startJob(s, job);
  return { ok: true, job };
}

export const contractorName = (s: GameState, id: string) => s.contractors.find((c) => c.id === id)?.name ?? 'Dienstleister';

const ledgerCategoryFor = (j: Job): LedgerCategory => {
  if (j.kind === 'repair') return 'repair';
  if (j.kind === 'maintenance') return 'maintenance';
  if (j.kind === 'renovation') return 'renovation';
  return 'modernization';
};

function startJob(s: GameState, j: Job) {
  j.status = 'in_progress';
  const measure = j.measureId ? MEASURE_BY_ID[j.measureId] : null;
  if (measure && j.paid === 0) {
    const first = Math.round(j.estimatedCost * 0.3);
    post(s, { category: ledgerCategoryFor(j), amount: -first, purpose: `Abschlag 30 %: ${j.title}`, apartmentId: j.target.kind === 'apartment' ? j.target.apartmentId : null, componentKey: j.target.kind === 'component' ? j.target.key : null, ref: { type: 'job', id: j.id } });
    j.paid = first;
  }
  if (j.target.kind === 'apartment' && j.blocksApartment) {
    const aptId = j.target.apartmentId;
    const a = s.apartments.find((x) => x.id === aptId);
    if (a) {
      if (a.status !== 'rented') a.status = 'renovating';
      else {
        const t = s.tenants.find((x) => x.id === a.tenantId);
        if (t) addMood(t, s.day, 'Handwerker in der Wohnung', -Math.round(4 * (1 - t.traits.constructionTolerance / 100) + 1), j.estimatedDays + 3);
      }
    }
  }
  if (j.measureId?.startsWith('heating_') && isHeatingSeason(s.day)) {
    for (const t of s.tenants) if (t.status !== 'former') addMood(t, s.day, 'Heizungsumbau im Winter', -12, j.estimatedDays + 2);
  }
}

/** Täglicher Fortschritt aller Aufträge. */
export function progressJobs(s: GameState, rng: Rng) {
  for (const j of s.jobs) {
    if (j.status === 'scheduled' && j.startDay <= s.day) {
      const c = s.contractors.find((x) => x.id === j.contractorId);
      const noShow = c ? (1 - c.reliability / 100) * 0.3 : 0;
      if (rng.chance(noShow)) {
        const delay = rng.int(1, 4);
        j.startDay = s.day + delay;
        j.delays += delay;
        addMessage(s, { category: 'contractor', severity: 'warning', title: `${c?.name ?? 'Handwerker'} sagt Termin ab`, text: `Der Termin für „${j.title}“ verschiebt sich um ${delay} Tag(e). Zuverlässigkeit des Betriebs: ${c?.reliability ?? '?'} %.`, link: { page: 'repairs', id: j.id } });
        continue;
      }
      startJob(s, j);
      continue;
    }
    if (j.status !== 'in_progress') continue;
    const c = s.contractors.find((x) => x.id === j.contractorId);
    if (c && rng.chance((1 - c.reliability / 100) * 0.08)) {
      j.delays += 1;
      continue;
    }
    j.workedDays += 1;
    if (j.workedDays >= j.estimatedDays) completeJob(s, j, rng);
  }
}

export function completeJob(s: GameState, j: Job, rng: Rng) {
  const c = s.contractors.find((x) => x.id === j.contractorId);
  const quality = c?.quality ?? 3;
  const bias = (j.measureId && MEASURE_BY_ID[j.measureId] ? (s.building.yearBuilt < 1950 ? 0.04 : 0.02) : 0) + (quality <= 2 ? 0.04 : 0);
  const dev = clamp(rng.normal(bias, j.uncertainty / 2), -j.uncertainty * 0.5, j.uncertainty * 1.5);
  const actual = Math.round((j.estimatedCost * (1 + dev)) / 100) * 100;
  j.actualCost = actual;
  j.status = 'done';
  j.completedDay = s.day;
  const rest = actual - j.paid;
  const aptId = j.target.kind === 'apartment' ? j.target.apartmentId : null;
  if (rest !== 0)
    post(s, { category: ledgerCategoryFor(j), amount: -rest, purpose: `${j.paid > 0 ? 'Schlussrechnung' : 'Rechnung'}: ${j.title} (${c?.name ?? ''})`, apartmentId: aptId, componentKey: j.target.kind === 'component' ? j.target.key : null, ref: { type: 'job', id: j.id } });
  j.paid = actual;
  if (c) c.jobsDone += 1;
  if (dev > 0.1)
    addMessage(s, { category: 'contractor', severity: 'warning', title: `Mehrkosten bei „${j.title}“`, text: `Unvorhergesehene Mehrkosten: ${formatMoney(actual)} statt geschätzt ${formatMoney(j.estimatedCost)} (+${Math.round(dev * 100)} %).`, link: { page: 'repairs', id: j.id } });
  if (j.subsidyRate > 0) {
    const sub = Math.round(actual * j.subsidyRate);
    post(s, { category: 'subsidy', amount: sub, purpose: `Förderzuschuss ${Math.round(j.subsidyRate * 100)} %: ${j.title}`, ref: { type: 'job', id: j.id } });
  }
  const qf = 0.6 + quality * 0.1;
  if (j.kind === 'repair') {
    for (const id of j.defectIds) {
      const d = s.defects.find((x) => x.id === id);
      if (!d) continue;
      resolveDefect(s, d, `Reparatur durch ${c?.name ?? 'Handwerker'}`);
      if (d.target.kind === 'component') {
        const comp = s.building.components[d.target.key]!;
        comp.condition = clamp(comp.condition + 2 * qf);
      } else {
        const a = s.apartments.find((x) => x.id === aptId);
        if (a) a.condition = clamp(a.condition + 1);
      }
      if (DEFECT_TYPES[d.type].insurable || s.counters[`insured:${d.id}`]) fileInsuranceClaim(s, d, j, rng);
      thankForRepair(s, d, j, rng);
    }
    s.building.repairHistory.push({ day: s.day, text: j.title, cost: actual, target: targetLabel(s, j.target) });
    // Schlechte Qualität: erhöhtes Risiko, dass der Mangel zurückkehrt
    if (quality <= 2 && rng.chance(0.25) && j.defectIds.length) {
      const d = s.defects.find((x) => x.id === j.defectIds[0]);
      if (d && d.target.kind === 'component') s.building.components[d.target.key]!.condition = clamp(s.building.components[d.target.key]!.condition - 3);
    }
  } else if (j.kind === 'maintenance' && j.target.kind === 'component') {
    const key = j.target.key;
    const comp = s.building.components[key]!;
    comp.condition = clamp(comp.condition + COMPONENTS[key].maintenanceGain * qf);
    comp.lastMaintenanceDay = s.day;
    if (key === 'outdoor') s.building.outdoorCare = clamp(s.building.outdoorCare + 30);
    if (key === 'stairwell') s.building.cleanliness = clamp(s.building.cleanliness + 15);
    for (const d of s.defects.filter((x) => x.resolvedDay === null && !x.discovered && x.target.kind === 'component' && x.target.key === key)) discoverDefect(s, d, 'Bei der Wartung entdeckt.');
    if (key === 'heating') {
      const ineff = s.defects.find((x) => x.resolvedDay === null && x.type === 'heating_inefficient');
      if (ineff) resolveDefect(s, ineff, 'bei der Wartung neu eingestellt');
    }
    s.building.repairHistory.push({ day: s.day, text: j.title, cost: actual, target: COMPONENTS[key].label });
  } else if (j.measureId) {
    const m = MEASURE_BY_ID[j.measureId];
    const a = aptId ? s.apartments.find((x) => x.id === aptId) : undefined;
    m.apply(s, a);
    if (quality <= 2 && a) a.condition = clamp(a.condition - 4);
    // Modernisierungsanteil für eine spätere Umlage vormerken
    const modCost = Math.round(actual * m.modernizationShare);
    if (modCost > 0) {
      if (a) a.modernizationPool += modCost;
      else {
        const parts = allocateCents(modCost, s.apartments.map((x) => x.area));
        s.apartments.forEach((x, i) => (x.modernizationPool += parts[i]));
      }
    }
    if (a) {
      a.lastRenovationDay = s.day;
      if (m.id === 'apt_full') for (const d of s.defects.filter((x) => x.resolvedDay === null && x.target.kind === 'apartment' && x.target.apartmentId === a.id)) resolveDefect(s, d, 'im Zuge der Komplettsanierung');
      if (m.id === 'apt_bath') for (const d of s.defects.filter((x) => x.resolvedDay === null && x.target.kind === 'apartment' && x.target.apartmentId === a.id && ['apt_faucet', 'apt_tiles'].includes(x.type))) resolveDefect(s, d, 'mit dem neuen Bad');
      if (m.id === 'apt_kitchen') for (const d of s.defects.filter((x) => x.resolvedDay === null && x.target.kind === 'apartment' && x.target.apartmentId === a.id && ['apt_appliance', 'apt_drain'].includes(x.type))) resolveDefect(s, d, 'mit der neuen Küche');
      if (a.status === 'renovating' || a.status === 'vacant_needs_renovation') a.status = a.condition < 50 ? 'vacant_needs_renovation' : 'vacant_ready';
      const t = a.tenantId ? s.tenants.find((x) => x.id === a.tenantId) : null;
      if (t) addMood(t, s.day, 'Wohnung modernisiert', 6, 180);
    } else {
      // Gebäudemaßnahmen lösen zugehörige Schäden
      const keyMap: Record<string, ComponentKey[]> = {
        roof_renovation: ['roof'],
        facade_renewal: ['facade'],
        facade_insulation: ['facade'],
        windows_replace: ['windows'],
        heating_condensing: ['heating'],
        heating_heatpump: ['heating'],
        heating_district: ['heating'],
        electrical_renewal: ['electrical'],
        pipe_renewal: ['pipes', 'sanitary'],
        basement_seal: ['basement'],
        stairwell_upgrade: ['stairwell'],
        outdoor_design: ['outdoor'],
      };
      for (const key of keyMap[m.id] ?? []) for (const d of s.defects.filter((x) => x.resolvedDay === null && x.target.kind === 'component' && x.target.key === key)) resolveDefect(s, d, `durch ${m.label}`);
      if (m.id === 'windows_replace') for (const d of s.defects.filter((x) => x.resolvedDay === null && x.type === 'apt_window')) resolveDefect(s, d, 'durch neue Fenster');
      for (const t of s.tenants) if (t.status !== 'former' && (m.category === 'comfort' || m.category === 'safety')) addMood(t, s.day, 'Haus aufgewertet', 4, 150);
      for (const t of s.tenants) if (t.status !== 'former' && m.category === 'energy') addMood(t, s.day, 'Energetische Modernisierung', Math.round(1 + t.traits.ecoAwareness / 30), 150);
    }
    s.building.modernizationHistory.push({ day: s.day, text: j.title, cost: actual, target: a ? apartmentLabel(a) : 'Gebäude' });
    s.counters.measuresDone = (s.counters.measuresDone ?? 0) + 1;
    addMessage(s, { category: 'contractor', severity: 'success', title: `Abgeschlossen: ${j.title}`, text: `${c?.name ?? 'Der Betrieb'} hat die Arbeiten abgeschlossen. Kosten: ${formatMoney(actual)}${j.subsidyRate > 0 ? ` (abzgl. ${Math.round(j.subsidyRate * 100)} % Förderung)` : ''}.`, link: { page: 'renovation', id: j.id } });
  }
  log(s, `Auftrag abgeschlossen: ${j.title} (${formatMoney(actual)}).`, 'job');
}

function thankForRepair(s: GameState, d: Defect, _j: Job, rng: Rng) {
  const aptId = d.target.kind === 'apartment' ? d.target.apartmentId : null;
  const reporter = d.reportedBy ? s.tenants.find((t) => t.id === d.reportedBy && t.status !== 'former') : null;
  const t = reporter ?? (aptId ? s.tenants.find((x) => x.apartmentId === aptId && x.status !== 'former') : null);
  const waited = s.day - (d.discoveredDay ?? d.createdDay);
  if (DEFECT_TYPES[d.type].buildingWide) for (const o of s.tenants) if (o.status !== 'former') addMood(o, s.day, 'Mangel behoben', 2, 30);
  if (!t) return;
  if (waited <= 7) {
    addMood(t, s.day, 'Schnelle Reparatur', 4, 60);
    if (t.satisfaction > 40 && rng.chance(0.5)) {
      t.thanks += 1;
      s.counters.thanks = (s.counters.thanks ?? 0) + 1;
      addMessage(s, { category: 'tenant', severity: 'success', title: `Dank von ${t.name}`, text: fill(rng.pick(TEXTS.thanks), { job: DEFECT_TYPES[d.type].label }), tenantId: t.id });
    }
  } else if (waited > 30) addMood(t, s.day, 'Reparatur hat lange gedauert', -2, 45);
}

export function cancelJob(s: GameState, j: Job): { ok: boolean; error?: string } {
  if (j.status === 'done' || j.status === 'cancelled') return { ok: false, error: 'Der Auftrag ist bereits abgeschlossen.' };
  if (j.status === 'in_progress') {
    const share = j.workedDays / Math.max(1, j.estimatedDays);
    const owed = Math.round(j.estimatedCost * share * 1.1) - j.paid;
    if (owed > 0) post(s, { category: ledgerCategoryFor(j), amount: -owed, purpose: `Abbruch – Teilleistung: ${j.title}`, ref: { type: 'job', id: j.id } });
    j.paid += Math.max(0, owed);
  }
  j.status = 'cancelled';
  j.completedDay = s.day;
  for (const id of j.defectIds) {
    const d = s.defects.find((x) => x.id === id);
    if (d && d.jobId === j.id) d.jobId = null;
  }
  if (j.target.kind === 'apartment') {
    const aptId = j.target.apartmentId;
    const a = s.apartments.find((x) => x.id === aptId);
    if (a && a.status === 'renovating') a.status = a.condition < 50 ? 'vacant_needs_renovation' : 'vacant_ready';
  }
  log(s, `Auftrag storniert: ${j.title}.`, 'job');
  return { ok: true };
}

/** Hausmeister erledigt Kleinreparaturen selbst und entdeckt versteckte Mängel. */
export function caretakerRound(s: GameState, rng: Rng) {
  const ct = s.services.caretaker;
  if (ct === 'none') return;
  const capacity = ct === 'fulltime' ? 2 : 1;
  const discoverP = ct === 'fulltime' ? 0.12 : 0.06;
  for (const d of s.defects) {
    if (d.resolvedDay === null && !d.discovered && rng.chance(discoverP)) discoverDefect(s, d, 'Vom Hausmeister beim Rundgang entdeckt.');
  }
  if (rng.next() > (ct === 'fulltime' ? 0.6 : 0.3)) return;
  const small = s.defects.filter(
    (d) =>
      d.resolvedDay === null &&
      d.discovered &&
      !d.jobId &&
      d.severity === 1 &&
      (['general', 'painting', 'garden'].includes(DEFECT_TYPES[d.type].trade) || ['apt_faucet', 'apt_drain', 'apt_heater', 'stairwell_light'].includes(d.type)),
  );
  for (const d of small.slice(0, capacity)) {
    const material = Math.round(mulCents(DEFECT_TYPES[d.type].repairCost, 0.25 * materialIndex(s)) / 100) * 100;
    post(s, { category: 'repair', amount: -material, purpose: `Hausmeister: Material für ${DEFECT_TYPES[d.type].label}`, apartmentId: d.target.kind === 'apartment' ? d.target.apartmentId : null, componentKey: d.target.kind === 'component' ? d.target.key : null, ref: { type: 'defect', id: d.id } });
    resolveDefect(s, d, 'vom Hausmeister erledigt');
    const t = d.reportedBy ? s.tenants.find((x) => x.id === d.reportedBy && x.status !== 'former') : null;
    if (t) addMood(t, s.day, 'Schnelle Reparatur', 4, 60);
    s.counters.caretakerFixes = (s.counters.caretakerFixes ?? 0) + 1;
  }
}
