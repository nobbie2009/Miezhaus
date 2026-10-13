import { useEffect, useRef } from 'react';
import { CONFIG } from '@/game/config';
import { useGame } from '@/store/gameStore';

/**
 * Spielschleife: Die Spielzeit ist von der realen Zeit entkoppelt. Jeder Tick simuliert genau
 * einen vollständigen Tag. Ist der Tab im Hintergrund, pausiert das Spiel automatisch –
 * es werden keine Tage „nachgeholt“ oder übersprungen.
 */
export function useGameLoop() {
  const speed = useGame((s) => s.speed);
  const hasGame = useGame((s) => !!s.game);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    if (!hasGame || speed === 'paused') return;
    const ms = CONFIG.time.speeds[speed];
    timer.current = window.setInterval(() => {
      const st = useGame.getState();
      if (!st.game || st.game.gameOver) {
        st.setSpeed('paused');
        return;
      }
      if (st.game.decisions.length && st.game.settings.autoPauseOnDecision) {
        st.setSpeed('paused');
        return;
      }
      st.advance(1);
    }, ms);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [speed, hasGame]);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        const st = useGame.getState();
        if (st.speed !== 'paused') st.setSpeed('paused');
        if (st.game && st.dirty) void st.save('auto');
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Regelmäßiges Autosave (alle 60 s, falls geändert)
  useEffect(() => {
    const id = window.setInterval(() => {
      const st = useGame.getState();
      if (st.game && st.dirty) void st.save('auto');
    }, 60000);
    const beforeUnload = () => {
      const st = useGame.getState();
      if (st.game && st.dirty) void st.save('auto');
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, []);
}
