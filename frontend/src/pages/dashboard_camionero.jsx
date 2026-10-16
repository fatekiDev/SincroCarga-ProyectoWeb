import { ArrowRight, FileCheck2, PackagePlus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
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
]

export default function DashboardCamionero({ session, onLogout }) {
  return (
    <div className="page dashboard">
      <Navbar activeSection="inicio" session={session} onLogout={onLogout} />

      <main className="page__main dashboard__main">
        <p className="eyebrow">Panel del camionero</p>
        <h1 className="page__title">Hola, {session.email || 'camionero'}</h1>
        <p className="page__subtitle">
          Elige qué quieres hacer y sigue el estado de cada paso desde su sección.
        </p>

        <section className="dashboard__notice" aria-label="Estado de las funciones">
          <strong>Entorno de demostración</strong>
          <p>
            Publicar espacio y aceptar cargas aún no guarda cambios en el servidor.
            No se generarán reservas ni pagos reales.
          </p>
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
