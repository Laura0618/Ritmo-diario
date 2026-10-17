import type { Anchor, Habit, HabitConfig, HabitFreq, HabitTime, LibCategoryId, Settings, Tag } from '../types';
import { LIBRARY } from './protocols';
import { dateKey, formatTime, toMinutes, weekStart, wrap } from './time';

export const HABITS_DOC = 'habits';

// --- Catalogo: los 47 protocolos del libro como habitos ---------------------

const CATEGORY_TAG: Record<LibCategoryId, Tag> = {
  sueno: 'sueno',
  luz: 'luz',
  estres: 'estres',
  ejercicio: 'cuerpo',
  nutricion: 'cuerpo',
  aprendizaje: 'mente',
  crecimiento: 'mente',
};

/** Frecuencia por defecto de los protocolos que no son diarios. */
const LIB_FREQ: Record<string, HabitFreq> = {
  'lib-ejercicio-2': { per: 'week', times: 3 },
  'lib-ejercicio-3': { per: 'week', times: 3 },
  'lib-ejercicio-4': { per: 'week', times: 3 },
  'lib-estres-2': { per: 'week', times: 3 },
  'lib-luz-4': { per: 'week', times: 3 },
  'lib-luz-5': { per: 'week', times: 3 },
  'lib-nutricion-7': { per: 'week', times: 2 },
};

/** Hora por defecto de los protocolos ligados a un momento del dia. */
const LIB_TIME: Record<string, HabitTime> = {
  'lib-sueno-1': { anchor: 'wake', offset: 10 },
  'lib-sueno-2': { anchor: 'sunset', offset: -45 },
  'lib-sueno-3': { anchor: 'bed', offset: -60 },
  'lib-sueno-4': { anchor: 'bed', offset: 0 },
  'lib-sueno-5': { anchor: 'bed', offset: -90 },
  'lib-sueno-12': { anchor: 'bed', offset: -480 },
  'lib-sueno-14': { anchor: 'bed', offset: -60 },
  'lib-estres-4': { anchor: 'wake', offset: 0 },
  'lib-luz-1': { anchor: 'wake', offset: 10 },
  'lib-luz-2': { anchor: 'sunset', offset: -30 },
  'lib-luz-3': { anchor: 'bed', offset: -60 },
};

/** Texto corto para la lista de Hoy cuando el del libro es largo. */
const LIB_HOW: Record<string, string> = {
  'lib-sueno-4': 'Mismo horario ±30 min de 6 a 7 noches por semana.',
  'lib-ejercicio-2': 'Piernas, torso, y hombros con brazos en días separados.',
  'lib-ejercicio-3': 'Uno largo, uno medio y uno intenso. Detalle en Semana.',
  'lib-nutricion-1': 'Alimentos de un solo ingrediente; nada de salsas ni envasados con azúcar.',
  'lib-nutricion-2': '0,5–0,7 L al despertar y unos 2,4 L en las primeras 10 h.',
};

export interface LibraryHabit extends Habit {
  category: LibCategoryId;
  categoryName: string;
}

export const LIBRARY_HABITS: readonly LibraryHabit[] = LIBRARY.flatMap((cat) =>
  cat.protocols.map((p, i): LibraryHabit => {
    const id = `lib-${cat.id}-${i + 1}`;
    return {
      id,
      source: 'libro',
      what: p.title,
      how: LIB_HOW[id] ?? p.points[0] ?? '',
      tag: CATEGORY_TAG[cat.id],
      freq: LIB_FREQ[id] ?? { per: 'day' },
      time: LIB_TIME[id] ?? null,
      category: cat.id,
      categoryName: cat.name,
    };
  }),
);

export function libraryHabit(id: string): LibraryHabit | undefined {
  return LIBRARY_HABITS.find((h) => h.id === id);
}

/** Los esenciales con los que empieza todo el mundo, en este orden. */
export const ESSENTIAL_IDS = [
  'lib-sueno-4', // Horario segun tu cronotipo
  'lib-ejercicio-3', // Cardio 3 veces por semana
  'lib-ejercicio-2', // Fuerza 3 veces por semana
  'lib-nutricion-2', // Hidratate
  'lib-nutricion-1', // Al menos un 90 % sin procesar
] as const;

function toHabit(h: LibraryHabit): Habit {
  return { id: h.id, source: h.source, what: h.what, how: h.how, tag: h.tag, freq: h.freq, time: h.time };
}

export function defaultHabitConfig(): HabitConfig {
  return { version: 2, list: ESSENTIAL_IDS.map((id) => toHabit(libraryHabit(id)!)) };
}

