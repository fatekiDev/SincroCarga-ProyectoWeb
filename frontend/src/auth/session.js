export function getHomePath(session) {
  if (session?.role === 'camionero') return '/dashboard'
  if (session?.role === 'cliente') return '/publicar'
  return '/'
}
