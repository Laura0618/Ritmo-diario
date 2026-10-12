// Validacion estricta del cuerpo de POST /api/sync.

import {
  ISO_PATTERN,
  KEY_PATTERN,
  MAX_DOCS_PER_PUSH,
  MAX_KEY_LENGTH,
  MAX_VALUE_BYTES,
  type SyncDoc,
} from '../src/lib/syncTypes';

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseSyncPush(body: Record<string, unknown>): ParseResult<SyncDoc[]> {
  const docs = body.docs;
  if (!Array.isArray(docs)) return { ok: false, error: '`docs` debe ser una lista.' };
  if (docs.length > MAX_DOCS_PER_PUSH) {
    return { ok: false, error: `Como maximo ${MAX_DOCS_PER_PUSH} documentos por envio.` };
  }

  const seen = new Set<string>();
  const out: SyncDoc[] = [];
  for (const [i, raw] of docs.entries()) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return { ok: false, error: `docs[${i}] no es un objeto.` };
    }
    const d = raw as Record<string, unknown>;
    if (typeof d.key !== 'string' || d.key.length > MAX_KEY_LENGTH || !KEY_PATTERN.test(d.key)) {
      return { ok: false, error: `docs[${i}].key no es una clave valida.` };
    }
    if (seen.has(d.key)) return { ok: false, error: `Clave repetida: ${d.key}.` };
    seen.add(d.key);
    if (typeof d.updatedAt !== 'string' || !ISO_PATTERN.test(d.updatedAt) || Number.isNaN(Date.parse(d.updatedAt))) {
      return { ok: false, error: `docs[${i}].updatedAt debe ser una fecha ISO UTC con milisegundos.` };
    }
    // No se aceptan fechas del futuro lejano: impedirian volver a editar la clave.
    if (Date.parse(d.updatedAt) > Date.now() + 24 * 3_600_000) {
      return { ok: false, error: `docs[${i}].updatedAt esta en el futuro.` };
    }
    const deleted = d.deleted === true;
    if (d.deleted !== undefined && typeof d.deleted !== 'boolean') {
      return { ok: false, error: `docs[${i}].deleted debe ser booleano.` };
    }
    const value = deleted ? null : (d.value ?? null);
    const size = new TextEncoder().encode(JSON.stringify(value)).length;
    if (size > MAX_VALUE_BYTES) return { ok: false, error: `docs[${i}] supera ${MAX_VALUE_BYTES} bytes.` };
    out.push({ key: d.key, value, updatedAt: d.updatedAt, deleted });
  }
  return { ok: true, value: out };
}
