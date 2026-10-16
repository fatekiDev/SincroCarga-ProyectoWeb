import { ArrowLeft, Circle, CircleCheck, CircleDot } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import './DriverVerificationPage.css'

export default function DriverVerificationPage({ session, onLogout }) {
  const status = session?.verificationStatus || 'Pendiente'
  const verified = status === 'Verificado'
  const rejected = status === 'Rechazado'
  const suspended = !rejected && session?.carrierActive === false
  const reviewStatus = verified || rejected ? 'complete' : 'current'

  return (
    <div className="page driver-verification">
      <Navbar session={session} onLogout={onLogout} />

      <main className="page__main driver-verification__main">
        <Link className="driver-verification__back-link" to={verified ? '/dashboard' : '/'}>
          <ArrowLeft size={16} aria-hidden="true" /> {verified ? 'Volver al panel' : 'Volver al inicio'}
        </Link>
        <p className="eyebrow">Verificación de transportista</p>
        <h1 className="driver-verification__title">
          {suspended
            ? 'Tu cuenta está suspendida'
            : verified
              ? 'Tu cuenta está verificada'
              : rejected
                ? 'Necesitamos que revises tu solicitud'
                : 'Tu cuenta está en revisión'}
        </h1>
        <p className="driver-verification__subtitle">
          {suspended
            ? 'No puedes operar con esta cuenta. Contacta a soporte para conocer los pasos para reactivarla.'
            : verified
              ? 'Ya puedes publicar espacios, buscar cargas y gestionar tus viajes.'
              : rejected
                ? 'La administración revisó los datos de tu cuenta y dejó este motivo.'
                : 'La administración revisará los datos de tu empresa, conductor, licencia y vehículo antes de habilitar las funciones de transportista.'}
        </p>

        <div className="driver-verification__grid">
          <section className="driver-verification__card" aria-labelledby="verification-status-title">
            <h2 id="verification-status-title" className="driver-verification__card-title">
              Estado de tu solicitud
            </h2>
            <ol className="driver-verification__timeline">
              <VerificationStep title="Cuenta creada" description={session?.email || 'Registro completado'} status="complete" />
              <VerificationStep
                title="Revisión de los datos registrados"
                description={verified ? 'Revisión completada' : rejected ? 'Revisión completada' : 'Pendiente de revisión'}
                status={reviewStatus}
              />
              <VerificationStep
                title="Acceso a funciones de transportista"
                description={verified && !suspended ? 'Habilitado' : suspended ? 'Suspendido' : 'Se habilitará después de la aprobación'}
                status={verified && !suspended ? 'complete' : 'pending'}
                last
              />
            </ol>

            {rejected && (
              <p className="driver-verification__message" role="status">
                Motivo: {session.verificationReason || 'Contacta a soporte para conocer los detalles.'}
              </p>
            )}
            {verified && !suspended && (
              <Link className="driver-verification__dashboard-link" to="/dashboard">
                Ir al panel del camionero
              </Link>
            )}
          </section>

          <section className="driver-verification__card" aria-labelledby="verification-next-title">
            <h2 id="verification-next-title" className="driver-verification__card-title">
              {verified && !suspended ? 'Próximo paso' : '¿Qué se revisa?'}
            </h2>
            <p className="driver-verification__copy">
              {suspended
                ? 'La cuenta está desactivada por administración. Comunícate con soporte para solicitar una revisión.'
                : verified
                  ? 'Completa la información de tu espacio disponible y encuentra cargas compatibles con tu vehículo.'
                  : 'La revisión utiliza los datos ingresados al crear la cuenta: RUT y contacto, razón social, licencia y sus fechas, y los datos del camión.'}
            </p>
            {!verified && !suspended && (
              <p className="driver-verification__notice" role="note">
                La plataforma aún no permite subir ni almacenar archivos de documentos. No selecciones archivos esperando que se envíen; por ahora la revisión se limita a los datos registrados.
              </p>
            )}
            {(rejected || suspended) && (
              <p className="driver-verification__copy">
                Si necesitas corregir información, contacta a <a href="mailto:contacto@sincrocarga.cl">soporte</a> para coordinar la actualización de tu solicitud.
              </p>
            )}
          </section>
        </div>
      </main>

      <Footer session={session} tagline="Verificación de transportistas en Chiloé" />
    </div>
  )
}

function VerificationStep({ title, description, status, last = false }) {
  const Icon = status === 'complete' ? CircleCheck : status === 'current' ? CircleDot : Circle

  return (
    <li className={`driver-verification__step driver-verification__step--${status}${last ? ' driver-verification__step--last' : ''}`}>
      <Icon className="driver-verification__step-icon" size={18} aria-hidden="true" />
      <div>
        <p className="driver-verification__step-title">{title}</p>
        <p className="driver-verification__step-description">{description}</p>
      </div>
    </li>
  )
}
