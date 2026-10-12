import { useCallback, useEffect, useState } from 'react';
import type { DayChecks } from '../types';
import { KEYS, readJSON, writeJSON } from '../lib/storage';

/** Casillas marcadas del dia `day` ("YYYY-MM-DD"), guardadas en local. */
export function useDayChecks(day: string): [DayChecks, (id: string, done: boolean) => void] {
  const [checks, setChecks] = useState<DayChecks>(() => readJSON<DayChecks>(KEYS.checks(day), {}));

  useEffect(() => {
    setChecks(readJSON<DayChecks>(KEYS.checks(day), {}));
  }, [day]);

  const toggle = useCallback(
    (id: string, done: boolean) => {
      setChecks((prev) => {
        const next = { ...prev, [id]: done };
        writeJSON(KEYS.checks(day), next);
        return next;
      });
    },
    [day],
  );

  return [checks, toggle];
}
