import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/header'
import InfoContacto from './components/InfoContacto'
import MainPage from './pages/MainPage'
import DashboardCamionero from './pages/dashboard_camionero.jsx'
import PublishCargoPage from './pages/PublishCargoPage'
import ReviewPage from './pages/ReviewPage'
import TrackingPage from './pages/TrackingPage'
import './App.css'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardCamionero />} />
          <Route path="/publicar" element={<PublishCargoPage />} />
          <Route path="/matching" element={<TrackingPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/pagos" element={<ReviewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <InfoContacto />
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
