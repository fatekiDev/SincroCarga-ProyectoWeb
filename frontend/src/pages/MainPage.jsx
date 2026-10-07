import Presentacion from '../components/Presentacion'
import ComoFunciona from '../components/ComoFunciona'
import SeccionConfianza from '../components/SeccionConfianza'

/**
 * MainPage: la página principal (landing) de SincroCarga.
 * Agrupa Presentacion + ComoFunciona + SeccionConfianza. Header y
 * InfoContacto se renderizan en App.jsx porque son comunes a todas las páginas.
 */
function MainPage() {
  return (
    <>
      <Presentacion />
      <ComoFunciona />
      <SeccionConfianza />
    </>
  )
}

export default MainPage
