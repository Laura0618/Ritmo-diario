import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../lib/plan';
import { KEYS, readJSON, writeJSON } from '../lib/storage';

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadSettings(): Settings {
  const stored = readJSON<Partial<Settings>>(KEYS.settings, {});
  const merged: Settings = { ...DEFAULT_SETTINGS, ...stored };
  // Versiones anteriores guardaban numeros como texto.
  merged.day1 = Number(merged.day1);
  merged.age = Number(merged.age);
  merged.kg = Number(merged.kg);
  merged.mins = Number(merged.mins);
  return merged;
}

export function SettingsProvider({ children }: { children: ReactNode }): JSX.Element {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeJSON(KEYS.settings, next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings debe usarse dentro de SettingsProvider.');
  return ctx;
}
