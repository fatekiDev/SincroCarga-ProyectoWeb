import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
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
import { getHomePath, getSession, saveSession } from './auth/session'

function App() {
  const [session, setSession] = useState(getSession)

  const handleLogin = (account) => {
    const nextSession = {
      role: account.role,
      name: account.name || (account.role === 'camionero' ? 'José P.' : 'Francisco M.'),
      email: account.email,
    }
    saveSession(nextSession)
    setSession(nextSession)
  }

  return (
    <BrowserRouter>
      <AppRoutes session={session} onAuthenticate={handleLogin} />
    </BrowserRouter>
  )
}

function AppRoutes({ session, onAuthenticate }) {
  const navigate = useNavigate()

  const handleAuthentication = (account) => {
    onAuthenticate(account)
    navigate(getHomePath(account), { replace: true })
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage session={session} />} />
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Login onSubmit={handleAuthentication} />} />
      <Route path="/registro" element={<Register onSubmit={handleAuthentication} />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute session={session} role="camionero" redirectPath="/login">
            <DashboardCamionero />
          </ProtectedRoute>
        }
      />
      <Route
        path="/publicar"
        element={
          <ProtectedRoute session={session} redirectPath="/login">
            <PublishCargoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/matching"
        element={
          <ProtectedRoute session={session} redirectPath="/login">
            <TrackingPage />
          </ProtectedRoute>
        }
      />
      <Route path="/tracking" element={<Navigate to="/matching" replace />} />
      <Route
        path="/review"
        element={
          <ProtectedRoute session={session} redirectPath="/login">
            <ReviewPage />
          </ProtectedRoute>
        }
      />
      <Route path="/pagos" element={<Navigate to="/review" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ProtectedRoute({ session, role, redirectPath, children }) {
  if (!session) return <Navigate to={redirectPath} replace />
  if (role && session.role !== role) return <Navigate to={getHomePath(session)} replace />
  return children
}

function LandingPage({ session }) {
  return (
    <>
      <Header session={session} />
      <main>
        <MainPage />
      </main>
      <InfoContacto />
    </>
  )
}

export default App
