/**
 * Tipos compartidos entre la PWA y el Worker para la sincronizacion.
 *
 * Modelo: todos los datos de la persona son "documentos" clave -> valor JSON.
 * Cada documento lleva `updatedAt` (ISO UTC, reloj del dispositivo que lo cambio)
 * y gana el mas reciente (last-write-wins) por clave. Las claves son granulares
 * (una casilla, un registro de frio...) para que dos dispositivos no se pisen.
 *
 * Claves en uso:
 *   settings                     Ajustes (horarios, plan, edad...)
 *   check:YYYY-MM-DD:<tarea>     Casilla del plan diario (boolean)
 *   log:cold:<epoch ms>          Sesion de frio ({ s: segundos })
 *   log:nsdr:<epoch ms>          Sesion de NSDR completada ({ m: minutos })
 */

export interface SyncDoc {
  key: string;
  value: unknown;
  updatedAt: string;
  deleted: boolean;
}

export interface SyncPushRequest {
  docs: SyncDoc[];
}

export interface SyncPushResponse {
  accepted: number;
  serverTime: number;
}

export interface SyncPullResponse {
  docs: SyncDoc[];
  /** Hora del servidor (epoch ms) para usar como siguiente cursor. */
  serverTime: number;
  /** Hay mas paginas: volver a pedir con `since = nextSince`. */
  hasMore: boolean;
  nextSince: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
}

export const KEY_PATTERN = /^[a-z][a-z0-9]*(?::[A-Za-z0-9_.-]+)*$/;
export const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
export const MAX_KEY_LENGTH = 120;
export const MAX_VALUE_BYTES = 20_000;
export const MAX_DOCS_PER_PUSH = 1000;
