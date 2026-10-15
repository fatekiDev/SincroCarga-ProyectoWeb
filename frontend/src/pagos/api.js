const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

async function paymentRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/pagos${path}`, {
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
    const error = new Error(result.error || 'No se pudo cargar el pago')
    error.details = Array.isArray(result.details) ? result.details : []
    error.status = response.status
    throw error
  }

  return result.data
}

export function getCurrentPayment(options = {}) {
  return paymentRequest('/actual', options)
}

export function startSimulatedPayment(viajeId) {
  return paymentRequest(`/${viajeId}/simular`, {
    method: 'POST',
    body: { aceptoTerminos: true },
  })
}