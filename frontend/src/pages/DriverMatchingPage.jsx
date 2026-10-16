import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, LoaderCircle, RefreshCw, Search } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  applyToLoad,
  getAvailableLoads,
  getCarrierApplications,
  withdrawApplication,
} from '../transportista/api'
import '../styles/DriverMatchingPage.css'

const CURRENCY_FORMAT = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const NUMBER_FORMAT = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 })

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(date)
}

function applicationStatus(status) {
  const labels = {
    Pendiente: 'En revisión del cliente',
    Aceptada: 'Aceptada',
    Rechazada: 'No seleccionada',
    Retirada: 'Retirada',
  }
  return labels[status] || status
}

export default function DriverMatchingPage({ session, onLogout }) {
  const [loads, setLoads] = useState([])
  const [applications, setApplications] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const [expandedId, setExpandedId] = useState(null)
  const [applicationId, setApplicationId] = useState(null)
  const [withdrawId, setWithdrawId] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ tarifaPropuesta: '', comentario: '' })
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [message, setMessage] = useState('')

  const reloadData = () => {
    setLoadState('loading')
    setLoadError('')
    setRetryToken((token) => token + 1)
  }

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      getAvailableLoads({ signal: controller.signal }),
      getCarrierApplications({ signal: controller.signal }),
    ])
      .then(([availableLoads, ownApplications]) => {
        setLoads(availableLoads)
        setApplications(ownApplications)
        setLoadError('')
        setLoadState('ready')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setLoadError(error.message)
        setLoadState('error')
      })
    return () => controller.abort()
  }, [retryToken])

  const filteredLoads = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es-CL')
    if (!term) return loads
    return loads.filter((load) => [
      load.carga,
      load.tipoCarga,
      load.ruta.origen,
      load.ruta.destino,
      load.ruta.cruceMaritimo,
    ].filter(Boolean).some((value) => value.toLocaleLowerCase('es-CL').includes(term)))
  }, [loads, search])

  const handleApply = async (event, load) => {
    event.preventDefault()
    const offeredRate = Number(form.tarifaPropuesta)
    if (!Number.isFinite(offeredRate) || offeredRate <= 0) {
      setActionError('Ingresa una tarifa propuesta mayor que cero.')
      return
    }

    setBusyId(load.id)
    setActionError('')
    setMessage('')
    try {
      const result = await applyToLoad(load.id, {
        tarifaPropuesta: offeredRate,
        comentario: form.comentario.trim(),
      })
      setMessage(result.reapplied
        ? `Actualizaste tu postulación para ${load.ruta.origen} → ${load.ruta.destino}.`
        : `Postulación enviada para ${load.ruta.origen} → ${load.ruta.destino}.`)
      setApplicationId(null)
      setForm({ tarifaPropuesta: '', comentario: '' })
      reloadData()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleWithdraw = async (application) => {
    setBusyId(application.id)
    setActionError('')
    setMessage('')
    try {
      await withdrawApplication(application.id)
      setWithdrawId(null)
      setMessage('Retiraste la postulación. Puedes volver a postular mientras la carga siga disponible.')
      reloadData()
    } catch (error) {
      setActionError(error.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page driver-matching">
      <Navbar activeSection="matching" session={session} onLogout={onLogout} />

      <main className="page__main">
        <p className="eyebrow">Transportista · Cargas disponibles</p>
        <h1 className="page__title">Busca cargas y postula</h1>
        <p className="page__subtitle">
          Revisa el trayecto, el cruce marítimo y los requisitos antes de enviar tu tarifa al cliente.
        </p>
        <p className="driver-matching__notice">
          Las postulaciones quedan guardadas en tu cuenta. Enviar una postulación no confirma el viaje: espera la decisión del cliente.
        </p>

        {message && <p className="driver-matching__message" role="status">{message}</p>}
        {actionError && <p className="driver-matching__error" role="alert">{actionError}</p>}

        <div className="driver-matching__toolbar">
          <label className="driver-matching__search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Buscar por carga, comuna o cruce</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar carga, comuna o cruce"
            />
          </label>
          {loadState === 'error' && (
            <button
              type="button"
              className="driver-matching__button driver-matching__button--secondary"
              onClick={reloadData}
            >
              <RefreshCw size={15} /> Reintentar
            </button>
          )}
        </div>

        {loadState === 'loading' && (
          <p className="driver-matching__feedback" role="status">
            <LoaderCircle size={18} /> Cargando cargas y postulaciones…
          </p>
        )}
        {loadState === 'error' && (
          <p className="driver-matching__error" role="alert">
            <AlertTriangle size={17} /> No se pudieron cargar los datos: {loadError}
          </p>
        )}

        {loadState === 'ready' && (
          <div className="driver-matching__columns">
            <section aria-labelledby="available-title">
              <h2 className="driver-matching__section-title" id="available-title">
                Cargas disponibles ({filteredLoads.length})
              </h2>
              <div className="driver-matching__list">
                {filteredLoads.length === 0 ? (
                  <p className="driver-matching__empty">
                    {loads.length
                      ? 'No hay cargas que coincidan con esa búsqueda.'
                      : 'No hay cargas disponibles para tu flota en este momento.'}
                  </p>
                ) : filteredLoads.map((load) => (
                  <article className="driver-matching__card" key={load.id}>
                    <div className="driver-matching__card-heading">
                      <h3>{load.ruta.origen} <span aria-hidden="true">→</span> {load.ruta.destino}</h3>
                      <strong>{CURRENCY_FORMAT.format(load.tarifaOfrecida)}</strong>
                    </div>
                    <p className="driver-matching__cargo">{load.carga} · {load.tipoCarga}</p>
                    <p className="driver-matching__meta">
                      {NUMBER_FORMAT.format(load.pesoKg)} kg · {NUMBER_FORMAT.format(load.volumenM3)} m³
                      {' · '}{NUMBER_FORMAT.format(load.ruta.distanciaKm)} km
                    </p>
                    <p className="driver-matching__meta">
                      {load.ruta.cruceMaritimo
                        ? `Incluye cruce ${load.ruta.cruceMaritimo}${load.ruta.duracionEstimadaMin ? ` · ${load.ruta.duracionEstimadaMin} min estimados` : ''}`
                        : 'Sin cruce marítimo registrado'}
                      {' · '}Postula hasta {formatDate(load.fechaLimitePostulacion)}
                    </p>
                    {(load.requiereRefrigeracion || load.esPeligrosa) && (
                      <p className="driver-matching__requirements">
                        Requisitos: {[
                          load.requiereRefrigeracion && 'mantener refrigeración',
                          load.esPeligrosa && 'manejo de carga peligrosa',
                        ].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {!load.puedePostular && (
                      <p className="driver-matching__eligibility" role="note">
                        {!load.tieneCamionCompatible
                          ? 'Tu cuenta no tiene un camión activo con capacidad suficiente para esta carga.'
                          : 'Necesitas una licencia de conducir vigente para postular.'}
                        {' '}<a href="mailto:contacto@sincrocarga.cl">Solicitar ayuda para actualizar tus datos</a>
                      </p>
                    )}

                    <div className="driver-matching__actions">
                      <button
                        type="button"
                        className="driver-matching__button driver-matching__button--secondary"
                        onClick={() => setExpandedId(expandedId === load.id ? null : load.id)}
                        aria-expanded={expandedId === load.id}
                      >
                        {expandedId === load.id ? 'Ocultar ruta' : 'Ver ruta y condiciones'}
                      </button>
                      {load.puedePostular && (
                        <button
                          type="button"
                          className="driver-matching__button"
                          onClick={() => {
                            setApplicationId(applicationId === load.id ? null : load.id)
                            setForm({ tarifaPropuesta: String(load.tarifaOfrecida), comentario: '' })
                            setActionError('')
                          }}
                          aria-expanded={applicationId === load.id}
                        >
                          {applicationId === load.id ? 'Cerrar postulación' : 'Postular'}
                        </button>
                      )}
                    </div>

                    {expandedId === load.id && (
                      <div className="driver-matching__details">
                        <p><strong>Recorrido:</strong> {load.ruta.origen} → {load.ruta.destino}</p>
                        <p><strong>Distancia referencial:</strong> {NUMBER_FORMAT.format(load.ruta.distanciaKm)} km</p>
                        <p><strong>Capacidad requerida:</strong> {NUMBER_FORMAT.format(load.pesoKg)} kg y {NUMBER_FORMAT.format(load.volumenM3)} m³</p>
                        <p><strong>Tarifa del cliente:</strong> {CURRENCY_FORMAT.format(load.tarifaOfrecida)} CLP</p>
                        <p>La ruta y la tarifa se confirman con el cliente antes de iniciar el viaje.</p>
                      </div>
                    )}

                    {applicationId === load.id && (
                      <form className="driver-matching__application" onSubmit={(event) => handleApply(event, load)}>
                        <label>
                          Tu tarifa propuesta (CLP)
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            inputMode="numeric"
                            value={form.tarifaPropuesta}
                            onChange={(event) => setForm((current) => ({ ...current, tarifaPropuesta: event.target.value }))}
                          />
                        </label>
                        <label>
                          Comentario para el cliente (opcional)
                          <textarea
                            maxLength={500}
                            rows={3}
                            value={form.comentario}
                            onChange={(event) => setForm((current) => ({ ...current, comentario: event.target.value }))}
                          />
                          <span>{form.comentario.length}/500 caracteres</span>
                        </label>
                        <div className="driver-matching__actions">
                          <button className="driver-matching__button" type="submit" disabled={busyId === load.id}>
                            {busyId === load.id ? 'Enviando…' : 'Enviar postulación'}
                          </button>
                          <button
                            className="driver-matching__button driver-matching__button--secondary"
                            type="button"
                            onClick={() => setApplicationId(null)}
                            disabled={busyId === load.id}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section aria-labelledby="applications-title">
              <h2 className="driver-matching__section-title" id="applications-title">
                Mis postulaciones ({applications.length})
              </h2>
              <div className="driver-matching__list">
                {applications.length === 0 ? (
                  <p className="driver-matching__empty">Aún no has enviado postulaciones.</p>
                ) : applications.map((application) => (
                  <article className="driver-matching__card" key={application.id}>
                    <div className="driver-matching__card-heading">
                      <h3>{application.ruta.origen} <span aria-hidden="true">→</span> {application.ruta.destino}</h3>
                      <strong>{CURRENCY_FORMAT.format(application.tarifaPropuesta)}</strong>
                    </div>
                    <p className={`driver-matching__badge driver-matching__badge--${application.estado.toLowerCase()}`}>
                      {applicationStatus(application.estado)}
                    </p>
                    <p className="driver-matching__cargo">{application.carga} · {application.tipoCarga}</p>
                    <p className="driver-matching__meta">Enviada: {formatDate(application.fecha)}</p>
                    {application.comentario && <p className="driver-matching__details">{application.comentario}</p>}
                    {application.viaje && (
                      <p className="driver-matching__meta">
                        Viaje #{application.viaje.id}: {application.viaje.estado}
                      </p>
                    )}
                    {application.estado === 'Pendiente' && (
                      withdrawId === application.id ? (
                        <div className="driver-matching__confirmation" role="group" aria-label="Confirmar retiro de postulación">
                          <p>¿Retirar esta postulación? Podrás volver a postular si la carga sigue disponible.</p>
                          <div className="driver-matching__actions">
                            <button
                              type="button"
                              className="driver-matching__button"
                              onClick={() => handleWithdraw(application)}
                              disabled={busyId === application.id}
                            >
                              {busyId === application.id ? 'Retirando…' : 'Sí, retirar'}
                            </button>
                            <button
                              type="button"
                              className="driver-matching__button driver-matching__button--secondary"
                              onClick={() => setWithdrawId(null)}
                              disabled={busyId === application.id}
                            >
                              Mantener postulación
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="driver-matching__button driver-matching__button--secondary"
                          onClick={() => setWithdrawId(application.id)}
                        >
                          Retirar postulación
                        </button>
                      )
                    )}
                  </article>
                ))}
              </div>
              <Link className="driver-matching__journeys-link" to="/viajes">
                Ver estado de mis viajes <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </section>
          </div>
        )}

        <p className="driver-matching__help">
          ¿Necesitas ayuda con una postulación? <a href="mailto:contacto@sincrocarga.cl">Contacta a soporte</a>.
        </p>
      </main>

      <Footer tagline="Matching de carga y transporte en Chiloé" />
    </div>
  )
}
