import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/header'
import InfoContacto from './components/InfoContacto'
import MainPage from './pages/MainPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<MainPage />} />
          {/* Cuando tengas listo tu dashboard, agrégalo aquí, por ejemplo:
              import DashboardCamionero from './pages/dashboard_camionero'
              <Route path="/dashboard" element={<DashboardCamionero />} /> */}
        </Routes>
      </main>
      <InfoContacto />
    </BrowserRouter>
  )
}

export default App
