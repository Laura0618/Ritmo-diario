import type { Settings, WeekDay } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  wake: '07:00',
  bed: '23:00',
  sunset: '19:30',
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

export function planDayFor(date: Date, day1: number): WeekDay {
  return WEEK[planIndexFor(date, day1)] ?? WEEK[0]!;
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
