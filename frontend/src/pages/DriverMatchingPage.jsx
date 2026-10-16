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

function formatPrice(price) {
  return `$${price.toLocaleString('es-CL')}`
}

export default function DriverMatchingPage({ session, onLogout }) {
  const [available, setAvailable] = useState(INITIAL_REQUESTS)
  const [accepted, setAccepted] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [pendingAcceptanceId, setPendingAcceptanceId] = useState(null)
  const [actionMessage, setActionMessage] = useState('')

  const acceptRequest = (request) => {
    setAvailable((current) => current.filter((item) => item.id !== request.id))
    setAccepted((current) => [...current, request])
    setPendingAcceptanceId(null)
    setActionMessage(`${request.route} se marcó como aceptada en esta demostración. No se reservó la carga.`)
  }

  const undoAcceptance = (request) => {
    setAccepted((current) => current.filter((item) => item.id !== request.id))
    setAvailable((current) => [...current, request].sort(
      (first, second) => INITIAL_REQUESTS.findIndex((item) => item.id === first.id)
        - INITIAL_REQUESTS.findIndex((item) => item.id === second.id),
    ))
    setActionMessage(`Se deshizo la aceptación de ${request.route}.`)
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
        <p className="driver-matching__demo-note" role="note">
          Datos y acciones de demostración. Aceptar aquí no contacta al cliente, no reserva la carga y no crea un viaje.
        </p>
        {actionMessage && <p className="driver-matching__action-message" role="status">{actionMessage}</p>}

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
                  confirming={pendingAcceptanceId === request.id}
                  onToggle={() => setExpandedId(expandedId === request.id ? null : request.id)}
                  onAccept={() => {
                    setPendingAcceptanceId(request.id)
                    setActionMessage('')
                  }}
                  onConfirm={() => acceptRequest(request)}
                  onCancel={() => setPendingAcceptanceId(null)}
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
                  onUndo={() => undoAcceptance(request)}
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

function RequestCard({
  request,
  accepted = false,
  expanded,
  confirming = false,
  onToggle,
  onAccept,
  onConfirm,
  onCancel,
  onUndo,
}) {
  return (
    <article className="driver-matching__card">
      <div className="driver-matching__card-heading">
        <h3>{request.route}</h3>
        <strong>{formatPrice(request.price)}</strong>
      </div>
      <span className={`driver-matching__badge${accepted ? ' driver-matching__badge--accepted' : ''}`}>
        {accepted ? 'Aceptada en demo' : `${request.match}% de compatibilidad`}
      </span>
      <p className="driver-matching__cargo">{request.cargo}</p>
      <p className="driver-matching__meta">{request.load} · {request.departure}</p>

      {expanded && (
        <div className="driver-matching__details">
          <p>{request.details}</p>
          <p><strong>Viaje:</strong> {request.route} · {request.load}</p>
        </div>
      )}

      {confirming && (
        <div className="driver-matching__confirmation" role="group" aria-label={`Confirmar aceptación de ${request.route}`}>
          <p>Esto solo cambia esta vista. No contactará al cliente ni reservará la carga.</p>
          <div className="driver-matching__actions">
            <button type="button" className="driver-matching__button" onClick={onConfirm}>
              Confirmar en demo
            </button>
            <button type="button" className="driver-matching__button driver-matching__button--secondary" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="driver-matching__actions">
        {!accepted && !confirming && (
          <button type="button" className="driver-matching__button" onClick={onAccept}>
            Aceptar en demo
          </button>
        )}
        {accepted && (
          <button type="button" className="driver-matching__button driver-matching__button--secondary" onClick={onUndo}>
            Deshacer
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
