import { useEffect, useState } from 'react'
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
import { authRequest } from './auth/api'
import { getHomePath } from './auth/session'

function App() {
  const [session, setSession] = useState(null)
  const [authStatus, setAuthStatus] = useState('loading')

  useEffect(() => {
    localStorage.removeItem('sincrocarga_session')
    const controller = new AbortController()

    authRequest('me', { signal: controller.signal })
      .then((user) => {
        setSession(user)
        setAuthStatus('ready')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        if (error.status !== 401) {
          console.error('No se pudo comprobar la sesión:', error)
          setAuthStatus('error')
          return
        }
        setAuthStatus('ready')
      })

    return () => controller.abort()
  }, [])

  const handleAuthenticated = (user) => {
    setSession(user)
    setAuthStatus('ready')
  }

  const handleLogout = async () => {
    await authRequest('logout', { method: 'POST' })
    setSession(null)
  }

  return (
    <BrowserRouter>
      <AppRoutes
        session={session}
        authStatus={authStatus}
        onAuthenticated={handleAuthenticated}
        onLogout={handleLogout}
      />
    </BrowserRouter>
  )
}

function AppRoutes({ session, authStatus, onAuthenticated, onLogout }) {
  const navigate = useNavigate()

  const handleLogoutAndNavigate = async () => {
    await onLogout()
    navigate('/', { replace: true })
  }

  return (
    <>
    {authStatus === 'error' && (
      <p className="auth-session-error" role="alert">
        No se pudo comprobar tu sesión. Verifica que el backend esté funcionando y recarga la página.
      </p>
    )}
    <Routes>
      <Route path="/" element={<LandingPage session={session} onLogout={handleLogoutAndNavigate} />} />
      <Route path="/landing" element={<Navigate to="/" replace />} />
      <Route
        path="/login"
        element={<Login onAuthenticated={(user) => {
          onAuthenticated(user)
          navigate(getHomePath(user), { replace: true })
        }} />}
      />
      <Route
        path="/registro"
        element={<Register onAuthenticated={(user) => {
          onAuthenticated(user)
          navigate(getHomePath(user), { replace: true })
        }} />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute session={session} authStatus={authStatus} role="camionero" redirectPath="/login">
            <DashboardCamionero session={session} onLogout={handleLogoutAndNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/publicar"
        element={
          <ProtectedRoute session={session} authStatus={authStatus} redirectPath="/login">
            <PublishCargoPage session={session} onLogout={handleLogoutAndNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/matching"
        element={
          <ProtectedRoute session={session} authStatus={authStatus} redirectPath="/login">
            <TrackingPage session={session} onLogout={handleLogoutAndNavigate} />
          </ProtectedRoute>
        }
      />
      <Route path="/tracking" element={<Navigate to="/matching" replace />} />
      <Route
        path="/review"
        element={
          <ProtectedRoute session={session} authStatus={authStatus} redirectPath="/login">
            <ReviewPage session={session} onLogout={handleLogoutAndNavigate} />
          </ProtectedRoute>
        }
      />
      <Route path="/pagos" element={<Navigate to="/review" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}

function ProtectedRoute({ session, authStatus, role, redirectPath, children }) {
  if (authStatus === 'loading') return <p role="status">Verificando sesión…</p>
  if (authStatus === 'error') return <p role="alert">No se puede verificar la sesión porque el backend no responde.</p>
  if (!session) return <Navigate to={redirectPath} replace />
  if (role && session.role !== role) return <Navigate to={getHomePath(session)} replace />
  return children
}

function LandingPage({ session, onLogout }) {
  return (
    <>
      <Header session={session} onLogout={onLogout} />
      <main>
        <MainPage />
      </main>
      <InfoContacto />
    </>
  )
}

export default App
