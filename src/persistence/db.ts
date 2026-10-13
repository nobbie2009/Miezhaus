import { openDB, type IDBPDatabase } from 'idb';
import type { GameState } from '@/domain/schema';
import { validateState } from './saveFile';
import { scoreGrade, computeScore } from '@/game/score';

/**
 * Lokale Spielstände in IndexedDB. Ein Eintrag enthält Metadaten für die Übersicht
 * und den vollständigen Spielzustand.
 */
export interface SaveMeta {
  id: string;
  gameId: string;
  name: string;
  kind: 'manual' | 'auto';
  updatedAt: number;
  day: number;
  cash: number;
  building: string;
  mode: string;
  scenarioId: string;
  phase: number;
  score: number;
  grade: string;
  gameOver: string | null;
}

interface SaveRecord extends SaveMeta {
  data: GameState;
}

const DB_NAME = 'mietshaus-tycoon';
const STORE = 'saves';
let dbPromise: Promise<IDBPDatabase> | null = null;

function db() {
  if (!dbPromise)
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) {
          const st = d.createObjectStore(STORE, { keyPath: 'id' });
          st.createIndex('updatedAt', 'updatedAt');
        }
      },
    });
  return dbPromise;
}

function metaOf(s: GameState, id: string, kind: SaveMeta['kind'], name?: string): SaveMeta {
  const score = computeScore(s).total;
  return {
    id,
    gameId: s.saveId,
    name: name ?? s.saveName,
    kind,
    updatedAt: Date.now(),
    day: s.day,
    cash: s.cash,
    building: s.building.name,
    mode: s.mode,
    scenarioId: s.scenarioId,
    phase: s.phase,
    score,
    grade: scoreGrade(score),
    gameOver: s.gameOver?.kind ?? null,
  };
}

export async function saveGame(s: GameState, kind: SaveMeta['kind'] = 'manual'): Promise<SaveMeta> {
  const id = kind === 'auto' ? `${s.saveId}:auto` : s.saveId;
  const meta = metaOf(s, id, kind, kind === 'auto' ? `${s.saveName} (Autosave)` : s.saveName);
  await (await db()).put(STORE, { ...meta, data: s } satisfies SaveRecord);
  return meta;
}

export async function listSaves(): Promise<SaveMeta[]> {
  const all = (await (await db()).getAll(STORE)) as SaveRecord[];
  return all.map(({ data: _d, ...m }) => m).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadSave(id: string): Promise<{ ok: boolean; state?: GameState; errors: string[]; warnings: string[] }> {
  const rec = (await (await db()).get(STORE, id)) as SaveRecord | undefined;
  if (!rec) return { ok: false, errors: ['Spielstand nicht gefunden.'], warnings: [] };
  return validateState(rec.data);
}

export async function deleteSave(id: string) {
  await (await db()).delete(STORE, id);
}

export async function duplicateSave(id: string): Promise<SaveMeta | null> {
  const r = await loadSave(id);
  if (!r.ok || !r.state) return null;
  const copy: GameState = { ...r.state, saveId: `${r.state.saveId}-k${Date.now().toString(36)}`, saveName: `${r.state.saveName} (Kopie)` };
  return saveGame(copy, 'manual');
}

export async function storeImported(s: GameState): Promise<SaveMeta> {
  const copy: GameState = { ...s, saveId: `${s.saveId}-i${Date.now().toString(36)}`, saveName: `${s.saveName} (Import)` };
  return saveGame(copy, 'manual');
}
