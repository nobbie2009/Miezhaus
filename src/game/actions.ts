import { AutomationSchema, type Automation, type GameSettings, type GameState, type Investment, type Services } from '@/domain/schema';
import { formatMoney } from '@/utils/money';
import { CONFIG } from './config';
import { Rng } from '@/utils/rng';
import { listApartment, offerLease, unlistApartment } from './applicants';
import { agreePaymentPlan, announceRentIncrease, offerMutualTermination, terminateForArrears } from './contracts';
import { discoverDefect } from './defects';
import { resolveDecision } from './events';
import { repayLoan, takeLoan } from './finance';
import { cancelJob, createJob, type JobRequest } from './jobs';
import { log } from './messages';
import { dun, writeOff } from './payments';
import { hasUnlock } from './progression';
import { repairAll } from './automation';
import { deposit, withdraw } from './investments';
import { buyProperty, sellProperty, surveyOffer } from './realestate';

/**
 * Alle Spieleraktionen laufen über diese validierten Befehle.
 * Die UI ruft niemals Spielregeln direkt auf.
 */
export type GameAction =
  | { type: 'listApartment'; aptId: string; askingRent: number; utilityPrepayment: number }
  | { type: 'unlistApartment'; aptId: string }
  | { type: 'offerLease'; applicantId: string; netRent: number; utilityPrepayment: number }
  | { type: 'rejectApplicant'; applicantId: string }
  | { type: 'createJob'; request: JobRequest; contractorId: string }
  | { type: 'cancelJob'; jobId: string }
  | { type: 'dun'; claimId: string }
  | { type: 'writeOff'; claimId: string }
  | { type: 'paymentPlan'; contractId: string; monthlyAmount: number }
  | { type: 'terminateArrears'; contractId: string }
  | { type: 'mutualTermination'; contractId: string; compensation: number }
  | { type: 'rentIncrease'; contractId: string; newRent: number; kind: 'comparable' | 'modernization' }
  | { type: 'setService'; key: keyof Services; value: Services[keyof Services] }
  | { type: 'takeLoan'; amount: number; years: number }
  | { type: 'repayLoan'; loanId: string; amount: number }
  | { type: 'resolveDecision'; decisionId: string; optionId: string }
  | { type: 'markRead'; messageId: string | 'all' }
  | { type: 'inspectApartment'; aptId: string }
  | { type: 'setSetting'; key: keyof GameSettings; value: GameSettings[keyof GameSettings] }
  | { type: 'setTutorialStep'; step: number }
  | { type: 'continueEndless' }
  | { type: 'renameSave'; name: string }
  | { type: 'setAutomation'; patch: Partial<Automation> }
  | { type: 'toggleFramework'; contractorId: string }
  | { type: 'repairAll'; minSeverity?: number }
  | { type: 'invest'; kind: Investment['kind']; amount: number; years?: number }
  | { type: 'withdrawInvestment'; investmentId: string; amount: number | 'all' }
  | { type: 'surveyOffer'; offerId: string }
  | { type: 'buyProperty'; offerId: string; price?: number; loanAmount: number; loanYears: number }
  | { type: 'sellProperty'; buildingId: string }
  | { type: 'renameProperty'; name: string };

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

/** Aktionen, die sich (am selben Spieltag) rückgängig machen lassen. */
export const UNDOABLE: GameAction['type'][] = ['listApartment', 'unlistApartment', 'rejectApplicant', 'setService', 'cancelJob', 'paymentPlan', 'setAutomation', 'toggleFramework'];

export const ACTION_LABEL: Partial<Record<GameAction['type'], string>> = {
  listApartment: 'Inserat',
  unlistApartment: 'Inserat zurückziehen',
  rejectApplicant: 'Bewerbung abgelehnt',
  setService: 'Dienstleistung geändert',
  cancelJob: 'Auftrag storniert',
  paymentPlan: 'Ratenzahlung',
  setAutomation: 'Automatik-Regeln',
  toggleFramework: 'Rahmenvertrag',
};

const SERVICE_UNLOCK: Partial<Record<string, string>> = {
  'caretaker:parttime': 'caretaker',
  'caretaker:fulltime': 'caretaker',
  'management:software': 'software',
  'management:agency': 'agency',
  'maintenancePlan:true': 'maintenance_plan',
};

