const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function adminRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/admin${path}`, {
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
    throw new Error('El servidor devolvió una respuesta no válida.')
  }

  if (!response.ok) {
    const error = new Error(result.error || 'No se pudo completar la solicitud.')
    error.status = response.status
    throw error
  }

  return result.data
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
  return adminRequest(`/solicitudes/${encodeURIComponent(id)}/aprobar`, { method: 'PUT' })
}

export function rechazarSolicitud(id, motivo) {
  return adminRequest(`/solicitudes/${encodeURIComponent(id)}/rechazar`, {
    method: 'PUT',
    body: { motivo },
  })
}

export function getTransportistas({ search = '', estado = 'Todos', page = 1, pageSize = 5 } = {}) {
  const params = new URLSearchParams({ search, estado, page: String(page), pageSize: String(pageSize) })
  return adminRequest(`/transportistas?${params}`)
}

export function updateTransportista(id, changes) {
  return adminRequest(`/transportistas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: changes,
  })
}

export function getReportes(period = '30d') {
  return adminRequest(`/reportes?periodo=${encodeURIComponent(period)}`)
}
