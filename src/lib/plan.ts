import type { DayChecks, DayItem, Settings, Sex, WeekDay } from '../types';
import { since, toMinutes, wrap } from './time';

export const DEFAULT_SETTINGS: Settings = {
  wake: '07:00',
  bed: '23:00',
  sunset: '19:30',
  day1: 1,
  age: 35,
  sex: 'f',
  kg: 65,
  mins: 60,
};

/** Plan base de ejercicio: 3 sesiones de fuerza, 3 de cardio y 1 de descanso. */
export const WEEK: readonly WeekDay[] = [
  {
    title: 'Cardio largo',
    kind: 'cardio',
    zone: [0.6, 0.7],
    desc: '45–75 min continuos. Si empiezas de cero, 15–20 min y suma unos minutos cada semana.',
  },
  {
    title: 'Fuerza: piernas',
    kind: 'fuerza',
    desc: 'Cuádriceps, isquiotibiales y gemelos. Glúteos y lumbares trabajan de forma indirecta.',
  },
  { title: 'Descanso', kind: 'descanso', desc: 'Camina 7.000–10.000 pasos. Movilidad suave si te apetece.' },
  { title: 'Fuerza: torso', kind: 'fuerza', desc: 'Pecho, espalda, abdomen y core. Cuello opcional.' },
  {
    title: 'Cardio medio',
    kind: 'cardio',
    zone: [0.75, 0.85],
    desc: '5 min de calentamiento y 25–30 min respirando fuerte pero sin ahogarte.',
  },
  {
    title: 'Cardio intenso',
    kind: 'cardio',
    zone: [0.9, 0.95],
    desc: 'Calienta 5–10 min. Luego 6–17 min de esfuerzo real: 30 s a tope y 60 s suave (6–12 rondas), 4×4 noruego o test de Cooper de 12 min.',
  },
  {
    title: 'Fuerza: hombros y brazos',
    kind: 'fuerza',
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

/** FC maxima estimada (formulas por sexo que cita el libro). */
export function maxHeartRate(age: number, sex: Sex): number {
  const a = Number.isFinite(age) && age > 0 ? age : DEFAULT_SETTINGS.age;
  return sex === 'm' ? 208 - 0.7 * a : 206 - 0.88 * a;
}

export function zoneBpm(maxHr: number, zone: readonly [number, number]): [number, number] {
  return [Math.round(maxHr * zone[0]), Math.round(maxHr * zone[1])];
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

/** Tareas del dia, ordenadas desde la hora de despertar. */
export function buildDayItems(settings: Settings, date: Date): DayItem[] {
  const W = toMinutes(settings.wake);
  const B = toMinutes(settings.bed);
  const SS = toMinutes(settings.sunset);
  const today = planDayFor(date, settings.day1);
  const zoneText = today.zone
    ? `Al ${Math.round(today.zone[0] * 100)}–${Math.round(today.zone[1] * 100)} % de tu FC máxima. `
    : '';

  const items: DayItem[] = [
    { id: 'agua', t: W, tag: 'cuerpo', what: 'Agua al despertar', how: '0,5–0,7 L antes del café.' },
    {
      id: 'medit',
      t: W,
      tag: 'estres',
      what: 'Micromeditación en la cama',
      how: '5 min. Si te entran ganas de levantarte, quédate: es entrenamiento de resiliencia.',
    },
    {
      id: 'luz',
      t: W + 10,
      tag: 'luz',
      what: 'Luz natural en los ojos',
      how: '5–10 min fuera, mirando hacia el sol sin fijar la vista. 10–30 min si está nublado. Sin gafas de sol ni cristal.',
    },
    {
      id: 'cafe',
      t: W + 75,
      tag: 'cuerpo',
      what: 'Primera cafeína',
      how: 'Retrásala entre 30 y 90 min tras despertar para evitar el bajón de la tarde.',
    },
    {
      id: 'mover',
      t: W + 120,
      tag: 'cuerpo',
      what: today.kind === 'descanso' ? 'Día de descanso activo' : `Entrenamiento: ${today.title}`,
      how:
        today.kind === 'descanso'
          ? today.desc
          : `${today.title}. ${zoneText}Mejor en las primeras 2–3 h del día.`,
    },
    {
      id: 'paseo',
      t: W + 360,
      tag: 'cuerpo',
      what: 'Paseo después de comer',
      how: '5–10 min. Y 5 min de movimiento por cada 30 sentada.',
    },
    { id: 'corte', t: B - 600, tag: 'sueno', what: 'Última cafeína', how: 'Nada de cafeína en las 8–10 h antes de dormir.' },
    {
      id: 'nsdr',
      t: W + 420,
      tag: 'estres',
      what: 'NSDR si notas el bajón',
      how: '10–20 min en lugar de siesta. Tienes la guía en Herramientas.',
    },
    {
      id: 'agua2',
      t: W + 600,
      tag: 'cuerpo',
      what: 'Unos 2,4 L de agua acumulados',
      how: 'Bebe sobre todo en las primeras 10 h para no despertarte de noche.',
    },
    {
      id: 'tarde',
      t: SS - 45,
      tag: 'luz',
      what: 'Luz del atardecer',
      how: '10–15 min fuera antes de la puesta, mirando hacia el oeste.',
    },
    {
      id: 'alcohol',
      t: B - 480,
      tag: 'sueno',
      what: 'Sin alcohol desde aquí',
      how: 'Si bebes, nada en las 8 h previas a dormir. Cuanto menos, mejor.',
    },
    {
      id: 'cena',
      t: B - 180,
      tag: 'sueno',
      what: 'Última comida',
      how: '2–3 h antes de dormir. Si tienes hambre real, algo ligero 1 h antes.',
    },
    {
      id: 'ducha',
      t: B - 90,
      tag: 'sueno',
      what: 'Ducha o baño caliente',
      how: 'Calentar manos y pies ayuda a que baje la temperatura central.',
    },
    {
      id: 'luces',
      t: B - 60,
      tag: 'luz',
      what: 'Luces bajas y pantallas fuera',
      how: 'Luz cálida o roja, nada de LED blanco. Dormitorio a 18–20 °C.',
    },
    {
      id: 'dormir',
      t: B,
      tag: 'sueno',
      what: 'A dormir',
      how: 'Pies y manos fuera de la manta. Si te despiertas, no mires el reloj ni enciendas luces.',
    },
  ];

  return items
    .map((item) => ({ ...item, t: wrap(item.t) }))
    .sort((a, b) => since(a.t, W) - since(b.t, W));
}

/**
 * Siguiente tarea pendiente: la primera sin marcar cuya hora no haya pasado
 * hace mas de 15 min (contando desde que te despiertas).
 */
export function nextItem(items: readonly DayItem[], checks: DayChecks, now: number, wake: string): DayItem | null {
  const W = toMinutes(wake);
  const nowRel = since(now, W);
  return items.find((i) => !checks[i.id] && since(i.t, W) >= nowRel - 15) ?? null;
}
