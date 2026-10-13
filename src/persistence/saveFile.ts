import { GameStateSchema, type GameState } from '@/domain/schema';
import { SCHEMA_VERSION } from '@/game/create';
import { ledgerBalance } from '@/game/ledger';

export const SAVE_FORMAT = 'mietshaus-tycoon-save';
export const SAVE_FORMAT_VERSION = 1;

export interface SaveFile {
  format: typeof SAVE_FORMAT;
  formatVersion: number;
  schemaVersion: number;
  exportedAt: string;
  game: unknown;
}

type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/**
 * Migrationen von Schema-Version n auf n+1. Neue Versionen ergänzen hier eine Funktion.
 * Version 0 bezeichnet Spielstände ohne schemaVersion-Feld (Vorabversionen).
 */
export const MIGRATIONS: Record<number, Migration> = {
  0: (raw) => ({ ...raw, schemaVersion: 1, insuranceClaims: raw.insuranceClaims ?? [], log: raw.log ?? [] }),
};

export function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  let v = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  let cur = raw;
  while (v < SCHEMA_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) throw new Error(`Keine Migration von Version ${v} verfügbar.`);
    cur = m(cur);
    v = typeof cur.schemaVersion === 'number' ? cur.schemaVersion : v + 1;
  }
  if (v > SCHEMA_VERSION) throw new Error(`Der Spielstand stammt aus einer neueren Spielversion (Schema ${v}).`);
  return cur;
}

export interface ValidationResult {
  ok: boolean;
  state?: GameState;
  errors: string[];
  warnings: string[];
}

/** Validiert einen Spielstand vollständig (Struktur + fachliche Konsistenz). */
export function validateState(raw: unknown): ValidationResult {
  const warnings: string[] = [];
  if (!raw || typeof raw !== 'object') return { ok: false, errors: ['Kein gültiges Spielstand-Objekt.'], warnings };
  let migrated: Record<string, unknown>;
  try {
    migrated = migrate(raw as Record<string, unknown>);
  } catch (e) {
    return { ok: false, errors: [(e as Error).message], warnings };
  }
  const parsed = GameStateSchema.safeParse(migrated);
  if (!parsed.success) {
    const errors = parsed.error.issues.slice(0, 8).map((i) => `${i.path.join('.') || '(Wurzel)'}: ${i.message}`);
    return { ok: false, errors, warnings };
  }
  const s = parsed.data;
  const errors: string[] = [];
  // Referenzielle Integrität
  const aptIds = new Set(s.apartments.map((a) => a.id));
  const tenantIds = new Set(s.tenants.map((t) => t.id));
  for (const c of s.contracts) {
    if (!aptIds.has(c.apartmentId)) errors.push(`Vertrag ${c.id} verweist auf unbekannte Wohnung.`);
    if (!tenantIds.has(c.tenantId)) errors.push(`Vertrag ${c.id} verweist auf unbekannten Mieter.`);
  }
  for (const a of s.apartments) if (a.tenantId && !tenantIds.has(a.tenantId)) errors.push(`Wohnung ${a.number} verweist auf unbekannten Mieter.`);
  const ids = new Set<string>();
  for (const e of s.ledger) {
    if (ids.has(e.id)) errors.push(`Doppelte Buchungs-ID ${e.id}.`);
    ids.add(e.id);
  }
  if (errors.length) return { ok: false, errors: errors.slice(0, 8), warnings };
  // Kontostand gegen Journal prüfen
  const bal = ledgerBalance(s);
  if (bal !== s.cash) {
    warnings.push(`Kontostand (${s.cash / 100} €) weicht vom Buchungsjournal (${bal / 100} €) ab und wurde korrigiert.`);
    s.cash = bal;
  }
  return { ok: true, state: s, errors: [], warnings };
}

export function exportSave(s: GameState): string {
  const file: SaveFile = { format: SAVE_FORMAT, formatVersion: SAVE_FORMAT_VERSION, schemaVersion: s.schemaVersion, exportedAt: new Date().toISOString(), game: s };
  return JSON.stringify(file);
}

export function importSave(text: string): ValidationResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['Die Datei ist kein gültiges JSON.'], warnings: [] };
  }
  const f = data as Partial<SaveFile>;
  if (!f || f.format !== SAVE_FORMAT) return { ok: false, errors: ['Die Datei ist kein Mietshaus-Tycoon-Spielstand.'], warnings: [] };
  if (typeof f.formatVersion !== 'number' || f.formatVersion > SAVE_FORMAT_VERSION) return { ok: false, errors: ['Unbekannte Version des Speicherformats.'], warnings: [] };
  return validateState(f.game);
}

export const exportFileName = (s: GameState) => `mietshaus-${s.building.name.replace(/[^a-z0-9äöüß]+/gi, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
