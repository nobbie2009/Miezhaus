import type { Automation, Defect, GameState, Job } from '@/domain/schema';
import { DEFECT_TYPES } from '@/content/defects';
import { COMPONENTS } from '@/content/components';
import { monthKey } from '@/utils/date';
import { formatMoney } from '@/utils/money';
import type { Rng } from '@/utils/rng';
import { maxNewLeaseRent, applicantFit, listApartment, offerLease } from './applicants';
import { CONFIG } from './config';
import { apartmentLabel, comparableRent } from './derived';
import { createJob, offersFor, specFor, type JobRequest, type Offer } from './jobs';
import { post } from './ledger';
import { addMessage, log } from './messages';
import { rootOf } from './portfolio';

export const STRATEGY_LABEL: Record<Automation['strategy'], string> = {
  value: 'Bestes Preis-Leistungs-Verhältnis',
  cheap: 'Günstigster Anbieter',
  quality: 'Beste Qualität',
  fast: 'Schnellster Termin',
};

/** Wählt aus mehreren Angeboten eines nach Strategie. Bevorzugte Betriebe werden genommen, wenn sie anbieten. */
export function chooseOffer(offers: Offer[], strategy: Automation['strategy'], day: number, urgency: Job['urgency'], preferredId?: string | null): Offer | null {
  if (!offers.length) return null;
  if (preferredId) {
    const pref = offers.find((o) => o.contractorId === preferredId);
    // Bevorzugter Betrieb – außer er ist bei dringenden Schäden viel zu spät dran
    if (pref && !(urgency === 'critical' && pref.startDay - day > 3)) return pref;
  }
  const wait = (o: Offer) => Math.max(0, o.startDay - day) + o.days;
  const urgencyWeight = urgency === 'critical' ? 0.12 : urgency === 'high' ? 0.05 : 0.015;
  const score = (o: Offer) => {
    switch (strategy) {
      case 'cheap':
        return o.price * (1 + wait(o) * 0.001);
      case 'quality':
        return -o.quality * 1e9 - o.reliability * 1e6 + o.price;
      case 'fast':
        return wait(o) * 1e9 + o.price;
      default:
        return (o.price / (0.55 + o.quality * 0.1 + o.reliability / 1000)) * (1 + wait(o) * urgencyWeight);
    }
  };
  return [...offers].sort((a, b) => score(a) - score(b))[0];
}

/** Kanal für automatische Vergabe: Mieter-App oder externe Hausverwaltung. */
export const automationChannel = (s: GameState): 'app' | 'agency' | null => (s.services.management === 'agency' ? 'agency' : s.services.tenantApp ? 'app' : null);

const budgetKey = (s: GameState) => `autoSpend-${monthKey(s.day)}`;
export const autoSpentThisMonth = (s: GameState) => rootOf(s).counters[budgetKey(s)] ?? 0;

interface DispatchResult {
  ok: boolean;
  reason?: 'limit' | 'budget' | 'reserve' | 'nooffer' | 'error';
  job?: Job;
  price?: number;
}

/** Vergibt einen Auftrag nach den Automatik-Regeln (Betragsgrenze, Monatsbudget, Kontoreserve). */
function dispatch(s: GameState, req: JobRequest, opts: { ignoreLimit?: boolean } = {}): DispatchResult {
  const root = rootOf(s);
  const a = root.automation;
  const spec = specFor(s, req);
  if ('error' in spec) return { ok: false, reason: 'error' };
  const offer = chooseOffer(offersFor(s, spec), a.strategy, s.day, spec.urgency, a.preferred[spec.trade]);
  if (!offer) return { ok: false, reason: 'nooffer' };
  const critical = spec.urgency === 'critical';
  if (!opts.ignoreLimit && offer.price > a.maxAutoCost && !(critical && a.includeCritical)) return { ok: false, reason: 'limit' };
  if (autoSpentThisMonth(s) + offer.price > a.monthlyBudget && !(critical && a.includeCritical)) return { ok: false, reason: 'budget' };
  if (s.cash - offer.price < a.minCashReserve && !(critical && a.includeCritical && s.cash + s.overdraftLimit > offer.price)) return { ok: false, reason: 'reserve' };
  const r = createJob(s, req, offer.contractorId);
  if (!r.ok) return { ok: false, reason: 'error' };
  root.counters[budgetKey(s)] = autoSpentThisMonth(s) + offer.price;
  root.counters.autoJobs = (root.counters.autoJobs ?? 0) + 1;
  return { ok: true, job: r.job, price: offer.price };
}

