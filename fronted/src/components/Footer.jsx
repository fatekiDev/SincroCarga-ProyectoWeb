import logo from '../assets/logoprincipal.png';
import './Footer.css';

export default function Footer({ tagline = 'Carga y transporte en Chiloé' }) {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">
            <img src={logo} alt="" aria-hidden="true" />
          </div>
          <div>
            <p className="footer__title">SincroCarga</p>
            <p className="footer__tagline">{tagline}</p>
          </div>
        </div>

        <nav className="footer__links">
          <a href="#" className="footer__link">Cómo funciona</a>
          <a href="#" className="footer__link">Pagos seguros</a>
          <a href="#" className="footer__link">Soporte</a>
        </nav>
      </div>
    </footer>
  );
}
