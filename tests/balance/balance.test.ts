import { describe, expect, it } from 'vitest';
import { createGame } from '@/game/create';
import { idleBot, neglectBot, reasonableBot, runBot } from '../helpers/bots';
import { avgSatisfaction, buildingCondition, occupiedCount } from '@/game/derived';
import { computeScore } from '@/game/score';
import { ledgerBalance } from '@/game/ledger';

/**
 * Balancing-Tests: Vernünftiges Wirtschaften bleibt über Jahre stabil,
 * Vernachlässigung hat nachvollziehbare Folgen.
 */
describe('Balancing', () => {
  const seeds = [1, 2, 3, 4];
  it('Vernünftige Bewirtschaftung bleibt 5 Jahre stabil', () => {
    for (const seed of seeds) {
      const s = runBot(createGame({ scenarioId: 'endless_linden', seed }), reasonableBot, 365 * 5);
      expect(s.gameOver, `seed ${seed}`).toBeNull();
      expect(s.cash, `seed ${seed}`).toBeGreaterThan(0);
      expect(avgSatisfaction(s), `seed ${seed}`).toBeGreaterThan(55);
      expect(buildingCondition(s), `seed ${seed}`).toBeGreaterThan(55);
      expect(occupiedCount(s)).toBeGreaterThanOrEqual(8);
      expect(ledgerBalance(s)).toBe(s.cash);
    }
  });

  it('Vernachlässigung führt zu Verfall, Unzufriedenheit und Leerstand', () => {
    for (const seed of seeds) {
      const good = runBot(createGame({ scenarioId: 'endless_linden', seed }), reasonableBot, 365 * 4);
      const bad = runBot(createGame({ scenarioId: 'endless_linden', seed }), neglectBot, 365 * 4);
      expect(computeScore(bad).total).toBeLessThan(computeScore(good).total - 150);
      expect(avgSatisfaction(bad)).toBeLessThan(avgSatisfaction(good));
      expect(buildingCondition(bad)).toBeLessThan(buildingCondition(good) - 15);
    }
  });

  it('Wer gar nicht handelt, gerät nachvollziehbar in Schieflage', () => {
    const s = runBot(createGame({ scenarioId: 'endless_linden', seed: 1 }), idleBot, 365 * 5);
    expect(s.gameOver?.kind === 'insolvency' || occupiedCount(s) <= 3).toBe(true);
  });

  it('Der Start ist nicht sofort verloren: 6 Monate Nichtstun überleben', () => {
    for (const seed of seeds) {
      const s = runBot(createGame({ scenarioId: 'endless_linden', seed }), idleBot, 183);
      expect(s.gameOver).toBeNull();
    }
  });

  it('Alle Szenarien laufen mit vernünftiger Strategie ein Jahr ohne Insolvenz', () => {
    for (const id of ['c1_inherited', 'c2_insolvent', 'c3_postwar', 'c4_energy', 'c5_fluctuation', 'c6_core', 'ch_backlog', 'ch_winter']) {
      const s = runBot(createGame({ scenarioId: id, seed: 2 }), reasonableBot, 365);
      expect(s.gameOver?.kind, id).not.toBe('insolvency');
    }
  });
});
