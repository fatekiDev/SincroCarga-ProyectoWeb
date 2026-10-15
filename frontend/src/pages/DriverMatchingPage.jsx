import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../styles/DriverMatchingPage.css'

const INITIAL_REQUESTS = [
  {
    id: 'request-1',
    route: 'Puerto Montt → Castro',
    match: 96,
    cargo: 'Materiales de construcción',
    load: '8 ton',
    departure: 'hoy 15:30',
    price: 87500,
    details: 'Carga paletizada, retiro en zona industrial de Puerto Montt.',
  },
  {
    id: 'request-2',
    route: 'Ancud → Castro',
    match: 88,
    cargo: 'Pallets de mariscos congelados',
    load: '2 ton',
    departure: 'mañana 09:00',
    price: 54000,
    details: 'Requiere mantener la carga refrigerada durante el trayecto.',
  },
  {
    id: 'request-3',
    route: 'Castro → Quellón',
    match: 81,
    cargo: 'Muebles de living',
    load: '1 ton',
    departure: 'mié 11:00',
    price: 32000,
    details: 'Carga embalada. El cliente ayuda con la descarga en destino.',
  },
]

const INITIAL_ACCEPTED = [
  {
    id: 'accepted-1',
    route: 'Parga → Castro',
    match: 94,
    cargo: 'Entrega de herramientas',
    load: '3 ton',
    departure: 'jue 10:00',
    price: 60000,
    details: 'Pago protegido · listo para coordinar el viaje.',
  },
]

function formatPrice(price) {
  return `$${price.toLocaleString('es-CL')}`
}

export default function DriverMatchingPage({ session, onLogout }) {
  const [available, setAvailable] = useState(INITIAL_REQUESTS)
  const [accepted, setAccepted] = useState(INITIAL_ACCEPTED)
  const [expandedId, setExpandedId] = useState(null)

  const acceptRequest = (request) => {
    setAvailable((current) => current.filter((item) => item.id !== request.id))
    setAccepted((current) => [...current, request])
  }

  return (
    <div className="page driver-matching">
      <Navbar activeSection="matching" session={session} onLogout={onLogout} />

      <main className="page__main">
        <p className="eyebrow">Camionero · Matching</p>
        <h1 className="page__title">Gestión de solicitudes y cargas</h1>
        <p className="page__subtitle">
          Cargas compatibles con tus rutas y camiones disponibles.
        </p>
        <p className="driver-matching__demo-note">
          Solicitudes de ejemplo: las acciones se mantienen solo durante esta visita.
        </p>

        <div className="driver-matching__columns">
          <section aria-labelledby="available-title">
            <h2 className="driver-matching__section-title" id="available-title">
              Solicitudes disponibles ({available.length})
            </h2>
            <div className="driver-matching__list">
              {available.length === 0 ? (
                <p className="driver-matching__empty">Ya revisaste todas las solicitudes disponibles.</p>
              ) : available.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  expanded={expandedId === request.id}
                  onToggle={() => setExpandedId(expandedId === request.id ? null : request.id)}
                  onAccept={() => acceptRequest(request)}
                />
              ))}
            </div>
          </section>

          <section aria-labelledby="accepted-title">
            <h2 className="driver-matching__section-title" id="accepted-title">
              Solicitudes aceptadas ({accepted.length})
            </h2>
            <div className="driver-matching__list">
              {accepted.length === 0 ? (
                <p className="driver-matching__empty">Todavía no has aceptado solicitudes.</p>
              ) : accepted.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  accepted
                  expanded={expandedId === request.id}
                  onToggle={() => setExpandedId(expandedId === request.id ? null : request.id)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer tagline="Matching de carga y transporte en Chiloé" />
    </div>
  )
}

function RequestCard({ request, accepted = false, expanded, onToggle, onAccept }) {
  return (
    <article className="driver-matching__card">
      <div className="driver-matching__card-heading">
        <h3>{request.route}</h3>
        <strong>{formatPrice(request.price)}</strong>
      </div>
      <span className={`driver-matching__badge${accepted ? ' driver-matching__badge--accepted' : ''}`}>
        {accepted ? 'Aceptada' : `${request.match}% match`}
      </span>
      <p className="driver-matching__cargo">{request.cargo}</p>
      <p className="driver-matching__meta">{request.load} · {request.departure}</p>
      {accepted && <p className="driver-matching__payment">Pago protegido · listo para continuar</p>}

      {expanded && (
        <div className="driver-matching__details">
          <p>{request.details}</p>
          <p><strong>Viaje:</strong> {request.route} · {request.load}</p>
        </div>
      )}

      <div className="driver-matching__actions">
        {!accepted && (
          <button type="button" className="driver-matching__button" onClick={onAccept}>
            Aceptar solicitud
          </button>
        )}
        <button
          type="button"
          className="driver-matching__button driver-matching__button--secondary"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          {accepted ? (expanded ? 'Ocultar estado' : 'Ver estado') : (expanded ? 'Ocultar detalle' : 'Ver detalle')}
        </button>
      </div>
    </article>
  )
}