/** El documento antiguo (v1, con habitos activados por casilla) se sustituye por los esenciales. */
export function normalizeHabitConfig(raw: unknown): HabitConfig {
  if (!raw || typeof raw !== 'object') return defaultHabitConfig();
  const r = raw as Partial<HabitConfig>;
  if (r.version !== 2 || !Array.isArray(r.list)) return defaultHabitConfig();
  return { version: 2, list: r.list.filter(isHabit) };
}

function isHabit(h: unknown): h is Habit {
  if (!h || typeof h !== 'object') return false;
  const x = h as Partial<Habit>;
  return typeof x.id === 'string' && typeof x.what === 'string' && !!x.freq && typeof x.tag === 'string';
}

export function fromLibrary(id: string): Habit | null {
  const h = libraryHabit(id);
  return h ? toHabit(h) : null;
}

export function newCustomHabit(partial: Omit<Habit, 'id' | 'source'>): Habit {
  const rand = Math.random().toString(36).slice(2, 8);
  return { ...partial, id: `c-${Date.now().toString(36)}${rand}`, source: 'propio' };
}

export function moveHabit(list: readonly Habit[], from: number, to: number): Habit[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (!item) return next;
  next.splice(Math.max(0, Math.min(next.length, to)), 0, item);
  return next;
}

// --- Horas ---------------------------------------------------------------

const ANCHOR_LABEL: Record<Anchor, string> = {
  wake: 'despertar',
  bed: 'dormir',
  sunset: 'la puesta de sol',
  fixed: 'hora fija',
};

export const ANCHOR_OPTIONS: readonly { value: Anchor; label: string }[] = [
  { value: 'wake', label: 'Despertar' },
  { value: 'bed', label: 'Dormir' },
  { value: 'sunset', label: 'Puesta de sol' },
  { value: 'fixed', label: 'Hora fija' },
];

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

export function describeFreq(freq: HabitFreq): string {
  return freq.per === 'day' ? 'Cada día' : `${freq.times} ${freq.times === 1 ? 'vez' : 'veces'} por semana`;
}

// --- Plan de hoy ----------------------------------------------------------

export interface TodayHabit {
  habit: Habit;
  /** Minuto del dia si tiene hora. */
  t: number | null;
  doneToday: boolean;
  /** Solo semanales: dias hechos esta semana (lunes a domingo). */
  weekDone: number;
  /** Semanal con el objetivo ya cumplido y sin marcar hoy: no cuenta para el progreso. */
  weekMet: boolean;
}

/** Fechas ("YYYY-MM-DD") de la semana de `date`, de lunes a domingo. */
export function weekDates(date: Date): string[] {
  const start = new Date(weekStart(date));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return dateKey(d);
  });
}

/**
 * Estado de cada habito para hoy, en el orden de la persona.
 * `isChecked(dia, id)` lee las casillas guardadas.
 */
export function buildToday(
  config: HabitConfig,
  settings: Settings,
  date: Date,
  isChecked: (day: string, id: string) => boolean,
): TodayHabit[] {
  const today = dateKey(date);
  const week = weekDates(date);
  return config.list.map((habit) => {
    const doneToday = isChecked(today, habit.id);
    const weekDone = habit.freq.per === 'week' ? week.filter((d) => isChecked(d, habit.id)).length : 0;
    const weekMet = habit.freq.per === 'week' && !doneToday && weekDone >= habit.freq.times;
    return { habit, t: habit.time ? resolveTime(habit.time, settings) : null, doneToday, weekDone, weekMet };
  });
}

/** Progreso de hoy: los semanales ya cumplidos no cuentan si no se hacen hoy. */
export function todayProgress(items: readonly TodayHabit[]): { done: number; total: number } {
  const relevant = items.filter((i) => !i.weekMet);
  return { done: relevant.filter((i) => i.doneToday).length, total: relevant.length };
}

/** Siguiente habito con hora pendiente (no mas de 15 min pasado), contando desde el despertar. */
export function nextTimed(items: readonly TodayHabit[], now: number, wake: string): TodayHabit | null {
  const W = toMinutes(wake);
  const rel = (m: number): number => wrap(m - W);
  const nowRel = rel(now);
  const pending = items
    .filter((i) => i.t !== null && !i.doneToday && !i.weekMet && rel(i.t) >= nowRel - 15)
    .sort((a, b) => rel(a.t!) - rel(b.t!));
  return pending[0] ?? null;
}
