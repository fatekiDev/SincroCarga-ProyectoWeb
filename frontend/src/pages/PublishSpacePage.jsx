import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, LoaderCircle, PackagePlus, RefreshCw } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  cancelCarrierTransportPublication,
  createCarrierTransportPublication,
  getCarrierCatalogs,
  getCarrierTransportPublications,
} from '../transportista/api'
import '../styles/PublishSpacePage.css'

function localDateString(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

const CURRENCY_FORMAT = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

export default function PublishSpacePage({ session, onLogout }) {
  const [catalogs, setCatalogs] = useState({ rutas: [], camiones: [] })
  const [spaces, setSpaces] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const [form, setForm] = useState({
    camionId: '',
    rutaId: '',
    fechaDesde: '',
    fechaHasta: '',
    capacidadKg: '',
    capacidadM3: '',
    tarifaReferencial: '',
  })
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [cancelId, setCancelId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const reloadData = () => {
    setLoadState('loading')
    setLoadError('')
    setRetryToken((token) => token + 1)
  }

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      getCarrierCatalogs({ signal: controller.signal }),
      getCarrierTransportPublications({ signal: controller.signal }),
    ])
      .then(([catalogData, mySpaces]) => {
        setCatalogs(catalogData)
        setSpaces(mySpaces)
        setLoadError('')
        setLoadState('ready')
      })
      .catch((requestError) => {
        if (requestError.name === 'AbortError') return
        setLoadError(requestError.message)
        setLoadState('error')
      })
    return () => controller.abort()
  }, [retryToken])

  const selectedTruck = useMemo(
    () => catalogs.camiones.find((truck) => String(truck.id) === form.camionId),
    [catalogs.camiones, form.camionId],
  )

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
    setMessage('')
  }

  const clearForm = () => {
    setForm({
      camionId: '',
      rutaId: '',
      fechaDesde: '',
      fechaHasta: '',
      capacidadKg: '',
      capacidadM3: '',
      tarifaReferencial: '',
    })
    setError('')
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedTruck) {
      setError('Selecciona uno de tus camiones activos.')
      return
    }
    if (Number(form.capacidadKg) > selectedTruck.capacidadKg
      || Number(form.capacidadM3) > selectedTruck.capacidadM3) {
      setError('El espacio publicado no puede superar la capacidad registrada del camión.')
      return
    }
    if (form.fechaDesde < localDateString()) {
      setError('La disponibilidad no puede comenzar en una fecha pasada.')
      return
    }
    if (form.fechaHasta <= form.fechaDesde) {
      setError('La fecha de término debe ser posterior a la fecha de inicio.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')
    try {
      await createCarrierTransportPublication({
        camionId: Number(form.camionId),
        rutaId: Number(form.rutaId),
        fechaDesde: form.fechaDesde,
        fechaHasta: form.fechaHasta,
        capacidadKg: Number(form.capacidadKg),
        capacidadM3: Number(form.capacidadM3),
        tarifaReferencial: form.tarifaReferencial === ''
          ? null
          : Number(form.tarifaReferencial),
      })
      clearForm()
      setMessage('Tu espacio disponible quedó publicado y guardado en tu cuenta.')
      try {
        setSpaces(await getCarrierTransportPublications())
      } catch (refreshError) {
        setMessage(`El espacio se guardó, pero no pudimos actualizar la lista: ${refreshError.message}`)
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async (publication) => {
    setBusyId(publication.id)
    setError('')
    setMessage('')
    try {
      await cancelCarrierTransportPublication(publication.id)
      setSpaces((current) => current.map((item) => item.id === publication.id
        ? { ...item, estado: 'Cancelada' }
        : item))
      setCancelId(null)
      setMessage('Cancelaste la publicación del espacio disponible.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="page publish-space">
      <Navbar activeSection="publicar" session={session} onLogout={onLogout} />

      <main className="page__main">
        <p className="eyebrow">Transportista · Capacidad disponible</p>
        <h1 className="page__title">Publica espacio en tu camión</h1>
        <p className="page__subtitle">
          Ofrece capacidad libre en un recorrido por Chiloé. La publicación se guarda en la base de datos y puede cancelarse mientras esté disponible.
        </p>

        {message && <p className="publish-space__message" role="status">{message}</p>}
        {error && <p className="publish-space__error" role="alert"><AlertTriangle size={16} /> {error}</p>}

        {loadState === 'loading' && (
          <p className="publish-space__feedback" role="status">
            <LoaderCircle size={18} /> Cargando tus camiones y rutas…
          </p>
        )}
        {loadState === 'error' && (
          <div className="publish-space__load-error" role="alert">
            <p>No se pudieron cargar los datos necesarios: {loadError}</p>
            <button type="button" className="publish-space__clear" onClick={reloadData}>
              <RefreshCw size={15} /> Reintentar
            </button>
          </div>
        )}

        {loadState === 'ready' && (
          <div className="publish-space__grid">
            <section className="publish-space__panel" aria-labelledby="trip-title">
              <h2 className="publish-space__panel-title" id="trip-title">Datos del espacio y el recorrido</h2>
              {catalogs.camiones.length === 0 ? (
                <div className="publish-space__empty">
                  <p>No tienes un camión activo asociado a tu cuenta, así que todavía no puedes publicar espacio.</p>
                  <a href="mailto:contacto@sincrocarga.cl">Contactar a soporte para actualizar tus datos</a>
                </div>
              ) : catalogs.rutas.length === 0 ? (
                <p className="publish-space__empty">No hay rutas disponibles para publicar por ahora.</p>
              ) : (
                <form className="publish-space__form" onSubmit={handleSubmit}>
                  <label className="publish-space__field">
                    <span>Camión</span>
                    <select
                      required
                      value={form.camionId}
                      onChange={(event) => updateField('camionId', event.target.value)}
                    >
                      <option value="">Selecciona tu camión</option>
                      {catalogs.camiones.map((truck) => (
                        <option key={truck.id} value={truck.id}>
                          {truck.patente} · {truck.vehiculo} ({truck.capacidadKg} kg, {truck.capacidadM3} m³)
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="publish-space__field">
                    <span>Ruta</span>
                    <select
                      required
                      value={form.rutaId}
                      onChange={(event) => updateField('rutaId', event.target.value)}
                    >
                      <option value="">Selecciona un recorrido</option>
                      {catalogs.rutas.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.origen} → {route.destino} · {route.distanciaKm} km
                          {route.cruceMaritimo ? ` · Cruce ${route.cruceMaritimo}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="publish-space__date-fields">
                    <label className="publish-space__field">
                      <span>Disponible desde</span>
                      <input
                        required
                        type="date"
                        min={localDateString()}
                        value={form.fechaDesde}
                        onChange={(event) => updateField('fechaDesde', event.target.value)}
                      />
                    </label>
                    <label className="publish-space__field">
                      <span>Disponible hasta</span>
                      <input
                        required
                        type="date"
                        min={form.fechaDesde || localDateString()}
                        value={form.fechaHasta}
                        onChange={(event) => updateField('fechaHasta', event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="publish-space__date-fields">
                    <label className="publish-space__field">
                      <span>Capacidad libre (kg)</span>
                      <input
                        required
                        type="number"
                        min="0.1"
                        max={selectedTruck?.capacidadKg}
                        step="0.1"
                        inputMode="decimal"
                        value={form.capacidadKg}
                        onChange={(event) => updateField('capacidadKg', event.target.value)}
                        aria-describedby="capacity-hint"
                      />
                    </label>
                    <label className="publish-space__field">
                      <span>Capacidad libre (m³)</span>
                      <input
                        required
                        type="number"
                        min="0.1"
                        max={selectedTruck?.capacidadM3}
                        step="0.1"
                        inputMode="decimal"
                        value={form.capacidadM3}
                        onChange={(event) => updateField('capacidadM3', event.target.value)}
                        aria-describedby="capacity-hint"
                      />
                    </label>
                  </div>
                  <p id="capacity-hint" className="publish-space__hint">
                    {selectedTruck
                      ? `Máximo registrado: ${selectedTruck.capacidadKg} kg y ${selectedTruck.capacidadM3} m³.`
                      : 'Selecciona un camión para revisar su capacidad.'}
                  </p>

                  <label className="publish-space__field">
                    <span>Tarifa referencial (CLP, opcional)</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={form.tarifaReferencial}
                      onChange={(event) => updateField('tarifaReferencial', event.target.value)}
                    />
                  </label>

                  <div className="publish-space__form-actions">
                    <button className="publish-space__submit" type="submit" disabled={busy}>
                      <PackagePlus size={16} /> {busy ? 'Publicando…' : 'Publicar espacio'}
                    </button>
                    <button className="publish-space__clear" type="button" onClick={clearForm} disabled={busy}>
                      Limpiar formulario
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="publish-space__panel" aria-labelledby="own-spaces-title">
              <h2 className="publish-space__panel-title" id="own-spaces-title">
                Mis espacios publicados ({spaces.length})
              </h2>
              {spaces.length === 0 ? (
                <p className="publish-space__empty">Todavía no has publicado capacidad disponible.</p>
              ) : (
                <div className="publish-space__list">
                  {spaces.map((space) => (
                    <article className="publish-space__item" key={space.id}>
                      <div className="publish-space__item-heading">
                        <h3>{space.ruta.origen} → {space.ruta.destino}</h3>
                        <span className={`publish-space__status publish-space__status--${space.estado.toLowerCase()}`}>
                          {space.estado}
                        </span>
                      </div>
                      <p>{space.patente} · {space.vehiculo}</p>
                      <p>{space.capacidadKg} kg · {space.capacidadM3} m³ disponibles</p>
                      <p>{formatDate(space.fechaDesde)} — {formatDate(space.fechaHasta)}</p>
                      {space.ruta.cruceMaritimo && <p>Cruce marítimo: {space.ruta.cruceMaritimo}</p>}
                      {space.tarifaReferencial != null && (
                        <p>Tarifa referencial: {CURRENCY_FORMAT.format(space.tarifaReferencial)}</p>
                      )}
                      {space.estado === 'Disponible' && (
                        cancelId === space.id ? (
                          <div className="publish-space__confirm" role="group" aria-label="Confirmar cancelación">
                            <span>¿Cancelar este espacio?</span>
                            <button
                              type="button"
                              className="publish-space__cancel"
                              onClick={() => handleCancel(space)}
                              disabled={busyId === space.id}
                            >
                              {busyId === space.id ? 'Cancelando…' : 'Sí, cancelar'}
                            </button>
                            <button
                              type="button"
                              className="publish-space__clear"
                              onClick={() => setCancelId(null)}
                              disabled={busyId === space.id}
                            >
                              Volver
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="publish-space__cancel"
                            onClick={() => setCancelId(space.id)}
                          >
                            Cancelar publicación
                          </button>
                        )
                      )}
                    </article>
                  ))}
                </div>
              )}
              <Link className="publish-space__matching-link" to="/matching">Buscar cargas para tu ruta</Link>
            </section>
          </div>
        )}
      </main>

      <Footer tagline="Matching de carga y transporte en Chiloé" />
    </div>
  )
}
