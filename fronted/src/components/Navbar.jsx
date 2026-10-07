import { Link } from 'react-router-dom';
import logo from '../assets/logoprincipal.png';
import './Navbar.css';

const NAV_ITEMS = [
  { key: 'publicar', label: 'Publicar', path: '/publicar' },
  { key: 'matching', label: 'Matching', path: '/matching' },
  { key: 'pagos', label: 'Pagos seguros', path: '/pagos' },
];

export default function Navbar({ activeSection, user }) {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/publicar" className="navbar__brand" aria-label="Ir a publicar carga">
          <div className="navbar__logo">
            <img src={logo} alt="" aria-hidden="true" />
          </div>
          <div>
            <p className="navbar__brand-title">SincroCarga</p>
            <p className="navbar__brand-subtitle">Carga y transporte, sin viajes vacíos</p>
          </div>
        </Link>

        <nav className="navbar__links">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeSection;
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`navbar__link ${isActive ? 'navbar__link--active' : ''}`}
              >
                {isActive && <span className="navbar__dot" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="navbar__user">
          <div className="navbar__user-text">
            <p className="navbar__user-name">{user.name}</p>
            <p className="navbar__user-role">{user.roleLabel}</p>
          </div>
          <div className="navbar__avatar">{user.initials}</div>
        </div>
      </div>
    </header>
  );
}