/** Bekannter, offener Schaden ohne laufenden Auftrag. */
const open = (s: GameState, d: Defect) => d.resolvedDay === null && d.discovered && (!d.jobId || !s.jobs.some((j) => j.id === d.jobId && (j.status === 'scheduled' || j.status === 'in_progress')));

/** Täglicher Automatik-Lauf für ein Objekt. */
export function runAutomation(s: GameState, rng: Rng) {
  void rng;
  const root = rootOf(s);
  const a = root.automation;
  const channel = automationChannel(s);
  if (s.gameOver) return;
  const via = channel === 'agency' ? 'Hausverwaltung' : 'Mieter-App';

  if (channel && a.autoRepair) {
    const done: string[] = [];
    const dispatchedIds: string[] = [];
    let skipped = 0;
    const candidates = s.defects.filter((d) => open(s, d));
    // Dringendes zuerst
    candidates.sort((x, y) => y.severity - x.severity || x.createdDay - y.createdDay);
    for (const d of candidates) {
      // Kleinigkeiten erledigt der Hausmeister – ihm einen Tag Vorsprung lassen
      if (s.services.caretaker !== 'none' && d.severity === 1 && s.day - (d.discoveredDay ?? s.day) < 2) continue;
      const r = dispatch(s, { kind: 'repair', defectId: d.id });
      if (r.ok) {
        dispatchedIds.push(d.id);
        const reporter = d.reportedBy ? s.tenants.find((t) => t.id === d.reportedBy) : null;
        done.push(`${DEFECT_TYPES[d.type].label} → ${r.job!.title.replace(/ beheben$/, '')} (${formatMoney(r.price!)}${reporter && channel === 'app' ? `, gemeldet von ${reporter.name}` : ''})`);
      } else if (r.reason === 'limit' || r.reason === 'budget' || r.reason === 'reserve') skipped++;
    }
    if (done.length) {
      const minorOnly = dispatchedIds.every((id) => (s.defects.find((x) => x.id === id)?.severity ?? 1) < 2);
      // Erledigte Meldungen nicht zusätzlich als ungelesen zählen
      for (const m of s.messages) if (m.day === s.day && m.defectId && dispatchedIds.includes(m.defectId) && m.severity !== 'danger') m.read = true;
      const msg = addMessage(s, {
        category: 'contractor',
        severity: 'success',
        title: `${via}: ${done.length} Auftrag${done.length > 1 ? 'e' : ''} automatisch vergeben`,
        text: `${channel === 'app' ? 'Die Mieter haben über die App Handwerker beauftragt' : 'Die Hausverwaltung hat Handwerker beauftragt'} (Strategie: ${STRATEGY_LABEL[a.strategy]}): ${done.join('; ')}.`,
        link: { page: 'repairs', id: null },
      });
      if (minorOnly) msg.read = true;
    }
    const warnKey = `autoSkipWarn-${monthKey(s.day)}`;
    if (skipped > 0 && !s.counters[warnKey]) {
      s.counters[warnKey] = 1;
      addMessage(s, {
        category: 'contractor',
        severity: 'warning',
        title: `${via}: Aufträge warten auf Freigabe`,
        text: `${skipped} Schaden/Schäden überschreiten die Automatik-Regeln (Einzelgrenze ${formatMoney(a.maxAutoCost)}, Monatsbudget ${formatMoney(a.monthlyBudget)}, Kontoreserve ${formatMoney(a.minCashReserve)}). Bitte unter „Reparaturen“ selbst beauftragen oder die Regeln unter „Personal & Dienste“ anpassen.`,
        link: { page: 'repairs', id: null },
      });
    }
  }

  // Vorbeugende Wartung schlechter Bauteile (nur Hausverwaltung oder Wartungsvertrag)
  if (channel && a.autoMaintenance && s.day % 7 === 0) {
    for (const c of Object.values(s.building.components)) {
      if (!c || c.condition >= 50) continue;
      const r = dispatch(s, { kind: 'maintenance', component: c.key });
      if (r.ok) log(s, `${via}: Wartung ${COMPONENTS[c.key].label} beauftragt (${formatMoney(r.price!)}).`, 'job');
    }
  }

  // Leerstand: renovieren
  if (channel && a.autoRenovateVacant && s.day % 3 === 0) {
    for (const apt of s.apartments) {
      if (apt.status !== 'vacant_needs_renovation') continue;
      if (s.jobs.some((j) => j.target.kind === 'apartment' && j.target.apartmentId === apt.id && (j.status === 'scheduled' || j.status === 'in_progress'))) continue;
      const r = dispatch(s, { kind: 'measure', measureId: 'apt_paint', apartmentId: apt.id }, { ignoreLimit: true });
      if (r.ok) addMessage(s, { category: 'contractor', title: `${via}: Renovierung ${apartmentLabel(apt)} beauftragt`, text: `Malerarbeiten für ${formatMoney(r.price!)}, damit die Wohnung wieder vermietet werden kann.`, apartmentId: apt.id, link: { page: 'apartments', id: apt.id } });
    }
  }

  if (a.autoLetting) runAutoLetting(s, rng);
}

