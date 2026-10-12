import type { DocStore } from './docs';
import type { SyncDoc, SyncPullResponse, SyncPushResponse } from './syncTypes';

export interface SyncTransport {
  push: (docs: SyncDoc[]) => Promise<SyncPushResponse>;
  pull: (since: number) => Promise<SyncPullResponse>;
}

/** Margen al pedir cambios para no perder escrituras concurrentes en el servidor. */
export const PULL_OVERLAP_MS = 5_000;
const PUSH_CHUNK = 500;

/**
 * Una pasada completa: sube lo pendiente y descarga lo nuevo.
 * Devuelve true si llegaron cambios de otro dispositivo.
 */
export async function syncOnce(store: DocStore, transport: SyncTransport): Promise<boolean> {
  const pending = store.dirtyDocs();
  for (let i = 0; i < pending.length; i += PUSH_CHUNK) {
    const chunk = pending.slice(i, i + PUSH_CHUNK);
    await transport.push(chunk);
    store.ackPushed(chunk);
  }

  let since = Math.max(0, store.getCursor() - PULL_OVERLAP_MS);
  let cursor: number | null = null;
  let changed = false;
  for (let page = 0; page < 50; page++) {
    const res = await transport.pull(since);
    cursor ??= res.serverTime;
    if (store.applyRemote(res.docs)) changed = true;
    if (!res.hasMore) break;
    since = res.nextSince;
  }
  if (cursor !== null) store.setCursor(cursor);
  return changed;
}
