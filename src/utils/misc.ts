export const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const round1 = (v: number) => Math.round(v * 10) / 10;
export const avg = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
export const cn = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');
