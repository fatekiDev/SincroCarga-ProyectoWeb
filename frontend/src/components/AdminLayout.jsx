import { Link, NavLink, useNavigate } from 'react-router-dom';
import LogoutButton from './LogoutButton';
import '../pages/Admin.css';

// Header + footer compartidos por las pantallas del administrador.
// userName y onLogout vienen de la sesión real cuando se integre; por ahora tienen valores por defecto.
function AdminLayout({ children, userName = 'Admin', onLogout }) {
  const navigate = useNavigate();
  const initials = userName === 'Admin'
    ? 'AD'
    : userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    if (onLogout) await onLogout();
    navigate('/');
  };

  return (
    <div className="adm-page">
      <header className="adm-header">
        <Link to="/admin" className="adm-brand" aria-label="SincroCarga, ir al panel administrativo">
          <span className="adm-brand-mark" aria-hidden="true" />
          <span className="adm-brand-text">
            <strong>SincroCarga</strong>
            <small>MATCHING OPERATIVO</small>
          </span>
        </Link>

        <nav className="adm-nav" aria-label="Principal">
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'adm-nav-link active' : 'adm-nav-link')}>Panel</NavLink>
          <NavLink to="/admin/solicitudes" className={({ isActive }) => (isActive ? 'adm-nav-link active' : 'adm-nav-link')}>Solicitudes</NavLink>
          <NavLink to="/admin/transportistas" className={({ isActive }) => (isActive ? 'adm-nav-link active' : 'adm-nav-link')}>Transportistas</NavLink>
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
        <span>Cómo funciona · Pagos seguros · Soporte</span>
      </footer>
    </div>
  );
}

export default AdminLayout;
