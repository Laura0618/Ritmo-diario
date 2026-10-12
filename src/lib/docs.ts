/**
 * Almacen local de documentos sincronizables (clave -> valor JSON).
 *
 * - Todo se guarda en localStorage y la app funciona igual sin cuenta.
 * - Cada cambio sella `updatedAt` y marca la clave como pendiente de subir.
 * - Al recibir datos del servidor gana el mas reciente por clave (LWW).
 *
 * Ver `syncTypes.ts` para el catalogo de claves.
 */
import { useSyncExternalStore } from 'react';
import type { SyncDoc } from './syncTypes';

interface LocalDoc {
  v: unknown;
  u: string;
  d?: 1;
}

interface Meta {
  cursor: number;
  dirty: string[];
  accountId: string | null;
}

const DOCS_KEY = 'ritmo-diario:v2:docs';
const META_KEY = 'ritmo-diario:v2:meta';
const V1_PREFIX = 'ritmo-diario:v1:';

type Listener = () => void;

function stampAfter(previous: string | undefined): string {
  const prev = previous ? Date.parse(previous) : 0;
  return new Date(Math.max(Date.now(), prev + 1)).toISOString();
}

export class DocStore {
  private docs: Record<string, LocalDoc> = {};
  private dirty = new Set<string>();
  private cursor = 0;
  private accountId: string | null = null;
  private listeners = new Set<Listener>();
  private version = 0;

  constructor(private readonly storage: Storage | null) {
    this.load();
  }

  // --- Lectura -----------------------------------------------------------

  get<T>(key: string, fallback: T): T {
    const doc = this.docs[key];
    return doc && !doc.d ? (doc.v as T) : fallback;
  }

  /** Claves vivas (no borradas) que empiezan por `prefix`. */
  keys(prefix: string): string[] {
    return Object.keys(this.docs).filter((k) => k.startsWith(prefix) && !this.docs[k]?.d);
  }

  // --- Escritura local ---------------------------------------------------

  set(key: string, value: unknown): void {
    this.docs[key] = { v: value, u: stampAfter(this.docs[key]?.u) };
    this.dirty.add(key);
    this.commit();
  }

  remove(key: string): void {
    if (!this.docs[key]) return;
    this.docs[key] = { v: null, u: stampAfter(this.docs[key]?.u), d: 1 };
    this.dirty.add(key);
    this.commit();
  }

  // --- Sincronizacion ----------------------------------------------------

  dirtyDocs(): SyncDoc[] {
    const out: SyncDoc[] = [];
    for (const key of this.dirty) {
      const doc = this.docs[key];
      if (!doc) continue;
      out.push({ key, value: doc.d ? null : doc.v, updatedAt: doc.u, deleted: Boolean(doc.d) });
    }
    return out;
  }

  hasPending(): boolean {
    return this.dirty.size > 0;
  }

  /** Marca como subidos los documentos enviados, salvo los que cambiaron mientras tanto. */
  ackPushed(sent: readonly SyncDoc[]): void {
    for (const d of sent) {
      if (this.docs[d.key]?.u === d.updatedAt) this.dirty.delete(d.key);
    }
    this.persist();
  }

  /** Aplica documentos del servidor. Devuelve true si algo cambio en local. */
  applyRemote(remote: readonly SyncDoc[]): boolean {
    let changed = false;
    for (const r of remote) {
      const local = this.docs[r.key];
      if (!local || r.updatedAt > local.u) {
        this.docs[r.key] = r.deleted ? { v: null, u: r.updatedAt, d: 1 } : { v: r.value, u: r.updatedAt };
        this.dirty.delete(r.key);
        changed = true;
      } else if (r.updatedAt === local.u) {
        this.dirty.delete(r.key);
      }
    }
    if (changed) this.commit();
    else this.persist();
    return changed;
  }

  getCursor(): number {
    return this.cursor;
  }

  setCursor(cursor: number): void {
    this.cursor = cursor;
    this.persist();
  }

  getAccountId(): string | null {
    return this.accountId;
  }

  /** Vincula este dispositivo a una cuenta: todo lo local se subira y se descargara todo. */
  linkAccount(accountId: string | null): void {
    this.accountId = accountId;
    if (accountId) {
      this.cursor = 0;
      for (const key of Object.keys(this.docs)) this.dirty.add(key);
    }
    this.persist();
  }

  // --- Suscripcion (React) -----------------------------------------------

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getVersion = (): number => this.version;

  // --- Persistencia ------------------------------------------------------

  private commit(): void {
    this.version++;
    this.persist();
    for (const l of this.listeners) l();
  }

  private persist(): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(DOCS_KEY, JSON.stringify(this.docs));
      const meta: Meta = { cursor: this.cursor, dirty: [...this.dirty], accountId: this.accountId };
      this.storage.setItem(META_KEY, JSON.stringify(meta));
    } catch {
      /* sin almacenamiento: seguimos en memoria */
    }
  }

  private load(): void {
    if (!this.storage) return;
    try {
      const rawDocs = this.storage.getItem(DOCS_KEY);
      if (rawDocs) {
        this.docs = JSON.parse(rawDocs) as Record<string, LocalDoc>;
        const meta = JSON.parse(this.storage.getItem(META_KEY) ?? '{}') as Partial<Meta>;
        this.cursor = typeof meta.cursor === 'number' ? meta.cursor : 0;
        this.dirty = new Set(Array.isArray(meta.dirty) ? meta.dirty : []);
        this.accountId = typeof meta.accountId === 'string' ? meta.accountId : null;
      } else {
        this.migrateV1();
      }
    } catch {
      this.docs = {};
    }
  }

  /** Datos de la primera version (antes de la sincronizacion). */
  private migrateV1(): void {
    const s = this.storage;
    if (!s) return;
    const read = (key: string): unknown => {
      try {
        const raw = s.getItem(V1_PREFIX + key);
        return raw == null ? undefined : JSON.parse(raw);
      } catch {
        return undefined;
      }
    };
    const now = new Date().toISOString();
    const put = (key: string, value: unknown): void => {
      this.docs[key] = { v: value, u: now };
      this.dirty.add(key);
    };

    const settings = read('settings');
    if (settings && typeof settings === 'object') put('settings', settings);

    for (let i = 0; i < s.length; i++) {
      const full = s.key(i);
      if (!full?.startsWith(`${V1_PREFIX}checks:`)) continue;
      const day = full.slice(`${V1_PREFIX}checks:`.length);
      const checks = read(`checks:${day}`);
      if (!checks || typeof checks !== 'object') continue;
      for (const [id, done] of Object.entries(checks as Record<string, unknown>)) {
        if (done === true) put(`check:${day}:${id}`, true);
      }
    }

    const cold = read('coldLog');
    if (Array.isArray(cold)) {
      for (const t of cold) if (typeof t === 'number') put(`log:cold:${t}`, { s: null });
    }

    if (Object.keys(this.docs).length > 0) this.persist();
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export const docStore = new DocStore(safeStorage());

/** Valor de un documento, re-renderizando cuando cambia (en local o por sincronizacion). */
export function useDoc<T>(key: string, fallback: T): T {
  useSyncExternalStore(docStore.subscribe, docStore.getVersion);
  return docStore.get(key, fallback);
}

/** Re-renderiza con cualquier cambio del almacen; util para listados por prefijo. */
export function useDocsVersion(): number {
  return useSyncExternalStore(docStore.subscribe, docStore.getVersion);
}
