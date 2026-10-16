import { createHash, randomBytes } from 'node:crypto'
import { pool } from '../db/pool.js'

const SESSION_LIFETIME_HOURS = 24 * 7

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

async function createSession(client, userId) {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)

  await client.query(`
    INSERT INTO usuario_sesion (usuario_id, token_hash, fecha_expiracion)
    VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 hour'))
  `, [userId, tokenHash, SESSION_LIFETIME_HOURS])

  return token
}

async function withTransaction(callback) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error('Error al revertir la transacción de autenticación:', rollbackError)
    }
    throw error
  } finally {
    client.release()
  }
}

export function registerAccount({ email, passwordHash, role, profile }) {
  return withTransaction(async (client) => {
    let profileId

    if (role === 'cliente') {
      const result = await client.query(`
        INSERT INTO cliente (
          tipo_cliente_id,
          rut,
          nombre_razon_social,
          email,
          telefono,
          direccion,
          comuna
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id_cliente
      `, [
        profile.tipoClienteId,
        profile.rut,
        profile.nombreRazonSocial,
        email,
        profile.telefono,
        profile.direccion || null,
        profile.comuna || null,
      ])
      profileId = result.rows[0].id_cliente
    } else {
      const carrierResult = await client.query(`
        INSERT INTO transportista (rut_empresa, razon_social, email, telefono, direccion)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_transportista
      `, [
        profile.empresa.rut,
        profile.empresa.razonSocial,
        email,
        profile.conductor.telefono,
        profile.empresa.direccion || null,
      ])
      profileId = carrierResult.rows[0].id_transportista

      await client.query(`
        INSERT INTO chofer (
          transportista_id,
          rut,
          nombre_completo,
          licencia_conducir,
          fecha_vencimiento_licencia,
          telefono
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        profileId,
        profile.conductor.rut,
        profile.conductor.nombre,
        profile.conductor.licencia,
        profile.conductor.licenciaVencimiento,
        profile.conductor.telefono,
      ])

      await client.query(`
        INSERT INTO camion (
          transportista_id,
          patente,
          marca,
          modelo,
          anio,
          capacidad_kg,
          capacidad_m3,
          tipo_vehiculo
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        profileId,
        profile.camion.patente,
        profile.camion.marca,
        profile.camion.modelo,
        profile.camion.anio,
        profile.camion.capacidadKg,
        profile.camion.capacidadM3,
        profile.camion.tipo,
      ])
    }

    const accountResult = role === 'cliente'
      ? await client.query(`
        INSERT INTO usuario (email, password_hash, rol, cliente_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id_usuario, email, rol
      `, [email, passwordHash, role, profileId])
      : await client.query(`
        INSERT INTO usuario (email, password_hash, rol, transportista_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id_usuario, email, rol
      `, [email, passwordHash, role, profileId])

    const user = accountResult.rows[0]
    const token = await createSession(client, user.id_usuario)

    return { user, token }
  })
}

export async function findAccountByEmail(email) {
  const { rows } = await pool.query(`
    SELECT
      u.id_usuario,
      u.email,
      u.password_hash,
      u.rol,
      COALESCE(ch.nombre_completo, c.nombre_razon_social, t.razon_social, u.nombre_mostrar) AS nombre,
      t.estado_verificacion,
      t.motivo_revision,
      t.activo AS transportista_activo
    FROM usuario AS u
    LEFT JOIN cliente AS c ON c.id_cliente = u.cliente_id
    LEFT JOIN transportista AS t ON t.id_transportista = u.transportista_id
    LEFT JOIN chofer AS ch ON ch.transportista_id = t.id_transportista
    WHERE LOWER(u.email) = LOWER($1) AND u.activo = TRUE
  `, [email])

  return rows[0] ?? null
}

export async function createAccountSession(userId) {
  return withTransaction((client) => createSession(client, userId))
}

export async function findUserBySessionToken(token) {
  const tokenHash = hashToken(token)
  const { rows } = await pool.query(`
    SELECT
      u.id_usuario,
      u.email,
      u.rol,
      u.cliente_id,
      u.transportista_id,
      COALESCE(ch.nombre_completo, c.nombre_razon_social, t.razon_social, u.nombre_mostrar) AS nombre,
      t.estado_verificacion,
      t.motivo_revision,
      t.activo AS transportista_activo
    FROM usuario_sesion AS s
    INNER JOIN usuario AS u ON u.id_usuario = s.usuario_id
    LEFT JOIN cliente AS c ON c.id_cliente = u.cliente_id
    LEFT JOIN transportista AS t ON t.id_transportista = u.transportista_id
    LEFT JOIN chofer AS ch ON ch.transportista_id = t.id_transportista
    WHERE s.token_hash = $1
      AND s.fecha_expiracion > NOW()
      AND u.activo = TRUE
  `, [tokenHash])

  return rows[0] ?? null
}

export async function deleteSession(token) {
  const tokenHash = hashToken(token)
  await pool.query('DELETE FROM usuario_sesion WHERE token_hash = $1', [tokenHash])
}
