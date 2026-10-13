import type { Apartment, ComponentKey, GameState } from '@/domain/schema';
import { APARTMENT_DEFECT_POOL, COMPONENT_DEFECT_POOL, DEFECT_TYPES } from '@/content/defects';
import { COMPONENTS } from '@/content/components';
import { seasonOf } from '@/utils/date';
import { clamp } from '@/utils/misc';
import type { Rng } from '@/utils/rng';
import { CONFIG } from './config';
import { createDefect, discoverDefect } from './defects';
import { activeTenants, persons } from './derived';
import { log } from './messages';

const PLAN_COMPONENTS: ComponentKey[] = ['heating', 'electrical', 'pipes', 'sanitary', 'roof'];

export function diff(s: GameState) {
  return CONFIG.difficulty[s.settings.difficulty];
}

/** Täglicher Verschleiß aller Gebäudekomponenten. */
export function wearComponents(s: GameState) {
  const season = seasonOf(s.day);
  const caretaker = s.services.caretaker !== 'none';
  for (const key of Object.keys(s.building.components) as ComponentKey[]) {
    const c = s.building.components[key]!;
    let w = CONFIG.components.wearPerYear[key] / 365;
    w *= 1 + Math.max(0, 60 - c.condition) / 80;
    w *= 1.25 - c.tier * 0.1;
    const maintained = c.lastMaintenanceDay !== null && s.day - c.lastMaintenanceDay < CONFIG.components.maintenanceEffectDays;
    if (maintained) w *= 1 - CONFIG.components.maintenanceWearReduction;
    if (caretaker) w *= 0.88;
    if (['roof', 'facade', 'outdoor'].includes(key)) w *= season === 'winter' ? 1.4 : season === 'autumn' ? 1.2 : 1;
    if (key === 'heating') w *= season === 'winter' ? 1.6 : season === 'summer' ? 0.45 : 1;
    if (key === 'stairwell') w *= 0.6 + persons(s) / 25 + (s.building.cleanliness < 40 ? 0.4 : 0);
    if (key === 'outdoor') {
      w *= s.services.garden === 'none' ? 1.3 : 0.6;
      if (s.building.amenities.includes('garden')) w *= 0.8;
    }
    c.condition = clamp(c.condition - w);
  }
  // Wartungsvertrag: jährliche Wartung der Haustechnik
  if (s.services.maintenancePlan) {
    for (const key of PLAN_COMPONENTS) {
      const c = s.building.components[key]!;
      if (c.lastMaintenanceDay === null || s.day - c.lastMaintenanceDay >= 365) {
        c.lastMaintenanceDay = s.day;
        c.condition = clamp(c.condition + COMPONENTS[key].maintenanceGain * 0.6);
        for (const d of s.defects.filter((x) => x.resolvedDay === null && !x.discovered && x.target.kind === 'component' && x.target.key === key)) {
          discoverDefect(s, d, 'Bei der Wartung im Rahmen des Wartungsvertrags entdeckt.');
        }
        log(s, `Wartungsvertrag: ${COMPONENTS[key].maintenanceLabel} durchgeführt.`, 'maintenance');
      }
    }
  }
  s.building.fireSafety = clamp(s.building.fireSafety - 2 / 365);
}

/** Pflegezustände (Sauberkeit, Außenanlagen), die von Dienstleistungen abhängen. */
export function updateCare(s: GameState) {
  const b = s.building;
  const season = seasonOf(s.day);
  const tenants = activeTenants(s).filter((t) => t.apartmentId);
  const avgTidy = tenants.length ? tenants.reduce((a, t) => a + t.traits.tidiness, 0) / tenants.length : 50;
  let clean = -1.1 - persons(s) / 40;
  switch (s.services.cleaning) {
    case 'weekly':
      clean += 2.6;
      break;
    case 'biweekly':
      clean += 1.8;
      break;
    case 'tenants':
      clean += 0.4 + (avgTidy / 100) * 1.3;
      break;
    default:
      clean += 0.3 + (avgTidy / 100) * 0.4;
  }
  if (s.services.caretaker !== 'none') clean += s.services.caretaker === 'fulltime' ? 1 : 0.5;
  b.cleanliness = clamp(b.cleanliness + clean, 0, s.services.cleaning === 'weekly' ? 98 : 92);

  let care = season === 'spring' || season === 'summer' ? -0.85 : -0.3;
  if (s.services.garden === 'monthly') care += 0.75;
  if (s.services.garden === 'biweekly') care += 1.3;
  if (s.services.caretaker !== 'none') care += 0.4;
  if ((s.counters.gardenVolunteer ?? 0) > 0) care += 0.6;
  if (b.amenities.includes('waste_sorting')) care += 0.1;
  b.outdoorCare = clamp(b.outdoorCare + care);
  // Ungepflegter Außenbereich zieht den Bauteilzustand mit
  if (b.outdoorCare < 35) b.components.outdoor!.condition = clamp(b.components.outdoor!.condition - 0.03);
}

