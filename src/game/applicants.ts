import type { Apartment, Applicant, GameState } from '@/domain/schema';
import { ARCHETYPE_BY_ID } from '@/content/tenants';
import { TEXTS } from '@/content/texts';
import { daysInMonth, formatDate, fromYmd, monthKey, toYmd } from '@/utils/date';
import { allocateCents, formatMoney } from '@/utils/money';
import { clamp } from '@/utils/misc';
import type { Rng } from '@/utils/rng';
import { CONFIG } from './config';
import { apartmentLabel, apartmentQualityFactor, buildingAttractiveness, comparableRent } from './derived';
import { nextId } from './ids';
import { post } from './ledger';
import { addMessage, fill, log } from './messages';
import { planPayment } from './payments';
import { createContract, generatePerson, tenantFromApplicant } from './tenants';

export const maxNewLeaseRent = (s: GameState, a: Apartment) => Math.round((comparableRent(s, a) * (1 + CONFIG.rent.maxNewLeaseOverComparable)) / 100) * 100;

export function listApartment(s: GameState, aptId: string, askingRent: number, utilityPrepayment: number): { ok: boolean; error?: string } {
  const a = s.apartments.find((x) => x.id === aptId);
  if (!a) return { ok: false, error: 'Wohnung nicht gefunden.' };
  if (a.status !== 'vacant_ready') return { ok: false, error: a.status === 'vacant_needs_renovation' ? 'Die Wohnung muss erst renoviert werden.' : 'Die Wohnung ist nicht bezugsfertig.' };
  askingRent = Math.round(askingRent / 100) * 100;
  const max = maxNewLeaseRent(s, a);
  if (askingRent > max) return { ok: false, error: `Höchstens ${formatMoney(max)} zulässig (Vergleichsmiete + 10 %).` };
  if (askingRent < Math.round(comparableRent(s, a) * 0.5)) return { ok: false, error: 'Die Miete ist unrealistisch niedrig.' };
  if (utilityPrepayment < 0) return { ok: false, error: 'Ungültige Nebenkostenvorauszahlung.' };
  const relist = !!a.listing;
  a.listing = { askingRent, utilityPrepayment: Math.round(utilityPrepayment), sinceDay: relist ? a.listing!.sinceDay : s.day, nextApplicantDay: s.day + 1 };
  if (!relist) post(s, { category: 'marketing', amount: -CONFIG.rent.listingCost, purpose: `Wohnungsinserat ${apartmentLabel(a)}`, apartmentId: a.id, ref: { type: 'listing', id: `${a.id}-${s.day}` } });
  log(s, `${apartmentLabel(a)} inseriert für ${formatMoney(askingRent)} kalt.`, 'rent');
  return { ok: true };
}

export function unlistApartment(s: GameState, aptId: string) {
  const a = s.apartments.find((x) => x.id === aptId);
  if (!a || !a.listing) return { ok: false, error: 'Kein aktives Inserat.' };
  a.listing = null;
  s.applicants = s.applicants.filter((x) => x.apartmentId !== aptId);
  return { ok: true };
}

export interface FitResult {
  score: number; // 0–1
  pros: string[];
  cons: string[];
  affordability: number;
}

/** Passung zwischen Bewerber und Wohnung – Vor- und Nachteile für die Entscheidung des Spielers. */
export function applicantFit(s: GameState, ap: Applicant, a: Apartment): FitResult {
  const pros: string[] = [];
  const cons: string[] = [];
  let score = 0.6;
  const rent = a.listing?.askingRent ?? comparableRent(s, a);
  const gross = rent + (a.listing?.utilityPrepayment ?? 0);
  const affordability = gross / Math.max(1, ap.monthlyIncome);
  if (affordability <= 0.3) {
    score += 0.12;
    pros.push(`Miete bei ${Math.round(affordability * 100)} % des Einkommens gut tragbar`);
  } else if (affordability > CONFIG.rent.affordabilityShare) {
    score -= 0.2;
    cons.push(`Miete beansprucht ${Math.round(affordability * 100)} % des Einkommens`);
  }
  if (ap.creditScore >= 80) {
    score += 0.08;
    pros.push(`Sehr gute Bonität (${ap.creditScore})`);
  } else if (ap.creditScore < 50) {
    score -= 0.1;
    cons.push(`Schwache Bonität (${ap.creditScore})`);
  }
  if (ap.householdSize > a.rooms + 1) {
    score -= 0.15;
    cons.push(`${ap.householdSize} Personen für ${a.rooms} Zimmer – eng`);
  } else if (ap.householdSize <= a.rooms) pros.push('Wohnungsgröße passt zum Haushalt');
  for (const n of ap.needs) {
    if (n === 'balcony') (a.balcony ? pros : cons).push(a.balcony ? 'Wünscht Balkon – vorhanden' : 'Wünscht Balkon – fehlt');
    if (n === 'modern') (a.kitchen + a.bath >= 5 ? pros : cons).push(a.kitchen + a.bath >= 5 ? 'Legt Wert auf moderne Ausstattung – erfüllt' : 'Erwartet moderne Ausstattung – nicht erfüllt');
    if (n === 'quiet' && a.floor === s.building.floors - 1) pros.push('Sucht Ruhe – oberste Etage ideal');
    if (n === 'garden') (s.building.amenities.includes('garden') ? pros : cons).push(s.building.amenities.includes('garden') ? 'Freut sich über den Garten' : 'Vermisst einen gepflegten Garten');
    if (n === 'bike_storage') (s.building.amenities.includes('bike_storage') ? pros : cons).push(s.building.amenities.includes('bike_storage') ? 'Fahrradstellplatz vorhanden' : 'Kein Fahrradstellplatz');
  }
  if (ap.pets) cons.push('Hat Haustiere (etwas mehr Abnutzung)');
  if (ap.traits.diy > 75) pros.push('Erledigt Kleinreparaturen gern selbst');
  if (ap.traits.communicativeness > 85) pros.push('Meldet Schäden früh (kann aber anstrengend sein)');
  if (ap.traits.tidiness > 75) pros.push('Sehr ordentlich');
  if (ap.traits.tidiness < 35) cons.push('Eher unordentlich');
  if (ap.expectedStayYears >= 6) pros.push(`Plant langfristig (~${Math.round(ap.expectedStayYears)} Jahre)`);
  if (ap.expectedStayYears < 3) cons.push(`Voraussichtlich nur ~${Math.round(ap.expectedStayYears)} Jahre`);
  if (ap.referredBy) pros.push('Empfohlen von einem Mieter');
  const unmet = cons.length - pros.length;
  score -= unmet * 0.02;
  return { score: clamp(score, 0, 1), pros, cons, affordability };
}

