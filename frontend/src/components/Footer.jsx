import { Link } from 'react-router-dom';
import { getHomePath } from '../auth/session';
import logo from '../assets/logoprincipal.png';
import './Footer.css';

export default function Footer({ tagline = 'Carga y transporte en Chiloé', session }) {
  const links = session?.role === 'camionero'
    ? [
      { label: 'Inicio', to: '/dashboard' },
      { label: 'Buscar cargas', to: '/matching' },
      { label: 'Mis viajes', to: '/viajes' },
    ]
    : session?.role === 'cliente'
      ? [
        { label: 'Mis cargas', to: '/publicar' },
        { label: 'Matching', to: '/matching' },
        { label: 'Pagos seguros', to: '/pagos' },
      ]
      : [
        { label: 'Cómo funciona', to: '/#matching' },
        { label: 'Pagos seguros', to: '/#pagos' },
      ];

  return (
    <footer className="footer">
      <div className="footer__inner">
        <Link to={getHomePath(session)} className="footer__brand" aria-label="SincroCarga, ir a mi inicio">
          <div className="footer__logo">
            <img src={logo} alt="" aria-hidden="true" />
          </div>
          <div>
            <p className="footer__title">SincroCarga</p>
            <p className="footer__tagline">{tagline}</p>
          </div>
        </Link>

        <nav className="footer__links" aria-label="Enlaces de navegación">
          {links.map(({ label, to }) => (
            <Link key={label} to={to} className="footer__link">{label}</Link>
          ))}
          <a href="mailto:contacto@sincrocarga.cl" className="footer__link">Soporte</a>
        </nav>
      </div>
    </footer>
  );
}
