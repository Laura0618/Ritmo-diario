import { NavLink, Outlet } from 'react-router-dom';
import { useNow } from '../hooks/useNow';
import { longDate } from '../lib/time';
import { AccountChip } from './AccountChip';
import { IconLibrary, IconToday, IconTools, IconWeek } from './Icons';

const NAV_ITEMS = [
  { to: '/', label: 'Hoy', Icon: IconToday },
  { to: '/herramientas', label: 'Herramientas', Icon: IconTools },
  { to: '/semana', label: 'Semana', Icon: IconWeek },
  { to: '/biblioteca', label: 'Biblioteca', Icon: IconLibrary },
] as const;

export function Layout(): JSX.Element {
  const now = useNow();

  return (
    <div className="shell">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>

      <header className="app-header">
        <div className="brand">
          <span className="sun" aria-hidden="true" />
          <div className="brand-text">
            <p className="brand-name">Ritmo Diario</p>
            <p className="brand-date">{longDate(now)}</p>
          </div>
        </div>
        <div className="header-end">
          <nav aria-label="Navegación principal" className="top-nav">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'}>
                {label}
              </NavLink>
            ))}
          </nav>
          <AccountChip />
        </div>
      </header>

      <main id="contenido" className="app-main">
        <Outlet />
        <footer className="app-footer">
          <p>
            Resumen propio de las ideas del libro <i>Protocols: An Operating Manual for the Human Body</i> (Andrew D.
            Huberman, Simon &amp; Schuster, 2026). Sin afiliación con el autor ni con la editorial.
          </p>
          <p>
            No es consejo médico. Consulta a un profesional antes de tomar suplementos, empezar con el frío o cambiar tu
            entrenamiento si tienes alguna condición de salud.
          </p>
          <p>Sin cuenta, tus datos se guardan solo en este dispositivo. Con cuenta, se sincronizan entre tus dispositivos.</p>
        </footer>
      </main>

      <nav aria-label="Navegación principal" className="bottom-nav">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
