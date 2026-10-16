import bcrypt from 'bcryptjs'
import {
  createAccountSession,
  findAccountByEmail,
  findUserBySessionToken,
  registerAccount,
  deleteSession,
} from '../models/auth.model.js'

const PASSWORD_HASH_ROUNDS = 12

export async function registerUser(account) {
  const passwordHash = await bcrypt.hash(account.password, PASSWORD_HASH_ROUNDS)
  return registerAccount({
    email: account.email.trim().toLowerCase(),
    passwordHash,
    role: account.role,
    profile: account.profile,
  })
}

export async function loginUser({ email, password }) {
  const account = await findAccountByEmail(email.trim().toLowerCase())
  if (!account || !(await bcrypt.compare(password, account.password_hash))) return null

  const token = await createAccountSession(account.id_usuario)
  return {
    token,
    user: {
      id: account.id_usuario,
      email: account.email,
      role: account.rol,
      nombre: account.nombre,
      estado_verificacion: account.estado_verificacion,
      motivo_revision: account.motivo_revision,
      transportista_activo: account.transportista_activo,
    },
  }
}

export function getUserFromSession(token) {
  return findUserBySessionToken(token)
}

export function logoutUser(token) {
  return deleteSession(token)
}
