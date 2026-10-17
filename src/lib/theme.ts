import { KEYS, readJSON, writeJSON } from './storage';

/** Apariencia elegida en este dispositivo. */
export type Theme = 'system' | 'light' | 'dark';

const THEME_COLOR: Record<'light' | 'dark', string> = { light: '#FFFFFF', dark: '#000000' };

export function readTheme(): Theme {
  const t = readJSON<string>(KEYS.theme, 'system');
  return t === 'light' || t === 'dark' ? t : 'system';
}

/** Aplica la apariencia al documento y a la barra de estado del iPhone. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    const scheme = meta.media.includes('dark') ? 'dark' : 'light';
    meta.content = THEME_COLOR[theme === 'system' ? scheme : theme];
  });
}

export function saveTheme(theme: Theme): void {
  writeJSON(KEYS.theme, theme);
  applyTheme(theme);
}
