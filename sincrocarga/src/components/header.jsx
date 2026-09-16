import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './Button'
import './header.css'

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <a href="#top" className="site-header__brand" aria-label="SincroCarga, inicio">
          <span className="site-header__logo" aria-hidden="true"></span>
          <span className="site-header__brand-name">SincroCarga</span>
        </a>

        <nav
          className={`site-header__nav ${menuOpen ? 'site-header__nav--open' : ''}`}
          aria-label="Navegación principal"
        >
          <a href="#top">Publicar</a>
          <a href="#matching">Matching</a>
          <a href="#pagos">Pagos seguros</a>
        </nav>

        <div className="site-header__actions">
          <Button variant="primary" onClick={() => navigate('/dashboard')}>Enviar al panel</Button>

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
