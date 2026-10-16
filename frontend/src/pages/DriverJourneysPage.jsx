import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Clock3, LoaderCircle, MapPinned, RefreshCw, Truck } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getCarrierJourneys } from '../transportista/api'
import 'leaflet/dist/leaflet.css'
import '../styles/DriverJourneysPage.css'

const TrackingMap = lazy(() => import('../components/TrackingMap'))

const CURRENCY_FORMAT = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})
const NUMBER_FORMAT = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 })

function formatDateTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function getStatusLabel(status) {
  const known = {
    'En Progreso': 'En curso',
    Completado: 'Finalizado',
    Cancelado: 'Cancelado',
    Pendiente: 'Pendiente',
  }
  return known[status] || status
}

export default function DriverJourneysPage({ session, onLogout }) {
  const [journeys, setJourneys] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [retryToken, setRetryToken] = useState(0)

  const reloadJourneys = () => {
    setStatus('loading')
    setError('')
    setRetryToken((token) => token + 1)
  }

  useEffect(() => {
    const controller = new AbortController()
    getCarrierJourneys({ signal: controller.signal })
      .then((result) => {
        setJourneys(result)
        setStatus(result.length ? 'ready' : 'empty')
        setError('')
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        setError(requestError.message)
        setStatus('error')
      })
    return () => controller.abort()
  }, [retryToken])

  return (
    <div className="page driver-journeys">
      <Navbar activeSection="viajes" session={session} onLogout={onLogout} />

      <main className="page__main driver-journeys__main">
        <Link className="driver-journeys__back-link" to="/dashboard">
          <ArrowLeft size={16} aria-hidden="true" /> Volver al panel
        </Link>
        <p className="eyebrow">Transportista · Seguimiento</p>
        <h1 className="page__title">Estado de mis viajes</h1>
        <p className="page__subtitle">
          Consulta el estado registrado por SincroCarga, el recorrido y el camión asignado.
        </p>
        <p className="driver-journeys__note">
          El mapa muestra un recorrido referencial; la plataforma no registra ubicación GPS del camión.
        </p>

        <div className="driver-journeys__toolbar">
          <p className="driver-journeys__updated">
            <Clock3 size={15} /> Estado consultado al cargar esta página
          </p>
          <button
            type="button"
            className="driver-journeys__refresh"
            onClick={reloadJourneys}
            disabled={status === 'loading'}
          >
            <RefreshCw size={15} /> Actualizar
          </button>
        </div>

        {status === 'loading' && (
          <p className="driver-journeys__feedback" role="status">
            <LoaderCircle size={18} /> Consultando tus viajes…
          </p>
        )}
        {status === 'error' && (
          <div className="driver-journeys__error" role="alert">
            <AlertTriangle size={18} />
            <p>No se pudieron cargar tus viajes: {error}</p>
            <button type="button" className="driver-journeys__refresh" onClick={reloadJourneys}>
              Reintentar
            </button>
          </div>
        )}
        {status === 'empty' && (
          <section className="driver-journeys__empty">
            <Truck size={24} aria-hidden="true" />
            <h2>Aún no tienes viajes asignados</h2>
            <p>
              Un viaje aparecerá aquí cuando el cliente acepte una de tus postulaciones y quede registrado en el sistema.
            </p>
            <Link to="/matching">Revisar cargas disponibles</Link>
          </section>
        )}
        {status === 'ready' && (
          <div className="driver-journeys__list">
            {journeys.map((journey) => (
              <article className="driver-journeys__card" key={journey.id}>
                <div className="driver-journeys__card-heading">
                  <div>
                    <p className="driver-journeys__trip-id">Viaje #{journey.id}</p>
                    <h2>{journey.ruta.origen} <span aria-hidden="true">→</span> {journey.ruta.destino}</h2>
                  </div>
                  <span className={`driver-journeys__status driver-journeys__status--${journey.estado.toLowerCase().replaceAll(' ', '-')}`}>
                    {getStatusLabel(journey.estado)}
                  </span>
                </div>

                <div className="driver-journeys__facts">
                  <p><strong>Carga:</strong> {journey.carga}</p>
                  <p><strong>Peso y volumen:</strong> {NUMBER_FORMAT.format(journey.pesoKg)} kg · {NUMBER_FORMAT.format(journey.volumenM3)} m³</p>
                  <p><strong>Camión:</strong> {journey.camion}</p>
                  <p><strong>Inicio registrado:</strong> {formatDateTime(journey.fechaInicio)}</p>
                  {journey.fechaFin && <p><strong>Término registrado:</strong> {formatDateTime(journey.fechaFin)}</p>}
                  {journey.ruta.cruceMaritimo && (
                    <p><strong>Cruce:</strong> {journey.ruta.cruceMaritimo}
                      {journey.ruta.duracionEstimadaMin ? ` · ${journey.ruta.duracionEstimadaMin} min estimados` : ''}
                    </p>
                  )}
                  <p><strong>Distancia referencial:</strong> {NUMBER_FORMAT.format(journey.ruta.distanciaKm)} km</p>
                  <p><strong>Tarifa final registrada:</strong> {CURRENCY_FORMAT.format(journey.tarifaFinal)}</p>
                </div>

                <button
                  type="button"
                  className="driver-journeys__map-toggle"
                  onClick={() => setExpandedId(expandedId === journey.id ? null : journey.id)}
                  aria-expanded={expandedId === journey.id}
                >
                  <MapPinned size={16} />
                  {expandedId === journey.id ? 'Ocultar mapa referencial' : 'Ver mapa referencial del recorrido'}
                </button>

                {expandedId === journey.id && (
                  <div className="driver-journeys__map">
                    <p>{journey.ruta.origen} → {journey.ruta.destino} · trazado aproximado, no navegación GPS.</p>
                    <Suspense fallback={<p role="status">Cargando mapa…</p>}>
                      <TrackingMap viaje={journey} progress={0} showVehicle={false} />
                    </Suspense>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer session={session} tagline="Matching de carga y transporte en Chiloé" />
    </div>
  )
}
