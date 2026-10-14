import { SESSION_COOKIE, clearSessionCookie } from '../controllers/auth.controller.js'
import { getUserFromSession } from '../services/auth.service.js'

export async function requireAuth(req, res, next) {
  const token = req.cookies[SESSION_COOKIE]

  if (!token) {
    return res.status(401).json({ error: 'Debes iniciar sesión' })
  }

  const user = await getUserFromSession(token)
  if (!user) {
    clearSessionCookie(res)
    return res.status(401).json({ error: 'La sesión no existe o expiró' })
  }

  req.user = user
  return next()
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.rol !== role) {
      return res.status(403).json({ error: 'No tienes permiso para esta operación' })
    }

    return next()
  }
}