/** Vermietungsservice: inseriert leere Wohnungen und schließt mit passenden Bewerbern ab. */
function runAutoLetting(s: GameState, rng: Rng) {
  const root = rootOf(s);
  const a = root.automation;
  const agency = s.services.management === 'agency';
  for (const apt of s.apartments) {
    if (apt.status !== 'vacant_ready') continue;
    if (!apt.listing) {
      const rent = Math.min(maxNewLeaseRent(s, apt), Math.round((comparableRent(s, apt) * a.lettingRentFactor) / 1000) * 1000);
      const util = Math.round((apt.area * 350) / 500) * 500;
      listApartment(s, apt.id, rent, util);
      continue;
    }
    const listed = s.day - apt.listing.sinceDay;
    const apps = s.applicants.filter((x) => x.apartmentId === apt.id && !x.declined);
    if (!apps.length) {
      // Nach 40 Tagen ohne Erfolg Miete leicht senken (nicht unter 85 % der Vergleichsmiete)
      if (listed > 0 && listed % 40 === 0) {
        const lower = Math.max(Math.round(comparableRent(s, apt) * 0.85), apt.listing.askingRent - Math.round(comparableRent(s, apt) * 0.04));
        if (lower < apt.listing.askingRent) listApartment(s, apt.id, Math.round(lower / 1000) * 1000, apt.listing.utilityPrepayment);
      }
      continue;
    }
    const scored = apps
      .map((ap) => ({ ap, fit: applicantFit(s, ap, apt).score, fits: ap.maxRent >= apt.listing!.askingRent }))
      .sort((x, y) => Number(y.fits) - Number(x.fits) || y.fit - x.fit);
    const best = scored[0];
    const oldest = Math.max(...apps.map((x) => s.day - x.arrivedDay));
    // Kurz warten, ob noch bessere Bewerber kommen
    if (oldest < 4 && apps.length < 3) continue;
    if (best.fit < a.minApplicantFit && listed < 60) continue;
    const rent = apt.listing.askingRent;
    const r = offerLease(s, best.ap.id, rent, apt.listing.utilityPrepayment, rng);
    if (r.ok && r.accepted && !agency) {
      // Makler-Provision (Bestellerprinzip: zahlt der Vermieter)
      const fee = Math.round((rent * CONFIG.automation.lettingFeeRents) / 100) * 100;
      post(s, { category: 'marketing', amount: -fee, purpose: `Vermietungsservice ${apartmentLabel(apt)}`, apartmentId: apt.id, ref: { type: 'letting', id: `${apt.id}-${s.day}` } });
    }
  }
}

/**
 * „Alle Schäden beauftragen“: vergibt für jeden bekannten, offenen Schaden des Objekts
 * einen Auftrag nach der gewählten Strategie (ohne Automatik-Grenzen, aber mit Liquiditätsprüfung).
 */
export function repairAll(s: GameState, opts: { maxSeverityOnly?: number; strategy?: Automation['strategy'] } = {}): { ok: boolean; count: number; total: number; error?: string; skipped: number } {
  const root = rootOf(s);
  const strategy = opts.strategy ?? root.automation.strategy;
  let count = 0;
  let total = 0;
  let skipped = 0;
  const list = s.defects.filter((d) => open(s, d));
  list.sort((x, y) => y.severity - x.severity);
  for (const d of list) {
    if (opts.maxSeverityOnly && d.severity < opts.maxSeverityOnly) continue;
    const spec = specFor(s, { kind: 'repair', defectId: d.id });
    if ('error' in spec) continue;
    const offer = chooseOffer(offersFor(s, spec), strategy, s.day, spec.urgency, root.automation.preferred[spec.trade]);
    if (!offer) {
      skipped++;
      continue;
    }
    // Reparaturen werden bei Fertigstellung bezahlt – grobe Liquiditätsprüfung
    if (s.cash + s.overdraftLimit - total - offer.price < 0) {
      skipped++;
      continue;
    }
    const r = createJob(s, { kind: 'repair', defectId: d.id }, offer.contractorId);
    if (r.ok) {
      count++;
      total += offer.price;
    } else skipped++;
  }
  if (!count && !skipped) return { ok: false, count, total, skipped, error: 'Keine offenen Schäden ohne Auftrag.' };
  return { ok: true, count, total, skipped };
}
