import { useGame } from '@/store/gameStore';
import type { GameState } from '@/domain/schema';

/** Liefert den aktuellen Spielzustand (nur innerhalb des laufenden Spiels verwenden). */
export function useGs(): GameState {
  const g = useGame((s) => s.game);
  if (!g) throw new Error('Kein Spiel geladen');
  return g;
}

export const useDispatch = () => useGame((s) => s.dispatch);
