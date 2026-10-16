import {
  getUserFromSession,
  loginUser,
  logoutUser,
  registerUser,
} from '../services/auth.service.js'
import {
  validateLogin,
  validateRegistration,
} from '../services/auth.validation.js'

export const SESSION_COOKIE = 'sincrocarga_session'
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  })
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  })
}

function publicUser(user) {
  return {
    id: user.id_usuario ?? user.id,
    email: user.email,
    role: user.rol ?? user.role,
    name: user.nombre ?? user.name ?? null,
    verificationStatus: user.estado_verificacion ?? null,
    verificationReason: user.motivo_revision ?? null,
    carrierActive: user.transportista_activo ?? null,
  }
}

function normalizePlate(value) {
  const compactPlate = value.trim().replace(/[\s-]/g, '').toUpperCase()
  return compactPlate.length === 6
    ? `${compactPlate.slice(0, 4)}-${compactPlate.slice(4)}`
    : `${compactPlate.slice(0, 2)}-${compactPlate.slice(2)}`
}

export async function register(req, res) {
  const errors = validateRegistration(req.body)
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Datos de registro inválidos', details: errors })
  }

  const account = {
    ...req.body,
    email: req.body.email.trim().toLowerCase(),
    profile: { ...req.body.profile },
  }
  if (account.role === 'cliente') {
    account.profile.rut = account.profile.rut.trim()
    account.profile.nombreRazonSocial = account.profile.nombreRazonSocial.trim()
    account.profile.telefono = account.profile.telefono.trim()
  } else {
    account.profile.empresa = {
      ...account.profile.empresa,
      rut: account.profile.empresa.rut.trim(),
      razonSocial: account.profile.empresa.razonSocial.trim(),
    }
    account.profile.conductor = {
      ...account.profile.conductor,
      rut: account.profile.conductor.rut.trim(),
      nombre: account.profile.conductor.nombre.trim(),
      telefono: account.profile.conductor.telefono.trim(),
      licencia: account.profile.conductor.licencia.trim(),
    }
    account.profile.camion = {
      ...account.profile.camion,
      patente: normalizePlate(account.profile.camion.patente),
      marca: account.profile.camion.marca.trim(),
      modelo: account.profile.camion.modelo.trim(),
      tipo: account.profile.camion.tipo.trim(),
    }
  }

  const { user, token } = await registerUser(account)
  setSessionCookie(res, token)
  const name = account.role === 'cliente'
    ? account.profile.nombreRazonSocial
    : account.profile.conductor.nombre
  res.status(201).json({
    data: publicUser({
      ...user,
      nombre: name,
      estado_verificacion: account.role === 'camionero' ? 'Pendiente' : null,
      transportista_activo: account.role === 'camionero',
    }),
  })
}

export async function login(req, res) {
  const errors = validateLogin(req.body)
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Datos de inicio de sesión inválidos', details: errors })
  }

  const result = await loginUser(req.body)
  if (!result) return res.status(401).json({ error: 'Correo o contraseña incorrectos' })

  setSessionCookie(res, result.token)
  res.status(200).json({ data: publicUser(result.user) })
}

export async function currentSession(req, res) {
  if (!req.cookies[SESSION_COOKIE]) {
    return res.status(401).json({ error: 'No hay una sesión activa' })
  }

  const user = await getUserFromSession(req.cookies[SESSION_COOKIE])
  if (!user) {
    clearSessionCookie(res)
    return res.status(401).json({ error: 'La sesión no existe o expiró' })
  }

  res.status(200).json({ data: publicUser(user) })
}

export async function logout(req, res) {
  const token = req.cookies[SESSION_COOKIE]
  if (token) await logoutUser(token)

  clearSessionCookie(res)
  res.status(200).json({ message: 'Sesión cerrada' })
}
