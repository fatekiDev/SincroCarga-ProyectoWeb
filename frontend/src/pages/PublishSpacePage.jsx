import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../styles/PublishSpacePage.css'

const INITIAL_FORM = {
  origin: '',
  destination: '',
  departure: '',
  capacity: '',
}

function getLocalDateTime() {
  const localDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

export default function PublishSpacePage({ session, onLogout }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [published, setPublished] = useState(false)
  const [routeError, setRouteError] = useState('')

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setPublished(false)
    setRouteError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (form.origin.trim().toLocaleLowerCase('es-CL') === form.destination.trim().toLocaleLowerCase('es-CL')) {
      setRouteError('El origen y el destino deben ser distintos.')
      return
    }
    setPublished(true)
  }

  const clearForm = () => {
    setForm(INITIAL_FORM)
    setPublished(false)
    setRouteError('')
  }

  return (
    <div className="page publish-space">
      <Navbar activeSection="publicar" session={session} onLogout={onLogout} />

      <main className="page__main">
        <p className="eyebrow">Camionero · Publicar espacio</p>
        <h1 className="page__title">Publica tu espacio vacío</h1>
        <p className="page__subtitle">
          Indica tu ruta y el tonelaje libre. Después podrás revisar solicitudes de ejemplo en “Buscar cargas”.
        </p>

        <div className="publish-space__grid">
          <section className="publish-space__panel" aria-labelledby="trip-title">
            <h2 className="publish-space__panel-title" id="trip-title">Datos del viaje</h2>
            <form className="publish-space__form" onSubmit={handleSubmit}>
              <label className="publish-space__field">
                <span>Origen</span>
                <input
                  required
                  maxLength={100}
                  value={form.origin}
                  onChange={(event) => updateField('origin', event.target.value)}
                  placeholder="Ej: Puerto Montt"
                />
              </label>

              <label className="publish-space__field">
                <span>Destino</span>
                <input
                  required
                  maxLength={100}
                  value={form.destination}
                  onChange={(event) => updateField('destination', event.target.value)}
                  placeholder="Ej: Castro"
                />
              </label>

              <label className="publish-space__field">
                <span>Fecha y hora de salida</span>
                <input
                  required
                  type="datetime-local"
                  min={getLocalDateTime()}
                  value={form.departure}
                  onChange={(event) => updateField('departure', event.target.value)}
                />
              </label>

              <label className="publish-space__field">
                <span>Tonelaje disponible (ton)</span>
                <input
                  required
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  inputMode="decimal"
                  value={form.capacity}
                  onChange={(event) => updateField('capacity', event.target.value)}
                />
              </label>

              {routeError && <p className="publish-space__error" role="alert">{routeError}</p>}
              {published && (
                <p className="publish-space__message" role="status">
                  Simulación completada. El espacio no se publicó ni se guardó en el servidor.
                </p>
              )}

              <div className="publish-space__form-actions">
                <button className="publish-space__submit" type="submit">
                  Simular publicación
                </button>
                <button className="publish-space__clear" type="button" onClick={clearForm}>
                  Limpiar formulario
                </button>
              </div>
            </form>
          </section>

          <section className="publish-space__panel" aria-labelledby="suggestion-title">
            <h2 className="publish-space__panel-title" id="suggestion-title">
              Antes de continuar
            </h2>
            <ul className="publish-space__guidance">
              <li>Indica el espacio libre real, no la capacidad total del camión.</li>
              <li>Revisa la fecha y hora antes de continuar.</li>
              <li>Podrás revisar cargas compatibles en la sección “Buscar cargas”.</li>
            </ul>
            <p className="publish-space__demo-note">
              Esta página es una demostración: no se crea ni publica un viaje real.
            </p>
          </section>
        </div>
      </main>

      <Footer tagline="Matching de carga y transporte en Chiloé" />
    </div>
  )
}