export function generateApplicant(s: GameState, a: Apartment, rng: Rng, referredBy: string | null = null): Applicant {
  const p = generatePerson(rng, { apt: a });
  const comp = comparableRent(s, a);
  const arch = ARCHETYPE_BY_ID[p.archetype];
  const archMult = arch.id === 'demanding' || arch.id === 'busy_professional' ? 1.1 : arch.id === 'student' || arch.id === 'temp_financial' ? 0.88 : 1;
  const willingness = Math.round(comp * rng.range(0.92, 1.16) * archMult);
  const affordable = Math.round(p.monthlyIncome * CONFIG.rent.affordabilityShare) - (a.listing?.utilityPrepayment ?? 0);
  const reliability = referredBy ? clamp(p.paymentReliability + 10, 0, 99) : p.paymentReliability;
  return {
    id: nextId(s, 'a'),
    apartmentId: a.id,
    name: p.name,
    archetype: p.archetype,
    householdSize: p.householdSize,
    occupation: p.occupation,
    monthlyIncome: p.monthlyIncome,
    creditScore: referredBy ? clamp(p.creditScore + 8, 0, 99) : p.creditScore,
    pets: p.pets,
    maxRent: Math.max(Math.round(comp * 0.7), Math.min(willingness, affordable)),
    desiredMoveInDays: rng.int(0, 30),
    expectedStayYears: p.expectedStayYears,
    needs: p.needs,
    traits: p.traits,
    paymentReliability: reliability,
    energyFactor: p.energyFactor,
    arrivedDay: s.day,
    expiresDay: s.day + CONFIG.applicants.validityDays,
    referredBy,
    declined: false,
  };
}

export function updateApplicants(s: GameState, rng: Rng) {
  s.applicants = s.applicants.filter((ap) => ap.expiresDay >= s.day && !ap.declined);
  for (const a of s.apartments) {
    if (!a.listing || a.status !== 'vacant_ready') continue;
    const waiting = s.applicants.filter((x) => x.apartmentId === a.id).length;
    if (waiting >= CONFIG.applicants.maxWaiting) continue;
    const comp = comparableRent(s, a);
    const priceFactor = Math.exp(-(a.listing.askingRent / comp - 0.95) * 5);
    const quality = apartmentQualityFactor(s, a);
    const fresh = a.lastRenovationDay !== null && s.day - a.lastRenovationDay < 60 ? 1.5 : 1;
    const attr = 0.75 + buildingAttractiveness(s) / 200;
    const rate = CONFIG.applicants.baseRatePerDay * s.market.demandIndex * CONFIG.difficulty[s.settings.difficulty].applicantFactor * priceFactor * quality * fresh * attr;
    if (rng.chance(Math.min(0.9, rate))) {
      s.applicants.push(generateApplicant(s, a, rng));
      if (waiting === 0) addMessage(s, { category: 'tenant', title: `Neue Bewerbung für ${apartmentLabel(a)}`, text: 'Es liegt eine neue Bewerbung vor. Vergleichen Sie die Interessenten und bieten Sie einen Mietvertrag an.', apartmentId: a.id, link: { page: 'apartments', id: a.id } });
    }
    // Empfehlung zufriedener Mieter
    const referrer = s.tenants.find((t) => t.status === 'active' && t.satisfaction > 78 && !t.referralGiven);
    if (referrer && rng.chance(0.012)) {
      referrer.referralGiven = true;
      s.applicants.push(generateApplicant(s, a, rng, referrer.id));
      s.counters.referrals = (s.counters.referrals ?? 0) + 1;
      addMessage(s, { category: 'tenant', severity: 'success', title: `Empfehlung von ${referrer.name}`, text: fill(rng.pick(TEXTS.referral), {}), tenantId: referrer.id, apartmentId: a.id, link: { page: 'apartments', id: a.id } });
    }
    const listedDays = s.day - a.listing.sinceDay;
    if (listedDays > 0 && listedDays % 45 === 0 && waiting === 0)
      addMessage(s, { category: 'system', severity: 'warning', title: `${apartmentLabel(a)} findet keine Interessenten`, text: `Seit ${listedDays} Tagen inseriert. Angebotsmiete ${formatMoney(a.listing.askingRent)} bei Vergleichsmiete ${formatMoney(comp)}. Eine niedrigere Miete oder Renovierung erhöht die Nachfrage.`, apartmentId: a.id, link: { page: 'apartments', id: a.id } });
  }
}

