import { apiRequest } from '../api/request'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export async function authRequest(endpoint, options = {}) {
  const successMessages = {
    login: 'Sesión iniciada correctamente.',
    register: 'Cuenta creada correctamente.',
    logout: 'Sesión cerrada correctamente.',
  }
  const data = await apiRequest(`${API_BASE_URL}/api/auth/${endpoint}`, options, {
    successMessage: successMessages[endpoint],
    errorFallback: 'No se pudo completar la solicitud.',
    includeDetailsInMessage: true,
  })
  return data
}
