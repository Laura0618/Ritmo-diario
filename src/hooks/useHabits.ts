import { useCallback, useMemo } from 'react';
import type { CustomHabit, HabitConfig, HabitTime } from '../types';
import { docStore, useDoc } from '../lib/docs';
import { HABITS_DOC, normalizeHabitConfig } from '../lib/habits';

export interface HabitsApi {
  config: HabitConfig;
  save: (next: HabitConfig) => void;
  setEnabled: (id: string, on: boolean) => void;
  setTime: (id: string, time: HabitTime | null) => void;
  upsertCustom: (habit: CustomHabit) => void;
  removeCustom: (id: string) => void;
}

/** Configuracion de habitos (documento sincronizado `habits`). */
export function useHabits(): HabitsApi {
  const raw = useDoc<Partial<HabitConfig> | null>(HABITS_DOC, null);
  const config = useMemo(() => normalizeHabitConfig(raw), [raw]);

  const update = useCallback((fn: (c: HabitConfig) => HabitConfig) => {
    const current = normalizeHabitConfig(docStore.get<Partial<HabitConfig> | null>(HABITS_DOC, null));
    docStore.set(HABITS_DOC, fn(current));
  }, []);

  const save = useCallback((next: HabitConfig) => docStore.set(HABITS_DOC, next), []);

  const setEnabled = useCallback(
    (id: string, on: boolean) => update((c) => ({ ...c, onboarded: true, enabled: { ...c.enabled, [id]: on } })),
    [update],
  );

  const setTime = useCallback(
    (id: string, time: HabitTime | null) =>
      update((c) => {
        const times = { ...c.times };
        if (time) times[id] = time;
        else delete times[id];
        return { ...c, times };
      }),
    [update],
  );

  const upsertCustom = useCallback(
    (habit: CustomHabit) =>
      update((c) => {
        const exists = c.custom.some((h) => h.id === habit.id);
        return {
          ...c,
          onboarded: true,
          custom: exists ? c.custom.map((h) => (h.id === habit.id ? habit : h)) : [...c.custom, habit],
        };
      }),
    [update],
  );

  const removeCustom = useCallback(
    (id: string) => update((c) => ({ ...c, custom: c.custom.filter((h) => h.id !== id) })),
    [update],
  );

  return { config, save, setEnabled, setTime, upsertCustom, removeCustom };
}
