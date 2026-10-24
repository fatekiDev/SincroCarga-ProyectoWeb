import assert from 'node:assert/strict'
import test from 'node:test'

// Evita abrir conexiones: el pool solo se crea, no se conecta hasta la primera consulta.
process.env.PGHOST ??= 'localhost'
process.env.PGDATABASE ??= 'test'
process.env.PGUSER ??= 'test'
process.env.PGPASSWORD ??= 'test'

function routeMethods(router) {
  return router.stack
    .filter((layer) => layer.route)
    .flatMap((layer) => Object.keys(layer.route.methods).map((m) => `${m.toUpperCase()} ${layer.route.path}`))
}

test('la API expone verbos DELETE con semántica de borrado lógico', async () => {
  const { default: publicaciones } = await import('../src/routes/publicaciones.routes.js')
  const { default: transportista } = await import('../src/routes/transportista.routes.js')
  const { default: auth } = await import('../src/routes/auth.routes.js')

  assert.ok(routeMethods(publicaciones).includes('DELETE /:id'))
  assert.ok(routeMethods(transportista).includes('DELETE /postulaciones/:postulacionId'))
  assert.ok(routeMethods(transportista).includes('DELETE /espacios/:publicacionId'))
  assert.ok(routeMethods(auth).includes('DELETE /session'))
})

test('se conservan los POST originales que usa el frontend', async () => {
  const { default: publicaciones } = await import('../src/routes/publicaciones.routes.js')
  assert.ok(routeMethods(publicaciones).includes('POST /:id/cancelar'))
})
