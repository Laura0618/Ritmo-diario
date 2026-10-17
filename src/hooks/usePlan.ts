import { useCallback, useMemo } from 'react';
import { docStore, useDoc } from '../lib/docs';
import { PLAN_DOC, normalizePlan, type WeekPlan } from '../lib/plan';
import { useSettings } from '../store/SettingsProvider';
import type { WeekDay } from '../types';

export interface PlanApi {
  plan: WeekPlan;
  /** Cambia la sesión de un día de la semana (0 = domingo). */
  setDay: (weekday: number, day: WeekDay) => void;
  reset: () => void;
  customized: boolean;
}

/** Plan semanal de ejercicio de la persona (documento sincronizado `plan`). */
export function usePlan(): PlanApi {
  const { settings } = useSettings();
  const raw = useDoc<unknown>(PLAN_DOC, null);
  const plan = useMemo(() => normalizePlan(raw, settings.day1), [raw, settings.day1]);

  const setDay = useCallback(
    (weekday: number, day: WeekDay) => {
      const current = normalizePlan(docStore.get<unknown>(PLAN_DOC, null), settings.day1);
      const days = current.days.map((d, i) => (i === weekday ? day : d));
      docStore.set(PLAN_DOC, { version: 1, days } satisfies WeekPlan);
    },
    [settings.day1],
  );
  const reset = useCallback(() => docStore.remove(PLAN_DOC), []);

  return { plan, setDay, reset, customized: raw !== null };
}
