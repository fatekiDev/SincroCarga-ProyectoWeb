import { apiRequest } from '../api/request'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function paymentRequest(path, options = {}, feedback = {}) {
  return apiRequest(`${API_BASE_URL}/api/pagos${path}`, options, {
    ...feedback,
    errorFallback: 'No se pudo cargar el pago',
  })
}

export function getCurrentPayment(options = {}) {
  return paymentRequest('/actual', options)
}

export function startSimulatedPayment(viajeId) {
  return paymentRequest(`/${viajeId}/simular`, {
    method: 'POST',
    body: { aceptoTerminos: true },
  }, { successMessage: 'Pago de demostración iniciado.' })
}