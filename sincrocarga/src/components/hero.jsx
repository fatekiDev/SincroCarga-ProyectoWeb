import Button from './button'
import StatCard from './statcard'
import heroBg from '../assets/hero-bg.jpg'
import './hero.css'

function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <img src={heroBg} alt="" className="hero__bg" aria-hidden="true" />
      <div className="hero__overlay" aria-hidden="true"></div>

      <div className="container hero__content">
        <div className="hero__intro">
          <h1 id="hero-title">SincroCarga, ¿quiénes somos?</h1>
          <p className="hero__subtitle">
            La plataforma que conecta espacio disponible con carga real en Chiloé.
          </p>
          <p className="hero__paragraph">
            Publicamos disponibilidad, registramos carga y encontramos coincidencias
            por ruta, techo y compatibilidad de camión, con pago seguro dentro de la app.
          </p>
        </div>

        <div className="hero__bottom">
          <div className="hero__ctas">
            <div className="hero__cta-card">
              <p>¿Necesitas enviar un pedido?</p>
              <Button variant="primary">Publicar carga</Button>
            </div>
            <div className="hero__cta-card">
              <p>¿Eres camionero?</p>
              <Button variant="primary">Registrarme</Button>
            </div>
          </div>

          <div className="hero__stats" role="list" aria-label="Resultados de la plataforma">
            {/* Nota: los valores son "—" mientras no exista el dato real
                proveniente del backend. Nunca mostrar cifras inventadas. */}
            <StatCard value="—" label="coincidencias activas" />
            <StatCard value="—" label="pago asegurado" />
            <StatCard value="—" label="tiempo promedio" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
