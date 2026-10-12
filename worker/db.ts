// Acceso a D1. Todas las consultas van parametrizadas y filtradas por user_id.

import type { AuthUser, SyncDoc } from '../src/lib/syncTypes';
import type { Env } from './env';
import type { GoogleProfile } from './google';
import { randomToken } from './session';

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL DEFAULT '',
     picture TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS docs (
     user_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
     updated_at TEXT NOT NULL, deleted INTEGER NOT NULL DEFAULT 0,
     synced_at INTEGER NOT NULL, PRIMARY KEY (user_id, key))`,
  `CREATE INDEX IF NOT EXISTS idx_docs_user_synced ON docs (user_id, synced_at)`,
  `CREATE TABLE IF NOT EXISTS app_config (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
];

let schemaReady: Promise<void> | null = null;

/** Crea las tablas si no existen. Una vez por isolate. */
export function ensureSchema(env: Env): Promise<void> {
  if (!schemaReady) {
    schemaReady = env.DB.batch(SCHEMA.map((sql) => env.DB.prepare(sql)))
      .then(() => undefined)
      .catch((err: unknown) => {
        schemaReady = null;
        throw err;
      });
  }
  return schemaReady;
}

let cachedSecret: string | null = null;

/** Secreto de sesion: el de Cloudflare si existe; si no, uno generado y guardado en D1. */
export async function sessionSecret(env: Env): Promise<string> {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  if (cachedSecret) return cachedSecret;
  await env.DB.prepare(`INSERT OR IGNORE INTO app_config (key, value) VALUES ('session_secret', ?1)`)
    .bind(randomToken(48))
    .run();
  const row = await env.DB.prepare(`SELECT value FROM app_config WHERE key = 'session_secret'`).first<{
    value: string;
  }>();
  if (!row) throw new Error('No se pudo leer el secreto de sesion.');
  cachedSecret = row.value;
  return cachedSecret;
}

// --- Usuarios --------------------------------------------------------------

export async function upsertUser(env: Env, p: GoogleProfile): Promise<AuthUser> {
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO users (id, email, name, picture, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?5)
     ON CONFLICT(id) DO UPDATE SET email = ?2, name = ?3, picture = ?4, updated_at = ?5`,
  )
    .bind(p.sub, p.email, p.name, p.picture, now)
    .run();
  return { id: p.sub, email: p.email, name: p.name, picture: p.picture };
}

export async function getUser(env: Env, uid: string): Promise<AuthUser | null> {
  const row = await env.DB.prepare(`SELECT id, email, name, picture FROM users WHERE id = ?1`)
    .bind(uid)
    .first<{ id: string; email: string; name: string; picture: string | null }>();
  return row ? { id: row.id, email: row.email, name: row.name, picture: row.picture } : null;
}

// --- Documentos ------------------------------------------------------------

export const PULL_PAGE_SIZE = 1000;

interface DocRow {
  key: string;
  value: string;
  updated_at: string;
  deleted: number;
  synced_at: number;
}

/** Documentos de `uid` cambiados en el servidor despues de `since` (epoch ms). */
export async function getDocsSince(
  env: Env,
  uid: string,
  since: number,
): Promise<{ docs: SyncDoc[]; hasMore: boolean; nextSince: number }> {
  const rows = await env.DB.prepare(
    `SELECT key, value, updated_at, deleted, synced_at FROM docs
     WHERE user_id = ?1 AND synced_at > ?2
     ORDER BY synced_at ASC, key ASC
     LIMIT ?3`,
  )
    .bind(uid, since, PULL_PAGE_SIZE)
    .all<DocRow>();
  const list = rows.results ?? [];
  const docs: SyncDoc[] = list.map((r) => ({
    key: r.key,
    value: safeJson(r.value),
    updatedAt: r.updated_at,
    deleted: r.deleted === 1,
  }));
  const last = list[list.length - 1];
  return { docs, hasMore: list.length === PULL_PAGE_SIZE, nextSince: last ? last.synced_at : since };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Guarda los documentos recibidos. Gana el mas reciente por `updated_at`
 * (comparacion de texto ISO UTC, valida porque el formato es fijo).
 */
export async function applyPush(env: Env, uid: string, docs: readonly SyncDoc[], now: number): Promise<number> {
  if (docs.length === 0) return 0;
  const statements = docs.map((d) =>
    env.DB.prepare(
      `INSERT INTO docs (user_id, key, value, updated_at, deleted, synced_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)
       ON CONFLICT(user_id, key) DO UPDATE SET
         value = excluded.value, updated_at = excluded.updated_at,
         deleted = excluded.deleted, synced_at = excluded.synced_at
       WHERE excluded.updated_at > docs.updated_at`,
    ).bind(uid, d.key, JSON.stringify(d.value ?? null), d.updatedAt, d.deleted ? 1 : 0, now),
  );
  let applied = 0;
  for (let i = 0; i < statements.length; i += 100) {
    const results = await env.DB.batch(statements.slice(i, i + 100));
    for (const r of results) applied += r.meta?.changes ?? 0;
  }
  return applied;
}
