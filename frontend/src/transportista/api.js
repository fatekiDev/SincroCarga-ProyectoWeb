const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function carrierRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/transportista${path}`, {
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
    const details = Array.isArray(result.details) ? ` ${result.details.join('. ')}` : ''
    const error = new Error(`${result.error || 'No se pudo completar la solicitud'}${details}`)
    error.status = response.status
    throw error
  }

  return result.data
}

export function getCarrierCatalogs(options = {}) {
  return carrierRequest('/catalogos', options)
}

export function getAvailableLoads(options = {}) {
  return carrierRequest('/cargas', options)
}

export function getCarrierApplications(options = {}) {
  return carrierRequest('/postulaciones', options)
}

export function applyToLoad(publicationId, application) {
  return carrierRequest(`/cargas/${publicationId}/postular`, {
    method: 'POST',
    body: application,
  })
}

export function withdrawApplication(applicationId) {
  return carrierRequest(`/postulaciones/${applicationId}/retirar`, { method: 'POST' })
}

export function getCarrierTransportPublications(options = {}) {
  return carrierRequest('/espacios', options)
}

export function createCarrierTransportPublication(publication) {
  return carrierRequest('/espacios', { method: 'POST', body: publication })
}

export function cancelCarrierTransportPublication(publicationId) {
  return carrierRequest(`/espacios/${publicationId}/cancelar`, { method: 'POST' })
}

export function getCarrierJourneys(options = {}) {
  return carrierRequest('/viajes', options)
}
