import type { Anchor, CustomHabit, HabitConfig, HabitTier, HabitTime, Settings, Tag } from '../types';
import { formatTime, toMinutes, wrap } from './time';

/** Habito del libro: texto, nivel, hora por defecto y protocolo de origen. */
export interface BookHabit {
  id: string;
  tier: HabitTier;
  tag: Tag;
  what: string;
  how: string;
  /** Protocolo del libro en el que se basa. */
  source: string;
  time: HabitTime;
}

/** El orden aqui es el de la pantalla de eleccion. Los ids no cambian: son las claves de las casillas. */
export const BOOK_HABITS: readonly BookHabit[] = [
  { id: 'luz', tier: 'esencial', tag: 'luz', what: 'Luz natural en los ojos', how: '5–10 min fuera, mirando hacia el sol sin fijar la vista. 10–30 min si está nublado. Sin gafas de sol ni cristal.', source: 'Sueño · Luz solar nada más despertar', time: { anchor: 'wake', offset: 10 } },
  { id: 'cafe', tier: 'esencial', tag: 'cuerpo', what: 'Primera cafeína', how: 'Retrásala entre 30 y 90 min tras despertar para evitar el bajón de la tarde.', source: 'Sueño · Ajusta la cafeína', time: { anchor: 'wake', offset: 75 } },
  { id: 'corte', tier: 'esencial', tag: 'sueno', what: 'Última cafeína', how: 'Nada de cafeína en las 8–10 h antes de dormir.', source: 'Sueño · Ajusta la cafeína', time: { anchor: 'bed', offset: -600 } },
  { id: 'luces', tier: 'esencial', tag: 'luz', what: 'Luces bajas y pantallas fuera', how: 'Luz cálida o roja, nada de LED blanco. Dormitorio a 18–20 °C.', source: 'Luz · Evita la luz brillante antes de dormir', time: { anchor: 'bed', offset: -60 } },
  { id: 'dormir', tier: 'esencial', tag: 'sueno', what: 'A dormir', how: 'Pies y manos fuera de la manta. Si te despiertas, no mires el reloj ni enciendas luces.', source: 'Sueño · Horario según tu cronotipo', time: { anchor: 'bed', offset: 0 } },

  { id: 'agua', tier: 'recomendado', tag: 'cuerpo', what: 'Agua al despertar', how: '0,5–0,7 L antes del café.', source: 'Nutrición · Hidrátate', time: { anchor: 'wake', offset: 0 } },
  { id: 'medit', tier: 'recomendado', tag: 'estres', what: 'Micromeditación en la cama', how: '5 min. Si te entran ganas de levantarte, quédate: es entrenamiento de resiliencia.', source: 'Estrés · Micromeditación al despertar', time: { anchor: 'wake', offset: 0 } },
  { id: 'mover', tier: 'recomendado', tag: 'cuerpo', what: 'Entrenamiento del día', how: 'Según tu plan semanal. Mejor en las primeras 2–3 h del día.', source: 'Ejercicio · Plan semanal', time: { anchor: 'wake', offset: 120 } },
  { id: 'paseo', tier: 'recomendado', tag: 'cuerpo', what: 'Paseo después de comer', how: '5–10 min. Y 5 min de movimiento por cada 30 sentada.', source: 'Ejercicio · Camina todo lo que puedas', time: { anchor: 'wake', offset: 360 } },
  { id: 'tarde', tier: 'recomendado', tag: 'luz', what: 'Luz del atardecer', how: '10–15 min fuera antes de la puesta, mirando hacia el oeste.', source: 'Luz · Sol al atardecer', time: { anchor: 'sunset', offset: -45 } },
  { id: 'cena', tier: 'recomendado', tag: 'sueno', what: 'Última comida', how: '2–3 h antes de dormir. Si tienes hambre real, algo ligero 1 h antes.', source: 'Sueño · Horario según tu cronotipo', time: { anchor: 'bed', offset: -180 } },
  { id: 'ducha', tier: 'recomendado', tag: 'sueno', what: 'Ducha o baño caliente', how: 'Calentar manos y pies ayuda a que baje la temperatura central.', source: 'Sueño · Baja la temperatura por la noche', time: { anchor: 'bed', offset: -90 } },

  { id: 'nsdr', tier: 'opcional', tag: 'estres', what: 'NSDR si notas el bajón', how: '10–20 min en lugar de siesta. Tienes la guía en Herramientas.', source: 'Estrés · NSDR contra el estrés', time: { anchor: 'wake', offset: 420 } },
  { id: 'agua2', tier: 'opcional', tag: 'cuerpo', what: 'Unos 2,4 L de agua acumulados', how: 'Bebe sobre todo en las primeras 10 h para no despertarte de noche.', source: 'Nutrición · Hidrátate', time: { anchor: 'wake', offset: 600 } },
  { id: 'alcohol', tier: 'opcional', tag: 'sueno', what: 'Sin alcohol desde aquí', how: 'Si bebes, nada en las 8 h previas a dormir. Cuanto menos, mejor.', source: 'Sueño · Sin alcohol 8 h antes de dormir', time: { anchor: 'bed', offset: -480 } },
];

