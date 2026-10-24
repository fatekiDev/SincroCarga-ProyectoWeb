// Pruebas de integración del esquema físico. Requieren PostgreSQL con el DDL
// base y las migraciones aplicadas (en CI lo hace .github/workflows/ci.yml).
// Sin PGHOST ni DATABASE_URL se omiten, para que `npm test` funcione sin BD.
import assert from 'node:assert/strict'
import test, { after } from 'node:test'

const hasDb = Boolean(process.env.PGHOST || process.env.DATABASE_URL)
const skip = hasDb ? false : 'Sin PostgreSQL configurado (PGHOST/DATABASE_URL)'
const { pool } = hasDb ? await import('../src/db/pool.js') : {}

after(async () => { if (pool) await pool.end() })

async function inRollback(callback) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    return await callback(client)
  } finally {
    await client.query('ROLLBACK')
    client.release()
  }
}

async function expectSqlState(client, sql, params, code) {
  await client.query('SAVEPOINT s')
  await assert.rejects(client.query(sql, params), (error) => error.code === code)
  await client.query('ROLLBACK TO s')
}

test('el esquema tiene las 24 tablas', { skip }, async () => {
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`)
  assert.equal(rows[0].n, 24)
})

test('ninguna FK usa NO ACTION implícito en ON DELETE', { skip }, async () => {
  const { rows } = await pool.query(
    `SELECT conname FROM pg_constraint WHERE contype = 'f' AND confdeltype = 'a'`)
  assert.deepEqual(rows, [])
})

test('pago -> viaje es RESTRICT (los pagos no se borran en cascada)', { skip }, async () => {
  const { rows } = await pool.query(
    `SELECT confdeltype FROM pg_constraint WHERE conname = 'pago_viaje_id_fkey'`)
  assert.equal(rows[0].confdeltype, 'r')
})

test('CHECK rechaza peso no positivo y NOT NULL rechaza fechas nulas', { skip }, async () => {
  await inRollback(async (client) => {
    await expectSqlState(client,
      `INSERT INTO carga (cliente_id, tipo_carga_id, descripcion, peso_kg, volumen_m3)
       SELECT id_cliente, 1, 'x', -1, 1 FROM cliente LIMIT 1`, [], '23514')
    await expectSqlState(client,
      `INSERT INTO cliente (tipo_cliente_id, rut, nombre_razon_social, email, telefono, fecha_registro)
       VALUES (1, '12.345.678-5', 'x', 'a@b.cl', '1', NULL)`, [], '23502')
    await expectSqlState(client,
      `INSERT INTO cliente (tipo_cliente_id, rut, nombre_razon_social, email, telefono)
       VALUES (1, 'no-es-rut', 'x', 'a@b.cl', '1')`, [], '23514')
  })
})

test('no se puede borrar un viaje que ya tiene pago', { skip }, async () => {
  await inRollback(async (client) => {
    const { rows } = await client.query(
      `SELECT v.id_viaje, c.cliente_id AS id_cliente
       FROM viaje v JOIN match m ON m.id_match = v.match_id
       JOIN postulacion post ON post.id_postulacion = m.postulacion_id
       JOIN publicacion_carga pc ON pc.id_publicacion = post.publicacion_id
       JOIN carga c ON c.id_carga = pc.carga_id LIMIT 1`)
    assert.ok(rows[0], 'el DDL base debe traer al menos un viaje de prueba')
    const { id_viaje, id_cliente } = rows[0]
    await client.query(
      `INSERT INTO pago (viaje_id, cliente_id, tarifa_propuesta, comision_porcentaje,
         comision, iva_porcentaje, iva, total_cliente)
       VALUES ($1, $2, 1000, 10, 100, 19, 19, 1119)`, [id_viaje, id_cliente])
    await expectSqlState(client, 'DELETE FROM viaje WHERE id_viaje = $1', [id_viaje], '23503')
  })
})
