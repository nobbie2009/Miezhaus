import type { Decision, GameState } from '@/domain/schema';
import { nextId } from './ids';

export interface DecisionInput {
  title: string;
  text: string;
  options: { id: string; label: string; description: string; costHint?: number | null }[];
  context?: Record<string, string | number | boolean>;
  expiresInDays?: number;
  defaultOptionId: string;
  severity?: Decision['severity'];
}

export function makeDecision(s: GameState, eventId: string, d: DecisionInput): Decision {
  const dec: Decision = {
    id: nextId(s, 'e'),
    eventId,
    day: s.day,
    title: d.title,
    text: d.text,
    options: d.options.map((o) => ({ ...o, costHint: o.costHint ?? null })),
    context: { ...(d.context ?? {}), propertyId: s.building.id },
    expiresDay: s.day + (d.expiresInDays ?? 14),
    defaultOptionId: d.defaultOptionId,
    severity: d.severity ?? 'info',
  };
  s.decisions.push(dec);
  return dec;
}
