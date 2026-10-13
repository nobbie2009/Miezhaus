/**
 * Deterministischer Zufallsgenerator (mulberry32). Der Zustand liegt im Spielstand,
 * dadurch sind Simulationen mit gleichem Seed exakt reproduzierbar.
 */
export interface RngHolder {
  rng: number;
}

export class Rng {
  constructor(private holder: RngHolder) {}

  next(): number {
    let t = (this.holder.rng = (this.holder.rng + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  chance(p: number): boolean {
    if (p <= 0) return false;
    if (p >= 1) return true;
    return this.next() < p;
  }

  range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  int(min: number, maxInclusive: number): number {
    return Math.floor(this.range(min, maxInclusive + 1));
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  weighted<T>(items: readonly { item: T; weight: number }[]): T {
    const total = items.reduce((a, b) => a + Math.max(0, b.weight), 0);
    let r = this.next() * total;
    for (const it of items) {
      r -= Math.max(0, it.weight);
      if (r <= 0) return it.item;
    }
    return items[items.length - 1].item;
  }

  /** Näherungsweise normalverteilt (Summe von Gleichverteilungen). */
  normal(mean: number, sd: number): number {
    const u = this.next() + this.next() + this.next() + this.next() - 2;
    return mean + u * sd * 0.866;
  }
}

export const seedFromString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
