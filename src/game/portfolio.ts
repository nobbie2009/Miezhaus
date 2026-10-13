import type { GameState, Property } from '@/domain/schema';

/**
 * Mehrere Immobilien: Das Stammhaus liegt direkt im Spielstand, weitere Objekte in
 * `properties`. Eine Objekt-Sicht ist ein Proxy auf den Spielstand, bei dem alle
 * objektbezogenen Felder auf das jeweilige Objekt umgeleitet werden. Konto, Journal,
 * Kredite, Nachrichten, Markt und Zufallsgenerator bleiben gemeinsam. Dadurch läuft
 * die gesamte Spiellogik unverändert für jedes Objekt.
 */
export const PROPERTY_KEYS = new Set<string>([
  'building',
  'apartments',
  'tenants',
  'contracts',
  'claims',
  'defects',
  'jobs',
  'services',
  'insuranceClaims',
  'applicants',
  'energyMonth',
  'energyHistory',
  'counters',
  'purchaseDay',
  'purchasePrice',
]);

const ROOT = '__root';
const cache = new WeakMap<object, Map<Property, GameState>>();

export function propertyView(root: GameState, prop: Property): GameState {
  let m = cache.get(root);
  if (!m) cache.set(root, (m = new Map()));
  const hit = m.get(prop);
  if (hit) return hit;
  const view = new Proxy(root, {
    get(t, k, r) {
      if (k === ROOT) return t;
      if (typeof k === 'string' && PROPERTY_KEYS.has(k)) return (prop as Record<string, unknown>)[k];
      return Reflect.get(t, k, r);
    },
    set(t, k, v, r) {
      if (typeof k === 'string' && PROPERTY_KEYS.has(k)) {
        (prop as Record<string, unknown>)[k] = v;
        return true;
      }
      return Reflect.set(t, k, v, r);
    },
  });
  m.set(prop, view);
  return view;
}

/** Spielstand-Wurzel zu einer (Objekt-)Sicht. */
export const rootOf = (s: GameState): GameState => ((s as unknown as Record<string, GameState>)[ROOT] ?? s);
export const isRoot = (s: GameState) => rootOf(s) === s;

/** Sichten auf alle Objekte, Stammhaus zuerst. */
export function allViews(s: GameState): GameState[] {
  const root = rootOf(s);
  return [root, ...root.properties.map((p) => propertyView(root, p))];
}

export function viewById(s: GameState, buildingId: string | null | undefined): GameState {
  const root = rootOf(s);
  if (!buildingId || root.building.id === buildingId) return root;
  const p = root.properties.find((x) => x.building.id === buildingId);
  return p ? propertyView(root, p) : root;
}

export const propertyCount = (s: GameState) => rootOf(s).properties.length + 1;
