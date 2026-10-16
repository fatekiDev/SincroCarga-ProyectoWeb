import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getHomePath } from '../auth/session';
import logo from '../assets/logoprincipal.png';
import LogoutButton from './LogoutButton';
import './Navbar.css';

const CLIENT_NAV_ITEMS = [
  { key: 'publicar', label: 'Publicar', path: '/publicar' },
  { key: 'matching', label: 'Matching', path: '/matching' },
  { key: 'pagos', label: 'Pagos seguros', path: '/pagos' },
];

export default function Navbar({ activeSection, session, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isDriver = session.role === 'camionero';
  const navItems = isDriver
    ? [
      { key: 'inicio', label: 'Inicio', path: '/dashboard' },
      { key: 'publicar', label: 'Publicar espacio', path: '/publicar' },
      { key: 'matching', label: 'Buscar cargas', path: '/matching' },
      { key: 'viajes', label: 'Mis viajes', path: '/viajes' },
    ]
    : CLIENT_NAV_ITEMS;
  const user = {
    name: session.email || 'Mi cuenta',
    roleLabel: isDriver ? 'Camionero' : 'Cliente',
    initials: (session.email || 'SC').slice(0, 2).toUpperCase(),
  };
  const homePath = getHomePath(session);

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to={homePath} className="navbar__brand" aria-label="SincroCarga, ir al inicio">
          <div className="navbar__logo">
            <img src={logo} alt="" aria-hidden="true" />
          </div>
          <div>
            <p className="navbar__brand-title">SincroCarga</p>
            <p className="navbar__brand-subtitle">Carga y transporte, sin viajes vacíos</p>
          </div>
        </Link>

        <nav
          id="authenticated-navigation"
          className={`navbar__links${menuOpen ? ' navbar__links--open' : ''}`}
          aria-label="Navegación principal"
        >
          {navItems.map((item) => {
            const isActive = item.key === activeSection;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`navbar__link ${isActive ? 'navbar__link--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {isActive && <span className="navbar__dot" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          className="navbar__menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="authenticated-navigation"
          aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
        </button>

        <div className="navbar__user">
          <div className="navbar__user-text">
            <p className="navbar__user-name">{user.name}</p>
            <p className="navbar__user-role">{user.roleLabel}</p>
          </div>
          <div className="navbar__avatar">{user.initials}</div>
          {onLogout && <LogoutButton className="navbar__logout" onLogout={onLogout} />}
        </div>
      </div>
    </header>
  );
}
