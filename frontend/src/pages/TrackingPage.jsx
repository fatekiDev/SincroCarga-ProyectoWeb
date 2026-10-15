import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BadgeCheck,
  Clock3,
  LoaderCircle,
  MessageCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
  Star,
  Truck,
  UserRound,
  X,
} from 'lucide-react'
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/button';
import Card from '../components/Card';
import { getActiveTracking, reportTrackingIncident } from '../seguimiento/api'
import 'leaflet/dist/leaflet.css'
import '../styles/TrackingPage.css';

const TrackingMap = lazy(() => import('../components/TrackingMap'))

const POLL_INTERVAL_MS = 5000

const EVENT_LABELS = {
  'Inicio de viaje': 'Inicio del viaje',
  'Entrega a tiempo': 'Entrega a tiempo',
  'Entrega completada': 'Entrega completada',
  Retraso: 'Retraso registrado',
  Incidencia: 'Problema reportado',
  Cancelacion: 'Cancelación',
}

function formatDateTime(value) {
  if (!value) return 'Sin registro de hora'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Sin registro de hora'
    : new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatNumber(value, maximumFractionDigits = 2) {
  const number = Number(value)
  return value == null || !Number.isFinite(number)
    ? '—'
    : new Intl.NumberFormat('es-CL', { maximumFractionDigits }).format(number)
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toLocaleUpperCase('es-CL'))
    .join('')
}

function normalizePhone(phone) {
  return phone?.replace(/\D/g, '') ?? ''
}

