import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../styles/PublishSpacePage.css'

export default function PublishSpacePage({ session, onLogout }) {
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
            <p className="publish-space__placeholder">
              Aquí podrás ingresar la ruta, fecha de salida y tonelaje disponible.
            </p>
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
