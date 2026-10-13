import type { Apartment, Defect, DefectTarget, GameState, Tenant } from '@/domain/schema';
import { COMPONENTS } from '@/content/components';
import { DEFECT_TYPES } from '@/content/defects';
import type { Rng } from '@/utils/rng';
import { nextId } from './ids';
import { addMessage, log } from './messages';
import { isHeatingSeason } from './weather';
import { apartmentLabel } from './derived';

export function targetLabel(s: GameState, t: DefectTarget | { kind: 'building' }): string {
  if (t.kind === 'component') return COMPONENTS[t.key].label;
  if (t.kind === 'apartment') {
    const a = s.apartments.find((x) => x.id === t.apartmentId);
    return a ? apartmentLabel(a) : 'Wohnung';
  }
  return 'Gesamtes Gebäude';
}

export interface CreateDefectOptions {
  discovered?: boolean;
  reportedBy?: string | null;
  cause: string;
  escalatedFrom?: string | null;
  silent?: boolean;
  rng?: Rng;
}

/** Legt einen Schaden an. Gleichartige offene Schäden am selben Ziel werden nicht doppelt angelegt. */
export function createDefect(s: GameState, type: string, target: DefectTarget, opts: CreateDefectOptions): Defect | null {
  const def = DEFECT_TYPES[type];
  if (!def) throw new Error(`Unbekannter Schadenstyp ${type}`);
  const sameTarget = (d: Defect) =>
    d.resolvedDay === null &&
    d.type === type &&
    d.target.kind === target.kind &&
    (target.kind === 'component' ? d.target.kind === 'component' && d.target.key === target.key : d.target.kind === 'apartment' && d.target.apartmentId === target.apartmentId);
  if (s.defects.some(sameTarget)) return null;
  const discovered = opts.discovered ?? true;
  const d: Defect = {
    id: nextId(s, 'd'),
    type,
    target,
    severity: def.severity,
    createdDay: s.day,
    discovered,
    discoveredDay: discovered ? s.day : null,
    reportedBy: opts.reportedBy ?? null,
    escalateAtDay: def.escalation ? s.day + def.escalation.afterDays : null,
    jobId: null,
    cause: opts.cause,
    escalatedFrom: opts.escalatedFrom ?? null,
    resolvedDay: null,
    insuranceClaimed: false,
  };
  s.defects.push(d);
  if (def.uninhabitable && target.kind === 'apartment') markUninhabitable(s, target.apartmentId);
  if (discovered && !opts.silent) announceDefect(s, d);
  // Rohrbruch verursacht unmittelbar einen Wasserschaden in einer Wohnung
  if (type === 'pipe_burst' && opts.rng && s.apartments.length) {
    const apt = opts.rng.pick(s.apartments);
    createDefect(s, 'apt_water_damage', { kind: 'apartment', apartmentId: apt.id }, { cause: 'Folge des Rohrbruchs im Steigstrang.', escalatedFrom: d.id, discovered: true });
  }
  return d;
}

export function announceDefect(s: GameState, d: Defect) {
  const def = DEFECT_TYPES[d.type];
  const where = targetLabel(s, d.target);
  addMessage(s, {
    category: 'building',
    severity: d.severity >= 3 ? 'danger' : d.severity === 2 ? 'warning' : 'info',
    title: `${def.label} – ${where}`,
    text: `${def.description} ${d.cause}`.trim(),
    apartmentId: d.target.kind === 'apartment' ? d.target.apartmentId : null,
    defectId: d.id,
    link: { page: 'repairs', id: d.id },
    important: d.severity >= 3,
  });
}

export function discoverDefect(s: GameState, d: Defect, how: string) {
  if (d.discovered || d.resolvedDay !== null) return;
  d.discovered = true;
  d.discoveredDay = s.day;
  d.cause = `${d.cause} ${how}`.trim();
  announceDefect(s, d);
}

function markUninhabitable(s: GameState, aptId: string) {
  const a = s.apartments.find((x) => x.id === aptId);
  if (!a) return;
  if (a.status === 'vacant_ready' || a.status === 'vacant_needs_renovation') {
    a.status = 'uninhabitable';
    a.listing = null;
    s.applicants = s.applicants.filter((x) => x.apartmentId !== a.id);
  }
  // Vermietete Wohnungen bleiben "rented" – Mietminderung 100 % greift über den Schaden.
}

export function resolveDefect(s: GameState, d: Defect, how: string) {
  if (d.resolvedDay !== null) return;
  d.resolvedDay = s.day;
  const def = DEFECT_TYPES[d.type];
  if (def.uninhabitable && d.target.kind === 'apartment') {
    const aptId = d.target.apartmentId;
    const a = s.apartments.find((x) => x.id === aptId);
    const stillBad = s.defects.some((x) => x.resolvedDay === null && x.target.kind === 'apartment' && x.target.apartmentId === aptId && DEFECT_TYPES[x.type].uninhabitable);
    if (a && a.status === 'uninhabitable' && !stillBad) a.status = a.condition < 50 ? 'vacant_needs_renovation' : 'vacant_ready';
  }
  log(s, `${def.label} (${targetLabel(s, d.target)}) behoben: ${how}`, 'repair');
}