export function applyAction(s: GameState, a: GameAction): ActionResult {
  if (s.gameOver && !['markRead', 'continueEndless', 'renameSave', 'setSetting'].includes(a.type)) return { ok: false, error: 'Das Spiel ist beendet.' };
  const rng = new Rng(s);
  switch (a.type) {
    case 'listApartment':
      return listApartment(s, a.aptId, a.askingRent, a.utilityPrepayment);
    case 'unlistApartment':
      return unlistApartment(s, a.aptId);
    case 'offerLease': {
      const r = offerLease(s, a.applicantId, a.netRent, a.utilityPrepayment, rng);
      if (!r.ok) return r;
      return { ok: true, message: r.accepted ? 'Der Bewerber hat den Mietvertrag unterschrieben.' : 'Der Bewerber hat abgelehnt.' };
    }
    case 'rejectApplicant': {
      const ap = s.applicants.find((x) => x.id === a.applicantId);
      if (!ap) return { ok: false, error: 'Bewerbung nicht gefunden.' };
      s.applicants = s.applicants.filter((x) => x.id !== a.applicantId);
      return { ok: true };
    }
    case 'createJob': {
      const r = createJob(s, a.request, a.contractorId);
      return r.ok ? { ok: true, message: `Auftrag erteilt: ${r.job.title}` } : r;
    }
    case 'cancelJob': {
      const j = s.jobs.find((x) => x.id === a.jobId);
      if (!j) return { ok: false, error: 'Auftrag nicht gefunden.' };
      return cancelJob(s, j);
    }
    case 'dun': {
      const c = s.claims.find((x) => x.id === a.claimId);
      if (!c) return { ok: false, error: 'Forderung nicht gefunden.' };
      return dun(s, c);
    }
    case 'writeOff': {
      const c = s.claims.find((x) => x.id === a.claimId);
      if (!c) return { ok: false, error: 'Forderung nicht gefunden.' };
      return writeOff(s, c);
    }
    case 'paymentPlan': {
      const c = s.contracts.find((x) => x.id === a.contractId);
      if (!c) return { ok: false, error: 'Vertrag nicht gefunden.' };
      return agreePaymentPlan(s, c, a.monthlyAmount);
    }
    case 'terminateArrears': {
      const c = s.contracts.find((x) => x.id === a.contractId);
      if (!c) return { ok: false, error: 'Vertrag nicht gefunden.' };
      return terminateForArrears(s, c);
    }
    case 'mutualTermination': {
      const c = s.contracts.find((x) => x.id === a.contractId);
      if (!c) return { ok: false, error: 'Vertrag nicht gefunden.' };
      if (a.compensation < 0) return { ok: false, error: 'Ungültige Abfindung.' };
      const r = offerMutualTermination(s, c, a.compensation, rng);
      if (!r.ok) return r;
      return { ok: true, message: r.accepted ? 'Der Mieter hat den Aufhebungsvertrag angenommen.' : 'Der Mieter hat das Angebot abgelehnt.' };
    }
    case 'rentIncrease': {
      const c = s.contracts.find((x) => x.id === a.contractId);
      if (!c) return { ok: false, error: 'Vertrag nicht gefunden.' };
      return announceRentIncrease(s, c, a.newRent, a.kind, rng);
    }
    case 'setService': {
      const need = SERVICE_UNLOCK[`${a.key}:${String(a.value)}`];
      if (need && !hasUnlock(s, need)) return { ok: false, error: 'Diese Option ist noch nicht freigeschaltet.' };
      const prev = s.services[a.key];
      if (prev === a.value) return { ok: true };
      (s.services as Record<string, unknown>)[a.key] = a.value;
      log(s, `Dienstleistung geändert: ${a.key} ${String(prev)} → ${String(a.value)}`, 'service');
      return { ok: true };
    }
    case 'takeLoan': {
      const r = takeLoan(s, a.amount, a.years, 'Finanzierung');
      return r.ok ? { ok: true, message: `Kredit über ${formatMoney(r.loan!.principal)} ausgezahlt.` } : r;
    }
    case 'repayLoan':
      return repayLoan(s, a.loanId, a.amount);
    case 'resolveDecision':
      return resolveDecision(s, a.decisionId, a.optionId, rng);
    case 'markRead':
      for (const m of s.messages) if (a.messageId === 'all' || m.id === a.messageId) m.read = true;
      return { ok: true };
    case 'inspectApartment': {
      const apt = s.apartments.find((x) => x.id === a.aptId);
      if (!apt) return { ok: false, error: 'Wohnung nicht gefunden.' };
      if (apt.tenantId) return { ok: false, error: 'Bewohnte Wohnungen werden von den Mietern gemeldet.' };
      const key = `inspect:${apt.id}`;
      if (s.counters[key] && s.day - s.counters[key] < 30) return { ok: false, error: 'Die Wohnung wurde kürzlich besichtigt.' };
      s.counters[key] = s.day;
      let n = 0;
      for (const d of s.defects.filter((x) => x.resolvedDay === null && !x.discovered && x.target.kind === 'apartment' && x.target.apartmentId === apt.id)) {
        discoverDefect(s, d, 'Bei der Wohnungsbesichtigung festgestellt.');
        n++;
      }
      return { ok: true, message: n ? `${n} Mangel/Mängel entdeckt.` : 'Keine weiteren Mängel gefunden.' };
    }
    case 'setSetting':
      (s.settings as Record<string, unknown>)[a.key] = a.value;
      return { ok: true };
    case 'setTutorialStep':
      s.tutorialStep = a.step;
      return { ok: true };
    case 'continueEndless':
      if (!s.gameOver || s.gameOver.kind === 'insolvency') return { ok: false, error: 'Nicht möglich.' };
      s.gameOver = null;
      s.endDay = null;
      s.mode = 'endless';
      s.scenarioId = `${s.scenarioId}:endless`;
      return { ok: true, message: 'Weiter im Endlosmodus.' };
    case 'renameSave':
      s.saveName = a.name.slice(0, 60) || s.saveName;
      return { ok: true };
    case 'setAutomation': {
      const next = AutomationSchema.safeParse({ ...s.automation, ...a.patch });
      if (!next.success) return { ok: false, error: 'Ungültige Automatik-Einstellung.' };
      s.automation = next.data;
      return { ok: true };
    }
    case 'toggleFramework': {
      const c = s.contractors.find((x) => x.id === a.contractorId);
      if (!c) return { ok: false, error: 'Dienstleister nicht gefunden.' };
      const has = s.automation.frameworkContracts.includes(c.id);
      if (!has && c.reliability < 60) return { ok: false, error: `${c.name} ist zu unzuverlässig für einen Rahmenvertrag.` };
      s.automation.frameworkContracts = has ? s.automation.frameworkContracts.filter((x) => x !== c.id) : [...s.automation.frameworkContracts, c.id];
      log(s, has ? `Rahmenvertrag mit ${c.name} gekündigt.` : `Rahmenvertrag mit ${c.name} geschlossen.`, 'service');
      return { ok: true, message: has ? `Rahmenvertrag mit ${c.name} beendet.` : `Rahmenvertrag mit ${c.name}: ${Math.round(CONFIG.costs.frameworkDiscount * 100)} % Rabatt, bevorzugte Termine, ${formatMoney(CONFIG.costs.frameworkContractFee)}/Monat.` };
    }
    case 'repairAll': {
      const r = repairAll(s, { maxSeverityOnly: a.minSeverity });
      if (!r.ok) return { ok: false, error: r.error };
      return { ok: true, message: `${r.count} Aufträge für zusammen ${formatMoney(r.total)} vergeben${r.skipped ? `, ${r.skipped} übersprungen (Liquidität/kein Anbieter)` : ''}.` };
    }
    case 'invest':
      return deposit(s, a.kind, Math.round(a.amount), a.years);
    case 'withdrawInvestment':
      return withdraw(s, a.investmentId, a.amount);
    case 'surveyOffer':
      return surveyOffer(s, a.offerId);
    case 'buyProperty':
      return buyProperty(s, { offerId: a.offerId, price: a.price, loanAmount: a.loanAmount, loanYears: a.loanYears }, rng);
    case 'sellProperty':
      return sellProperty(s, a.buildingId);
    case 'renameProperty':
      s.building.name = a.name.trim().slice(0, 40) || s.building.name;
      return { ok: true };
  }
}
