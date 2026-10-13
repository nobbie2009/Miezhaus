import { dayOfYear, toYmd } from '@/utils/date';
import { CONFIG } from './config';

/** Deterministischer Hash (ohne den Spiel-RNG zu verbrauchen) für Wetterrauschen. */
const hash = (a: number, b: number) => {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** Tagesmitteltemperatur in °C (Mitteleuropa, vereinfacht). */
export function temperature(day: number, seed: number): number {
  const doy = dayOfYear(day);
  const seasonal = 9.6 - 9.8 * Math.cos((2 * Math.PI * (doy - 18)) / 365);
  // Mehrtägige Wetterlagen: Rauschen über 5-Tage-Blöcke geglättet
  const block = Math.floor(day / 5);
  const t = (day % 5) / 5;
  const n0 = hash(seed, block) - 0.5;
  const n1 = hash(seed, block + 1) - 0.5;
  const noise = (n0 * (1 - t) + n1 * t) * 9 + (hash(seed ^ 0x55, day) - 0.5) * 3;
  return Math.round((seasonal + noise) * 10) / 10;
}

export const degreeDays = (day: number, seed: number) => Math.max(0, CONFIG.energy.heatingBaseTemp - temperature(day, seed));

export const isHeatingSeason = (day: number) => {
  const { month } = toYmd(day);
  return month >= 10 || month <= 4;
};

/** Sonnenertrag in kWh pro kWp und Tag. */
export function solarYield(day: number, seed: number): number {
  const doy = dayOfYear(day);
  const seasonal = 2.6 - 2.0 * Math.cos((2 * Math.PI * (doy - 10)) / 365);
  const cloud = 0.55 + hash(seed ^ 0xabc, day) * 0.7;
  return Math.max(0.1, seasonal * cloud);
}

/** Standard-Gradtagzahl pro Jahr (für Bedarfsausweis-ähnliche, wetterunabhängige Kennwerte). */
export const STANDARD_DEGREE_DAYS = 2750;
