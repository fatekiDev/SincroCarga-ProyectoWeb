const SESSION_KEY = 'sincrocarga_session'

export function getSession() {
  const storedSession = localStorage.getItem(SESSION_KEY)

  if (!storedSession) return null

  try {
    return JSON.parse(storedSession)
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function getHomePath(session) {
  if (session?.role === 'camionero') return '/dashboard'
  if (session?.role === 'cliente') return '/publicar'
  return '/'
}
