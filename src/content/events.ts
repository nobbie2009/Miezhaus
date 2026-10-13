import type { Decision, GameState, Tenant } from '@/domain/schema';
import { CONTRACTOR_TEMPLATES } from './contractors';
import { MEASURE_BY_ID } from './measures';
import { createDefect, discoverDefect } from '@/game/defects';
import { addMood, contractOfTenant } from '@/game/tenants';
import { post } from '@/game/ledger';
import { addMessage } from '@/game/messages';
import { makeDecision } from '@/game/decisions';
import { takeLoan } from '@/game/finance';
import { agreePaymentPlan } from '@/game/contracts';
import { contractArrears } from '@/game/payments';
import { apartmentLabel, avgSatisfaction, energyClassIndex, marketValue, materialIndex } from '@/game/derived';
import { forecastMeasure } from '@/game/forecast';
import { nextId } from '@/game/ids';
import { temperature } from '@/game/weather';
import { CONFIG } from '@/game/config';
import { formatMoney, mulCents } from '@/utils/money';
import { seasonOf, toYmd } from '@/utils/date';
import { clamp } from '@/utils/misc';
import type { Rng } from '@/utils/rng';
import { computeScore } from '@/game/score';

/**
 * Ereignisse mit klaren Auslösern. `chance` liefert die Tageswahrscheinlichkeit
 * anhand des aktuellen Spielzustands (0 = Voraussetzungen nicht erfüllt).
 */
export interface EventDef {
  id: string;
  title: string;
  category: 'weather' | 'building' | 'finance' | 'tenant' | 'market' | 'contractor' | 'community';
  cooldownDays: number;
  /** Unabhängig von der eingestellten Ereignishäufigkeit (z. B. Folge eines Zustands). */
  stateDriven?: boolean;
  chance: (s: GameState) => number;
  fire: (s: GameState, rng: Rng) => boolean;
  resolve?: (s: GameState, d: Decision, optionId: string, rng: Rng) => string;
}

const active = (s: GameState) => s.tenants.filter((t) => t.status === 'active' && t.apartmentId);
const aptOf = (s: GameState, t: Tenant) => s.apartments.find((a) => a.id === t.apartmentId)!;
const tenantById = (s: GameState, id: unknown) => s.tenants.find((t) => t.id === id);
const comp = (s: GameState, k: keyof GameState['building']['components']) => s.building.components[k]!;

const STORM_NAMES = ['Xaver', 'Ylenia', 'Zeynep', 'Antonia', 'Bruno', 'Carmen', 'Dieter', 'Elke', 'Friedhelm', 'Gisela', 'Hartmut', 'Ilse'];

