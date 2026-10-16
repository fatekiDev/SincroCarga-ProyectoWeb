import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Header from './components/header'
import InfoContacto from './components/InfoContacto'
import MainPage from './pages/MainPage'
import DashboardCamionero from './pages/dashboard_camionero.jsx'
import DriverJourneysPage from './pages/DriverJourneysPage'
import PublishCargoPage from './pages/PublishCargoPage'
import ReviewPage from './pages/ReviewPage'
import TrackingPage from './pages/TrackingPage'
import DriverVerificationPage from './pages/DriverVerificationPage'
import PublishSpacePage from './pages/PublishSpacePage'
import DriverMatchingPage from './pages/DriverMatchingPage'
import PaymentPage from './pages/PaymentPage'
import './App.css'
import Login from './pages/Login'
import Register from './pages/Register'
import { authRequest } from './auth/api'
import { getHomePath } from './auth/session'
import AdminPanel from './pages/AdminPanel'
import AdminSolicitudes from './pages/AdminSolicitudes'
import AdminTransportistas from './pages/AdminTransportistas'
import AdminReportes from './pages/AdminReportes'

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
        element={<Login session={session} onAuthenticated={(user) => {
          onAuthenticated(user)
          navigate(getHomePath(user), { replace: true })
        }} />}
      />
      <Route
        path="/admin/login"
        element={session
          ? <Navigate to={getHomePath(session)} replace />
          : <Login isAdminLogin onAuthenticated={(user) => {
            onAuthenticated(user)
            navigate(getHomePath(user), { replace: true })
          }} />}
      />
      <Route
        path="/registro"
        element={<Register session={session} onAuthenticated={(user) => {
          onAuthenticated(user)
          navigate(user.role === 'camionero' ? '/verificacion' : getHomePath(user), { replace: true })
        }} />}
      />
      <Route
        path="/verificacion"
        element={
          <ProtectedRoute session={session} authStatus={authStatus} role="camionero" redirectPath="/login">
            <DriverVerificationPage session={session} onLogout={handleLogoutAndNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute session={session} authStatus={authStatus} role="camionero" requireVerifiedCarrier redirectPath="/login">
            <DashboardCamionero session={session} onLogout={handleLogoutAndNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/viajes"
        element={
          <ProtectedRoute session={session} authStatus={authStatus} role="camionero" requireVerifiedCarrier redirectPath="/login">
            <DriverJourneysPage session={session} onLogout={handleLogoutAndNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/publicar"
        element={
          <ProtectedRoute
            session={session}
            authStatus={authStatus}
            requireVerifiedCarrier={session?.role === 'camionero'}
            redirectPath="/login"
          >
            {session?.role === 'camionero'
              ? <PublishSpacePage session={session} onLogout={handleLogoutAndNavigate} />
              : <PublishCargoPage session={session} onLogout={handleLogoutAndNavigate} />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/matching"
        element={
          <ProtectedRoute
            session={session}
            authStatus={authStatus}
            requireVerifiedCarrier={session?.role === 'camionero'}
            redirectPath="/login"
          >
            {session?.role === 'camionero'
              ? <DriverMatchingPage session={session} onLogout={handleLogoutAndNavigate} />
              : <TrackingPage session={session} onLogout={handleLogoutAndNavigate} />}
          </ProtectedRoute>
        }
      />
      <Route path="/tracking" element={<Navigate to="/matching" replace />} />
      <Route
        path="/review"
        element={
          <ProtectedRoute session={session} authStatus={authStatus} role="cliente" redirectPath="/login">
            <ReviewPage session={session} onLogout={handleLogoutAndNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pagos"
        element={
          <ProtectedRoute session={session} authStatus={authStatus} role="cliente" redirectPath="/login">
            <PaymentPage session={session} onLogout={handleLogoutAndNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute session={session} authStatus={authStatus} role="admin" redirectPath="/admin/login">
            <AdminPanel session={session} onLogout={handleLogoutAndNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/solicitudes"
        element={
          <ProtectedRoute session={session} authStatus={authStatus} role="admin" redirectPath="/admin/login">
            <AdminSolicitudes session={session} onLogout={handleLogoutAndNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transportistas"
        element={
          <ProtectedRoute session={session} authStatus={authStatus} role="admin" redirectPath="/admin/login">
            <AdminTransportistas session={session} onLogout={handleLogoutAndNavigate} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reportes"
        element={
          <ProtectedRoute session={session} authStatus={authStatus} role="admin" redirectPath="/admin/login">
            <AdminReportes session={session} onLogout={handleLogoutAndNavigate} />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}

function ProtectedRoute({ session, authStatus, role, redirectPath, children, requireVerifiedCarrier = false }) {
  if (authStatus === 'loading') return <p role="status">Verificando sesión…</p>
  if (authStatus === 'error') return <p role="alert">No se puede verificar la sesión porque el backend no responde.</p>
  if (!session) return <Navigate to={redirectPath} replace />
  if (role && session.role !== role) return <Navigate to={getHomePath(session)} replace />
  if (
    requireVerifiedCarrier
    && (session.verificationStatus !== 'Verificado' || session.carrierActive === false)
  ) {
    return <Navigate to="/verificacion" replace />
  }
  return children
}

function LandingPage({ session, onLogout }) {
  return (
    <>
      <Header session={session} onLogout={onLogout} />
      <main>
        <MainPage />
      </main>
      <InfoContacto session={session} />
    </>
  )
}

export default App
