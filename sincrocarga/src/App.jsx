import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/header'
import InfoContacto from './components/InfoContacto'
import MainPage from './pages/MainPage'
import DashboardCamionero from './pages/dashboard_camionero.jsx'
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
          <Route path="/dashboard" element={<DashboardCamionero />} />
        </Routes>
      </main>
      <InfoContacto />
    </BrowserRouter>
  )
}


export default App
