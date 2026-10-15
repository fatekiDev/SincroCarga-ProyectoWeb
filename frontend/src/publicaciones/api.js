const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function publicationRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/publicaciones${path}`, {
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
    const error = new Error(result.error || 'No se pudo completar la solicitud')
    error.details = Array.isArray(result.details) ? result.details : []
    error.status = response.status
    throw error
  }

  return result.data
}

export function getPublicationCatalogs(options = {}) {
  return publicationRequest('/catalogos', options)
}

export function getPublicationQuote(criteria, options = {}) {
  return publicationRequest('/cotizacion', {
    ...options,
    method: 'POST',
    body: criteria,
  })
}

export function getMyPublications(options = {}) {
  return publicationRequest('/mine', options)
}

export function createPublication(publication) {
  return publicationRequest('/', { method: 'POST', body: publication })
}

export function updatePublication(id, publication) {
  return publicationRequest(`/${id}`, { method: 'PUT', body: publication })
}

export function cancelPublication(id) {
  return publicationRequest(`/${id}/cancelar`, { method: 'POST' })
}