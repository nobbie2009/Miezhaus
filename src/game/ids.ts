import type { GameState } from '@/domain/schema';

/** Fortlaufende, deterministische IDs innerhalb eines Spielstands. */
export const nextId = (s: GameState, prefix: string): string => {
  s.idCounter += 1;
  return `${prefix}-${s.idCounter.toString(36)}`;
};