export const TIER_LABEL: Record<HabitTier, string> = {
  esencial: 'Esenciales',
  recomendado: 'Recomendados',
  opcional: 'Opcionales',
};

const ANCHOR_LABEL: Record<Anchor, string> = {
  wake: 'despertar',
  bed: 'dormir',
  sunset: 'la puesta de sol',
  fixed: 'hora fija',
};

/** Etiquetas para el selector de referencia. */
export const ANCHOR_OPTIONS: readonly { value: Anchor; label: string }[] = [
  { value: 'wake', label: 'Despertar' },
  { value: 'bed', label: 'Dormir' },
  { value: 'sunset', label: 'Puesta de sol' },
  { value: 'fixed', label: 'Hora fija' },
];

/** Configuracion inicial: solo los esenciales. */
export function defaultHabitConfig(): HabitConfig {
  return {
    onboarded: false,
    enabled: Object.fromEntries(BOOK_HABITS.filter((h) => h.tier === 'esencial').map((h) => [h.id, true])),
    times: {},
    custom: [],
  };
}

/** Completa un documento `habits` parcial o antiguo con valores validos. */
export function normalizeHabitConfig(raw: Partial<HabitConfig> | null | undefined): HabitConfig {
  const base = defaultHabitConfig();
  if (!raw) return base;
  return {
    onboarded: Boolean(raw.onboarded),
    enabled: raw.enabled && typeof raw.enabled === 'object' ? raw.enabled : base.enabled,
    times: raw.times && typeof raw.times === 'object' ? raw.times : {},
    custom: Array.isArray(raw.custom) ? raw.custom : [],
  };
}

/** Minuto del dia de una hora relativa, segun los horarios de la persona. */
export function resolveTime(time: HabitTime, settings: Pick<Settings, 'wake' | 'bed' | 'sunset'>): number {
  switch (time.anchor) {
    case 'wake':
      return wrap(toMinutes(settings.wake) + time.offset);
    case 'bed':
      return wrap(toMinutes(settings.bed) + time.offset);
    case 'sunset':
      return wrap(toMinutes(settings.sunset) + time.offset);
    case 'fixed':
      return wrap(time.offset);
  }
}

/** "1 h 30 min antes de dormir", "al despertar", "a las 21:00". */
export function describeTime(time: HabitTime): string {
  if (time.anchor === 'fixed') return `a las ${formatTime(time.offset)}`;
  const target = ANCHOR_LABEL[time.anchor];
  if (time.offset === 0) return time.anchor === 'sunset' ? 'a la puesta de sol' : `al ${target}`;
  const abs = Math.abs(time.offset);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const amount = h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
  return `${amount} ${time.offset < 0 ? 'antes de' : 'después de'} ${target}`;
}

export function bookTimeFor(habit: BookHabit, config: HabitConfig): HabitTime {
  return config.times[habit.id] ?? habit.time;
}

export function isEnabled(id: string, config: HabitConfig): boolean {
  return Boolean(config.enabled[id]);
}

export function newCustomHabit(partial: Omit<CustomHabit, 'id'>): CustomHabit {
  const rand = Math.random().toString(36).slice(2, 8);
  return { ...partial, id: `c-${Date.now().toString(36)}${rand}` };
}

export const HABITS_DOC = 'habits';
