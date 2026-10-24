const REQUEST_EVENT = 'sincrocarga:request'
const TOAST_EVENT = 'sincrocarga:toast'

function notify(type, message) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { type, message } }))
  }
}

export async function apiRequest(url, options = {}, {
  successMessage,
  errorFallback,
  includeDetailsInMessage = false,
} = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  const { body, ...fetchOptions } = options

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: { active: true } }))
  }

  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...fetchOptions,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    let result
    try {
      result = await response.json()
    } catch {
      throw new Error('El servidor devolvió una respuesta no válida')
    }

    if (!response.ok) {
      const details = Array.isArray(result.details) ? result.details : []
      const detailMessage = includeDetailsInMessage && details.length ? ` ${details.join('. ')}` : ''
      const error = new Error(`${result.error || errorFallback || 'No se pudo completar la solicitud.'}${detailMessage}`)
      error.details = details
      error.status = response.status
      throw error
    }

    if (isMutation && successMessage) notify('success', successMessage)
    return result.data
  } catch (error) {
    if (isMutation && error.name !== 'AbortError') {
      notify('error', error.message || errorFallback || 'No se pudo completar la solicitud.')
    }
    throw error
  } finally {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: { active: false } }))
    }
  }
}

export const requestEvents = { request: REQUEST_EVENT, toast: TOAST_EVENT }
