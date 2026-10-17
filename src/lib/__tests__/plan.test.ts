import { WEEK, changeKind, defaultPlan, normalizePlan, planDay, planIndexFor, waterForSession, waterPerInterval } from '../plan';

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

describe('plan editable', () => {
  it('por defecto coloca el día 1 en el día elegido', () => {
    const plan = defaultPlan(1); // lunes
    expect(plan.days[1]?.title).toBe(WEEK[0]?.title);
    expect(plan.days[0]?.title).toBe(WEEK[6]?.title); // domingo
  });

  it('un plan guardado incompleto vuelve al de por defecto', () => {
    expect(normalizePlan({ days: [1, 2] }, 1)).toEqual(defaultPlan(1));
    expect(normalizePlan(null, 1)).toEqual(defaultPlan(1));
  });

  it('respeta los cambios y limpia valores fuera de rango', () => {
    const days = defaultPlan(1).days.map((d) => ({ ...d }));
    days[3] = { title: 'Natación', kind: 'cardio', minutes: 999, effort: 'Suave', desc: 'x' };
    days[4] = { title: 'Yoga', kind: 'descanso', minutes: 30, effort: '', desc: '' };
    const plan = normalizePlan({ version: 1, days }, 1);
    expect(plan.days[3]).toMatchObject({ title: 'Natación', kind: 'cardio', minutes: 240, effort: 'Suave' });
    expect(plan.days[4]?.minutes).toBe(0);
    expect(planDay(plan, new Date(2026, 9, 14)).title).toBe('Natación'); // miércoles
  });

  it('al cambiar el tipo ajusta nombre y duración', () => {
    const rest = WEEK.find((d) => d.kind === 'descanso')!;
    const c = changeKind(rest, 'fuerza');
    expect(c).toMatchObject({ kind: 'fuerza', title: 'Fuerza', minutes: 45 });
    expect(changeKind({ ...c, title: 'Pesas en casa' }, 'descanso')).toMatchObject({ title: 'Pesas en casa', minutes: 0 });
  });
});
