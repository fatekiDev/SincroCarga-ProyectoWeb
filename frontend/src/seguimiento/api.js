const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function trackingRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/seguimiento${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('El servidor devolvió una respuesta no válida')
  }

  if (!response.ok) {
    const error = new Error(result.error || 'No se pudo cargar el seguimiento')
    error.details = Array.isArray(result.details) ? result.details : []
    error.status = response.status
    throw error
  }

  return result.data
}

export function getActiveTracking(options = {}) {
  return trackingRequest('/activo', options)
}

export function getJourneyReview(options = {}) {
  return trackingRequest('/revision', options)
}

export function confirmJourneyReceipt(viajeId) {
  return trackingRequest(`/${viajeId}/confirmar-recepcion`, { method: 'POST' })
}

export function submitJourneyRating(viajeId, rating) {
  return trackingRequest(`/${viajeId}/calificacion`, {
    method: 'POST',
    body: rating,
  })
}

export function reportTrackingIncident(viajeId, descripcion) {
  return trackingRequest(`/${viajeId}/incidencias`, {
    method: 'POST',
    body: { descripcion },
  })
}