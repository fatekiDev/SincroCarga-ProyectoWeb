export async function authRequest(endpoint, options = {}) {
  const response = await fetch(`/api/auth/${endpoint}`, {
    credentials: 'same-origin',
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
    const error = new Error(`${result.error || 'No se pudo completar la solicitud.'}${details}`)
    error.status = response.status
    throw error
  }

  return result.data
}
