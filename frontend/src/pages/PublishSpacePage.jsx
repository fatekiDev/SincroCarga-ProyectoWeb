import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../styles/PublishSpacePage.css'

const INITIAL_FORM = {
  origin: 'Puerto Montt',
  destination: 'Castro',
  departure: '',
  capacity: '8',
}

export default function PublishSpacePage({ session, onLogout }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [published, setPublished] = useState(false)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setPublished(false)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setPublished(true)
  }

  return (
    <div className="page publish-space">
      <Navbar activeSection="publicar" session={session} onLogout={onLogout} />

      <main className="page__main">
        <p className="eyebrow">Camionero · Publicar espacio</p>
        <h1 className="page__title">Publica tu espacio vacío</h1>
        <p className="page__subtitle">
          Indica tu ruta y el tonelaje libre. El sistema busca cargas compatibles.
        </p>

        <div className="publish-space__grid">
          <section className="publish-space__panel" aria-labelledby="trip-title">
            <h2 className="publish-space__panel-title" id="trip-title">Datos del viaje</h2>
            <form className="publish-space__form" onSubmit={handleSubmit}>
              <label className="publish-space__field">
                <span>Origen</span>
                <input
                  required
                  value={form.origin}
                  onChange={(event) => updateField('origin', event.target.value)}
                  placeholder="Ej: Puerto Montt"
                />
              </label>

              <label className="publish-space__field">
                <span>Destino</span>
                <input
                  required
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
                  value={form.capacity}
                  onChange={(event) => updateField('capacity', event.target.value)}
                />
              </label>

              {published && (
                <p className="publish-space__message" role="status">
                  Espacio publicado para esta demostración. No se guarda en el servidor.
                </p>
              )}

              <button className="publish-space__submit" type="submit">
                {published ? 'Actualizar espacio' : 'Publicar espacio'}
              </button>
            </form>
          </section>

          <section className="publish-space__panel" aria-labelledby="suggestion-title">
            <h2 className="publish-space__panel-title" id="suggestion-title">
              Coincidencia sugerida
            </h2>
            <p className="publish-space__placeholder">
              Las cargas compatibles con tu viaje aparecerán aquí.
            </p>
          </section>
        </div>
      </main>

      <Footer tagline="Matching de carga y transporte en Chiloé" />
    </div>
  )
}
