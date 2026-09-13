import './trust.css'

const ITEMS = [
  {
    title: 'Camión verificado',
    text: 'Revisamos datos y ruta antes de coordinar cualquier viaje.',
  },
  {
    title: 'Pago retenido',
    text: 'El dinero se libera solo cuando confirmas la entrega.',
  },
  {
    title: 'Soporte durante el viaje',
    text: 'Ante cualquier imprevisto, te acompañamos hasta el final.',
  },
]

function Trust() {
  return (
    <section id="pagos" className="trust" aria-label="Garantías de la plataforma">
      <div className="container trust__grid">
        {ITEMS.map((item) => (
          <article className="trust__item" key={item.title}>
            <span className="trust__icon" aria-hidden="true"></span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Trust