export const isOpen = (d: Defect) => d.resolvedDay === null;

/** Welche offenen Schäden betreffen eine bestimmte Wohnung (direkt oder hausweit)? */
export function defectsAffecting(s: GameState, a: Apartment): Defect[] {
  const top = a.floor === s.building.floors - 1;
  return s.defects.filter((d) => {
    if (d.resolvedDay !== null) return false;
    const def = DEFECT_TYPES[d.type];
    if (d.target.kind === 'apartment') return d.target.apartmentId === a.id;
    if (def.buildingWide) return true;
    if (d.type === 'roof_leak') return top;
    return false;
  });
}

/** Mietminderung (Anteil 0–1) für eine Wohnung aufgrund aktuell offener Mängel. */
export function rentReductionFor(s: GameState, a: Apartment): { rate: number; reasons: string[] } {
  let rate = 0;
  const reasons: string[] = [];
  const winter = isHeatingSeason(s.day);
  for (const d of defectsAffecting(s, a)) {
    const def = DEFECT_TYPES[d.type];
    if (!def.rentReduction || !d.discovered) continue;
    // Heizungsausfall mindert nur in der Heizperiode voll.
    const r = d.type === 'heating_failure' && !winter ? def.rentReduction * 0.3 : def.rentReduction;
    rate += r;
    reasons.push(`${def.label} (−${Math.round(r * 100)} %)`);
  }
  return { rate: Math.min(1, rate), reasons };
}

/** Zufriedenheitsabzug durch offene Mängel für einen Mieter. */
export function defectPenaltyFor(s: GameState, a: Apartment, t: Tenant): number {
  const winter = isHeatingSeason(s.day);
  let p = 0;
  for (const d of defectsAffecting(s, a)) {
    const def = DEFECT_TYPES[d.type];
    // Mieter spüren auch unentdeckte Mängel in der eigenen Wohnung erst, wenn sie bekannt sind.
    if (!d.discovered && d.target.kind === 'apartment') continue;
    let v = def.satisfactionPenalty + (winter ? def.winterPenalty ?? 0 : 0);
    const age = s.day - (d.discoveredDay ?? d.createdDay);
    if (age > 14) v *= 1 + Math.min(1, (age - 14) / 45) * (0.5 + t.traits.renovationDemands / 200);
    if (d.jobId) v *= 0.6; // Auftrag erteilt: Mieter sehen, dass sich jemand kümmert
    p += v;
  }
  return p;
}

/** Tägliche Eskalation unbehandelter Schäden zu Folgeschäden. */
export function escalateDefects(s: GameState, rng: Rng) {
  const open = s.defects.filter((d) => d.resolvedDay === null && d.escalateAtDay !== null && d.escalateAtDay <= s.day);
  for (const d of open) {
    // Gültige Voraussetzung: Schaden offen, kein aktiver Auftrag.
    const job = d.jobId ? s.jobs.find((j) => j.id === d.jobId) : null;
    if (job && (job.status === 'scheduled' || job.status === 'in_progress')) {
      d.escalateAtDay = s.day + 7; // Aufschub, solange gearbeitet wird
      continue;
    }
    const def = DEFECT_TYPES[d.type];
    if (!def.escalation) continue;
    const toDef = DEFECT_TYPES[def.escalation.to];
    let target: DefectTarget = d.target;
    if (toDef.scope === 'apartment' && d.target.kind === 'component') {
      const candidates = pickAffectedApartment(s, d.target.key, rng);
      if (!candidates) {
        d.escalateAtDay = null;
        continue;
      }
      target = { kind: 'apartment', apartmentId: candidates.id };
    } else if (toDef.scope === 'component' && toDef.component) {
      target = { kind: 'component', key: toDef.component };
    }
    d.escalateAtDay = null;
    const created = createDefect(s, def.escalation.to, target, { cause: `Folgeschaden: ${def.escalation.text}`, escalatedFrom: d.id, discovered: true, rng });
    if (created) {
      s.counters.escalations = (s.counters.escalations ?? 0) + 1;
      // Der ursprüngliche Schaden geht im schwereren auf (gleiches Bauteil), sonst bleibt er offen.
      if (created.target.kind === d.target.kind && toDef.scope === DEFECT_TYPES[d.type].scope) resolveDefect(s, d, 'in Folgeschaden aufgegangen');
    }
  }
}

function pickAffectedApartment(s: GameState, key: string, rng: Rng): Apartment | null {
  const top = s.building.floors - 1;
  let pool = s.apartments;
  if (key === 'roof') pool = s.apartments.filter((a) => a.floor === top);
  if (key === 'basement' || key === 'sanitary') pool = s.apartments.filter((a) => a.floor === 0);
  if (pool.length === 0) pool = s.apartments;
  return pool.length ? rng.pick(pool) : null;
}

export function apartmentFromTarget(s: GameState, t: DefectTarget): Apartment | null {
  return t.kind === 'apartment' ? s.apartments.find((a) => a.id === t.apartmentId) ?? null : null;
}
