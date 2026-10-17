import { maxHeartRate, planIndexFor, waterForSession, waterPerInterval, zoneBpm } from '../plan';

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
