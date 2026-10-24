import { apiRequest } from '../api/request'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function publicationRequest(path, options = {}, feedback = {}) {
  return apiRequest(`${API_BASE_URL}/api/publicaciones${path}`, options, {
    ...feedback,
    errorFallback: 'No se pudo completar la solicitud',
  })
}

export function getAvailablePublications(options = {}) {
  return apiRequest(`${API_BASE_URL}/api/publicaciones`, {
    ...options,
    credentials: 'omit',
  }, { errorFallback: 'No se pudieron cargar las publicaciones disponibles.' })
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
  return publicationRequest('/', { method: 'POST', body: publication }, { successMessage: 'Carga publicada correctamente.' })
}

export function updatePublication(id, publication) {
  return publicationRequest(`/${id}`, { method: 'PUT', body: publication }, { successMessage: 'Publicación actualizada correctamente.' })
}

export function cancelPublication(id) {
  return publicationRequest(`/${id}/cancelar`, { method: 'POST' }, { successMessage: 'Publicación cancelada correctamente.' })
}