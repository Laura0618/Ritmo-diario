// Cliente de la API del Worker. Todas las llamadas envian la cookie de sesion.

import type { AuthUser, SyncDoc, SyncPullResponse, SyncPushResponse } from './syncTypes';

export const LOGIN_URL = '/api/auth/login';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      credentials: 'include',
      ...init,
      headers: { accept: 'application/json', ...(init.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, 'network', 'Sin conexión con el servidor.');
  }

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const obj = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
    throw new ApiError(
      res.status,
      typeof obj.code === 'string' ? obj.code : null,
      typeof obj.error === 'string' ? obj.error : `Error ${res.status}`,
    );
  }
  // Sin API (p. ej. `vite dev` sin Worker) el servidor devuelve el HTML de la app.
  if (body === null) throw new ApiError(0, 'no_api', 'La API no está disponible.');
  return body as T;
}

export const api = {
  config: (): Promise<{ oauthConfigured: boolean }> => request('/api/config'),
  me: (): Promise<{ user: AuthUser }> => request('/api/me'),
  logout: (): Promise<{ ok: true }> => request('/api/auth/logout', { method: 'POST' }),
  pull: (since: number): Promise<SyncPullResponse> => request(`/api/sync?since=${Math.max(0, Math.floor(since))}`),
  push: (docs: SyncDoc[]): Promise<SyncPushResponse> =>
    request('/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ docs }),
    }),
};
