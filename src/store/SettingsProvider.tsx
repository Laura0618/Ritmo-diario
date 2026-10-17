import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../lib/plan';
import { docStore, useDoc } from '../lib/docs';
import { DEFAULT_PLACE, sunTimes } from '../lib/sun';
import { dateKey, formatTime } from '../lib/time';
import { useNow } from '../hooks/useNow';

interface SettingsContextValue {
  /** Ajustes efectivos: con `sunAuto`, la salida y la puesta de sol son las de hoy. */
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);
const EMPTY: Partial<Settings> = {};

const coord = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function normalize(stored: Partial<Settings>): Settings {
  const s = { ...DEFAULT_SETTINGS, ...stored };
  return {
    wake: s.wake,
    bed: s.bed,
    sunrise: s.sunrise,
    sunset: s.sunset,
    sunAuto: stored.sunAuto !== false,
    lat: coord(s.lat),
    lon: coord(s.lon),
    // La primera version guardaba algunos numeros como texto.
    day1: Number(s.day1),
    kg: Number(s.kg),
  };
}

/** Salida y puesta de sol de `date` para los ajustes (ubicación propia o la de por defecto). */
export function withSun(settings: Settings, date: Date): Settings {
  if (!settings.sunAuto) return settings;
  const lat = settings.lat ?? DEFAULT_PLACE.lat;
  const lon = settings.lon ?? DEFAULT_PLACE.lon;
  const { sunrise, sunset } = sunTimes(date, lat, lon);
  return {
    ...settings,
    sunrise: sunrise === null ? settings.sunrise : formatTime(sunrise),
    sunset: sunset === null ? settings.sunset : formatTime(sunset),
  };
}

/** Ajustes de la persona, guardados como el documento sincronizable `settings`. */
export function SettingsProvider({ children }: { children: ReactNode }): JSX.Element {
  const stored = useDoc<Partial<Settings>>('settings', EMPTY);
  const now = useNow();
  const day = dateKey(now);
  const settings = useMemo(() => withSun(normalize(stored), now), [stored, day]); // eslint-disable-line react-hooks/exhaustive-deps

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
