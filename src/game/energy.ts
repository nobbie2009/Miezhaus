import type { EnergyMonth, GameState } from '@/domain/schema';
import { CONFIG } from './config';
import { energyPrice, heatLossCoefficient, heatPricePerKwh, heatingEfficiency } from './derived';
import { degreeDays, solarYield } from './weather';

export const emptyEnergyMonth = (): EnergyMonth => ({ heatKwh: 0, hotWaterKwh: 0, commonKwh: 0, pvKwh: 0, waterM3: 0, degreeDays: 0, heatCost: 0, elecCost: 0, waterCost: 0, feedIn: 0 });

export interface DailyEnergy {
  heatKwh: number;
  hotWaterKwh: number;
  commonKwh: number;
  pvKwh: number;
  feedInKwh: number;
  waterM3: number;
  dd: number;
}

/** Energiebedarf eines Tages auf Basis von Wetter, Gebäudehülle, Anlage und Mieterverhalten. */
export function dailyEnergy(s: GameState): DailyEnergy {
  const e = CONFIG.energy;
  const dd = degreeDays(s.day, s.seed);
  const H = heatLossCoefficient(s);
  const heatingOut = s.defects.some((d) => d.resolvedDay === null && d.type === 'heating_failure');
  let heat = 0;
  let hotWater = 0;
  let water = 0;
  for (const a of s.apartments) {
    const t = a.tenantId ? s.tenants.find((x) => x.id === a.tenantId) : null;
    const behaviour = t ? t.energyFactor * (1 - (t.traits.ecoAwareness - 50) / 400) : 0.45;
    heat += a.area * H * dd * behaviour * (a.smartThermostat ? 0.92 : 1);
    if (t) {
      hotWater += t.householdSize * e.hotWaterKwhPerPersonDay * t.energyFactor;
      water += t.householdSize * e.waterM3PerPersonDay * (0.85 + t.energyFactor * 0.15);
    }
  }
  if (heatingOut) {
    heat = 0;
    hotWater = 0;
  }
  if (s.building.amenities.includes('rainwater')) water *= 0.91;
  let common = e.commonKwhPerDay * (s.building.amenities.includes('led_lighting') ? 0.65 : 1) * (s.building.amenities.includes('efficient_pumps') ? 0.8 : 1);
  let pv = 0;
  let feedIn = 0;
  if (s.building.amenities.includes('solar')) {
    pv = e.pvKwp * solarYield(s.day, s.seed);
    const selfCommon = Math.min(common, pv);
    common -= selfCommon;
    feedIn = pv - selfCommon;
  }
  return { heatKwh: heat, hotWaterKwh: hotWater, commonKwh: common, pvKwh: pv, feedInKwh: feedIn, waterM3: water, dd };
}

export function accumulateEnergy(s: GameState) {
  const d = dailyEnergy(s);
  const m = s.energyMonth;
  const heatPrice = heatPricePerKwh(s);
  let heatCost = (d.heatKwh + d.hotWaterKwh) * heatPrice;
  let feed = d.feedInKwh;
  // Wärmepumpe nutzt einen Teil des Solarüberschusses direkt
  if (s.building.heatingSystem === 'heat_pump' && feed > 0) {
    const hpElec = (d.heatKwh + d.hotWaterKwh) / heatingEfficiency(s);
    const used = Math.min(feed * 0.5, hpElec);
    heatCost -= used * CONFIG.energy.heating.heat_pump.pricePerKwh * energyPrice(s);
    feed -= used;
  }
  m.heatKwh += d.heatKwh;
  m.hotWaterKwh += d.hotWaterKwh;
  m.commonKwh += d.commonKwh;
  m.pvKwh += d.pvKwh;
  m.waterM3 += d.waterM3;
  m.degreeDays += d.dd;
  m.heatCost += Math.max(0, heatCost);
  m.elecCost += d.commonKwh * CONFIG.energy.electricityPerKwh * energyPrice(s);
  m.waterCost += d.waterM3 * CONFIG.energy.waterPerM3;
  m.feedIn += feed * CONFIG.energy.feedInPerKwh;
}

/** Jährliche Einsparung einer Maßnahme grob abschätzen: Differenz zweier Zustände. */
export function annualEnergyCostEstimate(s: GameState): { heating: number; electricity: number; kwh: number } {
  const area = s.apartments.reduce((a, b) => a + b.area, 0);
  const heatKwh = heatLossCoefficient(s) * 2750 * area + 15 * area;
  const heating = Math.round(heatKwh * heatPricePerKwh(s));
  let common = CONFIG.energy.commonKwhPerDay * 365 * (s.building.amenities.includes('led_lighting') ? 0.65 : 1) * (s.building.amenities.includes('efficient_pumps') ? 0.8 : 1);
  let feedIn = 0;
  if (s.building.amenities.includes('solar')) {
    const pv = CONFIG.energy.pvKwp * 2.6 * 365;
    const self = Math.min(common, pv * 0.6);
    common -= self;
    feedIn = (pv - self) * CONFIG.energy.feedInPerKwh;
  }
  const electricity = Math.round(common * CONFIG.energy.electricityPerKwh * energyPrice(s) - feedIn);
  return { heating, electricity, kwh: heatKwh / heatingEfficiency(s) + common };
}
