import { habitStreak, monthGrid, monthScore, trackingStart, weekSummary } from '../history';
import { weekStart } from '../time';
import type { Habit } from '../../types';

const today = new Date(2026, 9, 15, 12, 0); // jueves 15/10/2026
const base = { source: 'propio', what: 'X', how: '', tag: 'cuerpo', time: null } as const;
const daily: Habit = { ...base, id: 'd', freq: { per: 'day' } };
const weekly: Habit = { ...base, id: 'w', freq: { per: 'week', times: 2 } };
const checker = (set: Record<string, string[]>) => (day: string, id: string) => (set[id] ?? []).includes(day);

describe('historial', () => {
  it('el inicio es el primer día con alguna casilla', () => {
    const start = trackingStart(['check:2026-10-08:d', 'check:2026-10-03:w', 'habits'], today);
    expect(start).toEqual(new Date(2026, 9, 3));
    expect(trackingStart([], today)).toEqual(new Date(2026, 9, 15));
  });

  it('el resumen semanal solo cuenta días vividos desde el inicio', () => {
    const isChecked = checker({ d: ['2026-10-14', '2026-10-15'], w: ['2026-10-13'] });
    const start = new Date(2026, 9, 14); // empezó el miércoles
    const s = weekSummary([daily, weekly], weekStart(today), today, start, isChecked);
    // diario: 2 de 2 días contables; semanal: 1 de 2 -> 3/4
    expect(s.pct).toBe(75);
    expect(s.days.filter((d) => d.future)).toHaveLength(3);
    expect(s.days.filter((d) => d.beforeStart)).toHaveLength(2);
  });

  it('hoy sin marcar no rompe la racha diaria', () => {
    const isChecked = checker({ d: ['2026-10-10', '2026-10-12', '2026-10-13', '2026-10-14'] });
    const s = habitStreak(daily, today, new Date(2026, 9, 1), isChecked);
    expect(s).toEqual({ current: 3, best: 3, unit: 'día' });
  });

  it('cuenta semanas cumplidas seguidas en hábitos semanales', () => {
    const isChecked = checker({ w: ['2026-09-28', '2026-09-30', '2026-10-06', '2026-10-08', '2026-10-14'] });
    const s = habitStreak(weekly, today, new Date(2026, 8, 1), isChecked);
    expect(s.current).toBe(2);
    expect(s.best).toBe(2);
  });

  it('la cuadrícula del mes empieza en lunes', () => {
    const cells = monthGrid(2026, 9); // octubre 2026 empieza en jueves
    expect(cells.slice(0, 3)).toEqual([null, null, null]);
    expect(cells[3]?.getDate()).toBe(1);
    expect(cells.length % 7).toBe(0);
    const isChecked = checker({ d: ['2026-10-01', '2026-10-15', '2026-10-20'] });
    expect(monthScore(daily, 2026, 9, today, new Date(2026, 9, 1), isChecked)).toEqual({ done: 2, total: 15 });
  });
});
