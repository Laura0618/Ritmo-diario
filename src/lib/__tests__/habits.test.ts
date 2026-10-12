import { BOOK_HABITS, defaultHabitConfig, describeTime, normalizeHabitConfig, resolveTime } from '../habits';
import { DEFAULT_SETTINGS, buildDayItems } from '../plan';
import { toMinutes } from '../time';

const monday = new Date(2026, 9, 12, 10, 0);

describe('hábitos', () => {
  it('empieza solo con los 5 esenciales', () => {
    const c = defaultHabitConfig();
    expect(c.onboarded).toBe(false);
    expect(Object.keys(c.enabled).sort()).toEqual(['cafe', 'corte', 'dormir', 'luces', 'luz']);
    expect(BOOK_HABITS).toHaveLength(15);
    expect(new Set(BOOK_HABITS.map((h) => h.id)).size).toBe(15);
  });

  it('resuelve horas relativas y fijas', () => {
    expect(resolveTime({ anchor: 'wake', offset: 75 }, DEFAULT_SETTINGS)).toBe(toMinutes('08:15'));
    expect(resolveTime({ anchor: 'bed', offset: -600 }, DEFAULT_SETTINGS)).toBe(toMinutes('13:00'));
    expect(resolveTime({ anchor: 'sunset', offset: -45 }, DEFAULT_SETTINGS)).toBe(toMinutes('18:45'));
    expect(resolveTime({ anchor: 'fixed', offset: 1290 }, DEFAULT_SETTINGS)).toBe(toMinutes('21:30'));
    expect(resolveTime({ anchor: 'bed', offset: 120 }, { ...DEFAULT_SETTINGS, bed: '23:30' })).toBe(toMinutes('01:30'));
  });

  it('describe la hora en lenguaje natural', () => {
    expect(describeTime({ anchor: 'wake', offset: 0 })).toBe('al despertar');
    expect(describeTime({ anchor: 'wake', offset: 75 })).toBe('1 h 15 min después de despertar');
    expect(describeTime({ anchor: 'bed', offset: -60 })).toBe('1 h antes de dormir');
    expect(describeTime({ anchor: 'sunset', offset: -45 })).toBe('45 min antes de la puesta de sol');
    expect(describeTime({ anchor: 'fixed', offset: 1290 })).toBe('a las 21:30');
  });

  it('completa documentos parciales', () => {
    const c = normalizeHabitConfig({ onboarded: true });
    expect(c.onboarded).toBe(true);
    expect(c.custom).toEqual([]);
    expect(c.enabled.luz).toBe(true);
  });
});

describe('plan del día con hábitos', () => {
  it('muestra solo los activos, con horas cambiadas y propios', () => {
    const items = buildDayItems(DEFAULT_SETTINGS, monday, {
      onboarded: true,
      enabled: { luz: true, dormir: true, paseo: false },
      times: { luz: { anchor: 'wake', offset: 30 } },
      custom: [{ id: 'c-1', what: 'Estiramientos', how: '', tag: 'cuerpo', time: { anchor: 'fixed', offset: 1260 } }],
    });
    expect(items.map((i) => i.id)).toEqual(['luz', 'c-1', 'dormir']);
    expect(items[0]?.t).toBe(toMinutes('07:30'));
    expect(items[1]?.t).toBe(toMinutes('21:00'));
  });

  it('sin hábitos activos, el plan está vacío', () => {
    expect(buildDayItems(DEFAULT_SETTINGS, monday, { onboarded: true, enabled: {}, times: {}, custom: [] })).toEqual([]);
  });
});
