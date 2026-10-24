import { apiRequest } from '../api/request'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function trackingRequest(path, options = {}, feedback = {}) {
  return apiRequest(`${API_BASE_URL}/api/seguimiento${path}`, options, {
    ...feedback,
    errorFallback: 'No se pudo cargar el seguimiento',
  })
}

export function getActiveTracking(options = {}) {
  return trackingRequest('/activo', options)
}

export function getJourneyReview(options = {}) {
  return trackingRequest('/revision', options)
}

export function confirmJourneyReceipt(viajeId) {
  return trackingRequest(`/${viajeId}/confirmar-recepcion`, { method: 'POST' }, { successMessage: 'Recepción del viaje confirmada.' })
}

export function submitJourneyRating(viajeId, rating) {
  return trackingRequest(`/${viajeId}/calificacion`, {
    method: 'POST',
    body: rating,
  }, { successMessage: 'Calificación enviada correctamente.' })
}

export function reportTrackingIncident(viajeId, descripcion) {
  return trackingRequest(`/${viajeId}/incidencias`, {
    method: 'POST',
    body: { descripcion },
  }, { successMessage: 'Incidencia registrada en el viaje.' })
}