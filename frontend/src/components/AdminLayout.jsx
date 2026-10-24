import { Link, NavLink, useNavigate } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import logo from '../assets/logoprincipal.svg';
import '../pages/Admin.css';

// Header + footer compartidos por las pantallas del administrador.
function AdminLayout({ children, userName = 'Admin', onLogout }) {
  const navigate = useNavigate();
  const nameParts = userName.split(/[\s.@_-]+/).filter(Boolean)
  const initials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
    : (nameParts[0]?.slice(0, 2) || 'AD').toUpperCase()

  const handleLogout = async () => {
    if (onLogout) await onLogout();
    navigate('/');
  };

  return (
    <div className="adm-page">
      <header className="adm-header">
        <Link to="/admin" className="adm-brand" aria-label="SincroCarga, ir al panel administrativo">
          <img src={logo} alt="" aria-hidden="true" className="adm-brand-logo" />
          <span className="adm-brand-text">
            <strong>SincroCarga</strong>
            <small>MATCHING OPERATIVO</small>
          </span>
        </Link>

        <nav className="adm-nav" aria-label="Principal">
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'adm-nav-link active' : 'adm-nav-link')}>Panel</NavLink>
          <NavLink to="/admin/solicitudes" className={({ isActive }) => (isActive ? 'adm-nav-link active' : 'adm-nav-link')}>Solicitudes</NavLink>
          <NavLink to="/admin/transportistas" className={({ isActive }) => (isActive ? 'adm-nav-link active' : 'adm-nav-link')}>Transportistas</NavLink>
          <NavLink to="/admin/fletes" className={({ isActive }) => (isActive ? 'adm-nav-link active' : 'adm-nav-link')}>Fletes</NavLink>
          <NavLink to="/admin/reportes" className={({ isActive }) => (isActive ? 'adm-nav-link active' : 'adm-nav-link')}>Reportes</NavLink>
        </nav>

        <div className="adm-user">
          <span className="adm-avatar" aria-hidden="true">{initials}</span>
          <span className="adm-user-name">{userName}</span>
          <span className="adm-user-separator" aria-hidden="true">·</span>
          <LogoutButton className="adm-user-logout" label="Salir" onLogout={handleLogout} />
        </div>
      </header>

      <main className="adm-main">{children}</main>

      <footer className="adm-footer">
        <span>SincroCarga · Matching de carga y transporte en Chiloé</span>
        <nav className="adm-footer-links" aria-label="Enlaces de administración">
          <Link to="/admin/solicitudes">Solicitudes</Link>
          <Link to="/admin/transportistas">Transportistas</Link>
          <Link to="/admin/fletes">Fletes activos</Link>
          <Link to="/admin/reportes">Reportes</Link>
          <a href="mailto:contacto@sincrocarga.cl">Soporte</a>
        </nav>
      </footer>
    </div>
  );
}

export default AdminLayout;
