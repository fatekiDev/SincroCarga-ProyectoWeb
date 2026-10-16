export function getHomePath(session) {
  if (session?.role === 'admin') return '/admin'
  if (
    session?.role === 'camionero'
    && (session.verificationStatus !== 'Verificado' || session.carrierActive === false)
  ) return '/verificacion'
  if (session?.role === 'camionero') return '/dashboard'
  if (session?.role === 'cliente') return '/publicar'
  return '/'
}
