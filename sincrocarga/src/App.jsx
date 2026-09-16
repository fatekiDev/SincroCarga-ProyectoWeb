import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/header'
import InfoContacto from './components/InfoContacto'
import MainPage from './pages/MainPage'
import DashboardCamionero from './pages/dashboard_camionero.jsx'
import PublishCargoPage from './pages/PublishCargoPage'
import ReviewPage from './pages/ReviewPage'
import TrackingPage from './pages/TrackingPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardCamionero />} />
        <Route path="/publicar" element={<PublishCargoPage />} />
        <Route path="/matching" element={<TrackingPage />} />
        <Route path="/tracking" element={<TrackingPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/pagos" element={<ReviewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <MainPage />
      </main>
      <InfoContacto />
    </>
  )
}

export default App
