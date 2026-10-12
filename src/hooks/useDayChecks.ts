import { useCallback, useMemo } from 'react';
import type { DayChecks } from '../types';
import { docStore, useDocsVersion } from '../lib/docs';

/**
 * Casillas marcadas del dia `day` ("YYYY-MM-DD"). Cada casilla es un documento
 * propio (`check:<dia>:<tarea>`) para que dos dispositivos no se pisen.
 */
export function useDayChecks(day: string): [DayChecks, (id: string, done: boolean) => void] {
  const version = useDocsVersion();
  const prefix = `check:${day}:`;

  const checks = useMemo(() => {
    const out: DayChecks = {};
    for (const key of docStore.keys(prefix)) out[key.slice(prefix.length)] = docStore.get(key, false);
    return out;
  }, [prefix, version]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback((id: string, done: boolean) => docStore.set(`${prefix}${id}`, done), [prefix]);

  return [checks, toggle];
}
