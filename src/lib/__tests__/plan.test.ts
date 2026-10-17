import { WEEK, planIndexFor, waterForSession, waterPerInterval } from '../plan';

const monday = new Date(2026, 9, 12, 10, 0); // lunes 12/10/2026

describe('plan semanal', () => {
  it('el día 1 cae en el día elegido', () => {
    expect(planIndexFor(monday, 1)).toBe(0);
    expect(planIndexFor(monday, 0)).toBe(1);
    expect(planIndexFor(new Date(2026, 9, 11), 1)).toBe(6); // domingo
  });

  it('cada día tiene su duración y el descanso no tiene sesión', () => {
    expect(WEEK).toHaveLength(7);
    expect(WEEK.find((d) => d.kind === 'descanso')?.minutes).toBe(0);
    expect(WEEK.every((d) => d.kind === 'descanso' || d.minutes > 0)).toBe(true);
  });

  it('calcula el agua con la fórmula de Galpin según la duración del día', () => {
    expect(waterPerInterval(65)).toBe(140);
    expect(waterForSession(65, 60)).toBe(500);
    expect(waterForSession(65, 25)).toBeLessThan(waterForSession(65, 60));
    expect(waterForSession(65, 0)).toBe(0);
    expect(waterPerInterval(0)).toBe(0);
  });
});
