import type { GameState } from '@/domain/schema';
import { EVENTS, EVENT_BY_ID } from '@/content/events';
import type { Rng } from '@/utils/rng';
import { formatMoney } from '@/utils/money';
import { addMessage, log } from './messages';
import { post } from './ledger';

/** Tägliche Ereignisprüfung. Ereignisse feuern nur, wenn ihre Voraussetzungen im Spielzustand erfüllt sind. */
export function rollEvents(s: GameState, rng: Rng) {
  const freq = s.settings.eventFrequency;
  let decisionsToday = 0;
  for (const ev of EVENTS) {
    const last = s.eventCooldowns[ev.id];
    if (last !== undefined && s.day - last < ev.cooldownDays) continue;
    const p = ev.chance(s) * (ev.stateDriven ? Math.max(0.5, Math.min(1.5, freq)) : freq);
    if (p <= 0 || !rng.chance(p)) continue;
    if (ev.resolve && (s.decisions.length >= 3 || decisionsToday >= 1)) continue;
    const fired = ev.fire(s, rng);
    if (fired) {
      s.eventCooldowns[ev.id] = s.day;
      if (ev.resolve) decisionsToday++;
      log(s, `Ereignis: ${ev.title}`, 'event');
    }
  }
  // Fristen aus früheren Entscheidungen
  if (s.counters.fireDeadline && s.day >= s.counters.fireDeadline) {
    delete s.counters.fireDeadline;
    if (s.building.fireSafety < 55) {
      post(s, { category: 'legal', amount: -150000, purpose: 'Bußgeld: Brandschutzmängel nicht behoben', ref: { type: 'event', id: `fire-${s.day}` } });
      addMessage(s, { category: 'event', severity: 'danger', title: 'Bußgeld wegen Brandschutz', text: `Die Frist ist abgelaufen und der Brandschutz liegt weiterhin bei ${Math.round(s.building.fireSafety)} %. Bußgeld: ${formatMoney(150000)}.`, important: true });
    } else addMessage(s, { category: 'event', severity: 'success', title: 'Brandschutz-Nachkontrolle bestanden', text: 'Die Mängel wurden fristgerecht behoben.' });
  }
}

export function resolveDecision(s: GameState, decisionId: string, optionId: string, rng: Rng): { ok: boolean; error?: string; result?: string } {
  const d = s.decisions.find((x) => x.id === decisionId);
  if (!d) return { ok: false, error: 'Entscheidung nicht mehr offen.' };
  if (!d.options.some((o) => o.id === optionId)) return { ok: false, error: 'Ungültige Option.' };
  const ev = EVENT_BY_ID[d.eventId];
  s.decisions = s.decisions.filter((x) => x.id !== decisionId);
  const result = ev?.resolve ? ev.resolve(s, d, optionId, rng) : 'Erledigt.';
  const label = d.options.find((o) => o.id === optionId)?.label ?? optionId;
  addMessage(s, { category: 'event', title: d.title, text: `Entscheidung: ${label}. ${result}` });
  log(s, `Entscheidung „${d.title}“: ${label}`, 'decision');
  return { ok: true, result };
}

/** Abgelaufene Entscheidungen werden mit der Standardoption aufgelöst. */
export function expireDecisions(s: GameState, rng: Rng) {
  for (const d of [...s.decisions]) if (d.expiresDay <= s.day) resolveDecision(s, d.id, d.defaultOptionId, rng);
}
