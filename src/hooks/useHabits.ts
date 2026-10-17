import { useCallback, useMemo } from 'react';
import type { Habit, HabitConfig } from '../types';
import { docStore, useDoc } from '../lib/docs';
import { HABITS_DOC, moveHabit, normalizeHabitConfig } from '../lib/habits';

export interface HabitsApi {
  config: HabitConfig;
  add: (habit: Habit) => void;
  update: (habit: Habit) => void;
  remove: (id: string) => void;
  move: (from: number, to: number) => void;
}

/** Lista de habitos de la persona, en su orden (documento sincronizado `habits`). */
export function useHabits(): HabitsApi {
  const raw = useDoc<unknown>(HABITS_DOC, null);
  const config = useMemo(() => normalizeHabitConfig(raw), [raw]);

  const change = useCallback((fn: (list: Habit[]) => Habit[]) => {
    const current = normalizeHabitConfig(docStore.get<unknown>(HABITS_DOC, null));
    docStore.set(HABITS_DOC, { version: 2, list: fn(current.list) } satisfies HabitConfig);
  }, []);

  const add = useCallback(
    (habit: Habit) => change((list) => (list.some((h) => h.id === habit.id) ? list : [...list, habit])),
    [change],
  );
  const update = useCallback(
    (habit: Habit) => change((list) => list.map((h) => (h.id === habit.id ? habit : h))),
    [change],
  );
  const remove = useCallback((id: string) => change((list) => list.filter((h) => h.id !== id)), [change]);
  const move = useCallback((from: number, to: number) => change((list) => moveHabit(list, from, to)), [change]);

  return { config, add, update, remove, move };
}
