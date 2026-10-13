/**
 * Spielzeit: ganzzahlige Tage seit 1970-01-01 (UTC). Unabhängig von der realen Uhrzeit.
 */
export type GameDay = number;

const MS_PER_DAY = 86_400_000;

export interface Ymd {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export const toYmd = (d: GameDay): Ymd => {
  const date = new Date(d * MS_PER_DAY);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
};

export const fromYmd = (year: number, month: number, day: number): GameDay =>
  Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);

export const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();

export const monthKey = (d: GameDay): string => {
  const { year, month } = toYmd(d);
  return `${year}-${String(month).padStart(2, '0')}`;
};

export const monthKeyOf = (year: number, month: number): string => `${year}-${String(month).padStart(2, '0')}`;

export const firstOfMonth = (d: GameDay): GameDay => {
  const { year, month } = toYmd(d);
  return fromYmd(year, month, 1);
};

export const addMonths = (d: GameDay, n: number): GameDay => {
  const { year, month, day } = toYmd(d);
  const total = year * 12 + (month - 1) + n;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return fromYmd(y, m, Math.min(day, daysInMonth(y, m)));
};

export const dayOfYear = (d: GameDay): number => {
  const { year } = toYmd(d);
  return d - fromYmd(year, 1, 1);
};

export const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
export const daysInYear = (y: number) => (isLeapYear(y) ? 366 : 365);

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const WEEKDAYS = ['Do', 'Fr', 'Sa', 'So', 'Mo', 'Di', 'Mi']; // 1970-01-01 war ein Donnerstag

export const monthName = (m: number) => MONTHS[m - 1];
export const weekday = (d: GameDay) => WEEKDAYS[((d % 7) + 7) % 7];

export const formatDate = (d: GameDay): string => {
  const { year, month, day } = toYmd(d);
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`;
};

export const formatDateLong = (d: GameDay): string => {
  const { year, month, day } = toYmd(d);
  return `${weekday(d)}, ${day}. ${MONTHS[month - 1]} ${year}`;
};

export const formatPeriod = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS_SHORT[m - 1]} ${String(y).slice(2)}`;
};

export const formatPeriodLong = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export const seasonOf = (d: GameDay): Season => {
  const { month } = toYmd(d);
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
};
export const SEASON_LABEL: Record<Season, string> = { winter: 'Winter', spring: 'Frühling', summer: 'Sommer', autumn: 'Herbst' };

export const monthsBetween = (a: GameDay, b: GameDay): number => {
  const ya = toYmd(a);
  const yb = toYmd(b);
  return (yb.year - ya.year) * 12 + (yb.month - ya.month) - (yb.day < ya.day ? 1 : 0);
};
