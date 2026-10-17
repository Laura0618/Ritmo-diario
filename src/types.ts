/** Categoria visual de cada tarea del plan diario. */
export type Tag = 'sueno' | 'luz' | 'estres' | 'cuerpo' | 'mente';

export type Sex = 'f' | 'm';

export interface Settings {
  /** Hora de despertar, "HH:MM". */
  wake: string;
  /** Hora de dormir, "HH:MM". */
  bed: string;
  /** Hora aproximada de la puesta de sol, "HH:MM". */
  sunset: string;
  /** Dia de la semana (0 = domingo) en el que empieza el plan de ejercicio. */
  day1: number;
  age: number;
  sex: Sex;
  kg: number;
  /** Duracion de referencia del entrenamiento, para el calculo de agua. */
  mins: number;
}

export type WorkoutKind = 'cardio' | 'fuerza' | 'descanso';

export interface WeekDay {
  title: string;
  kind: WorkoutKind;
  /** Rango de % de frecuencia cardiaca maxima, si aplica. */
  zone?: readonly [number, number];
  desc: string;
}

export type LibCategoryId =
  | 'sueno'
  | 'ejercicio'
  | 'estres'
  | 'nutricion'
  | 'luz'
  | 'aprendizaje'
  | 'crecimiento';

export interface Protocol {
  title: string;
  points: readonly string[];
}

export interface LibCategory {
  id: LibCategoryId;
  name: string;
  protocols: readonly Protocol[];
}

/** Casillas marcadas de un dia, por id de tarea. */
export type DayChecks = Record<string, boolean>;

/** Referencia de la hora de un habito. */
export type Anchor = 'wake' | 'bed' | 'sunset' | 'fixed';

export interface HabitTime {
  anchor: Anchor;
  /** Minutos respecto a la referencia; con 'fixed', minuto del dia (0-1439). */
  offset: number;
}

/** Cada cuanto toca un habito. */
export type HabitFreq = { per: 'day' } | { per: 'week'; times: number };

export interface Habit {
  /** Estable: `lib-<categoria>-<n>` para los del libro, `c-...` para los propios. Es la clave de las casillas. */
  id: string;
  source: 'libro' | 'propio';
  what: string;
  how: string;
  tag: Tag;
  freq: HabitFreq;
  /** Hora opcional; sin hora el habito se hace en cualquier momento del dia. */
  time: HabitTime | null;
}

/** Documento sincronizado `habits` (v2): la lista de habitos en el orden de la persona. */
export interface HabitConfig {
  version: 2;
  list: Habit[];
}
