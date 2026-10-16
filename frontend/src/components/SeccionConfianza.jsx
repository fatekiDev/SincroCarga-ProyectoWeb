import { Headset, ShieldCheck, Truck } from 'lucide-react'
import './SeccionConfianza.css'

const ITEMS = [
  {
    title: 'Camión verificado',
    text: 'La cuenta y los documentos del transportista pasan por revisión.',
    icon: Truck,
  },
  {
    title: 'Pago retenido',
    text: 'El flujo de pago es demostrativo; no se realizan transferencias reales.',
    icon: ShieldCheck,
  },
  {
    title: 'Soporte durante el viaje',
    text: 'Puedes registrar incidencias desde el seguimiento del viaje.',
    icon: Headset,
  },
]

function SeccionConfianza() {
  return (
    <section id="pagos" className="trust" aria-label="Garantías de la plataforma">
      <div className="container trust__grid">
        {ITEMS.map(({ icon: Icon, ...item }) => (
          <article className="trust__item" key={item.title}>
            <span className="trust__icon" aria-hidden="true"><Icon size={24} strokeWidth={1.8} /></span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default SeccionConfianza
