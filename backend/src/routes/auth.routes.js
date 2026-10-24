import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  currentSession,
  login,
  logout,
  register,
} from '../controllers/auth.controller.js'

const router = Router()
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta nuevamente en 15 minutos.' },
})

router.post('/register', register)
router.post('/login', loginLimiter, login)
router.get('/me', currentSession)
router.post('/logout', logout)
// DELETE equivalente a POST /logout: elimina la sesión (fila de usuario_sesion) y la cookie
router.delete('/session', logout)

export default router