export const EVENTS: EventDef[] = [
  {
    id: 'storm',
    title: 'Sturm',
    category: 'weather',
    cooldownDays: 25,
    chance: (s) => ({ winter: 0.006, autumn: 0.007, spring: 0.0025, summer: 0.0015 })[seasonOf(s.day)],
    fire: (s, rng) => {
      const roof = comp(s, 'roof').condition;
      const name = rng.pick(STORM_NAMES);
      const results: string[] = [];
      if (rng.chance(((100 - roof) / 100) * 1.3)) {
        const d = createDefect(s, roof < 40 ? 'roof_leak' : 'roof_tiles', { kind: 'component', key: 'roof' }, { cause: `Ursache: Sturmtief „${name}“ bei Dachzustand ${Math.round(roof)} %.`, silent: true, rng });
        if (d) {
          s.counters[`insured:${d.id}`] = 1;
          results.push(roof < 40 ? 'Das Dach ist undicht geworden.' : 'Mehrere Dachziegel haben sich gelöst.');
        }
      } else results.push(`Das Dach (Zustand ${Math.round(roof)} %) hat standgehalten.`);
      if (rng.chance(0.5)) {
        const d = createDefect(s, 'storm_debris', { kind: 'component', key: 'outdoor' }, { cause: `Ursache: Sturmtief „${name}“.`, silent: true });
        if (d) results.push('Im Hof liegen abgebrochene Äste und umgestürzte Tonnen.');
      }
      addMessage(s, { category: 'event', severity: results.length > 1 ? 'warning' : 'info', title: `Sturmtief „${name}“`, text: `Orkanböen über der Stadt. ${results.join(' ')}${s.services.insurance !== 'none' ? ' Sturmschäden sind über die Gebäudeversicherung abgedeckt (abzgl. Selbstbeteiligung).' : ' Ohne Gebäudeversicherung tragen Sie die Kosten selbst.'}`, link: { page: 'repairs', id: null } });
      return true;
    },
  },
  {
    id: 'heavy_rain',
    title: 'Starkregen',
    category: 'weather',
    cooldownDays: 30,
    chance: (s) => ({ winter: 0.0005, autumn: 0.002, spring: 0.003, summer: 0.005 })[seasonOf(s.day)],
    fire: (s, rng) => {
      const res: string[] = [];
      const base = comp(s, 'basement').condition;
      const san = comp(s, 'sanitary').condition;
      if (base < 60 && rng.chance((60 - base) / 60 + 0.2)) {
        if (createDefect(s, 'basement_moisture', { kind: 'component', key: 'basement' }, { cause: `Ursache: Starkregen bei Kellerzustand ${Math.round(base)} %.`, silent: true })) res.push('Im Keller steht Feuchtigkeit an den Wänden.');
      }
      if (san < 45 && rng.chance(0.5)) {
        if (createDefect(s, 'sanitary_backflow', { kind: 'component', key: 'sanitary' }, { cause: `Ursache: Überlastete Kanalisation bei Sanitärzustand ${Math.round(san)} %.`, silent: true })) res.push('Die Abwasserleitung hat einen Rückstau.');
      }
      const cracks = s.defects.find((d) => d.resolvedDay === null && d.type === 'facade_cracks' && d.escalateAtDay !== null);
      if (cracks && cracks.escalateAtDay !== null) {
        cracks.escalateAtDay = Math.max(s.day + 1, cracks.escalateAtDay - 30);
        res.push('Der Regen dringt in die Putzrisse ein – der Schaden verschlimmert sich schneller.');
      }
      addMessage(s, { category: 'event', severity: res.length ? 'warning' : 'info', title: 'Starkregen', text: `Ein Unwetter mit Starkregen. ${res.length ? res.join(' ') : 'Keller und Leitungen haben dem Wasser standgehalten.'}` });
      return true;
    },
  },
  {
    id: 'frost',
    title: 'Frostperiode',
    category: 'weather',
    cooldownDays: 20,
    stateDriven: true,
    chance: (s) => (temperature(s.day, s.seed) < -5 ? 0.35 : 0),
    fire: (s, rng) => {
      const res: string[] = [];
      const pipes = comp(s, 'pipes').condition;
      const heat = comp(s, 'heating').condition;
      if (pipes < 45 && rng.chance(((45 - pipes) / 45) * 0.6)) {
        if (createDefect(s, 'pipe_burst', { kind: 'component', key: 'pipes' }, { cause: `Ursache: Frost bei Leitungszustand ${Math.round(pipes)} %.`, silent: true, rng })) res.push('Eine Wasserleitung ist geplatzt!');
      }
      if (heat < 50 && rng.chance(((50 - heat) / 50) * 0.7)) {
        if (createDefect(s, heat < 30 ? 'heating_failure' : 'heating_fault', { kind: 'component', key: 'heating' }, { cause: `Ursache: Volllastbetrieb bei Frost, Anlagenzustand ${Math.round(heat)} %.`, silent: true })) res.push(heat < 30 ? 'Die Heizung ist ausgefallen!' : 'Die Heizung meldet Störungen.');
      }
      if (s.services.winterService === false && s.services.caretaker === 'none') {
        for (const t of active(s)) addMood(t, s.day, 'Glatte Gehwege', -2, 10);
        res.push('Ohne Winterdienst sind die Wege vereist – die Mieter ärgern sich.');
      }
      addMessage(s, { category: 'event', severity: res.length ? 'danger' : 'info', title: `Frost: ${temperature(s.day, s.seed).toLocaleString('de-DE')} °C`, text: `Strenger Frost. ${res.length ? res.join(' ') : 'Leitungen und Heizung laufen stabil.'}`, important: res.length > 0, link: { page: 'repairs', id: null } });
      return true;
    },
  },
  {
    id: 'heatwave',
    title: 'Hitzewelle',
    category: 'weather',
    cooldownDays: 30,
    stateDriven: true,
    chance: (s) => (temperature(s.day, s.seed) > 22.5 ? 0.3 : 0),
    fire: (s) => {
      const top = s.building.floors - 1;
      const protectedRoof = s.building.insulationLevel >= 1 || s.building.amenities.includes('greening');
      let n = 0;
      if (!protectedRoof)
        for (const t of active(s))
          if (aptOf(s, t).floor === top) {
            addMood(t, s.day, 'Hitze unterm Dach', -5, 20);
            n++;
          }
      if (s.services.garden === 'none') s.building.outdoorCare = clamp(s.building.outdoorCare - 10);
      addMessage(s, { category: 'event', title: 'Hitzewelle', text: protectedRoof ? 'Tagelang über 30 °C – dank gedämmtem Dach bzw. Begrünung bleibt es im Haus erträglich.' : `Tagelang über 30 °C. ${n} Haushalt(e) im Dachgeschoss leiden unter der Hitze – ein gedämmtes Dach würde helfen.` });
      return true;
    },
  },
  {
    id: 'energy_price_shock',
    title: 'Energiepreise steigen',
    category: 'market',
    cooldownDays: 900,
    chance: (s) => (s.day - s.startDay > 120 ? 0.0007 : 0),
    fire: (s) => {
      makeDecision(s, 'energy_price_shock', {
        title: 'Energieversorger kündigt Preiserhöhung an',
        text: `Wegen der angespannten Lage an den Energiemärkten steigen die Preise für Heizenergie und Strom ab sofort um etwa 30 % für voraussichtlich ein Jahr. Ihr Versorger bietet alternativ einen Festpreisvertrag über zwei Jahre mit +12 % an. Aktueller Energiepreisindex: ${s.market.energyPriceIndex.toFixed(2)}.`,
        options: [
          { id: 'fixed', label: 'Festpreis für 2 Jahre (+12 %)', description: 'Planbar, aber auch im zweiten Jahr teurer.' },
          { id: 'market', label: 'Marktpreis behalten (+30 % für 1 Jahr)', description: 'Riskanter, danach normalisieren sich die Preise vermutlich.' },
        ],
        defaultOptionId: 'market',
        severity: 'warning',
      });
      return true;
    },
    resolve: (s, _d, opt) => {
      if (opt === 'fixed') {
        s.market.modifiers.push({ id: nextId(s, 'mm'), kind: 'energy', value: 1.12, untilDay: s.day + 730, label: 'Festpreisvertrag Energie' });
        return 'Festpreisvertrag abgeschlossen: Energie +12 % für zwei Jahre.';
      }
      s.market.modifiers.push({ id: nextId(s, 'mm'), kind: 'energy', value: 1.3, untilDay: s.day + 365, label: 'Energiepreisschock' });
      for (const t of active(s)) addMood(t, s.day, 'Steigende Energiepreise', -Math.round(2 + t.traits.frugality / 30), 120);
      return 'Energiepreise steigen um 30 % für etwa ein Jahr. Die Mieter sorgen sich um ihre Nebenkosten.';
    },
  },
  {
    id: 'material_price_rise',
    title: 'Baupreise steigen',
    category: 'market',
    cooldownDays: 300,
    chance: () => 0.0012,
    fire: (s, rng) => {
      const pct = rng.int(8, 18);
      s.market.modifiers.push({ id: nextId(s, 'mm'), kind: 'material', value: 1 + pct / 100, untilDay: s.day + 240, label: `Materialengpass (+${pct} %)` });
      addMessage(s, { category: 'event', severity: 'warning', title: `Materialpreise +${pct} %`, text: `Lieferengpässe treiben die Baupreise für etwa acht Monate. Neue Angebote werden teurer – bereits beauftragte Arbeiten sind nicht betroffen.` });
      return true;
    },
  },
  {
    id: 'new_contractor',
    title: 'Neuer Dienstleister',
    category: 'contractor',
    cooldownDays: 200,
    chance: (s) => (CONTRACTOR_TEMPLATES.some((t) => t.hidden && !s.contractors.some((c) => c.name === t.name)) ? 0.0016 : 0),
    fire: (s, rng) => {
      const tpl = rng.pick(CONTRACTOR_TEMPLATES.filter((t) => t.hidden && !s.contractors.some((c) => c.name === t.name)));
      s.contractors.push({ id: nextId(s, 'c'), name: tpl.name, trade: tpl.trade, priceFactor: tpl.priceFactor, quality: tpl.quality, reliability: tpl.reliability, waitDays: tpl.waitDays, jobsDone: 0, available: true, busyUntil: 0, description: tpl.description });
      addMessage(s, { category: 'contractor', severity: 'success', title: `Neu verfügbar: ${tpl.name}`, text: `${tpl.description} Qualität ${tpl.quality}/5, Zuverlässigkeit ${tpl.reliability} %. Der Betrieb nimmt ab sofort Aufträge an.`, link: { page: 'staff', id: null } });
      return true;
    },
  },
  {
    id: 'subsidy_program',
    title: 'Förderprogramm',
    category: 'finance',
    cooldownDays: 500,
    chance: (s) => (s.phase >= 2 ? 0.0013 : 0),
    fire: (s, rng) => {
      const rate = rng.pick([0.15, 0.2, 0.25]);
      s.market.modifiers.push({ id: nextId(s, 'mm'), kind: 'subsidy_energy', value: rate, untilDay: s.day + 150, label: `Förderprogramm Energie (${Math.round(rate * 100)} %)` });
      addMessage(s, { category: 'event', severity: 'success', title: `Förderprogramm: ${Math.round(rate * 100)} % Zuschuss`, text: 'Für 150 Tage werden energetische Maßnahmen (Dämmung, Fenster, Heizung, Abgleich, PV …) mit einem Zuschuss gefördert. Der Zuschuss wird nach Abschluss ausgezahlt. Spielmechanik – keine reale Förderauskunft.', important: true, link: { page: 'renovation', id: null } });
      return true;
    },
  },
  {
    id: 'energy_audit',
    title: 'Energieberatung',
    category: 'building',
    cooldownDays: 365,
    chance: (s) => (s.phase >= 2 && energyClassIndex(s) >= 4 && !s.counters.auditDay ? 0.0018 : 0),
    fire: (s) => {
      const cost = mulCents(89000, materialIndex(s));
      makeDecision(s, 'energy_audit', {
        title: 'Energieberater bietet Gebäudecheck an',
        text: `Ein zertifizierter Energieberater bietet eine Vor-Ort-Analyse an (${formatMoney(cost)}). Er prüft Hülle und Anlage, findet versteckte Mängel und erstellt einen Sanierungsfahrplan mit konkreten Einsparpotenzialen.`,
        options: [
          { id: 'yes', label: `Beauftragen (${formatMoney(cost)})`, description: 'Versteckte Mängel an Heizung, Fenstern, Dach und Fassade werden sichtbar.', costHint: cost },
          { id: 'no', label: 'Ablehnen', description: 'Kein Kostenaufwand.' },
        ],
        context: { cost },
        defaultOptionId: 'no',
      });
      return true;
    },
    resolve: (s, d, opt) => {
      if (opt !== 'yes') return 'Energieberatung abgelehnt.';
      post(s, { category: 'administration', amount: -Number(d.context.cost), purpose: 'Energieberatung / Sanierungsfahrplan', ref: { type: 'event', id: d.id } });
      s.counters.auditDay = s.day;
      let found = 0;
      for (const def of s.defects.filter((x) => x.resolvedDay === null && !x.discovered && x.target.kind === 'component' && ['heating', 'windows', 'roof', 'facade'].includes(x.target.key))) {
        discoverDefect(s, def, 'Bei der Energieberatung entdeckt.');
        found++;
      }
      const ids = ['hydraulic_balance', 'windows_replace', 'roof_renovation', 'facade_insulation', 'heating_condensing', 'heating_heatpump', 'efficient_pumps', 'led_lighting'];
      const res = ids
        .map((id) => ({ id, f: forecastMeasure(s, { kind: 'measure', measureId: id }) }))
        .filter((x): x is { id: string; f: Exclude<ReturnType<typeof forecastMeasure>, { error: string }> } => !('error' in x.f))
        .sort((a, b) => b.f.annualEnergySaving / Math.max(1, b.f.costEstimate) - a.f.annualEnergySaving / Math.max(1, a.f.costEstimate))
        .slice(0, 3);
      const lines = res.map((x) => `${MEASURE_BY_ID[x.id].label}: ca. ${formatMoney(x.f.annualEnergySaving, { decimals: false })}/Jahr bei ${formatMoney(x.f.costEstimate, { decimals: false })}`);
      addMessage(s, { category: 'building', severity: 'info', title: 'Sanierungsfahrplan liegt vor', text: `${found} versteckte Mängel entdeckt. Wirtschaftlichste Maßnahmen: ${lines.join('; ')}.`, important: true, link: { page: 'energy', id: null } });
      return `Energieberatung durchgeführt – ${found} Mängel entdeckt.`;
    },
  },
  {
    id: 'neighbor_conflict',
    title: 'Nachbarschaftsstreit',
    category: 'tenant',
    cooldownDays: 110,
    chance: (s) => (conflictPair(s) ? (s.building.amenities.includes('community_room') ? 0.0015 : 0.003) : 0),
    fire: (s) => {
      const pair = conflictPair(s);
      if (!pair) return false;
      const [a, b] = pair;
      const reason = b.pets ? 'Hundegebell und Tierhaare im Treppenhaus' : b.householdSize >= 3 ? 'Kinderlärm und Getrampel zu Ruhezeiten' : 'Unordnung im Treppenhaus und laute Musik';
      makeDecision(s, 'neighbor_conflict', {
        title: `Streit zwischen ${a.name} und ${b.name}`,
        text: `${a.name} (${apartmentLabel(aptOf(s, a))}) beschwert sich über ${b.name} (${apartmentLabel(aptOf(s, b))}): ${reason}. Beide erwarten, dass Sie als Vermieter eingreifen.`,
        options: [
          { id: 'mediate', label: 'Professionelle Mediation (250 €)', description: 'Hohe Erfolgschance, kostet Geld.', costHint: 25000 },
          { id: 'talk', label: 'Selbst vermitteln', description: 'Kostenlos, Erfolg hängt vom Gemeinschaftssinn ab.' },
          { id: 'ignore', label: 'Nicht einmischen', description: 'Beide werden unzufriedener.' },
        ],
        context: { a: a.id, b: b.id },
        defaultOptionId: 'ignore',
        severity: 'warning',
      });
      return true;
    },
    resolve: (s, d, opt, rng) => {
      const a = tenantById(s, d.context.a);
      const b = tenantById(s, d.context.b);
      if (!a || !b) return 'Der Streit hat sich erledigt.';
      const community = (a.traits.community + b.traits.community) / 200 + (s.building.amenities.includes('community_room') ? 0.15 : 0);
      if (opt === 'mediate') {
        post(s, { category: 'legal', amount: -25000, purpose: 'Mediation Nachbarschaftsstreit', ref: { type: 'event', id: d.id } });
        if (rng.chance(0.55 + community * 0.35)) {
          addMood(a, s.day, 'Streit geschlichtet', 4, 90);
          addMood(b, s.day, 'Streit geschlichtet', 4, 90);
          return 'Die Mediation war erfolgreich – beide Parteien haben sich geeinigt.';
        }
        addMood(a, s.day, 'Nachbarschaftsstreit', -3, 60);
        addMood(b, s.day, 'Nachbarschaftsstreit', -3, 60);
        return 'Trotz Mediation bleibt die Stimmung angespannt.';
      }
      if (opt === 'talk') {
        if (rng.chance(0.3 + community * 0.4)) {
          addMood(a, s.day, 'Streit geschlichtet', 3, 90);
          addMood(b, s.day, 'Streit geschlichtet', 3, 90);
          return 'Ihr Gespräch hat geholfen. Die beiden grüßen sich wieder.';
        }
        addMood(a, s.day, 'Nachbarschaftsstreit', -5, 75);
        addMood(b, s.day, 'Nachbarschaftsstreit', -5, 75);
        return 'Das Gespräch ist eskaliert. Beide fühlen sich ungerecht behandelt.';
      }
      addMood(a, s.day, 'Nachbarschaftsstreit', -7, 90);
      addMood(b, s.day, 'Nachbarschaftsstreit', -5, 90);
      return 'Sie halten sich heraus. Der Streit schwelt weiter.';
    },
  },
  {
    id: 'community_party',
    title: 'Hoffest',
    category: 'community',
    cooldownDays: 240,
    chance: (s) => {
      const season = seasonOf(s.day);
      if (season !== 'summer' && season !== 'spring') return 0;
      const ts = active(s);
      const comm = ts.length ? ts.reduce((a, t) => a + t.traits.community, 0) / ts.length : 0;
      return comm > 55 || s.building.amenities.includes('community_room') ? 0.006 : 0;
    },
    fire: (s) => {
      const organizer = active(s).sort((a, b) => b.traits.community - a.traits.community)[0];
      if (!organizer) return false;
      makeDecision(s, 'community_party', {
        title: `${organizer.name} plant ein Hoffest`,
        text: `${organizer.name} möchte ein Sommerfest für alle Hausbewohner organisieren und fragt, ob Sie sich mit 300 € für Getränke und Grill beteiligen.`,
        options: [
          { id: 'sponsor', label: 'Fest unterstützen (300 €)', description: 'Stärkt die Gemeinschaft im ganzen Haus.', costHint: 30000 },
          { id: 'no', label: 'Freundlich absagen', description: 'Das Fest findet kleiner statt.' },
        ],
        context: { organizer: organizer.id },
        defaultOptionId: 'no',
      });
      return true;
    },
    resolve: (s, d, opt) => {
      if (opt === 'sponsor') {
        post(s, { category: 'other_expense', amount: -30000, purpose: 'Zuschuss Hoffest', ref: { type: 'event', id: d.id } });
        for (const t of active(s)) addMood(t, s.day, 'Gelungenes Hoffest', Math.round(2 + t.traits.community / 25), 100);
        s.building.cleanliness = clamp(s.building.cleanliness - 8);
        s.counters.parties = (s.counters.parties ?? 0) + 1;
        return 'Das Hoffest war ein voller Erfolg. Die Nachbarschaft ist enger zusammengerückt.';
      }
      for (const t of active(s)) if (t.traits.community > 60) addMood(t, s.day, 'Kleines Hoffest', 1, 60);
      return 'Ein paar Nachbarn feiern trotzdem zusammen.';
    },
  },
  {
    id: 'tenant_job_loss',
    title: 'Finanzielle Notlage',
    category: 'tenant',
    cooldownDays: 70,
    chance: (s) => active(s).filter((t) => t.financialStress < 50).length * 0.00022,
    fire: (s, rng) => {
      const cands = active(s).filter((t) => t.financialStress < 50);
      if (!cands.length) return false;
      const t = rng.pick(cands);
      const cause = rng.pick(['hat überraschend die Arbeitsstelle verloren', 'ist länger erkrankt und erhält nur Krankengeld', 'musste ein Geschäft aufgeben', 'hat hohe unerwartete Ausgaben in der Familie']);
      t.financialStress = clamp(t.financialStress + rng.int(40, 60));
      makeDecision(s, 'tenant_job_loss', {
        title: `${t.name} gerät in finanzielle Not`,
        text: `${t.name} (${apartmentLabel(aptOf(s, t))}) ${cause} und bittet um Verständnis, falls die Miete in den nächsten Monaten nicht immer vollständig kommt.`,
        options: [
          { id: 'support', label: 'Entgegenkommen signalisieren', description: 'Senkt den Druck. Rückstände werden später per Ratenzahlung beglichen.' },
          { id: 'strict', label: 'Auf pünktlicher Zahlung bestehen', description: 'Klare Ansage – belastet das Verhältnis.' },
        ],
        context: { tenant: t.id },
        defaultOptionId: 'strict',
        severity: 'warning',
      });
      return true;
    },
    resolve: (s, d, opt) => {
      const t = tenantById(s, d.context.tenant);
      if (!t || t.status === 'former') return 'Die Situation hat sich erledigt.';
      if (opt === 'support') {
        t.financialStress = clamp(t.financialStress - 15);
        addMood(t, s.day, 'Verständnisvoller Vermieter', 8, 180);
        const c = contractOfTenant(s, t);
        if (c) {
          c.specialTerms.push('Entgegenkommen bei finanzieller Notlage zugesagt');
          const arrears = contractArrears(s, c);
          if (arrears > 0) agreePaymentPlan(s, c, Math.max(Math.ceil(arrears / 6), 5000));
        }
        return `${t.name} ist sehr dankbar. Die Zahlungen werden voraussichtlich unregelmäßig, aber zuverlässig nachgeholt.`;
      }
      addMood(t, s.day, 'Harte Haltung des Vermieters', -6, 150);
      t.paymentReliability = clamp(t.paymentReliability + 4);
      return `${t.name} wird sich bemühen, pünktlich zu zahlen – das Verhältnis ist aber belastet.`;
    },
  },
  {
    id: 'fire_inspection',
    title: 'Brandschau',
    category: 'building',
    cooldownDays: 365,
    chance: (s) => (s.building.fireSafety < 55 && !s.counters.fireDeadline ? 0.0012 : 0),
    stateDriven: true,
    fire: (s) => {
      const m = MEASURE_BY_ID.fire_safety;
      const cost = mulCents(m.baseCost(s), materialIndex(s));
      makeDecision(s, 'fire_inspection', {
        title: 'Brandschutz-Begehung: Mängel festgestellt',
        text: `Bei einer Begehung wurde unzureichender Brandschutz festgestellt (Brandschutz ${Math.round(s.building.fireSafety)} %). Rauchwarnmelder und Feuerlöscher müssen innerhalb von 60 Tagen nachgerüstet werden, sonst droht ein Bußgeld von 1.500 €.`,
        options: [
          { id: 'now', label: `Sofort nachrüsten (${formatMoney(cost)})`, description: 'Brandschutz +35, Sicherheit für alle.', costHint: cost },
          { id: 'later', label: 'Frist nutzen (selbst beauftragen)', description: 'Bis zur Frist über „Renovierung → Brandschutz nachrüsten“ beauftragen.' },
        ],
        context: { cost },
        defaultOptionId: 'later',
        severity: 'warning',
      });
      return true;
    },
    resolve: (s, d, opt) => {
      if (opt === 'now') {
        post(s, { category: 'modernization', amount: -Number(d.context.cost), purpose: 'Brandschutz nachgerüstet (Sofortmaßnahme)', ref: { type: 'event', id: d.id } });
        MEASURE_BY_ID.fire_safety.apply(s);
        return 'Brandschutz nachgerüstet.';
      }
      s.counters.fireDeadline = s.day + 60;
      return 'Frist läuft: Brandschutz innerhalb von 60 Tagen auf mindestens 55 % bringen.';
    },
  },
  {
    id: 'kitchen_request',
    title: 'Modernisierungswunsch',
    category: 'tenant',
    cooldownDays: 200,
    chance: (s) => (active(s).some((t) => t.traits.renovationDemands > 70 && aptOf(s, t).kitchen <= 1 && t.satisfaction > 35) ? 0.002 : 0),
    fire: (s) => {
      const t = active(s).find((x) => x.traits.renovationDemands > 70 && aptOf(s, x).kitchen <= 1 && x.satisfaction > 35);
      if (!t) return false;
      const a = aptOf(s, t);
      const m = MEASURE_BY_ID.apt_kitchen;
      const cost = mulCents(m.baseCost(s, a), materialIndex(s));
      const surcharge = Math.round((cost * 0.08) / 12 / 100) * 100;
      makeDecision(s, 'kitchen_request', {
        title: `${t.name} wünscht sich eine neue Küche`,
        text: `${t.name} (${apartmentLabel(a)}) bittet um eine neue Einbauküche und wäre bereit, dafür eine Modernisierungsvereinbarung über +${formatMoney(surcharge)} Miete im Monat zu unterschreiben. Kosten: ca. ${formatMoney(cost)}.`,
        options: [
          { id: 'yes', label: `Küche einbauen (${formatMoney(cost)})`, description: `Miete +${formatMoney(surcharge)}/Monat, Mieter sehr zufrieden.`, costHint: cost },
          { id: 'no', label: 'Ablehnen', description: 'Mieter ist enttäuscht.' },
        ],
        context: { tenant: t.id, cost, surcharge },
        defaultOptionId: 'no',
      });
      return true;
    },
    resolve: (s, d, opt) => {
      const t = tenantById(s, d.context.tenant);
      if (!t || t.status !== 'active') return 'Der Wunsch hat sich erledigt.';
      const a = aptOf(s, t);
      const c = contractOfTenant(s, t);
      if (opt !== 'yes' || !c) {
        addMood(t, s.day, 'Wunsch abgelehnt', -5, 120);
        return 'Sie haben den Wunsch abgelehnt.';
      }
      post(s, { category: 'renovation', amount: -Number(d.context.cost), purpose: `Neue Küche ${apartmentLabel(a)} (Modernisierungsvereinbarung)`, apartmentId: a.id, ref: { type: 'event', id: d.id } });
      MEASURE_BY_ID.apt_kitchen.apply(s, a);
      const sur = Number(d.context.surcharge);
      c.rentHistory.push({ day: s.day, netRent: c.netRent + sur, utilityPrepayment: c.utilityPrepayment, reason: 'Modernisierungsvereinbarung Küche' });
      c.changes.push({ day: s.day, text: `Modernisierungsvereinbarung: Miete +${formatMoney(sur)} für neue Küche.` });
      c.netRent += sur;
      addMood(t, s.day, 'Neue Küche', 9, 240);
      return `Neue Küche eingebaut. Die Miete steigt einvernehmlich um ${formatMoney(sur)}.`;
    },
  },
  {
    id: 'garden_volunteer',
    title: 'Gartenpatenschaft',
    category: 'community',
    cooldownDays: 365,
    chance: (s) => (!s.counters.gardenVolunteer && s.building.outdoorCare < 80 && active(s).some((t) => t.archetype === 'gardener' || t.traits.ecoAwareness > 80) ? 0.003 : 0),
    fire: (s) => {
      const t = active(s).find((x) => x.archetype === 'gardener') ?? active(s).find((x) => x.traits.ecoAwareness > 80);
      if (!t) return false;
      makeDecision(s, 'garden_volunteer', {
        title: `${t.name} möchte den Hof pflegen`,
        text: `${t.name} bietet an, ehrenamtlich Beete und Hof zu pflegen. Gewünscht ist nur ein einmaliges Budget von 150 € für Pflanzen und Werkzeug.`,
        options: [
          { id: 'yes', label: 'Gerne annehmen (150 €)', description: 'Außenanlagen werden dauerhaft besser gepflegt.', costHint: 15000 },
          { id: 'no', label: 'Ablehnen', description: 'Der Hof bleibt in Profi- bzw. keiner Hand.' },
        ],
        context: { tenant: t.id },
        defaultOptionId: 'no',
      });
      return true;
    },
    resolve: (s, d, opt) => {
      const t = tenantById(s, d.context.tenant);
      if (!t) return 'Erledigt.';
      if (opt === 'yes') {
        post(s, { category: 'garden', amount: -15000, purpose: 'Budget Gartenpatenschaft', ref: { type: 'event', id: d.id } });
        s.counters.gardenVolunteer = 1;
        s.counters.gardenVolunteerTenant = 0;
        s.counters[`gardener:${t.id}`] = 1;
        addMood(t, s.day, 'Gartenpatenschaft', 8, 365);
        return `${t.name} kümmert sich ab jetzt um den Hof.`;
      }
      addMood(t, s.day, 'Angebot abgelehnt', -3, 60);
      return 'Angebot abgelehnt.';
    },
  },
  {
    id: 'diy_stairwell',
    title: 'Mieter will helfen',
    category: 'community',
    cooldownDays: 365,
    chance: (s) => (comp(s, 'stairwell').condition < 60 && active(s).some((t) => t.traits.diy > 80) ? 0.0025 : 0),
    fire: (s) => {
      const t = active(s).find((x) => x.traits.diy > 80);
      if (!t) return false;
      makeDecision(s, 'diy_stairwell', {
        title: `${t.name} bietet an, das Treppenhaus zu streichen`,
        text: `${t.name} würde das Treppenhaus an zwei Wochenenden streichen – gegen Materialkosten (≈ 380 €) und einen einmaligen Mietnachlass von 150 €.`,
        options: [
          { id: 'yes', label: 'Angebot annehmen (530 €)', description: 'Treppenhaus +18 Zustand, deutlich günstiger als ein Maler.', costHint: 53000 },
          { id: 'no', label: 'Lieber einen Maler beauftragen', description: 'Kein Risiko, aber teurer.' },
        ],
        context: { tenant: t.id },
        defaultOptionId: 'no',
      });
      return true;
    },
    resolve: (s, d, opt) => {
      const t = tenantById(s, d.context.tenant);
      if (!t) return 'Erledigt.';
      if (opt !== 'yes') return 'Sie bedanken sich für das Angebot.';
      post(s, { category: 'maintenance', amount: -53000, purpose: `Treppenhausanstrich in Eigenleistung (${t.name})`, componentKey: 'stairwell', ref: { type: 'event', id: d.id } });
      comp(s, 'stairwell').condition = clamp(comp(s, 'stairwell').condition + 18);
      addMood(t, s.day, 'Eigenleistung anerkannt', 6, 180);
      for (const o of active(s)) if (o.id !== t.id) addMood(o, s.day, 'Frisches Treppenhaus', 2, 90);
      return 'Das Treppenhaus erstrahlt in neuem Glanz – dank Ihres Mieters.';
    },
  },
  {
    id: 'vandalism',
    title: 'Vandalismus',
    category: 'building',
    cooldownDays: 90,
    stateDriven: true,
    chance: (s) => (s.building.security < 50 ? 0.002 * ((50 - s.building.security) / 50 + 0.3) : 0),
    fire: (s, rng) => {
      createDefect(s, 'graffiti', { kind: 'component', key: 'facade' }, { cause: `Ursache: Haustür steht offen, geringe Sicherheit (${Math.round(s.building.security)} %).`, silent: true });
      if (rng.chance(0.4)) createDefect(s, 'door_lock', { kind: 'component', key: 'stairwell' }, { cause: 'Ursache: Beschädigung durch Unbekannte.', silent: true });
      for (const t of active(s)) addMood(t, s.day, 'Vandalismus', -2, 45);
      addMessage(s, { category: 'event', severity: 'warning', title: 'Vandalismus am Haus', text: `Unbekannte haben den Eingangsbereich beschmiert. Die geringe Sicherheit (${Math.round(s.building.security)} %) begünstigt solche Vorfälle – eine neue Haustür mit Gegensprechanlage würde helfen.`, link: { page: 'repairs', id: null } });
      return true;
    },
  },
  {
    id: 'bridge_loan',
    title: 'Überbrückungskredit',
    category: 'finance',
    cooldownDays: 120,
    stateDriven: true,
    chance: (s) => (s.cash < -s.overdraftLimit * 0.6 ? 0.08 : 0),
    fire: (s) => {
      const amount = Math.ceil((-s.cash + 500000) / 100000) * 100000;
      makeDecision(s, 'bridge_loan', {
        title: 'Ihre Bank meldet sich',
        text: `Ihr Konto steht bei ${formatMoney(s.cash)} (Dispo: −${formatMoney(s.overdraftLimit)}). Die Bank bietet einen Überbrückungskredit über ${formatMoney(amount)} zu ${(CONFIG.finance.emergencyLoanRate * 100).toFixed(1)} % für 3 Jahre an.`,
        options: [
          { id: 'yes', label: `Kredit annehmen (${formatMoney(amount)})`, description: 'Sichert die Liquidität, ist aber teuer.' },
          { id: 'no', label: 'Ablehnen', description: 'Sie müssen die Liquidität anders sichern.' },
        ],
        context: { amount },
        defaultOptionId: 'no',
        severity: 'danger',
      });
      return true;
    },
    resolve: (s, d, opt) => {
      if (opt !== 'yes') return 'Kredit abgelehnt.';
      const r = takeLoan(s, Number(d.context.amount), 3, 'Überbrückung Liquiditätsengpass', 'bank', CONFIG.finance.emergencyLoanRate);
      return r.ok ? 'Überbrückungskredit ausgezahlt.' : `Kredit nicht möglich: ${r.error}`;
    },
  },
  {
    id: 'chimney_sweep',
    title: 'Schornsteinfeger',
    category: 'building',
    cooldownDays: 300,
    stateDriven: true,
    chance: (s) => (CONFIG.energy.heating[s.building.heatingSystem].chimney && [9, 10].includes(toYmd(s.day).month) ? 0.03 : 0),
    fire: (s) => {
      post(s, { category: 'maintenance', amount: -16500, purpose: 'Schornsteinfeger: Feuerstättenschau & Abgasmessung', componentKey: 'heating', ref: { type: 'event', id: String(s.day) } });
      const h = comp(s, 'heating');
      let note = 'Alle Werte in Ordnung.';
      if (h.condition < 45) {
        if (createDefect(s, 'heating_inefficient', { kind: 'component', key: 'heating' }, { cause: `Ursache: Abgasverluste bei Anlagenzustand ${Math.round(h.condition)} %.`, silent: true })) note = 'Die Abgaswerte sind grenzwertig – der Brenner sollte gewartet werden.';
        else {
          const d = s.defects.find((x) => x.resolvedDay === null && x.type === 'heating_inefficient');
          if (d) discoverDefect(s, d, 'Vom Schornsteinfeger festgestellt.');
        }
      }
      addMessage(s, { category: 'building', title: 'Schornsteinfeger war da', text: `Jährliche Feuerstättenschau (165 €, umlagefähig). ${note}` });
      return true;
    },
  },
  {
    id: 'pipe_warning',
    title: 'Warnzeichen an Leitungen',
    category: 'building',
    cooldownDays: 120,
    stateDriven: true,
    chance: (s) => (comp(s, 'pipes').condition < 45 && !s.defects.some((d) => d.resolvedDay === null && d.target.kind === 'component' && d.target.key === 'pipes') ? 0.004 : 0),
    fire: (s) => {
      const d = createDefect(s, 'pipe_corrosion', { kind: 'component', key: 'pipes' }, { cause: `Ursache: Alterung des Steigstrangs (Zustand ${Math.round(comp(s, 'pipes').condition)} %).`, silent: true });
      if (!d) return false;
      addMessage(s, { category: 'building', severity: 'warning', title: 'Wasserrohr zeigt Warnzeichen', text: 'Im Keller ist eine feuchte Stelle am Steigstrang aufgetaucht, das Wasser ist leicht bräunlich. Jetzt reparieren ist günstig – ein Rohrbruch wäre deutlich teurer.', defectId: d.id, link: { page: 'repairs', id: d.id }, important: true });
      return true;
    },
  },
  {
    id: 'insurance_offer',
    title: 'Versicherungsangebot',
    category: 'finance',
    cooldownDays: 365,
    chance: (s) => (s.services.insurance === 'none' ? 0.003 : 0),
    fire: (s) => {
      makeDecision(s, 'insurance_offer', {
        title: 'Versicherungsmakler meldet sich',
        text: `Ihr Haus ist nicht versichert. Ein Makler bietet eine Gebäudeversicherung (Basis) für ${formatMoney(CONFIG.costs.insurance.basic)} im Monat an. Sturm-, Leitungswasser- und Rohrbruchschäden wären abgedeckt (Selbstbeteiligung ${formatMoney(CONFIG.costs.insuranceDeductible.basic)}). Die Prämie ist umlagefähig.`,
        options: [
          { id: 'yes', label: 'Abschließen', description: 'Schützt vor teuren Großschäden.' },
          { id: 'no', label: 'Ablehnen', description: 'Sie tragen das volle Risiko.' },
        ],
        defaultOptionId: 'no',
      });
      return true;
    },
    resolve: (s, _d, opt) => {
      if (opt !== 'yes') return 'Versicherung abgelehnt.';
      s.services.insurance = 'basic';
      return 'Gebäudeversicherung (Basis) abgeschlossen.';
    },
  },
  {
    id: 'helpful_neighbor',
    title: 'Nachbarschaftshilfe',
    category: 'community',
    cooldownDays: 300,
    chance: (s) => (active(s).some((t) => t.archetype === 'helpful_neighbor' && t.satisfaction > 55) ? 0.002 : 0),
    fire: (s) => {
      const t = active(s).find((x) => x.archetype === 'helpful_neighbor' && x.satisfaction > 55);
      if (!t) return false;
      for (const o of active(s)) addMood(o, s.day, 'Nachbarschaftshilfe', 2, 90);
      addMessage(s, { category: 'tenant', severity: 'success', title: `${t.name} organisiert Nachbarschaftshilfe`, text: `${t.name} hat eine Paket- und Einkaufshilfe im Haus organisiert. Die Stimmung unter den Nachbarn hat sich spürbar verbessert.`, tenantId: t.id });
      return true;
    },
  },
  {
    id: 'investor_inquiry',
    title: 'Kaufinteresse',
    category: 'market',
    cooldownDays: 720,
    chance: (s) => (s.phase >= 3 ? 0.0006 : 0),
    fire: (s, rng) => {
      const value = marketValue(s);
      const offer = Math.round((value * rng.range(0.92, 1.08)) / 100000) * 100000;
      addMessage(s, { category: 'event', title: 'Investor zeigt Interesse am Haus', text: `Ein Immobilienfonds würde ${formatMoney(offer, { decimals: false })} zahlen. Der geschätzte Marktwert liegt bei ${formatMoney(value, { decimals: false })}. (Ein Verkauf ist in dieser Version nicht möglich – aber gut zu wissen, was Ihr Haus wert ist.)` });
      return true;
    },
  },
  {
    id: 'press_praise',
    title: 'Lokalpresse',
    category: 'community',
    cooldownDays: 365,
    chance: (s) => (computeScore(s).total >= 720 ? 0.002 : 0),
    fire: (s) => {
      s.market.modifiers.push({ id: nextId(s, 'mm'), kind: 'demand', value: 1.15, untilDay: s.day + 180, label: 'Positiver Zeitungsartikel' });
      s.market.demandIndex = clamp(s.market.demandIndex + 0.08, 0.7, 1.3);
      for (const t of active(s)) addMood(t, s.day, 'Stolz aufs Haus', 2, 90);
      addMessage(s, { category: 'event', severity: 'success', title: 'Lokalzeitung lobt Ihr Haus', text: `„Ein Mietshaus, wie man es sich wünscht“ – die Lokalzeitung berichtet über gepflegte Wohnungen und zufriedene Mieter (Ø ${Math.round(avgSatisfaction(s))} %). Die Nachfrage nach Ihren Wohnungen steigt.` });
      return true;
    },
  },
];

function conflictPair(s: GameState): [Tenant, Tenant] | null {
  const ts = active(s);
  for (const a of ts) {
    if (a.traits.noiseSensitivity < 65) continue;
    const fa = aptOf(s, a).floor;
    for (const b of ts) {
      if (b.id === a.id) continue;
      const fb = aptOf(s, b).floor;
      if (Math.abs(fa - fb) > 1) continue;
      if (b.householdSize >= 3 || b.pets || b.traits.tidiness < 35) return [a, b];
    }
  }
  return null;
}

export const EVENT_BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

