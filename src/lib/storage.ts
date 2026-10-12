/**
 * Preferencias de interfaz que solo tienen sentido en este dispositivo
 * (no se sincronizan). Los datos de la persona viven en `docs.ts`.
 */
const PREFIX = 'ritmo-diario:v1:';

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* sin almacenamiento: la app sigue funcionando en memoria */
  }
}

export const KEYS = {
  libCategory: 'libCategory',
} as const;