export default function TrackingPage({ session, onLogout }) {
  const [tracking, setTracking] = useState(null)
  const [loadState, setLoadState] = useState('loading')
  const [trackingError, setTrackingError] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const [activeDialog, setActiveDialog] = useState('')
  const [incidentDescription, setIncidentDescription] = useState('')
  const [incidentError, setIncidentError] = useState('')
  const [incidentStatus, setIncidentStatus] = useState('idle')
  const requestInFlight = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    let mounted = true

    const pollTracking = async () => {
      if (requestInFlight.current) return
      requestInFlight.current = true
      try {
        const result = await getActiveTracking({ signal: controller.signal })
        if (!mounted) return
        setTracking(result)
        setLoadState(result ? 'ready' : 'empty')
        setTrackingError('')
      } catch (error) {
        if (error.name === 'AbortError' || !mounted) return
        setTrackingError(error.message)
        setLoadState((current) => current === 'loading' ? 'error' : current)
      } finally {
        requestInFlight.current = false
      }
    }

    pollTracking()
    const intervalId = window.setInterval(pollTracking, POLL_INTERVAL_MS)

    return () => {
      mounted = false
      window.clearInterval(intervalId)
      controller.abort()
    }
  }, [retryToken])

  const handleReportIncident = async (event) => {
    event.preventDefault()
    if (!tracking || !incidentDescription.trim()) return

    setIncidentStatus('saving')
    setIncidentError('')
    try {
      const incident = await reportTrackingIncident(tracking.viaje.id, incidentDescription.trim())
      setTracking((current) => current && ({
        ...current,
        historial: [...current.historial, incident].sort(
          (firstEvent, secondEvent) => new Date(firstEvent.timestamp) - new Date(secondEvent.timestamp),
        ),
      }))
      setIncidentDescription('')
      setIncidentStatus('success')
    } catch (error) {
      setIncidentError(error.message)
      setIncidentStatus('error')
    }
  }

  const closeDialog = () => {
    setActiveDialog('')
    setIncidentError('')
    if (incidentStatus !== 'saving') setIncidentStatus('idle')
  }

  const journey = tracking?.viaje
  const driver = journey?.conductor
  const vehicleName = [driver?.marca, driver?.modelo].filter(Boolean).join(' ')
  const vehicleDetails = [vehicleName, driver?.patente].filter(Boolean).join(' · ')
  const phone = normalizePhone(driver?.telefono || driver?.telefonoTransportista)
  const currentStage = tracking?.etapas.find((stage) => stage.status === 'active')
    ?? tracking?.etapas[tracking.etapas.length - 1]

  return (
    <div className="page">
      <Navbar activeSection="matching" session={session} onLogout={onLogout} />

      <main className="page__main tracking-main">
        {loadState === 'loading' && (
          <p className="tracking-message" role="status"><LoaderCircle size={18} /> Buscando tu viaje activo…</p>
        )}
        {loadState === 'error' && !tracking && (
          <Card className="tracking-empty">
            <AlertTriangle size={22} />
            <h1>No pudimos cargar el seguimiento</h1>
            <p>{trackingError}</p>
            <Button onClick={() => setRetryToken((token) => token + 1)}><RefreshCw size={16} /> Reintentar</Button>
          </Card>
        )}
        {loadState === 'empty' && (
          <Card className="tracking-empty">
            <Truck size={24} />
            <h1>No tienes un viaje activo</h1>
            <p>Cuando una de tus cargas tenga un viaje en progreso, su seguimiento aparecerá aquí.</p>
          </Card>
        )}

        {tracking && journey && driver && (
          <>
            <div className="tracking-header">
              <div>
                <p className="eyebrow">Seguimiento de tu viaje</p>
                <h1 className="page__title">{journey.carga}</h1>
                <p className="tracking-route-title">{journey.ruta.origen} <span aria-hidden="true">→</span> {journey.ruta.destino}</p>
              </div>
              <span className="demo-badge"><span /> Modo demostración</span>
            </div>

            {trackingError && <p className="tracking-refresh-warning" role="status">No se pudo actualizar el seguimiento: {trackingError}. Se mantiene la última consulta correcta.</p>}

            <div className="tracking-grid">
              <Card className="tracking-history-card">
                <div className="tracking-section-heading">
                  <h2 className="section-title">Historial registrado</h2>
                  <BadgeCheck size={16} aria-label="Datos guardados" />
                </div>
                {tracking.historial.length === 0 ? (
                  <p className="tracking-no-history">Aún no hay eventos registrados para este viaje.</p>
                ) : (
                  <ol className="timeline tracking-history">
                    {tracking.historial.map((event, index) => (
                      <li key={event.id} className="timeline__item">
                        {index < tracking.historial.length - 1 && <span className="timeline__line timeline__line--done" />}
                        <span className={`timeline__dot ${event.type === 'Incidencia' || event.type === 'Retraso' ? 'timeline__dot--warning' : 'timeline__dot--done'}`} />
                        <div>
                          <p className="timeline__label timeline__label--strong">{EVENT_LABELS[event.type] || event.type}</p>
                          {event.description && <p className="timeline__description">{event.description}</p>}
                          <p className="timeline__meta">{formatDateTime(event.timestamp)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                <div className="tracking-demo-stages">
                  <div className="tracking-section-heading">
                    <h3>Etapas del trayecto</h3>
                    <span className="tracking-data-tag">Simuladas</span>
                  </div>
                  <ol className="timeline">
                    {tracking.etapas.map((stage, index) => (
                      <li key={stage.id} className="timeline__item">
                        {index < tracking.etapas.length - 1 && (
                          <span className={`timeline__line ${stage.status === 'done' ? 'timeline__line--done' : ''}`} />
                        )}
                        <span className={`timeline__dot timeline__dot--${stage.status}`} />
                        <div>
                          <p className={stage.status === 'pending' ? 'timeline__label' : 'timeline__label timeline__label--strong'}>
                            {stage.label}
                          </p>
                          <p className={stage.status === 'active' ? 'timeline__meta timeline__meta--active' : 'timeline__meta'}>
                            {stage.detail}
                          </p>
                          {stage.durationEstimatedMin != null && (
                            <p className="timeline__meta">Duración estimada del cruce: {stage.durationEstimatedMin} min</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </Card>

              <Card className="map-card tracking-map-card">
                <div className="tracking-section-heading">
                  <h2 className="section-title">Mapa del recorrido</h2>
                  <span className="tracking-map-note">Posición aproximada</span>
                </div>
                <Suspense fallback={<div className="tracking-map-fallback" role="status">Cargando mapa…</div>}>
                  <TrackingMap viaje={journey} progress={tracking.progreso} />
                </Suspense>
                <div className="map-progress">
                  <div className="map-progress__top">
                    <span className="map-progress__percent">{tracking.progreso}% del recorrido simulado</span>
                    <span className="map-progress__eta">
                      <Clock3 size={13} /> Consulta cada 5 s
                    </span>
                  </div>
                  <div className="map-progress__track" aria-label={`${tracking.progreso}% del recorrido simulado`}>
                    <div className="map-progress__fill" style={{ width: `${tracking.progreso}%` }} />
                  </div>
                  <p className="tracking-updated">Última consulta: {formatDateTime(tracking.ultimaActualizacion)}</p>
                </div>
              </Card>

              <Card className="tracking-details-card">
                <h2 className="section-title">Carga y conductor</h2>
                <div className="cargo-confirmed">
                  <span className="cargo-confirmed__check"><BadgeCheck size={16} /></span>
                  <div>
                    <p className="cargo-confirmed__title">{journey.carga}</p>
                    <p className="cargo-confirmed__meta">
                      {formatNumber(journey.pesoKg)} kg · {formatNumber(journey.volumenM3, 3)} m³
                    </p>
                  </div>
                </div>

                <div className="divider" />

                <div className="driver-row">
                  <span className="driver-avatar">{getInitials(driver.nombre)}</span>
                  <div>
                    <p className="driver-name">{driver.nombre}</p>
                    <p className="driver-vehicle">{vehicleDetails || driver.transportista}</p>
                  </div>
                </div>

                <div className="rating-row">
                  {driver.calificacion != null && Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={12}
                      className={index < Math.round(Number(driver.calificacion)) ? 'star star--filled' : 'star'}
                    />
                  ))}
                  <span className="rating-row__text">
                    {driver.calificacion == null
                      ? 'Sin evaluaciones'
                      : `${formatNumber(driver.calificacion, 1)} (${driver.totalCalificaciones})`}
                  </span>
                </div>

                <Button variant="secondary" fullWidth className="profile-btn" onClick={() => setActiveDialog('profile')}>
                  <UserRound size={15} /> Ver perfil
                </Button>

                <div className="tracking-contact-actions">
                  {phone ? (
                    <>
                      <a className="btn btn--secondary" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer">
                        <MessageCircle size={15} /> WhatsApp
                      </a>
                      <a className="btn btn--secondary" href={`tel:+${phone}`}>
                        <Phone size={15} /> Llamar
                      </a>
                    </>
                  ) : <p>No hay un teléfono de contacto registrado.</p>}
                </div>

                <div className="guarantee-box">
                  <ShieldCheck size={16} />
                  <p><strong>Pago de demostración:</strong> el estado retenido se libera al confirmar la recepción. No se procesa una transferencia bancaria.</p>
                </div>
                <Button variant="secondary" fullWidth className="report-incident-button" onClick={() => setActiveDialog('incident')}>
                  <AlertTriangle size={15} /> Reportar un problema
                </Button>
              </Card>
            </div>

            <section className="status-banner tracking-status-banner">
              <div className="status-banner__left">
                <span className={`status-banner__dot ${tracking.completado ? 'status-banner__dot--complete' : ''}`} />
                <div>
                  <p className="status-banner__title">{tracking.etapaActual}</p>
                  <p className="status-banner__meta">
                    {currentStage?.detail || 'Progreso simulado a partir de las etapas del trayecto.'}
                  </p>
                </div>
              </div>
              <span className="tracking-poll-label"><RefreshCw size={14} /> Actualización automática cada 5 segundos</span>
              {tracking.completado && (
                <Link className="btn btn--secondary tracking-review-link" to="/review">
                  Revisar entrega
                </Link>
              )}
            </section>
          </>
        )}
      </main>

      <Footer tagline="Matching de carga y transporte en Chiloé" />

      {activeDialog === 'profile' && driver && (
        <div className="tracking-dialog-backdrop" onClick={(event) => event.target === event.currentTarget && closeDialog()} role="presentation">
          <section className="tracking-dialog" role="dialog" aria-modal="true" aria-labelledby="driver-dialog-title">
            <div className="tracking-dialog__heading">
              <div><p className="eyebrow">Perfil del conductor</p><h2 id="driver-dialog-title">{driver.nombre}</h2></div>
              <button type="button" className="tracking-dialog__close" onClick={closeDialog} aria-label="Cerrar perfil"><X size={18} /></button>
            </div>
            <p className="tracking-dialog__company">{driver.transportista}</p>
            <dl className="tracking-profile-facts">
              <div><dt>Vehículo</dt><dd>{vehicleDetails || 'No informado'}</dd></div>
              <div><dt>Calificación</dt><dd>{driver.calificacion == null ? 'Sin evaluaciones' : `${formatNumber(driver.calificacion, 1)} / 5 (${driver.totalCalificaciones})`}</dd></div>
              <div><dt>Ruta del viaje</dt><dd>{journey.ruta.origen} → {journey.ruta.destino}</dd></div>
            </dl>
            <div className="tracking-dialog__actions">
              {phone && <a className="btn btn--secondary" href={`tel:+${phone}`}><Phone size={15} /> Llamar</a>}
              <Button onClick={closeDialog}>Cerrar</Button>
            </div>
          </section>
        </div>
      )}

      {activeDialog === 'incident' && tracking && (
        <div className="tracking-dialog-backdrop" onClick={(event) => event.target === event.currentTarget && closeDialog()} role="presentation">
          <section className="tracking-dialog" role="dialog" aria-modal="true" aria-labelledby="incident-dialog-title">
            <div className="tracking-dialog__heading">
              <div><p className="eyebrow">Soporte SincroCarga</p><h2 id="incident-dialog-title">Reportar un problema</h2></div>
              <button type="button" className="tracking-dialog__close" onClick={closeDialog} aria-label="Cerrar formulario"><X size={18} /></button>
            </div>
            <p className="tracking-dialog__company">El reporte se guardará en el historial de este viaje.</p>
            <form onSubmit={handleReportIncident}>
              <label className="field-label" htmlFor="incident-description">¿Qué ocurrió?</label>
              <textarea
                id="incident-description"
                className="tracking-incident-textarea"
                value={incidentDescription}
                maxLength={500}
                required
                onChange={(event) => setIncidentDescription(event.target.value)}
                placeholder="Describe brevemente el problema"
              />
              <p className="tracking-incident-count">{incidentDescription.length} / 500</p>
              {incidentError && <p className="tracking-form-error" role="alert">{incidentError}</p>}
              {incidentStatus === 'success' && <p className="tracking-form-success" role="status">El problema quedó registrado en el historial del viaje.</p>}
              <div className="tracking-dialog__actions">
                <Button type="button" variant="secondary" onClick={closeDialog}>Cerrar</Button>
                <Button type="submit" disabled={incidentStatus === 'saving' || !incidentDescription.trim()}>
                  {incidentStatus === 'saving' ? <LoaderCircle size={15} /> : <AlertTriangle size={15} />}
                  {incidentStatus === 'saving' ? 'Enviando…' : 'Enviar reporte'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
