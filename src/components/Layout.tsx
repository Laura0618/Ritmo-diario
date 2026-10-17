import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AccountChip } from './AccountChip';
import { IconLibrary, IconToday, IconTools, IconWeek } from './Icons';

const NAV_ITEMS = [
  { to: '/', label: 'Hoy', Icon: IconToday },
  { to: '/herramientas', label: 'Herramientas', Icon: IconTools },
  { to: '/semana', label: 'Semana', Icon: IconWeek },
  { to: '/biblioteca', label: 'Biblioteca', Icon: IconLibrary },
] as const;

/** Las pestañas también llevan al inicio: al cambiar de pantalla o al tocar la pestaña en la que ya estás. */
function useScrollTop(): (to: string) => void {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (to: string) => {
    if (to === pathname) window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}

export function Layout(): JSX.Element {
  const toTop = useScrollTop();
  return (
    <div className="shell">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>

      <header className="app-header">
        <Link to="/" className="brand" aria-label="Protocolos, ir a Hoy">
          <span className="sun" aria-hidden="true" />
          <span className="brand-name">Protocolos</span>
        </Link>
        <div className="header-end">
          <nav aria-label="Navegación principal" className="top-nav">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => toTop(to)}>
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
          <NavLink key={to} to={to} end={to === '/'} onClick={() => toTop(to)}>
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
