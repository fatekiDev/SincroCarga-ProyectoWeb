import Button from './button'
import './howitworks.css'

function HowItWorks() {
  return (
    <section id="matching" className="how" aria-labelledby="how-title">
      <div className="container how__inner">
        <h2 id="how-title">Así funciona SincroCarga</h2>
        <p className="how__subtitle">
          Publica tu espacio o tu carga, y el sistema encuentra la coincidencia por ti.
        </p>

        <div className="how__grid">
          <article className="how__card">
            <p className="how__eyebrow">Transportista</p>
            <h3>Publica tu espacio vacío</h3>
            <dl className="how__field">
              <dt>Ruta</dt>
              <dd>Puerto Montt → Castro</dd>
            </dl>
            <dl className="how__field">
              <dt>Tonelaje disponible</dt>
              <dd>8 toneladas</dd>
            </dl>
          </article>

          <article className="how__card">
            <p className="how__eyebrow">Matching automático</p>
            <h3>Coincidencia sugerida</h3>
            <div className="how__match">
              <div className="how__match-top">
                <span className="how__match-badge">96% match</span>
                <span className="how__match-price">$87.500</span>
              </div>
              <p className="how__match-route">Puerto Montt → Castro</p>
              <p className="how__match-detail">Camión con 6 ton disponibles · hoy 15:30</p>
              <Button variant="primary">Coordinar y pagar vía app</Button>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
