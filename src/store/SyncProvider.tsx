import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, ApiError, LOGIN_URL } from '../lib/api';
import { docStore } from '../lib/docs';
import { syncOnce } from '../lib/syncEngine';
import type { AuthUser } from '../lib/syncTypes';

export type AuthStatus = 'loading' | 'signed_out' | 'signed_in';
export type SyncStatus = 'idle' | 'saving' | 'synced' | 'pending' | 'offline' | 'error';

interface SyncContextValue {
  authStatus: AuthStatus;
  user: AuthUser | null;
  oauthConfigured: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: Date | null;
  signIn: () => void;
  signOut: () => Promise<void>;
  syncNow: () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

const PUSH_DEBOUNCE_MS = 1_500;
const POLL_MS = 60_000;

export function SyncProvider({ children }: { children: ReactNode }): JSX.Element {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const signedIn = useRef(false);
  const running = useRef(false);
  const rerun = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  const run = useCallback(async (): Promise<void> => {
    if (!signedIn.current) return;
    if (running.current) {
      rerun.current = true;
      return;
    }
    running.current = true;
    setSyncStatus('saving');
    try {
      do {
        rerun.current = false;
        await syncOnce(docStore, api);
      } while (rerun.current);
      setLastSyncAt(new Date());
      setSyncStatus(docStore.hasPending() ? 'pending' : 'synced');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        signedIn.current = false;
        setUser(null);
        setAuthStatus('signed_out');
        setSyncStatus('idle');
      } else if (!navigator.onLine) {
        setSyncStatus('offline');
      } else {
        setSyncStatus('error');
      }
    } finally {
      running.current = false;
    }
  }, []);

  const syncNow = useCallback(() => {
    window.clearTimeout(timer.current);
    void run();
  }, [run]);

  // Arranque: configuracion y sesion.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const cfg = await api.config();
        if (!cancelled) setOauthConfigured(cfg.oauthConfigured);
      } catch {
        /* sin API: modo solo local */
      }
      try {
        const { user: me } = await api.me();
        if (cancelled) return;
        if (docStore.getAccountId() !== me.id) docStore.linkAccount(me.id);
        signedIn.current = true;
        setUser(me);
        setAuthStatus('signed_in');
        void run();
      } catch {
        if (!cancelled) setAuthStatus('signed_out');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [run]);

  // Subir los cambios locales poco despues de hacerlos.
  useEffect(
    () =>
      docStore.subscribe(() => {
        if (!signedIn.current || !docStore.hasPending()) return;
        setSyncStatus((s) => (s === 'saving' ? s : 'pending'));
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => void run(), PUSH_DEBOUNCE_MS);
      }),
    [run],
  );

  // Traer cambios de otros dispositivos: al volver a la app, al recuperar red y cada minuto.
  useEffect(() => {
    const onVisible = (): void => {
      if (!document.hidden) void run();
    };
    const onOnline = (): void => void run();
    const onOffline = (): void => setSyncStatus((s) => (signedIn.current ? 'offline' : s));
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const poll = window.setInterval(() => {
      if (!document.hidden) void run();
    }, POLL_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.clearInterval(poll);
    };
  }, [run]);

  const signIn = useCallback(() => {
    window.location.href = LOGIN_URL;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await api.logout();
    } catch {
      /* limpiamos el estado igualmente */
    }
    signedIn.current = false;
    docStore.linkAccount(null);
    setUser(null);
    setAuthStatus('signed_out');
    setSyncStatus('idle');
    setLastSyncAt(null);
  }, []);

  const value = useMemo<SyncContextValue>(
    () => ({ authStatus, user, oauthConfigured, syncStatus, lastSyncAt, signIn, signOut, syncNow }),
    [authStatus, user, oauthConfigured, syncStatus, lastSyncAt, signIn, signOut, syncNow],
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync debe usarse dentro de SyncProvider.');
  return ctx;
}
