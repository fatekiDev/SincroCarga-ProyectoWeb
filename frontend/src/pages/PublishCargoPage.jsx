import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  LoaderCircle,
  Pencil,
  Package,
  Plus,
  Route,
  Thermometer,
  X,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Button from '../components/button'
import Card from '../components/Card'
import {
  cancelPublication,
  createPublication,
  getMyPublications,
  getPublicationCatalogs,
  getPublicationQuote,
  updatePublication,
} from '../publicaciones/api'
import '../styles/PublishCargoPage.css'

const EMPTY_FORM = {
  descripcion: '',
  tipoCargaId: '',
  pesoKg: '',
  largoCm: '',
  anchoCm: '',
  altoCm: '',
  volumenM3: '',
  valorDeclarado: '',
  rutaId: '',
  fechaLimitePostulacion: '',
}

const FIELD_LABELS = {
  descripcion: 'Descripción',
  tipoCargaId: 'Tipo de carga',
  pesoKg: 'Peso',
  volumenM3: 'Volumen',
  valorDeclarado: 'Valor declarado',
  rutaId: 'Ruta',
  fechaLimitePostulacion: 'Fecha límite',
  tarifaOfrecida: 'Tarifa',
}

const CURRENCY_FORMAT = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function formatNumber(value, maximumFractionDigits = 2) {
  const number = Number(value)
  return Number.isFinite(number)
    ? new Intl.NumberFormat('es-CL', { maximumFractionDigits }).format(number)
    : '—'
}

function getVolume(form, directVolume) {
  if (directVolume) return Number(form.volumenM3) || 0
  const length = Number(form.largoCm)
  const width = Number(form.anchoCm)
  const height = Number(form.altoCm)
  if (!length || !width || !height) return 0
  return (length * width * height) / 1_000_000
}

function getServerField(detail) {
  const apiField = Object.keys(FIELD_LABELS).find((field) => detail.startsWith(field))
  if (apiField === 'volumenM3' && !detail.startsWith('volumen')) return null
  return apiField
}

