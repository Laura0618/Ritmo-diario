import { NavLink } from 'react-router-dom';
import { useSync, type SyncStatus } from '../store/SyncProvider';
import { IconSettings } from './Icons';

const LABEL: Record<SyncStatus, string> = {
  idle: 'sincronizado',
  synced: 'sincronizado',
  saving: 'guardando',
  pending: 'cambios pendientes',
  offline: 'sin conexión',
  error: 'error al sincronizar',
};

/** Acceso a Ajustes en la cabecera; un punto indica el estado de la sincronización. */
export function AccountChip(): JSX.Element {
  const { authStatus, syncStatus } = useSync();
  const signedIn = authStatus === 'signed_in';
  const tone =
    syncStatus === 'error' || syncStatus === 'offline' ? 'warn' : syncStatus === 'synced' || syncStatus === 'idle' ? 'ok' : 'busy';
  return (
    <NavLink
      to="/ajustes"
      className="settings-link"
      data-tone={signedIn ? tone : undefined}
      aria-label={signedIn ? `Ajustes y cuenta: ${LABEL[syncStatus]}` : 'Ajustes y cuenta'}
    >
      <IconSettings />
      {signedIn && <span className="dot" aria-hidden="true" />}
    </NavLink>
  );
}
