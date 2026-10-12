/** Categoria visual de cada tarea del plan diario. */
export type Tag = 'sueno' | 'luz' | 'estres' | 'cuerpo';

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

export interface DayItem {
  id: string;
  /** Minuto del dia (0-1439). */
  t: number;
  tag: Tag;
  what: string;
  how: string;
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
