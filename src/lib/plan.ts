import type { Settings, WeekDay } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  wake: '07:00',
  bed: '23:00',
  sunrise: '08:00',
  sunset: '19:30',
  sunAuto: true,
  lat: null,
  lon: null,
  day1: 1,
  kg: 65,
};

/**
 * Plan base de ejercicio: 3 sesiones de cardio, 3 de fuerza y 1 de descanso.
 * Es una guia: el orden se puede cambiar si un dia no encaja.
 */
export const WEEK: readonly WeekDay[] = [
  {
    title: 'Cardio largo',
    kind: 'cardio',
    minutes: 60,
    effort: 'Suave y continuo: puedes hablar o respirar solo por la nariz.',
    desc: '45–75 min seguidos. Si empiezas de cero, 15–20 min y suma unos minutos cada semana.',
  },
  {
    title: 'Fuerza: piernas',
    kind: 'fuerza',
    minutes: 50,
    effort: 'Series cerca del fallo, con buena técnica.',
    desc: 'Cuádriceps, isquiotibiales y gemelos. Glúteos y lumbares trabajan de forma indirecta.',
  },
  {
    title: 'Descanso',
    kind: 'descanso',
    minutes: 0,
    effort: 'Recuperar también es entrenar.',
    desc: 'Camina 7.000–10.000 pasos. Movilidad suave si te apetece.',
  },
  {
    title: 'Fuerza: torso',
    kind: 'fuerza',
    minutes: 50,
    effort: 'Series cerca del fallo, con buena técnica.',
    desc: 'Pecho, espalda, abdomen y core. Cuello opcional.',
  },
  {
    title: 'Cardio medio',
    kind: 'cardio',
    minutes: 35,
    effort: 'Respiras fuerte, pero sin ahogarte.',
    desc: '5 min de calentamiento y 25–30 min a ritmo sostenido.',
  },
  {
    title: 'Cardio intenso',
    kind: 'cardio',
    minutes: 25,
    effort: 'Esfuerzo real en los intervalos; recupera bien entre ellos.',
    desc: 'Calienta 5–10 min. Luego 6–17 min de trabajo: 30 s a tope y 60 s suave (6–12 rondas), 4×4 noruego o test de Cooper de 12 min.',
  },
  {
    title: 'Fuerza: hombros y brazos',
    kind: 'fuerza',
    minutes: 45,
    effort: 'Series cerca del fallo, con buena técnica.',
    desc: 'Hombros, bíceps, tríceps, abdomen y core. Antebrazos y cuello opcionales.',
  },
];

/** Posicion (0-6) del plan semanal que corresponde a `date`. */
export function planIndexFor(date: Date, day1: number): number {
  return (((date.getDay() - day1) % 7) + 7) % 7;
}

/**
 * Agua durante el ejercicio (formula de Galpin): peso en libras / 30 = onzas cada 15-20 min.
 * Devuelve mililitros por intervalo, redondeados a 10 ml.
 */
export function waterPerInterval(kg: number): number {
  if (!Number.isFinite(kg) || kg <= 0) return 0;
  const ml = ((kg * 2.20462) / 30) * 29.5735;
  return Math.round(ml / 10) * 10;
}

/** Total aproximado de la sesion (un intervalo cada 17,5 min), redondeado a 50 ml. */
export function waterForSession(kg: number, minutes: number): number {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  const per = ((kg * 2.20462) / 30) * 29.5735;
  return Math.round((per * minutes) / 17.5 / 50) * 50;
}

/** Documento sincronizado `plan`: el ejercicio de cada día de la semana (índice 0 = domingo, como Date.getDay). */
export const PLAN_DOC = 'plan';

export interface WeekPlan {
  version: 1;
  days: WeekDay[];
}

const KINDS: readonly WeekDay['kind'][] = ['cardio', 'fuerza', 'descanso'];

/** Plan por defecto: el plan base colocado a partir del día 1 elegido. */
export function defaultPlan(day1: number): WeekPlan {
  const days = Array.from({ length: 7 }, (_, weekday) => ({ ...WEEK[(((weekday - day1) % 7) + 7) % 7]! }));
  return { version: 1, days };
}

function normalizeDay(raw: unknown, fallback: WeekDay): WeekDay {
  if (!raw || typeof raw !== 'object') return fallback;
  const d = raw as Partial<WeekDay>;
  const kind = KINDS.includes(d.kind as WeekDay['kind']) ? (d.kind as WeekDay['kind']) : fallback.kind;
  const minutes = kind === 'descanso' ? 0 : Math.max(0, Math.min(240, Math.round(Number(d.minutes) || 0)));
  return {
    title: typeof d.title === 'string' ? d.title.slice(0, 60) : fallback.title,
    kind,
    minutes,
    effort: typeof d.effort === 'string' ? d.effort.slice(0, 160) : '',
    desc: '',
  };
}

/** Plan guardado o, si no hay, el de por defecto. */
export function normalizePlan(raw: unknown, day1: number): WeekPlan {
  const base = defaultPlan(day1);
  const days = (raw as Partial<WeekPlan> | null)?.days;
  if (!Array.isArray(days) || days.length !== 7) return base;
  return { version: 1, days: base.days.map((fb, i) => normalizeDay(days[i], fb)) };
}

/** Sesión del día de `date` en el plan. */
export function planDay(plan: WeekPlan, date: Date): WeekDay {
  return plan.days[date.getDay()] ?? plan.days[0]!;
}

/** Valores al cambiar el tipo de sesión de un día. */
export function changeKind(day: WeekDay, kind: WeekDay['kind']): WeekDay {
  if (kind === day.kind) return day;
  const titles: Record<WeekDay['kind'], string> = { cardio: 'Cardio', fuerza: 'Fuerza', descanso: 'Descanso' };
  const isDefaultTitle = Object.values(titles).includes(day.title) || WEEK.some((w) => w.title === day.title);
  return {
    ...day,
    kind,
    title: isDefaultTitle ? titles[kind] : day.title,
    minutes: kind === 'descanso' ? 0 : day.minutes || 45,
    effort: isDefaultTitle ? '' : day.effort,
  };
}
