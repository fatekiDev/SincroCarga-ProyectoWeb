import { apiRequest } from '../api/request'

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function adminRequest(path, options = {}, feedback = {}) {
  return apiRequest(`${API_BASE_URL}/api/admin${path}`, options, {
    ...feedback,
    errorFallback: 'No se pudo completar la solicitud.',
  })
}

export function getResumen() {
  return adminRequest('/resumen')
}

export function getSolicitudes() {
  return adminRequest('/solicitudes')
}

export function getSolicitudDetalle(id) {
  return adminRequest(`/solicitudes/${encodeURIComponent(id)}`)
}

export function aprobarSolicitud(id) {
  return adminRequest(`/solicitudes/${encodeURIComponent(id)}/aprobar`, { method: 'PUT' }, { successMessage: 'Solicitud aprobada correctamente.' })
}

export function rechazarSolicitud(id, motivo) {
  return adminRequest(`/solicitudes/${encodeURIComponent(id)}/rechazar`, {
    method: 'PUT',
    body: { motivo },
  }, { successMessage: 'Solicitud rechazada correctamente.' })
}

export function getTransportistas({ search = '', estado = 'Todos', page = 1, pageSize = 5 } = {}) {
  const params = new URLSearchParams({ search, estado, page: String(page), pageSize: String(pageSize) })
  return adminRequest(`/transportistas?${params}`)
}

export function updateTransportista(id, changes) {
  return adminRequest(`/transportistas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: changes,
  }, { successMessage: 'Estado del transportista actualizado.' })
}

export function getReportes(period = '30d') {
  return adminRequest(`/reportes?periodo=${encodeURIComponent(period)}`)
}
