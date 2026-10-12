/**
 * Persistencia local. Todo vive en el navegador de cada persona; no hay servidor.
 * Cada lectura y escritura tolera que el almacenamiento no exista o falle
 * (modo privado, cuota llena, etc.).
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
  settings: 'settings',
  checks: (day: string) => `checks:${day}`,
  coldLog: 'coldLog',
  nsdrCount: 'nsdrCount',
  libCategory: 'libCategory',
} as const;
