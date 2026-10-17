import type { Habit } from '../types';
import { dateKey, weekStart } from './time';

export type IsChecked = (day: string, id: string) => boolean;

/** Limite de dias hacia atras al buscar rachas. */
const MAX_LOOKBACK = 400;

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Los 7 dias (lunes a domingo) de la semana que empieza en `ws`. */
export function daysOfWeek(ws: number): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(new Date(ws), i));
}

/** Primer dia con alguna casilla marcada; antes de el no se cuenta como fallo. */
export function trackingStart(checkKeys: readonly string[], today: Date): Date {
  let min = dateKey(today);
  for (const k of checkKeys) {
    const day = k.split(':')[1];
    if (day && /^\d{4}-\d{2}-\d{2}$/.test(day) && day < min) min = day;
  }
  const [y, m, d] = min.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Veces marcadas un habito en la semana `ws`. */
export function weekCount(habit: Habit, ws: number, isChecked: IsChecked): number {
  return daysOfWeek(ws).filter((d) => isChecked(dateKey(d), habit.id)).length;
}

export interface DayStatus {
  date: Date;
  key: string;
  /** Habitos diarios hechos / habitos diarios a contar ese dia. */
  done: number;
  total: number;
  future: boolean;
  beforeStart: boolean;
}

export function dayStatus(habits: readonly Habit[], date: Date, today: Date, start: Date, isChecked: IsChecked): DayStatus {
  const key = dateKey(date);
  const daily = habits.filter((h) => h.freq.per === 'day');
  const future = date > startOfDay(today);
  const beforeStart = date < start;
  const done = daily.filter((h) => isChecked(key, h.id)).length;
  return { date, key, done, total: daily.length, future, beforeStart };
}

export interface WeekSummary {
  days: DayStatus[];
  /** Porcentaje de lo que tocaba hasta hoy; null si aun no hay nada que contar. */
  pct: number | null;
}

/**
 * Cumplimiento de una semana: dias hechos de los habitos diarios (solo dias ya
 * vividos y desde que empezaste a registrar) mas veces de los semanales hasta su objetivo.
 */
export function weekSummary(
  habits: readonly Habit[],
  ws: number,
  today: Date,
  start: Date,
  isChecked: IsChecked,
): WeekSummary {
  const days = daysOfWeek(ws).map((d) => dayStatus(habits, d, today, start, isChecked));
  let done = 0;
  let possible = 0;
  for (const d of days) {
    if (d.future || d.beforeStart) continue;
    done += d.done;
    possible += d.total;
  }
  const weekEnd = addDays(new Date(ws), 6);
  if (weekEnd >= start && new Date(ws) <= startOfDay(today)) {
    for (const h of habits) {
      if (h.freq.per !== 'week') continue;
      done += Math.min(weekCount(h, ws, isChecked), h.freq.times);
      possible += h.freq.times;
    }
  }
  return { days, pct: possible ? Math.round((done / possible) * 100) : null };
}

export interface Streak {
  current: number;
  best: number;
  unit: 'día' | 'semana';
}

/**
 * Racha actual y mejor racha. Diarios: dias seguidos; semanales: semanas cumplidas seguidas.
 * Hoy (o esta semana) sin completar todavia no rompe la racha.
 */
export function habitStreak(habit: Habit, today: Date, start: Date, isChecked: IsChecked): Streak {
  const t = startOfDay(today);
  const ok: boolean[] = [];
  if (habit.freq.per === 'day') {
    for (let i = 0; i < MAX_LOOKBACK; i++) {
      const d = addDays(t, -i);
      if (d < start) break;
      ok.push(isChecked(dateKey(d), habit.id));
    }
  } else {
    const target = habit.freq.times;
    for (let i = 0; i < MAX_LOOKBACK / 7; i++) {
      const ws = weekStart(addDays(t, -7 * i));
      if (addDays(new Date(ws), 6) < start) break;
      ok.push(weekCount(habit, ws, isChecked) >= target);
    }
  }
  // ok[0] es hoy / esta semana.
  let current = 0;
  for (let i = ok[0] ? 0 : 1; i < ok.length && ok[i]; i++) current++;
  let best = 0;
  let run = 0;
  for (const v of ok) {
    run = v ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { current, best, unit: habit.freq.per === 'day' ? 'día' : 'semana' };
}

/** Celdas de un mes empezando en lunes; null rellena los huecos. */
export function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let i = 1; i <= count; i++) cells.push(new Date(year, month, i));
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** Dias hechos / dias contables de un habito en un mes (hasta hoy y desde el inicio). */
export function monthScore(habit: Habit, year: number, month: number, today: Date, start: Date, isChecked: IsChecked) {
  let done = 0;
  let total = 0;
  const t = startOfDay(today);
  for (const d of monthGrid(year, month)) {
    if (!d || d > t || d < start) continue;
    total++;
    if (isChecked(dateKey(d), habit.id)) done++;
  }
  return { done, total };
}

