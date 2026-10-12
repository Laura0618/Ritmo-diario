-- Ritmo Diario - esquema de persistencia (Cloudflare D1 / SQLite).
--
-- El Worker tambien aplica este esquema al arrancar (CREATE ... IF NOT EXISTS),
-- asi que no hace falta ejecutar la migracion a mano para que funcione.
--
-- Diseno:
--  * Todo dato de la persona es un documento clave -> JSON (`docs`).
--  * PK compuesta (user_id, key). `updated_at` (ISO, reloj del dispositivo)
--    decide quien gana (last-write-wins). `synced_at` (epoch ms del servidor)
--    sirve de cursor para descargar solo lo nuevo.
--  * Los borrados se guardan como deleted = 1 para propagarlos.

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,           -- Google `sub`
  email       TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  picture     TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS docs (
  user_id     TEXT NOT NULL,
  key         TEXT NOT NULL,
  value       TEXT NOT NULL,              -- JSON
  updated_at  TEXT NOT NULL,              -- ISO 8601 UTC con milisegundos
  deleted     INTEGER NOT NULL DEFAULT 0,
  synced_at   INTEGER NOT NULL,           -- epoch ms del servidor
  PRIMARY KEY (user_id, key)
);
CREATE INDEX IF NOT EXISTS idx_docs_user_synced ON docs (user_id, synced_at);

CREATE TABLE IF NOT EXISTS app_config (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
