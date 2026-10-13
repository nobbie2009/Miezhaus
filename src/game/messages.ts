import type { GameState, Message } from '@/domain/schema';
import { nextId } from './ids';

const MAX_MESSAGES = 400;
const MAX_LOG = 600;

export function addMessage(
  s: GameState,
  m: Pick<Message, 'category' | 'title' | 'text'> & Partial<Omit<Message, 'id' | 'day' | 'read'>>,
): Message {
  const msg: Message = {
    id: nextId(s, 'm'),
    day: s.day,
    category: m.category,
    severity: m.severity ?? 'info',
    title: m.title,
    text: m.text,
    tenantId: m.tenantId ?? null,
    apartmentId: m.apartmentId ?? null,
    defectId: m.defectId ?? null,
    link: m.link ?? null,
    propertyId: m.propertyId ?? s.building.id,
    read: false,
    important: m.important ?? false,
  };
  s.messages.push(msg);
  if (s.messages.length > MAX_MESSAGES) {
    // Älteste gelesene Nachrichten zuerst entfernen.
    const idx = s.messages.findIndex((x) => x.read && !x.important);
    s.messages.splice(idx >= 0 ? idx : 0, 1);
  }
  return msg;
}

export function log(s: GameState, text: string, kind = 'info') {
  s.log.push({ day: s.day, text, kind });
  if (s.log.length > MAX_LOG) s.log.splice(0, s.log.length - MAX_LOG);
}

export const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
