import { useEffect, useState } from 'react'
import { getAvailablePublications } from '../publicaciones/api'
import './PublicacionesDisponibles.css'

const CURRENCY_FORMAT = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const NUMBER_FORMAT = new Intl.NumberFormat('es-CL')
function formatDate(value) {
  if (!value) return 'Sin fecha límite'

  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' })
    .format(new Date(year, month - 1, day))
}

function formatNumber(value, formatter) {
  const number = Number(value)
  return Number.isFinite(number) ? formatter.format(number) : '—'
}

export default function PublicacionesDisponibles() {
  const [publications, setPublications] = useState([])
  const [status, setStatus] = useState('loading')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadPublications() {
      setStatus('loading')

      try {
        const result = await getAvailablePublications({ signal: controller.signal })

        if (!Array.isArray(result)) {
          throw new Error('La respuesta de publicaciones tiene un formato inesperado')
        }

        setPublications(result)
        setStatus('success')
      } catch (error) {
        if (error.name === 'AbortError') return

        console.error('No se pudieron cargar las publicaciones disponibles:', error)
        setStatus('error')
      }
    }

    loadPublications()
    return () => controller.abort()
  }, [retryCount])

  return (
    <section className="available-loads" aria-labelledby="available-loads-title">
      <div className="container available-loads__inner">
        <h2 id="available-loads-title">Cargas disponibles</h2>
        <p className="available-loads__subtitle">
          Publicaciones activas obtenidas desde la plataforma.
        </p>

        {status === 'loading' && (
          <p className="available-loads__message" role="status">
            Cargando publicaciones…
          </p>
        )}

        {status === 'error' && (
          <div className="available-loads__message available-loads__message--error" role="alert">
            <p>No pudimos cargar las publicaciones. Comprueba que el backend esté disponible.</p>
            <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
              Reintentar
            </button>
          </div>
        )}

        {status === 'success' && publications.length === 0 && (
          <p className="available-loads__message">
            No hay cargas disponibles por el momento.
          </p>
        )}

        {status === 'success' && publications.length > 0 && (
          <div className="available-loads__grid">
            {publications.map((publication) => (
              <article className="available-load" key={publication.id}>
                <p className="available-load__route">
                  {publication.origen} <span aria-hidden="true">→</span> {publication.destino}
                </p>
                <h3>{publication.descripcion}</h3>
                <dl className="available-load__details">
                  <div>
                    <dt>Peso</dt>
                    <dd>{formatNumber(publication.pesoKg, NUMBER_FORMAT)} kg</dd>
                  </div>
                  <div>
                    <dt>Volumen</dt>
                    <dd>{formatNumber(publication.volumenM3, NUMBER_FORMAT)} m³</dd>
                  </div>
                  <div>
                    <dt>Distancia</dt>
                    <dd>{formatNumber(publication.distanciaKm, NUMBER_FORMAT)} km</dd>
                  </div>
                </dl>
                <p className="available-load__price">
                  Tarifa ofrecida: {formatNumber(publication.tarifaOfrecida, CURRENCY_FORMAT)}
                </p>
                <p className="available-load__deadline">
                  Postulaciones hasta {formatDate(publication.fechaLimitePostulacion)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
