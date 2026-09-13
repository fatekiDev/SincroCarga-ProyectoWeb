import './footer.css'

function Footer() {
  return (
    <footer id="contacto" className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <p className="site-footer__brand">SincroCarga</p>
          <p className="site-footer__tagline">
            Conectamos espacio disponible con carga real en Chiloé.
          </p>
        </div>

        <section aria-labelledby="footer-contact">
          <h3 id="footer-contact">Contacto</h3>
          <address>
            <p>Castro, Chiloé</p>
            <p><a href="mailto:contacto@sincrocarga.cl">contacto@sincrocarga.cl</a></p>
            <p><a href="tel:+56900000000">+56 9 0000 0000</a></p>
          </address>
        </section>

        <nav aria-labelledby="footer-social">
          <h3 id="footer-social">Redes sociales</h3>
          <ul className="site-footer__list">
            <li><a href="#" target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer">Facebook</a></li>
            <li><a href="#" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-links">
          <h3 id="footer-links">Enlaces</h3>
          <ul className="site-footer__list">
            <li><a href="#top">Publicar espacio</a></li>
            <li><a href="#matching">Cómo funciona</a></li>
            <li><a href="#pagos">Pagos seguros</a></li>
          </ul>
        </nav>
      </div>

      <p className="site-footer__copyright">
        © {new Date().getFullYear()} SincroCarga. Todos los derechos reservados.
      </p>
    </footer>
  )
}

export default Footer
