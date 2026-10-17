import {
  ESSENTIAL_IDS,
  LIBRARY_HABITS,
  buildToday,
  defaultHabitConfig,
  describeFreq,
  describeTime,
  moveHabit,
  nextTimed,
  normalizeHabitConfig,
  resolveTime,
  todayProgress,
  weekDates,
} from '../habits';
import { DEFAULT_SETTINGS } from '../plan';
import { toMinutes } from '../time';
import type { HabitConfig } from '../../types';

const saturday = new Date(2026, 9, 17, 20, 0); // sábado 17/10/2026

describe('catálogo y configuración inicial', () => {
  it('convierte los 47 protocolos en hábitos con ids únicos', () => {
    expect(LIBRARY_HABITS).toHaveLength(47);
    expect(new Set(LIBRARY_HABITS.map((h) => h.id)).size).toBe(47);
  });

  it('empieza con los 5 esenciales pedidos, en orden', () => {
    const c = defaultHabitConfig();
    expect(c.list.map((h) => h.what)).toEqual([
      'Horario según tu cronotipo',
      'Cardio 3 veces por semana',
      'Fuerza 3 veces por semana',
      'Hidrátate',
      'Al menos un 90 % sin procesar',
    ]);
    expect(c.list.map((h) => h.id)).toEqual([...ESSENTIAL_IDS]);
    expect(c.list[1]?.freq).toEqual({ per: 'week', times: 3 });
    expect(c.list[0]?.time).toEqual({ anchor: 'bed', offset: 0 });
  });

  it('sustituye la configuración antigua por los esenciales', () => {
    expect(normalizeHabitConfig({ onboarded: true, enabled: { luz: true }, times: {}, custom: [] }).list).toHaveLength(5);
    expect(normalizeHabitConfig(null).list).toHaveLength(5);
    expect(normalizeHabitConfig({ version: 2, list: [] }).list).toEqual([]);
  });

  it('reordena', () => {
    const list = defaultHabitConfig().list;
    expect(moveHabit(list, 0, 2).map((h) => h.id)[2]).toBe('lib-sueno-4');
    expect(moveHabit(list, 4, 0)[0]?.id).toBe('lib-nutricion-1');
  });
});

describe('horas y textos', () => {
  it('resuelve horas', () => {
    expect(resolveTime({ anchor: 'wake', offset: 75 }, DEFAULT_SETTINGS)).toBe(toMinutes('08:15'));
    expect(resolveTime({ anchor: 'bed', offset: 120 }, { ...DEFAULT_SETTINGS, bed: '23:30' })).toBe(toMinutes('01:30'));
    expect(resolveTime({ anchor: 'fixed', offset: 1290 }, DEFAULT_SETTINGS)).toBe(toMinutes('21:30'));
  });

  it('describe hora y frecuencia', () => {
    expect(describeTime({ anchor: 'bed', offset: 0 })).toBe('al dormir');
    expect(describeTime({ anchor: 'wake', offset: 75 })).toBe('1 h 15 min después de despertar');
    expect(describeFreq({ per: 'day' })).toBe('Cada día');
    expect(describeFreq({ per: 'week', times: 3 })).toBe('3 veces por semana');
  });
});

describe('plan de hoy', () => {
  const config: HabitConfig = defaultHabitConfig();
  const week = weekDates(saturday);

  it('la semana va de lunes a domingo', () => {
    expect(week[0]).toBe('2026-10-12');
    expect(week[6]).toBe('2026-10-18');
  });

  it('cuenta los semanales y deja fuera los ya cumplidos', () => {
    const checks = new Set(['2026-10-12:lib-ejercicio-3', '2026-10-14:lib-ejercicio-3', '2026-10-16:lib-ejercicio-3', '2026-10-17:lib-nutricion-2']);
    const items = buildToday(config, DEFAULT_SETTINGS, saturday, (d, id) => checks.has(`${d}:${id}`));
    const cardio = items.find((i) => i.habit.id === 'lib-ejercicio-3')!;
    expect(cardio.weekDone).toBe(3);
    expect(cardio.weekMet).toBe(true);
    expect(todayProgress(items)).toEqual({ done: 1, total: 4 });
    expect(items.map((i) => i.habit.id)).toEqual([...ESSENTIAL_IDS]);
  });

  it('el siguiente con hora es el horario de dormir', () => {
    const items = buildToday(config, DEFAULT_SETTINGS, saturday, () => false);
    expect(nextTimed(items, toMinutes('20:00'), DEFAULT_SETTINGS.wake)?.habit.id).toBe('lib-sueno-4');
    const done = buildToday(config, DEFAULT_SETTINGS, saturday, (_d, id) => id === 'lib-sueno-4');
    expect(nextTimed(done, toMinutes('20:00'), DEFAULT_SETTINGS.wake)).toBeNull();
  });
});
