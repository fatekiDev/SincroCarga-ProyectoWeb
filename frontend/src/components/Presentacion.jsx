import Button from './button'
import StatCard from './statcard'
import { useNavigate } from 'react-router-dom'
import heroBg from '../assets/hero-bg.jpg'
import './Presentacion.css'

function Presentacion() {
  const navigate = useNavigate()

  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <img
        src={heroBg}
        alt="Palafitos de Castro, Chiloé, junto al mar"
        className="hero__bg"
      />
      <div className="hero__overlay" aria-hidden="true"></div>

      <div className="container hero__content">
        <div className="hero__intro">
          <h1 id="hero-title">SincroCarga, ¿quiénes somos?</h1>
          <p className="hero__subtitle">
            La plataforma que conecta espacio disponible con carga real en Chiloé.
          </p>
          <p className="hero__paragraph">
            Publicamos disponibilidad, registramos carga y encontramos coincidencias
            por ruta, techo y compatibilidad de camión, con un flujo de pago demostrativo.
          </p>
        </div>

        <div className="hero__bottom">
          <div className="hero__ctas">
            <div className="hero__cta-card">
              <p>¿Necesitas enviar un pedido?</p>
              <Button fullWidth variant="primary" onClick={() => navigate('/publicar')}>Publicar carga</Button>
            </div>
            <div className="hero__cta-card">
              <p>¿Eres camionero?</p>
              <Button fullWidth variant="primary" onClick={() => navigate('/registro')}>Registrarme</Button>
            </div>
          </div>

          <div className="hero__stats" role="list" aria-label="Resultados de la plataforma">
            <StatCard value="≈ 3" label="cargas de referencia" />
            <StatCard value="Demo" label="pago protegido" />
            <StatCard value="≈ 2 h" label="tiempo promedio estimado" />
          </div>
        </div>
        <p className="hero__stats-note">
          Estimaciones referenciales para esta demostración, no métricas operativas en tiempo real. El pago no representa una transferencia ni un monto retenido.
        </p>
      </div>
    </section>
  )
}

export default Presentacion
