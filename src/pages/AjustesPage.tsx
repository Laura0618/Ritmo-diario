import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSync } from '../store/SyncProvider';
import { readTheme, saveTheme, type Theme } from '../lib/theme';

function formatSync(d: Date | null): string {
  if (!d) return 'todavía no';
  return d.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
}

const THEMES: readonly (readonly [Theme, string])[] = [
  ['system', 'Sistema'],
  ['light', 'Claro'],
  ['dark', 'Oscuro'],
];

export function AjustesPage(): JSX.Element {
  const { authStatus, user, oauthConfigured, syncStatus, lastSyncAt, signIn, signOut, syncNow } = useSync();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const chooseTheme = (t: Theme): void => {
    setTheme(t);
    saveTheme(t);
  };

  // Resultado del inicio de sesion (?login=ok | error).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const login = params.get('login');
    if (!login) return;
    setNotice(
      login === 'ok'
        ? { tone: 'ok', text: 'Sesión iniciada. Tus datos se sincronizarán en todos tus dispositivos.' }
        : { tone: 'error', text: 'No se pudo iniciar sesión. Inténtalo de nuevo.' },
    );
    navigate('/ajustes', { replace: true });
  }, [location.search, navigate]);

  return (
    <>
      <div className="section-head">
        <h1>Ajustes</h1>
      </div>

      {notice && (
        <p className="notice" data-tone={notice.tone} role="status">
          {notice.text}
        </p>
      )}

      <section className="panel settings-panel" aria-labelledby="h-apariencia">
        <div className="setting-row">
          <h2 id="h-apariencia">Apariencia</h2>
          <div className="seg" role="group" aria-labelledby="h-apariencia">
            {THEMES.map(([value, label]) => (
              <button key={value} type="button" aria-pressed={theme === value} onClick={() => chooseTheme(value)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="note">«Sistema» sigue el modo claro u oscuro de tu iPhone. Se guarda en este dispositivo.</p>
      </section>

      <section className="panel settings-panel spaced" aria-labelledby="h-habitos">
        <h2 id="h-habitos">Hábitos</h2>
        <p className="lede">
          Ordena tus hábitos, cambia su frecuencia u hora, quítalos o añade nuevos del libro o tuyos.
        </p>
        <div className="btn-row">
          <Link to="/?editar=1" className="btn ghost">
            Editar hábitos
          </Link>
          <Link to="/historial" className="btn ghost">
            Ver historial
          </Link>
        </div>
      </section>

      <section className="panel settings-panel spaced" aria-labelledby="h-cuenta">
        <h2 id="h-cuenta">Cuenta y sincronización</h2>

        {authStatus === 'loading' && <p className="lede">Comprobando la sesión…</p>}

        {authStatus === 'signed_out' && (
          <>
            <p className="lede">
              Sin cuenta, tus datos viven solo en este dispositivo. Inicia sesión con Google para tenerlos en el móvil y
              en el ordenador a la vez.
            </p>
            {oauthConfigured ? (
              <div className="btn-row">
                <button type="button" className="btn" onClick={signIn}>
                  Entrar con Google
                </button>
              </div>
            ) : (
              <p className="note">
                El inicio de sesión todavía no está activado en este despliegue. La app funciona igual en este
                dispositivo.
              </p>
            )}
          </>
        )}

        {authStatus === 'signed_in' && user && (
          <>
            <div className="account">
              {user.picture ? (
                <img src={user.picture} alt="" className="avatar" referrerPolicy="no-referrer" />
              ) : (
                <span className="avatar" aria-hidden="true">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="account-text">
                <p className="account-name">{user.name}</p>
                <p className="small muted">{user.email}</p>
              </div>
            </div>
            <dl className="kv">
              <dt>Estado</dt>
              <dd>
                {syncStatus === 'error'
                  ? 'Error al sincronizar. Se reintentará solo.'
                  : syncStatus === 'offline'
                    ? 'Sin conexión. Los cambios se guardan aquí y se subirán al volver la red.'
                    : syncStatus === 'saving'
                      ? 'Guardando…'
                      : syncStatus === 'pending'
                        ? 'Cambios pendientes de subir.'
                        : 'Todo sincronizado.'}
              </dd>
              <dt>Última sincronización</dt>
              <dd className="mono">{formatSync(lastSyncAt)}</dd>
            </dl>
            <div className="btn-row">
              <button type="button" className="btn" onClick={syncNow} disabled={syncStatus === 'saving'}>
                Sincronizar ahora
              </button>
              <button type="button" className="btn ghost" onClick={() => void signOut()}>
                Cerrar sesión
              </button>
            </div>
            <p className="note">
              Al cerrar sesión, los datos siguen en este dispositivo pero dejan de sincronizarse. Si dos dispositivos
              cambian lo mismo, se queda el cambio más reciente.
            </p>
          </>
        )}
      </section>

      <section className="settings-panel spaced about" aria-labelledby="h-about">
        <h2 id="h-about" className="sr-only">
          Acerca de
        </h2>
        <p>
          Resumen propio de las ideas del libro <i>Protocols: An Operating Manual for the Human Body</i> (Andrew D.
          Huberman, Simon &amp; Schuster, 2026). Sin afiliación con el autor ni con la editorial.
        </p>
        <p>
          No es consejo médico. Consulta a un profesional antes de tomar suplementos, empezar con el frío o cambiar tu
          entrenamiento si tienes alguna condición de salud.
        </p>
      </section>
    </>
  );
}
