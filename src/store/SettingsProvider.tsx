import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../lib/plan';
import { docStore, useDoc } from '../lib/docs';

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);
const EMPTY: Partial<Settings> = {};

function normalize(stored: Partial<Settings>): Settings {
  const merged: Settings = { ...DEFAULT_SETTINGS, ...stored };
  // La primera version guardaba algunos numeros como texto.
  merged.day1 = Number(merged.day1);
  merged.age = Number(merged.age);
  merged.kg = Number(merged.kg);
  merged.mins = Number(merged.mins);
  return merged;
}

/** Ajustes de la persona, guardados como el documento sincronizable `settings`. */
export function SettingsProvider({ children }: { children: ReactNode }): JSX.Element {
  const stored = useDoc<Partial<Settings>>('settings', EMPTY);
  const settings = useMemo(() => normalize(stored), [stored]);

  const update = useCallback((patch: Partial<Settings>) => {
    const current = normalize(docStore.get<Partial<Settings>>('settings', EMPTY));
    docStore.set('settings', { ...current, ...patch });
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider.');
  return ctx;
}
