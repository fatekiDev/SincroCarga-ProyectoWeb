import { SESSION_COOKIE, clearSessionCookie } from '../controllers/auth.controller.js'
import { getUserFromSession } from '../services/auth.service.js'
import { getCarrierVerification } from '../models/admin.model.js'

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

export async function requireVerifiedCarrier(req, res, next) {
  const verification = await getCarrierVerification(req.user.transportista_id)
  if (!verification || !verification.activo) {
    return res.status(403).json({ error: 'La cuenta transportista está suspendida. Contacta a soporte.' })
  }
  if (verification.estado_verificacion !== 'Verificado') {
    return res.status(403).json({
      error: verification.estado_verificacion === 'Rechazado'
        ? `La verificación fue rechazada. ${verification.motivo_revision || 'Contacta a soporte para más información.'}`
        : 'Tu cuenta de transportista debe ser verificada por administración antes de operar.',
    })
  }
  return next()
}
