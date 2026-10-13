import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { SCHEMA_VERSION, createGame } from '@/game/create';
import { advanceDays } from '@/game/simulation';
import { exportSave, importSave, validateState } from '@/persistence/saveFile';
import { deleteSave, duplicateSave, listSaves, loadSave, saveGame } from '@/persistence/db';

describe('Speichern & Laden', () => {
  it('Export/Import erhält den Spielzustand vollständig', () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 77 });
    advanceDays(s, 90);
    const r = importSave(exportSave(s));
    expect(r.ok).toBe(true);
    expect(r.state).toEqual(s);
  });

  it('Importierte Spielstände werden validiert', () => {
    expect(importSave('kein json').ok).toBe(false);
    expect(importSave(JSON.stringify({ format: 'etwas-anderes' })).ok).toBe(false);
    const s = createGame({ scenarioId: 'endless_linden', seed: 1 });
    const broken = JSON.parse(exportSave(s));
    broken.game.cash = 'viel';
    expect(importSave(JSON.stringify(broken)).ok).toBe(false);
    const badRef = JSON.parse(exportSave(s));
    badRef.game.contracts[0].tenantId = 'gibt-es-nicht';
    const r = importSave(JSON.stringify(badRef));
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toContain('unbekannten Mieter');
  });

  it('Manipulierter Kontostand wird gegen das Journal korrigiert', () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 1 });
    const raw = structuredClone(s);
    raw.cash += 10_000_000;
    const r = validateState(raw);
    expect(r.ok).toBe(true);
    expect(r.state!.cash).toBe(s.cash);
    expect(r.warnings.length).toBe(1);
  });

  it('Migration älterer Spielstände', () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 1 });
    const old = structuredClone(s) as Record<string, unknown>;
    delete old.schemaVersion;
    delete old.insuranceClaims;
    const r = validateState(old);
    expect(r.ok).toBe(true);
    expect(r.state!.schemaVersion).toBe(SCHEMA_VERSION);
    const future = { ...structuredClone(s), schemaVersion: 99 };
    expect(validateState(future).ok).toBe(false);
  });

  it('IndexedDB: speichern, laden, duplizieren, löschen', async () => {
    const s = createGame({ scenarioId: 'endless_linden', seed: 9 });
    advanceDays(s, 40);
    await saveGame(s, 'manual');
    await saveGame(s, 'auto');
    let list = await listSaves();
    expect(list.filter((x) => x.gameId === s.saveId).length).toBe(2);
    const loaded = await loadSave(s.saveId);
    expect(loaded.ok).toBe(true);
    expect(loaded.state).toEqual(s);
    const dup = await duplicateSave(s.saveId);
    expect(dup).not.toBeNull();
    list = await listSaves();
    expect(list.some((x) => x.id === dup!.id)).toBe(true);
    await deleteSave(dup!.id);
    expect((await listSaves()).some((x) => x.id === dup!.id)).toBe(false);
  });
});
