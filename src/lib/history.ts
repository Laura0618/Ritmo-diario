import type { Habit } from '../types';
import { MONTHS, dateKey, weekStart } from './time';

const INITIALS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const;

/** Ultimos `n` dias hasta hoy incluido, del mas antiguo al mas reciente. */
export function lastDays(today: Date, n: number): Date[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
}

export interface HistoryCell {
  day: string;
  label: string;
  /** Inicial del dia de la semana (L, M, X...). */
  initial: string;
  done: boolean;
  today: boolean;
}

export interface HabitHistory {
  cells: HistoryCell[];
  doneDays: number;
  /** Solo semanales: semanas (lunes a domingo) que tocan el periodo. */
  weeks: { current: number; met: number; total: number };
}

/** Casillas de un habito en `days` y resumen por semanas. */
export function habitHistory(
  habit: Habit,
  days: readonly Date[],
  today: Date,
  isChecked: (day: string, id: string) => boolean,
): HabitHistory {
  const todayKey = dateKey(today);
  const cells = days.map((d) => {
    const day = dateKey(d);
    return { day, label: `${d.getDate()} ${MONTHS[d.getMonth()]}`, initial: INITIALS[d.getDay()] ?? '', done: isChecked(day, habit.id), today: day === todayKey };
  });
  const doneDays = cells.filter((c) => c.done).length;

  const weeks = { current: 0, met: 0, total: 0 };
  if (habit.freq.per === 'week') {
    const target = habit.freq.times;
    const thisWeek = weekStart(today);
    const starts = [...new Set(days.map((d) => weekStart(d)))];
    for (const ws of starts) {
      let count = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(ws);
        d.setDate(d.getDate() + i);
        if (isChecked(dateKey(d), habit.id)) count++;
      }
      if (ws === thisWeek) weeks.current = count;
      if (count >= target) weeks.met++;
      weeks.total++;
    }
  }
  return { cells, doneDays, weeks };
}
