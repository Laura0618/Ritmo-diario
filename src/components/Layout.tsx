import { Link, NavLink, Outlet } from 'react-router-dom';
import { AccountChip } from './AccountChip';
import { IconLibrary, IconToday, IconTools, IconWeek } from './Icons';

const NAV_ITEMS = [
  { to: '/', label: 'Hoy', Icon: IconToday },
  { to: '/herramientas', label: 'Herramientas', Icon: IconTools },
  { to: '/semana', label: 'Semana', Icon: IconWeek },
  { to: '/biblioteca', label: 'Biblioteca', Icon: IconLibrary },
] as const;

export function Layout(): JSX.Element {
  return (
    <div className="shell">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>

      <header className="app-header">
        <Link to="/" className="brand" aria-label="Ritmo Diario, ir a Hoy">
          <span className="sun" aria-hidden="true" />
          <span className="brand-name">Ritmo Diario</span>
        </Link>
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