/** Mietvertrag anbieten. Der Bewerber entscheidet anhand seiner Zahlungsbereitschaft und Passung. */
export function offerLease(s: GameState, applicantId: string, netRent: number, utilityPrepayment: number, rng: Rng): { ok: boolean; accepted?: boolean; error?: string; tenantId?: string } {
  const ap = s.applicants.find((x) => x.id === applicantId);
  if (!ap || ap.declined) return { ok: false, error: 'Bewerbung nicht mehr verfügbar.' };
  const a = s.apartments.find((x) => x.id === ap.apartmentId);
  if (!a || a.status !== 'vacant_ready' || a.tenantId) return { ok: false, error: 'Die Wohnung ist nicht mehr verfügbar.' };
  netRent = Math.round(netRent / 100) * 100;
  const max = maxNewLeaseRent(s, a);
  if (netRent > max) return { ok: false, error: `Höchstens ${formatMoney(max)} zulässig (Vergleichsmiete + 10 %).` };
  if (netRent <= 0 || utilityPrepayment < 0) return { ok: false, error: 'Ungültige Konditionen.' };
  const fit = applicantFit(s, ap, a);
  const pAccept = netRent <= ap.maxRent ? 0.7 + fit.score * 0.3 : Math.max(0, 0.35 - ((netRent - ap.maxRent) / ap.maxRent) * 4);
  if (!rng.chance(pAccept)) {
    ap.declined = true;
    addMessage(s, { category: 'tenant', severity: 'warning', title: `${ap.name} lehnt ab`, text: netRent > ap.maxRent ? `Die Miete von ${formatMoney(netRent)} übersteigt das Budget.` : 'Nach der Besichtigung hat sich der Interessent für eine andere Wohnung entschieden.', apartmentId: a.id });
    return { ok: true, accepted: false };
  }
  const t = tenantFromApplicant(s, ap, a);
  const c = createContract(s, a, t, netRent, Math.round(utilityPrepayment), s.day);
  // Anteilige Miete für den Einzugsmonat
  const { year, month, day } = toYmd(s.day);
  const dim = daysInMonth(year, month);
  if (day > 1) {
    const share = (dim - day + 1) / dim;
    const gross = Math.round((netRent + c.utilityPrepayment) * share);
    const [np, up] = allocateCents(gross, [netRent, c.utilityPrepayment]);
    const claim = {
      id: nextId(s, 'f'),
      kind: 'rent' as const,
      contractId: c.id,
      tenantId: t.id,
      apartmentId: a.id,
      period: monthKey(s.day),
      createdDay: s.day,
      dueDay: Math.min(s.day + 7, fromYmd(year, month, dim)),
      netRent: np,
      utilities: up,
      amount: gross,
      paid: 0,
      status: 'open' as const,
      dunningLevel: 0,
      lastDunningDay: null,
      payments: [],
      plannedPayDay: null,
      plannedFraction: 1,
      note: `Anteilige Miete ab ${formatDate(s.day)}`,
    };
    planPayment(s, claim, t, rng);
    s.claims.push(claim);
  }
  s.applicants = s.applicants.filter((x) => x.apartmentId !== a.id);
  s.counters.newLeases = (s.counters.newLeases ?? 0) + 1;
  addMessage(s, { category: 'tenant', severity: 'success', title: `Neuer Mieter: ${t.name}`, text: `${t.name} (${t.occupation}, ${t.householdSize} Pers.) zieht in ${apartmentLabel(a)} ein. Miete ${formatMoney(netRent)} kalt + ${formatMoney(c.utilityPrepayment)} NK.`, tenantId: t.id, apartmentId: a.id, link: { page: 'tenants', id: t.id } });
  log(s, `Mietvertrag ${apartmentLabel(a)} mit ${t.name} geschlossen (${formatMoney(netRent)}).`, 'rent');
  return { ok: true, accepted: true, tenantId: t.id };
}
