import { Link } from 'react-router-dom';
import { useSync, type SyncStatus } from '../store/SyncProvider';

const LABEL: Record<SyncStatus, string> = {
  idle: 'Sincronizado',
  synced: 'Sincronizado',
  saving: 'Guardando…',
  pending: 'Pendiente',
  offline: 'Sin conexión',
  error: 'Error al sincronizar',
};

/** Estado de la cuenta en la cabecera. Lleva a Ajustes. */
export function AccountChip(): JSX.Element | null {
  const { authStatus, syncStatus, oauthConfigured, user } = useSync();
  if (authStatus === 'loading') return null;

  if (authStatus === 'signed_out') {
    if (!oauthConfigured) return null;
    return (
      <Link to="/ajustes" className="account-chip" data-tone="neutral">
        Iniciar sesión
      </Link>
    );
  }

  const tone = syncStatus === 'error' || syncStatus === 'offline' ? 'warn' : syncStatus === 'synced' || syncStatus === 'idle' ? 'ok' : 'busy';
  return (
    <Link to="/ajustes" className="account-chip" data-tone={tone} title={user?.email ?? undefined} aria-live="polite">
      <span className="dot" aria-hidden="true" />
      {LABEL[syncStatus]}
    </Link>
  );
}