export default function PublishCargoPage({ session, onLogout }) {
  const location = useLocation()
  const repeatedPublication = location.state?.repeatPublication
  const initialForm = repeatedPublication ? {
    ...EMPTY_FORM,
    descripcion: repeatedPublication.descripcion ?? '',
    tipoCargaId: String(repeatedPublication.tipoCargaId ?? ''),
    pesoKg: String(repeatedPublication.pesoKg ?? ''),
    volumenM3: String(repeatedPublication.volumenM3 ?? ''),
    valorDeclarado: repeatedPublication.valorDeclarado == null ? '' : String(repeatedPublication.valorDeclarado),
    rutaId: String(repeatedPublication.rutaId ?? ''),
  } : EMPTY_FORM
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [repeatMode, setRepeatMode] = useState(Boolean(repeatedPublication))
  const [catalogs, setCatalogs] = useState({ tiposCarga: [], rutas: [] })
  const [catalogStatus, setCatalogStatus] = useState('loading')
  const [catalogError, setCatalogError] = useState('')
  const [quote, setQuote] = useState(null)
  const [quoteStatus, setQuoteStatus] = useState(repeatedPublication ? 'loading' : 'idle')
  const [quoteError, setQuoteError] = useState('')
  const [errors, setErrors] = useState({})
  const [serverDetails, setServerDetails] = useState([])
  const [submitError, setSubmitError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [publications, setPublications] = useState([])
  const [publicationStatus, setPublicationStatus] = useState('loading')
  const [publicationError, setPublicationError] = useState('')
  const [cancelConfirmId, setCancelConfirmId] = useState(null)
  const [busyPublicationId, setBusyPublicationId] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    getPublicationCatalogs({ signal: controller.signal })
      .then((data) => {
        setCatalogs(data)
        setCatalogStatus('success')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setCatalogError(error.message)
        setCatalogStatus('error')
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getMyPublications({ signal: controller.signal })
      .then((data) => {
        setPublications(data)
        setPublicationStatus('success')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setPublicationError(error.message)
        setPublicationStatus('error')
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!form.tipoCargaId || !form.rutaId) {
      return undefined
    }

    const controller = new AbortController()
    getPublicationQuote({
      tipoCargaId: Number(form.tipoCargaId),
      rutaId: Number(form.rutaId),
    }, { signal: controller.signal })
      .then((result) => {
        setQuote(result)
        setQuoteStatus('success')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setQuoteError(error.message)
        setQuoteStatus('error')
      })

    return () => controller.abort()
  }, [form.tipoCargaId, form.rutaId])

  const selectedType = catalogs.tiposCarga.find((type) => String(type.id) === form.tipoCargaId)
  const selectedRoute = catalogs.rutas.find((route) => String(route.id) === form.rutaId)
  const directVolumeMode = Boolean(editingId || repeatMode)
  const volume = getVolume(form, directVolumeMode)

  const updateField = (field, value) => {
    const nextForm = { ...form, [field]: value }
    setForm(nextForm)
    if (field === 'tipoCargaId' || field === 'rutaId') {
      setQuote(null)
      setQuoteError('')
      setQuoteStatus(nextForm.tipoCargaId && nextForm.rutaId ? 'loading' : 'idle')
    }
    setErrors((previous) => ({ ...previous, [field]: '' }))
    setServerDetails([])
    setSubmitError('')
    setNotice('')
  }

  const refreshPublications = async () => {
    try {
      const data = await getMyPublications()
      setPublications(data)
      setPublicationStatus('success')
      setPublicationError('')
    } catch (error) {
      setPublicationError(error.message)
      setPublicationStatus('error')
    }
  }

  const validateCurrentStep = () => {
    const nextErrors = {}
    if (step === 1) {
      if (!form.descripcion.trim()) nextErrors.descripcion = 'Describe qué necesitas transportar.'
      if (!form.tipoCargaId) nextErrors.tipoCargaId = 'Selecciona un tipo de carga.'
      if (!Number.isFinite(Number(form.pesoKg)) || Number(form.pesoKg) <= 0) {
        nextErrors.pesoKg = 'El peso debe ser mayor que cero.'
      }
      if (directVolumeMode) {
        if (!Number.isFinite(volume) || volume <= 0) nextErrors.volumenM3 = 'El volumen debe ser mayor que cero.'
      } else {
        for (const [field, label] of [['largoCm', 'Largo'], ['anchoCm', 'Ancho'], ['altoCm', 'Alto']]) {
          if (!Number.isFinite(Number(form[field])) || Number(form[field]) <= 0) {
            nextErrors[field] = `${label} debe ser mayor que cero.`
          }
        }
      }
      if (form.valorDeclarado !== ''
        && (!Number.isFinite(Number(form.valorDeclarado)) || Number(form.valorDeclarado) < 0)) {
        nextErrors.valorDeclarado = 'El valor declarado no puede ser negativo.'
      }
    }

    if (step === 2) {
      if (!form.rutaId) nextErrors.rutaId = 'Selecciona una ruta.'
      if (!form.fechaLimitePostulacion) {
        nextErrors.fechaLimitePostulacion = 'Selecciona una fecha límite.'
      } else if (form.fechaLimitePostulacion < todayString()) {
        nextErrors.fechaLimitePostulacion = 'La fecha límite no puede estar en el pasado.'
      }
      if (quoteStatus === 'error') nextErrors.tarifaOfrecida = quoteError
      if (quoteStatus === 'loading') nextErrors.tarifaOfrecida = 'Espera a que termine la cotización.'
      if (quoteStatus === 'idle' && form.tipoCargaId && form.rutaId) {
        nextErrors.tarifaOfrecida = 'Todavía no hay una cotización disponible.'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return
    setErrors({})
    setStep((current) => Math.min(current + 1, 3))
    setServerDetails([])
    setSubmitError('')
  }

  const handleBack = () => {
    setErrors({})
    setStep((current) => Math.max(current - 1, 1))
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setRepeatMode(false)
    setStep(1)
    setQuote(null)
    setQuoteStatus('idle')
    setErrors({})
    setServerDetails([])
    setSubmitError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setServerDetails([])
    setNotice('')
    if (!quote || quoteStatus !== 'success') {
      setSubmitError('No hay una cotización vigente para esta ruta y tipo de carga.')
      return
    }

    const publication = {
      tipoCargaId: Number(form.tipoCargaId),
      descripcion: form.descripcion.trim(),
      pesoKg: Number(form.pesoKg),
      volumenM3: volume,
      valorDeclarado: form.valorDeclarado === '' ? null : Number(form.valorDeclarado),
      rutaId: Number(form.rutaId),
      fechaLimitePostulacion: form.fechaLimitePostulacion,
      tarifaOfrecida: quote.tarifaOfrecida,
    }

    setIsSubmitting(true)
    const wasEditing = Boolean(editingId)
    try {
      if (wasEditing) {
        await updatePublication(editingId, publication)
      } else {
        await createPublication(publication)
      }
      resetForm()
      setNotice(wasEditing
        ? 'La publicación se actualizó correctamente.'
        : 'Tu carga se publicó correctamente y ya aparece en Mis publicaciones.')
      await refreshPublications()
    } catch (error) {
      const details = error.details ?? []
      setServerDetails(details)
      setSubmitError(error.message)
      if (details.length > 0) {
        setErrors(Object.fromEntries(details.map((detail) => [getServerField(detail), detail]).filter(([field]) => field)))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEdit = (publication) => {
    setQuote(null)
    setQuoteStatus('loading')
    setQuoteError('')
    setForm({
      descripcion: publication.descripcion,
      tipoCargaId: String(publication.tipoCargaId),
      pesoKg: String(publication.pesoKg),
      largoCm: '',
      anchoCm: '',
      altoCm: '',
      volumenM3: String(publication.volumenM3),
      valorDeclarado: publication.valorDeclarado == null ? '' : String(publication.valorDeclarado),
      rutaId: String(publication.rutaId),
      fechaLimitePostulacion: String(publication.fechaLimitePostulacion).slice(0, 10),
    })
    setEditingId(publication.id)
    setRepeatMode(false)
    setStep(1)
    setNotice('Editando publicación disponible.')
    setErrors({})
    setServerDetails([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelPublication = async (id) => {
    setBusyPublicationId(id)
    setPublicationError('')
    try {
      await cancelPublication(id)
      if (editingId === id) resetForm()
      setCancelConfirmId(null)
      setNotice('La publicación se canceló.')
      await refreshPublications()
    } catch (error) {
      setPublicationError(error.message)
    } finally {
      setBusyPublicationId(null)
    }
  }

  const renderFieldError = (field) => errors[field]
    ? <p className="publish-field-error" role="alert">{errors[field]}</p>
    : null

  return (
    <div className="page">
      <Navbar activeSection="publicar" session={session} onLogout={onLogout} />

      <main className="page__main publish-main">
        <p className="eyebrow">Publicar carga</p>
        <h1 className="page__title">{editingId ? 'Edita tu publicación' : repeatMode ? 'Repite este envío' : 'Publica tu carga y obtén coincidencias'}</h1>
        <p className="page__subtitle">
          {repeatMode
            ? 'Revisa los datos anteriores, define una nueva fecha límite y confirma la tarifa vigente.'
            : 'Completa los datos de la carga y revisa la tarifa calculada para la ruta seleccionada.'}
        </p>

        {notice && <p className="publish-notice" role="status"><Check size={16} /> {notice}</p>}
        {catalogStatus === 'error' && (
          <div className="publish-error" role="alert">
            <p>{catalogError}</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>Reintentar</Button>
          </div>
        )}

        {catalogStatus === 'loading' ? (
          <p className="publish-loading" role="status"><LoaderCircle size={18} /> Cargando tipos de carga y rutas…</p>
        ) : catalogStatus === 'success' && (
          <form className="publish-form" onSubmit={handleSubmit} noValidate>
            <ol className="publish-steps" aria-label="Pasos de publicación">
              {['Datos de la carga', 'Ruta y fecha', 'Revisar y publicar'].map((label, index) => {
                const stepNumber = index + 1
                return (
                  <li key={label} className={stepNumber === step ? 'publish-steps__item publish-steps__item--active' : stepNumber < step ? 'publish-steps__item publish-steps__item--done' : 'publish-steps__item'}>
                    <span>{stepNumber < step ? <Check size={14} /> : stepNumber}</span>
                    <p>{label}</p>
                  </li>
                )
              })}
            </ol>

            {step === 1 && (
              <Card className="publish-panel">
                <div className="publish-panel__heading">
                  <Package size={19} />
                  <div>
                    <h2>Datos de la carga</h2>
                    <p>Indica qué transportarás, su peso y dimensiones.</p>
                  </div>
                </div>

                <div className="publish-fields">
                  <div className="publish-field publish-field--wide">
                    <label className="field-label" htmlFor="cargo-description">Descripción de la carga</label>
                    <input
                      id="cargo-description"
                      className={`input-field ${errors.descripcion ? 'input-field--error' : ''}`}
                      value={form.descripcion}
                      maxLength={300}
                      onChange={(event) => updateField('descripcion', event.target.value)}
                      placeholder="Ej.: 12 cajas de productos congelados"
                      aria-invalid={Boolean(errors.descripcion)}
                      aria-describedby={errors.descripcion ? 'cargo-description-error' : undefined}
                    />
                    {errors.descripcion && <p className="publish-field-error" id="cargo-description-error" role="alert">{errors.descripcion}</p>}
                  </div>

                  <div className="publish-field">
                    <label className="field-label" htmlFor="cargo-type">Tipo de carga</label>
                    <select
                      id="cargo-type"
                      className={`input-field select-field ${errors.tipoCargaId ? 'input-field--error' : ''}`}
                      value={form.tipoCargaId}
                      onChange={(event) => updateField('tipoCargaId', event.target.value)}
                      aria-invalid={Boolean(errors.tipoCargaId)}
                    >
                      <option value="">Selecciona un tipo</option>
                      {catalogs.tiposCarga.map((type) => (
                        <option key={type.id} value={type.id}>{type.nombre}</option>
                      ))}
                    </select>
                    {renderFieldError('tipoCargaId')}
                  </div>

                  <div className="publish-field">
                    <label className="field-label" htmlFor="cargo-weight">Peso (kg)</label>
                    <input
                      id="cargo-weight"
                      className={`input-field ${errors.pesoKg ? 'input-field--error' : ''}`}
                      type="number"
                      min="0.01"
                      step="any"
                      value={form.pesoKg}
                      onChange={(event) => updateField('pesoKg', event.target.value)}
                      placeholder="Ej.: 850"
                      aria-invalid={Boolean(errors.pesoKg)}
                    />
                    {renderFieldError('pesoKg')}
                  </div>

                  {directVolumeMode ? (
                    <div className="publish-field">
                      <label className="field-label" htmlFor="cargo-volume">Volumen de la carga (m³){repeatMode ? ' · envío anterior' : ''}</label>
                      <input
                        id="cargo-volume"
                        className={`input-field ${errors.volumenM3 ? 'input-field--error' : ''}`}
                        type="number"
                        min="0.001"
                        step="any"
                        value={form.volumenM3}
                        onChange={(event) => updateField('volumenM3', event.target.value)}
                        aria-invalid={Boolean(errors.volumenM3)}
                      />
                      {renderFieldError('volumenM3')}
                    </div>
                  ) : (
                    <div className="publish-field publish-field--wide">
                      <span className="field-label">Dimensiones (largo × ancho × alto, cm)</span>
                      <div className="publish-dimensions">
                        {[
                          ['largoCm', 'Largo', 'cargo-length'],
                          ['anchoCm', 'Ancho', 'cargo-width'],
                          ['altoCm', 'Alto', 'cargo-height'],
                        ].map(([field, label, id]) => (
                          <label className="publish-dimension" key={field} htmlFor={id}>
                            <span>{label}</span>
                            <input
                              id={id}
                              className={`input-field ${errors[field] ? 'input-field--error' : ''}`}
                              type="number"
                              min="0.01"
                              step="any"
                              value={form[field]}
                              onChange={(event) => updateField(field, event.target.value)}
                              placeholder="cm"
                              aria-invalid={Boolean(errors[field])}
                            />
                          </label>
                        ))}
                      </div>
                      {(errors.largoCm || errors.anchoCm || errors.altoCm) && (
                        <p className="publish-field-error" role="alert">
                          {errors.largoCm || errors.anchoCm || errors.altoCm}
                        </p>
                      )}
                      <p className="publish-volume">Volumen calculado: <strong>{formatNumber(volume, 4)} m³</strong></p>
                    </div>
                  )}

                  <div className="publish-field">
                    <label className="field-label" htmlFor="declared-value">Valor declarado (CLP, opcional)</label>
                    <input
                      id="declared-value"
                      className={`input-field ${errors.valorDeclarado ? 'input-field--error' : ''}`}
                      type="number"
                      min="0"
                      step="any"
                      value={form.valorDeclarado}
                      onChange={(event) => updateField('valorDeclarado', event.target.value)}
                      placeholder="Sin valor declarado"
                      aria-invalid={Boolean(errors.valorDeclarado)}
                    />
                    {renderFieldError('valorDeclarado')}
                  </div>
                </div>

                {selectedType && (selectedType.requiere_refrigeracion || selectedType.es_peligrosa) && (
                  <div className="publish-requirements" aria-live="polite">
                    {selectedType.requiere_refrigeracion && <span><Thermometer size={15} /> Requiere refrigeración</span>}
                    {selectedType.es_peligrosa && <span><AlertTriangle size={15} /> Carga peligrosa</span>}
                  </div>
                )}
              </Card>
            )}

            {step === 2 && (
              <Card className="publish-panel">
                <div className="publish-panel__heading">
                  <Route size={19} />
                  <div>
                    <h2>Ruta y fecha límite</h2>
                    <p>La tarifa se obtiene de la tarifa referencial vigente para esta ruta y carga.</p>
                  </div>
                </div>

                <div className="publish-fields publish-fields--route">
                  <div className="publish-field">
                    <label className="field-label" htmlFor="cargo-route">Ruta</label>
                    <select
                      id="cargo-route"
                      className={`input-field select-field ${errors.rutaId ? 'input-field--error' : ''}`}
                      value={form.rutaId}
                      onChange={(event) => updateField('rutaId', event.target.value)}
                      aria-invalid={Boolean(errors.rutaId)}
                    >
                      <option value="">Selecciona una ruta</option>
                      {catalogs.rutas.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.origen} → {route.destino}
                        </option>
                      ))}
                    </select>
                    {renderFieldError('rutaId')}
                  </div>

                  <div className="publish-field">
                    <label className="field-label" htmlFor="deadline">Fecha límite para recibir propuestas</label>
                    <div className="publish-date-field">
                      <CalendarDays size={17} aria-hidden="true" />
                      <input
                        id="deadline"
                        className={`input-field ${errors.fechaLimitePostulacion ? 'input-field--error' : ''}`}
                        type="date"
                        min={todayString()}
                        value={form.fechaLimitePostulacion}
                        onChange={(event) => updateField('fechaLimitePostulacion', event.target.value)}
                        aria-invalid={Boolean(errors.fechaLimitePostulacion)}
                      />
                    </div>
                    {renderFieldError('fechaLimitePostulacion')}
                  </div>
                </div>

                {selectedRoute && (
                  <div className="publish-route-meta">
                    <span>{formatNumber(selectedRoute.distancia_km)} km de distancia</span>
                    {selectedRoute.cruce_maritimo && <span>Cruce: {selectedRoute.cruce_maritimo}</span>}
                  </div>
                )}

                {form.tipoCargaId && form.rutaId && (
                  <div className="publish-quote" aria-live="polite">
                    {quoteStatus === 'loading' && <p role="status"><LoaderCircle size={17} /> Calculando tarifa…</p>}
                    {quoteStatus === 'error' && <p className="publish-field-error" role="alert">{quoteError}</p>}
                    {quoteStatus === 'success' && quote && (
                      <>
                        <div><span>Tarifa referencial</span><strong>{CURRENCY_FORMAT.format(quote.tarifaBase)}</strong></div>
                        {quote.cruceMaritimo && (
                          <div><span>Recargo por cruce marítimo</span><strong>+ {CURRENCY_FORMAT.format(quote.recargoCruce)}</strong></div>
                        )}
                        <div className="publish-quote__total"><span>Total ofrecido</span><strong>{CURRENCY_FORMAT.format(quote.tarifaOfrecida)}</strong></div>
                        <p>Distancia estimada: {formatNumber(quote.distanciaKm)} km{quote.cruceMaritimo ? ` · ${quote.cruceMaritimo}` : ''}</p>
                      </>
                    )}
                  </div>
                )}
                {errors.tarifaOfrecida && <p className="publish-field-error" role="alert">{errors.tarifaOfrecida}</p>}
              </Card>
            )}

            {step === 3 && (
              <Card className="publish-panel publish-review">
                <div className="publish-panel__heading">
                  <Check size={19} />
                  <div>
                    <h2>Revisa tu publicación</h2>
                    <p>Confirma los datos antes de hacer visible tu carga.</p>
                  </div>
                </div>
                <dl className="publish-summary">
                  <div><dt>Descripción</dt><dd>{form.descripcion}</dd></div>
                  <div><dt>Tipo de carga</dt><dd>{selectedType?.nombre || '—'}</dd></div>
                  <div><dt>Peso</dt><dd>{formatNumber(form.pesoKg)} kg</dd></div>
                  <div><dt>Volumen</dt><dd>{formatNumber(volume, 4)} m³</dd></div>
                  {form.valorDeclarado !== '' && <div><dt>Valor declarado</dt><dd>{CURRENCY_FORMAT.format(Number(form.valorDeclarado))}</dd></div>}
                  <div><dt>Ruta</dt><dd>{selectedRoute ? `${selectedRoute.origen} → ${selectedRoute.destino}` : '—'}</dd></div>
                  <div><dt>Fecha límite</dt><dd>{form.fechaLimitePostulacion}</dd></div>
                  <div className="publish-summary__price"><dt>Tarifa ofrecida</dt><dd>{quote ? CURRENCY_FORMAT.format(quote.tarifaOfrecida) : '—'}</dd></div>
                </dl>
                {selectedType?.requiere_refrigeracion && <p className="publish-summary__flag"><Thermometer size={15} /> Esta carga requiere refrigeración.</p>}
                {selectedType?.es_peligrosa && <p className="publish-summary__flag publish-summary__flag--warning"><AlertTriangle size={15} /> Esta carga está clasificada como peligrosa.</p>}
              </Card>
            )}

            {submitError && <p className="publish-submit-error" role="alert">{submitError}</p>}
            {serverDetails.length > 0 && (
              <ul className="publish-server-details" aria-label="Detalles de validación">
                {serverDetails.map((detail) => <li key={detail}>{detail}</li>)}
              </ul>
            )}

            <div className="publish-wizard-actions">
              {step > 1 ? (
                <Button type="button" variant="secondary" onClick={handleBack}>
                  <ArrowLeft size={16} /> Atrás
                </Button>
              ) : <span />}
              {step < 3 ? (
                <Button type="button" onClick={handleNext} disabled={step === 2 && quoteStatus === 'loading'}>
                  Siguiente <ArrowRight size={16} />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting || quoteStatus !== 'success'}>
                  {isSubmitting ? <LoaderCircle size={16} /> : <Check size={16} />}
                  {isSubmitting ? 'Publicando…' : editingId ? 'Guardar cambios' : 'Publicar solicitud de flete'}
                </Button>
              )}
              {editingId && (
                <Button type="button" variant="secondary" onClick={resetForm}>
                  <X size={16} /> Salir de edición
                </Button>
              )}
            </div>
          </form>
        )}

        <section className="my-publications" aria-labelledby="my-publications-title">
          <div className="my-publications__heading">
            <div>
              <p className="eyebrow">Tu actividad</p>
              <h2 id="my-publications-title">Mis publicaciones</h2>
            </div>
            <Button variant="secondary" onClick={resetForm}>
              <Plus size={16} /> Nueva publicación
            </Button>
          </div>

          {publicationStatus === 'loading' && <p className="publish-loading" role="status">Cargando tus publicaciones…</p>}
          {publicationStatus === 'error' && (
            <div className="publish-error" role="alert">
              <p>{publicationError}</p>
              <Button variant="secondary" onClick={refreshPublications}>Reintentar</Button>
            </div>
          )}
          {publicationStatus === 'success' && publications.length === 0 && (
            <Card className="my-publications__empty">
              <Package size={22} />
              <p>Aún no tienes publicaciones de carga.</p>
            </Card>
          )}
          {publicationError && publicationStatus === 'success' && <p className="publish-field-error" role="alert">{publicationError}</p>}
          {publicationStatus === 'success' && publications.length > 0 && (
            <div className="my-publications__list">
              {publications.map((publication) => (
                <Card className="my-publication" key={publication.id}>
                  <div className="my-publication__main">
                    <div className="my-publication__title-row">
                      <h3>{publication.descripcion}</h3>
                      <span className={`publication-status publication-status--${publication.estado.toLowerCase()}`}>
                        {publication.estado}
                      </span>
                    </div>
                    <p>{publication.origen} → {publication.destino}</p>
                    <div className="my-publication__meta">
                      <span>{publication.tipoCarga}</span>
                      <span>{formatNumber(publication.pesoKg)} kg</span>
                      <span>{CURRENCY_FORMAT.format(Number(publication.tarifaOfrecida))}</span>
                    </div>
                  </div>
                  {publication.estado === 'Disponible' && (
                    <div className="my-publication__actions">
                      {cancelConfirmId === publication.id ? (
                        <>
                          <span>¿Cancelar esta publicación?</span>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={busyPublicationId === publication.id}
                            onClick={() => handleCancelPublication(publication.id)}
                          >
                            {busyPublicationId === publication.id ? 'Cancelando…' : 'Confirmar'}
                          </Button>
                          <Button type="button" variant="secondary" onClick={() => setCancelConfirmId(null)}>No</Button>
                        </>
                      ) : (
                        <>
                          <Button type="button" variant="secondary" onClick={() => startEdit(publication)}>
                            <Pencil size={15} /> Editar
                          </Button>
                          <Button type="button" variant="secondary" onClick={() => setCancelConfirmId(publication.id)}>
                            <X size={15} /> Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer tagline="Matching de carga y transporte en Chiloé" />
    </div>
  )
}