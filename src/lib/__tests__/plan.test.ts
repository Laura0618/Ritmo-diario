import { DEFAULT_SETTINGS, buildDayItems, maxHeartRate, nextItem, planIndexFor, waterForSession, waterPerInterval, zoneBpm } from '../plan';
import { since, toMinutes } from '../time';

const monday = new Date(2026, 9, 12, 10, 0); // lunes 12/10/2026

describe('plan semanal', () => {
  it('el día 1 cae en el día elegido', () => {
    expect(planIndexFor(monday, 1)).toBe(0);
    expect(planIndexFor(monday, 0)).toBe(1);
    expect(planIndexFor(new Date(2026, 9, 11), 1)).toBe(6); // domingo
  });

  it('calcula la FC máxima con la fórmula por sexo', () => {
    expect(maxHeartRate(35, 'f')).toBeCloseTo(175.2);
    expect(maxHeartRate(35, 'm')).toBeCloseTo(183.5);
    expect(zoneBpm(175.2, [0.6, 0.7])).toEqual([105, 123]);
  });

  it('calcula el agua con la fórmula de Galpin', () => {
    expect(waterPerInterval(65)).toBe(140);
    expect(waterForSession(65, 60)).toBe(500);
    expect(waterPerInterval(0)).toBe(0);
  });
});

describe('plan de hoy', () => {
  const items = buildDayItems(DEFAULT_SETTINGS, monday);
  const W = toMinutes(DEFAULT_SETTINGS.wake);

  it('tiene 15 tareas ordenadas desde el despertar', () => {
    expect(items).toHaveLength(15);
    const rel = items.map((i) => since(i.t, W));
    expect([...rel].sort((a, b) => a - b)).toEqual(rel);
    expect(items[0]?.id).toBe('agua');
    expect(items[items.length - 1]?.id).toBe('dormir');
  });

  it('pone la última cafeína 10 h antes de dormir', () => {
    expect(items.find((i) => i.id === 'corte')?.t).toBe(toMinutes('13:00'));
  });

  it('usa el entrenamiento del día', () => {
    expect(items.find((i) => i.id === 'mover')?.what).toBe('Entrenamiento: Cardio largo');
  });

  it('funciona con horarios que cruzan la medianoche', () => {
    const late = buildDayItems({ ...DEFAULT_SETTINGS, wake: '10:00', bed: '02:00' }, monday);
    expect(late[late.length - 1]?.id).toBe('dormir');
    expect(late.find((i) => i.id === 'dormir')?.t).toBe(120);
  });

  it('la siguiente tarea salta las ya hechas', () => {
    const at8 = toMinutes('08:00');
    expect(nextItem(items, {}, at8, '07:00')?.id).toBe('cafe');
    expect(nextItem(items, { cafe: true }, at8, '07:00')?.id).toBe('mover');
    const all = Object.fromEntries(items.map((i) => [i.id, true]));
    expect(nextItem(items, all, at8, '07:00')).toBeNull();
  });
});
