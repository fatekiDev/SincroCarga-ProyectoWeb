import { apiRequest } from '../api/request'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function carrierRequest(path, options = {}, feedback = {}) {
  return apiRequest(`${API_BASE_URL}/api/transportista${path}`, options, {
    ...feedback,
    errorFallback: 'No se pudo completar la solicitud',
    includeDetailsInMessage: true,
  })
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
  }, { successMessage: 'Postulación enviada correctamente.' })
}

export function withdrawApplication(applicationId) {
  return carrierRequest(`/postulaciones/${applicationId}/retirar`, { method: 'POST' }, { successMessage: 'Postulación retirada correctamente.' })
}

export function getCarrierTransportPublications(options = {}) {
  return carrierRequest('/espacios', options)
}

export function createCarrierTransportPublication(publication) {
  return carrierRequest('/espacios', { method: 'POST', body: publication }, { successMessage: 'Espacio de transporte publicado correctamente.' })
}

export function cancelCarrierTransportPublication(publicationId) {
  return carrierRequest(`/espacios/${publicationId}/cancelar`, { method: 'POST' }, { successMessage: 'Espacio cancelado correctamente.' })
}

export function getCarrierJourneys(options = {}) {
  return carrierRequest('/viajes', options)
}
