import { create } from 'zustand';
import type { GameState } from '@/domain/schema';
import { applyAction, UNDOABLE, ACTION_LABEL, type ActionResult, type GameAction } from '@/game/actions';
import { advanceDays, type StopReason } from '@/game/simulation';
import { createGame, type NewGameOptions } from '@/game/create';
import { saveGame } from '@/persistence/db';

export type Speed = 'paused' | 'slow' | 'normal' | 'fast' | 'turbo';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info' | 'warning';
  text: string;
}

interface UndoEntry {
  state: GameState;
  label: string;
  day: number;
}

interface Store {
  game: GameState | null;
  speed: Speed;
  toasts: Toast[];
  undo: UndoEntry | null;
  busy: boolean;
  lastSavedAt: number | null;
  dirty: boolean;
  saveError: string | null;
  newGame: (opts: NewGameOptions) => void;
  loadGame: (s: GameState) => void;
  closeGame: () => void;
  dispatch: (a: GameAction) => ActionResult;
  advance: (days: number) => { days: number; reason: StopReason };
  setSpeed: (s: Speed) => void;
  undoLast: () => void;
  toast: (kind: Toast['kind'], text: string) => void;
  dismissToast: (id: number) => void;
  save: (kind?: 'manual' | 'auto') => Promise<void>;
}

let toastId = 0;

/** Aktionen, nach denen automatisch gespeichert wird. */
const AUTOSAVE_ACTIONS: GameAction['type'][] = ['createJob', 'offerLease', 'takeLoan', 'repayLoan', 'resolveDecision', 'rentIncrease', 'terminateArrears', 'mutualTermination', 'writeOff', 'setService'];

export const useGame = create<Store>((set, get) => ({
  game: null,
  speed: 'paused',
  toasts: [],
  undo: null,
  busy: false,
  lastSavedAt: null,
  dirty: false,
  saveError: null,

  newGame: (opts) => {
    const g = createGame(opts);
    set({ game: g, speed: 'paused', undo: null, dirty: true });
    void get().save('auto');
  },
  loadGame: (s) => set({ game: s, speed: 'paused', undo: null, dirty: false }),
  closeGame: () => set({ game: null, speed: 'paused', undo: null }),

  dispatch: (a) => {
    const { game, busy } = get();
    if (!game) return { ok: false, error: 'Kein Spiel geladen.' };
    // Schutz vor Doppelklicks: während einer laufenden Aktion wird nichts weiteres angenommen.
    if (busy) return { ok: false, error: 'Aktion wird bereits ausgeführt.' };
    set({ busy: true });
    try {
      const draft = structuredClone(game);
      const res = applyAction(draft, a);
      if (!res.ok) {
        if (res.error) get().toast('error', res.error);
        return res;
      }
      const undo = UNDOABLE.includes(a.type) ? { state: game, label: ACTION_LABEL[a.type] ?? a.type, day: game.day } : a.type === 'markRead' ? get().undo : null;
      set({ game: draft, undo, dirty: true });
      if (res.message) get().toast('success', res.message);
      if (AUTOSAVE_ACTIONS.includes(a.type)) void get().save('auto');
      return res;
    } catch (e) {
      console.error(e);
      get().toast('error', `Interner Fehler: ${(e as Error).message}`);
      return { ok: false, error: (e as Error).message };
    } finally {
      set({ busy: false });
    }
  },

  advance: (days) => {
    const { game } = get();
    if (!game || game.gameOver) return { days: 0, reason: 'gameover' as const };
    const draft = structuredClone(game);
    const monthsBefore = draft.history.length;
    const res = advanceDays(draft, days, { stopOnDecision: draft.settings.autoPauseOnDecision, stopOnCritical: days > 1 });
    set({ game: draft, dirty: true, undo: null });
    if (res.reason !== 'done' && get().speed !== 'paused') set({ speed: 'paused' });
    if (draft.history.length !== monthsBefore || draft.gameOver) void get().save('auto');
    return res;
  },

  setSpeed: (speed) => set({ speed }),

  undoLast: () => {
    const { undo, game } = get();
    if (!undo || !game) return;
    if (undo.day !== game.day) {
      get().toast('warning', 'Rückgängig ist nur am selben Spieltag möglich.');
      set({ undo: null });
      return;
    }
    set({ game: undo.state, undo: null, dirty: true });
    get().toast('info', `Rückgängig: ${undo.label}`);
  },

  toast: (kind, text) => {
    const id = ++toastId;
    set({ toasts: [...get().toasts.slice(-4), { id, kind, text }] });
    setTimeout(() => get().dismissToast(id), kind === 'error' ? 6000 : 3500);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  save: async (kind = 'manual') => {
    const { game } = get();
    if (!game) return;
    try {
      await saveGame(game, kind);
      set({ lastSavedAt: Date.now(), dirty: false, saveError: null });
      if (kind === 'manual') get().toast('success', 'Spielstand gespeichert.');
    } catch (e) {
      set({ saveError: (e as Error).message });
      if (kind === 'manual') get().toast('error', `Speichern fehlgeschlagen: ${(e as Error).message}`);
    }
  },
}));
