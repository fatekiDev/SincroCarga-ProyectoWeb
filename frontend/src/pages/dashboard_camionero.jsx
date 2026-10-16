import { useEffect, useState } from 'react'
import { ArrowRight, FileCheck2, LoaderCircle, PackagePlus, Search, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getCarrierApplications, getCarrierJourneys } from '../transportista/api'
import '../styles/dashboard_camionero.css'

const DRIVER_ACTIONS = [
  {
    icon: PackagePlus,
    title: 'Publicar espacio disponible',
    description: 'Registra una ruta y el espacio libre de tu camión.',
    path: '/publicar',
    action: 'Ir a publicar',
  },
  {
    icon: Search,
    title: 'Buscar cargas',
    description: 'Revisa solicitudes compatibles con tus viajes.',
    path: '/matching',
    action: 'Ver solicitudes',
  },
  {
    icon: FileCheck2,
    title: 'Preparar documentos',
    description: 'Consulta los documentos necesarios para tu cuenta.',
    path: '/verificacion',
    action: 'Ver documentos',
  },
  {
    icon: Truck,
    title: 'Revisar mis viajes',
    description: 'Consulta los estados de los viajes registrados a tu nombre.',
    path: '/viajes',
    action: 'Ver mis viajes',
  },
]

export default function DashboardCamionero({ session, onLogout }) {
  const [summary, setSummary] = useState({ status: 'loading', applications: 0, journeys: 0, error: '' })
  const [retryToken, setRetryToken] = useState(0)

  const reloadSummary = () => {
    setSummary((current) => ({ ...current, status: 'loading', error: '' }))
    setRetryToken((token) => token + 1)
  }

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      getCarrierApplications({ signal: controller.signal }),
      getCarrierJourneys({ signal: controller.signal }),
    ])
      .then(([applications, journeys]) => {
        setSummary({
          status: 'ready',
          applications: applications.filter((item) => item.estado !== 'Retirada').length,
          journeys: journeys.length,
          error: '',
        })
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setSummary((current) => ({ ...current, status: 'error', error: error.message }))
      })
    return () => controller.abort()
  }, [retryToken])

  return (
    <div className="page dashboard">
      <Navbar activeSection="inicio" session={session} onLogout={onLogout} />

      <main className="page__main dashboard__main">
        <p className="eyebrow">Panel del camionero</p>
        <h1 className="page__title">Hola, {session.email || 'camionero'}</h1>
        <p className="page__subtitle">
          Gestiona tu capacidad, postulaciones y viajes desde un solo lugar.
        </p>

        <section className="dashboard__summary" aria-label="Resumen de actividad">
          {summary.status === 'loading' ? (
            <p role="status"><LoaderCircle size={17} /> Cargando tu actividad…</p>
          ) : summary.status === 'error' ? (
            <>
              <p role="alert">No se pudo consultar el resumen: {summary.error}</p>
              <button type="button" onClick={reloadSummary}>Reintentar</button>
            </>
          ) : (
            <>
              <p><strong>{summary.applications}</strong> postulaciones no retiradas</p>
              <p><strong>{summary.journeys}</strong> viajes registrados</p>
              <Link to="/matching">Revisar postulaciones <ArrowRight size={15} /></Link>
            </>
          )}
        </section>

        <section className="dashboard__actions" aria-label="Accesos rápidos">
          {DRIVER_ACTIONS.map(({ icon: Icon, title, description, path, action }) => (
            <article className="dashboard__action-card" key={path}>
              <Icon size={22} aria-hidden="true" />
              <h2>{title}</h2>
              <p>{description}</p>
              <Link to={path}>
                {action}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </section>
      </main>

      <Footer tagline="Matching de carga y transporte en Chiloé" />
    </div>
  )
}
