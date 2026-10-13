import { useGame } from '@/store/gameStore';
import { useUi } from '@/store/uiStore';
import type { GameState } from '@/domain/schema';
import { viewById } from '@/game/portfolio';

/**
 * Liefert den Spielzustand aus Sicht des ausgewählten Objekts (nur innerhalb des laufenden Spiels verwenden).
 * Objektbezogene Felder (Gebäude, Wohnungen, Mieter …) gehören zum gewählten Haus, alles andere ist gemeinsam.
 */
export function useGs(): GameState {
  const g = useGame((s) => s.game);
  const pid = useUi((s) => s.activePropertyId);
  if (!g) throw new Error('Kein Spiel geladen');
  return viewById(g, pid);
}

/** Wurzel-Spielstand (Portfolio-Ebene). */
export function useRoot(): GameState {
  const g = useGame((s) => s.game);
  if (!g) throw new Error('Kein Spiel geladen');
  return g;
}

export const useDispatch = () => useGame((s) => s.dispatch);
