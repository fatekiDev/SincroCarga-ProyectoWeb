import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import Button from './Button'
import { getHomePath } from '../auth/session'
import logo from '../assets/logoprincipal.png'
import './header.css'

function Header({ session }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const homePath = getHomePath(session)

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to={homePath} className="site-header__brand" aria-label="SincroCarga, inicio">
          <img src={logo} alt="" className="site-header__logo" aria-hidden="true" />
          <span className="site-header__brand-name">SincroCarga</span>
        </Link>

        <nav
          className={`site-header__nav ${menuOpen ? 'site-header__nav--open' : ''}`}
          aria-label="Navegación principal"
        >
          <a href="#top">Publicar</a>
          <a href="#matching">Matching</a>
          <a href="#pagos">Pagos seguros</a>
        </nav>

        <div className="site-header__actions">
          <Button variant="primary" onClick={() => navigate(session ? homePath : '/login')}>
            {session ? 'Ir a mi panel' : 'Iniciar sesión'}
          </Button>

          <button
            type="button"
            className="site-header__toggle"
            aria-expanded={menuOpen}
            aria-controls="site-header-nav"
            aria-label="Abrir menú de navegación"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