/** Entstehung neuer Schäden an Gebäudekomponenten – abhängig vom Zustand. */
export function generateComponentDefects(s: GameState, rng: Rng) {
  const season = seasonOf(s.day);
  for (const key of Object.keys(s.building.components) as ComponentKey[]) {
    const c = s.building.components[key]!;
    const wearShare = (100 - c.condition) / 100;
    let p = CONFIG.components.defectBaseRatePerDay * wearShare ** 3 * diff(s).defectFactor;
    if (key === 'heating') p *= season === 'winter' ? 2.2 : season === 'summer' ? 0.3 : 1;
    if (key === 'pipes') p *= season === 'winter' ? 1.5 : 1;
    if (key === 'roof') p *= season === 'autumn' ? 1.4 : 1;
    if (key === 'outdoor') {
      p *= s.building.outdoorCare < 40 ? 2.2 : 0.8;
      if (s.building.amenities.includes('waste_sorting')) p *= 0.7;
    }
    if (key === 'stairwell' && s.building.cleanliness < 35) p *= 1.6;
    if (!rng.chance(p)) continue;
    const pool = COMPONENT_DEFECT_POOL[key].filter((x) => x.minSeverityCondition === undefined || c.condition < x.minSeverityCondition);
    if (!pool.length) continue;
    const type = rng.weighted(pool.map((x) => ({ item: x.id, weight: x.weight })));
    const def = DEFECT_TYPES[type];
    const hidden = rng.chance(def.hiddenChance);
    createDefect(s, type, { kind: 'component', key }, { cause: causeText(key, c.condition), discovered: !hidden, rng });
  }
}

function causeText(key: ComponentKey, cond: number): string {
  const label = COMPONENTS[key].label;
  if (cond < 30) return `Ursache: ${label} ist stark verschlissen (Zustand ${Math.round(cond)} %).`;
  if (cond < 55) return `Ursache: Alterung – ${label} im Zustand ${Math.round(cond)} %.`;
  return `Ursache: normaler Verschleiß (${label} ${Math.round(cond)} %).`;
}

/** Wohnungsverschleiß und neue Schäden in Wohnungen. */
export function updateApartments(s: GameState, rng: Rng) {
  for (const a of s.apartments) {
    const t = a.tenantId ? s.tenants.find((x) => x.id === a.tenantId) : null;
    let w = CONFIG.apartments.wearPerYear / 365;
    if (t) {
      w *= 1.4 - t.traits.tidiness / 100;
      w *= t.pets ? 1.2 : 1;
      w *= Math.pow(t.householdSize / 2, 0.3);
    } else w *= 0.2;
    a.condition = clamp(a.condition - w);

    if (a.status === 'renovating') continue;
    let p = CONFIG.apartments.defectBaseRatePerDay * (1 + (100 - a.condition) / 40) * (1 + (3 - a.bath) * 0.15 + (3 - a.kitchen) * 0.1) * diff(s).defectFactor;
    if (!t) p *= 0.3;
    if (!rng.chance(p)) continue;
    const moldRisk = moldRiskFactor(s, a, t?.traits.tidiness ?? 60);
    const pool = APARTMENT_DEFECT_POOL.map((x) => ({
      item: x.id,
      weight: x.weight * (x.area === 'bath' ? 1 + (3 - a.bath) * 0.4 : x.area === 'kitchen' ? 1 + (3 - a.kitchen) * 0.4 : 1) * (x.id === 'apt_mold' ? moldRisk : 1),
    }));
    const type = rng.weighted(pool);
    createDefect(s, type, { kind: 'apartment', apartmentId: a.id }, {
      cause: type === 'apt_mold' ? moldCause(s, a) : `Ursache: Abnutzung (Wohnungszustand ${Math.round(a.condition)} %).`,
      discovered: false,
      rng,
    });
  }
}

function moldRiskFactor(s: GameState, a: Apartment, tidiness: number) {
  const win = s.building.components.windows!;
  let f = 1 + (100 - win.condition) / 60 + (win.tier <= 2 ? 0.5 : 0) + (100 - tidiness) / 150;
  if (s.defects.some((d) => d.resolvedDay === null && (d.type === 'facade_moisture' || d.type === 'window_draft'))) f += 1;
  if (a.floor === 0 && s.building.components.basement!.condition < 50) f += 0.6;
  return f;
}

function moldCause(s: GameState, a: Apartment) {
  const win = s.building.components.windows!;
  if (win.condition < 50 || win.tier <= 2) return `Ursache: Kondensat an alten Fenstern (Fensterzustand ${Math.round(win.condition)} %).`;
  if (a.floor === 0) return 'Ursache: aufsteigende Feuchtigkeit aus dem Keller.';
  return 'Ursache: unzureichendes Lüften und kalte Wandoberflächen.';
}
