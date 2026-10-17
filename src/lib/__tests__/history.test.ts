import { habitHistory, lastDays } from '../history';
import { dateKey } from '../time';
import type { Habit } from '../../types';

const today = new Date(2026, 9, 15, 12, 0); // jueves 15/10/2026
const base = { source: 'propio', what: 'X', how: '', tag: 'cuerpo', time: null } as const;

describe('historial', () => {
  it('lastDays devuelve n días acabando hoy', () => {
    const days = lastDays(today, 7);
    expect(days).toHaveLength(7);
    expect(dateKey(days[6]!)).toBe('2026-10-15');
    expect(dateKey(days[0]!)).toBe('2026-10-09');
  });

  it('cuenta días hechos de un hábito diario', () => {
    const habit: Habit = { ...base, id: 'h', freq: { per: 'day' } };
    const done = new Set(['2026-10-15', '2026-10-13']);
    const h = habitHistory(habit, lastDays(today, 7), today, (d) => done.has(d));
    expect(h.doneDays).toBe(2);
    expect(h.cells[6]!.today).toBe(true);
  });

  it('resume semanas cumplidas de un hábito semanal', () => {
    const habit: Habit = { ...base, id: 'w', freq: { per: 'week', times: 2 } };
    // Semana del 5/10: 2 hechos (cumplida). Semana del 12/10: 1 hecho.
    const done = new Set(['2026-10-06', '2026-10-08', '2026-10-14']);
    const h = habitHistory(habit, lastDays(today, 7), today, (d) => done.has(d));
    expect(h.weeks).toEqual({ current: 1, met: 1, total: 2 });
  });
});
