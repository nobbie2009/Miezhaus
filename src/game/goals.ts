import type { GameState } from '@/domain/schema';
import { ACHIEVEMENTS, GOAL_BY_ID } from '@/content/goals';
import { SCENARIO_BY_ID } from '@/content/scenarios';
import { formatDate } from '@/utils/date';
import { addMessage, log } from './messages';
import { computeScore, scoreGrade } from './score';

/** Ziele auswerten. `monthEnd` = true beim Monatsabschluss (für Zähler-Ziele). */
export function evaluateGoals(s: GameState, monthEnd: boolean) {
  for (const g of s.goals) {
    if (g.status !== 'active') continue;
    const def = GOAL_BY_ID[g.id];
    if (!def) continue;
    if (def.monthly && !monthEnd) continue;
    g.progress = Math.max(0, Math.min(1, def.evaluate(s, g)));
    if (g.progress >= 1) {
      g.status = 'done';
      g.completedDay = s.day;
      addMessage(s, { category: 'goal', severity: 'success', title: `Ziel erreicht: ${def.title}`, text: def.description, link: { page: 'goals', id: null }, important: true });
      log(s, `Ziel erreicht: ${def.title}`, 'goal');
    }
  }
}

export function evaluateAchievements(s: GameState) {
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.some((x) => x.id === a.id)) continue;
    if (!a.check(s)) continue;
    s.achievements.push({ id: a.id, day: s.day });
    addMessage(s, { category: 'goal', severity: 'success', title: `Erfolg freigeschaltet: ${a.title}`, text: a.description, link: { page: 'goals', id: null } });
  }
}

/** Siegbedingungen und Zeitlimit von Szenarien prüfen. */
export function checkScenario(s: GameState) {
  if (s.gameOver) return;
  const sc = SCENARIO_BY_ID[s.scenarioId];
  if (!sc || !sc.winGoals?.length) return;
  const required = s.goals.filter((g) => sc.winGoals!.includes(g.id));
  if (required.length && required.every((g) => g.status === 'done')) {
    const score = computeScore(s);
    s.gameOver = { kind: 'won', day: s.day, title: `Szenario gemeistert: ${sc.title}`, text: `Alle Szenarioziele erreicht am ${formatDate(s.day)}. Bewertung: ${score.total} Punkte (${scoreGrade(score.total)}). Sie können im Endlosmodus weiterspielen.` };
    return;
  }
  if (s.endDay !== null && s.day >= s.endDay) {
    const missing = required.filter((g) => g.status !== 'done').map((g) => GOAL_BY_ID[g.id]?.title ?? g.id);
    s.gameOver = { kind: 'lost', day: s.day, title: 'Zeit abgelaufen', text: `Die Frist für „${sc.title}“ ist abgelaufen. Nicht erreicht: ${missing.join(', ')}.` };
  }
}
