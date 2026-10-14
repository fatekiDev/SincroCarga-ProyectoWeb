import { pool } from '../db/pool.js'

function mapPublication(row) {
  if (!row) return null

  return {
    id: row.id_publicacion,
    descripcion: row.descripcion,
    pesoKg: row.peso_kg,
    volumenM3: row.volumen_m3,
    tipoCargaId: row.tipo_carga_id,
    origen: row.origen,
    destino: row.destino,
    distanciaKm: row.distancia_km,
    fechaPublicacion: row.fecha_publicacion,
    fechaLimitePostulacion: row.fecha_limite_postulacion,
    tarifaOfrecida: row.tarifa_ofrecida,
    estado: row.estado,
  }
}

async function findPublicationById(client, id) {
  const { rows } = await client.query(`
    SELECT
      pc.id_publicacion,
      c.descripcion,
      c.peso_kg,
      c.volumen_m3,
      c.tipo_carga_id,
      r.origen,
      r.destino,
      r.distancia_km,
      pc.fecha_publicacion,
      pc.fecha_limite_postulacion,
      pc.tarifa_ofrecida,
      pc.estado
    FROM publicacion_carga AS pc
    INNER JOIN carga AS c ON c.id_carga = pc.carga_id
    INNER JOIN ruta AS r ON r.id_ruta = pc.ruta_id
    WHERE pc.id_publicacion = $1
  `, [id])

  return mapPublication(rows[0])
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
      console.error('Error al revertir la transacción de publicación:', rollbackError)
    }
    throw error
  } finally {
    client.release()
  }
}

export async function findAvailablePublications() {
  const { rows } = await pool.query(`
    SELECT
      pc.id_publicacion,
      c.descripcion,
      c.peso_kg,
      c.volumen_m3,
      c.tipo_carga_id,
      r.origen,
      r.destino,
      r.distancia_km,
      pc.fecha_publicacion,
      pc.fecha_limite_postulacion,
      pc.tarifa_ofrecida,
      pc.estado
    FROM publicacion_carga AS pc
    INNER JOIN carga AS c ON c.id_carga = pc.carga_id
    INNER JOIN ruta AS r ON r.id_ruta = pc.ruta_id
    WHERE pc.estado = $1
    ORDER BY pc.fecha_publicacion DESC, pc.id_publicacion DESC
  `, ['Disponible'])

  return rows.map(mapPublication)
}

export function findPublication(id) {
  return findPublicationById(pool, id)
}

export async function createPublication(publication, clienteId) {
  return withTransaction(async (client) => {
    const cargoResult = await client.query(`
      INSERT INTO carga (
        cliente_id,
        tipo_carga_id,
        descripcion,
        peso_kg,
        volumen_m3,
        valor_declarado
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_carga
    `, [
      clienteId,
      publication.tipoCargaId,
      publication.descripcion,
      publication.pesoKg,
      publication.volumenM3,
      publication.valorDeclarado,
    ])

    const { id_carga: cargoId } = cargoResult.rows[0]
    const publicationResult = await client.query(`
      INSERT INTO publicacion_carga (
        carga_id,
        ruta_id,
        fecha_limite_postulacion,
        tarifa_ofrecida
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id_publicacion
    `, [
      cargoId,
      publication.rutaId,
      publication.fechaLimitePostulacion,
      publication.tarifaOfrecida,
    ])

    return findPublicationById(client, publicationResult.rows[0].id_publicacion)
  })
}

export async function updatePublication(id, publication, clienteId) {
  return withTransaction(async (client) => {
    const existingResult = await client.query(`
      SELECT carga_id
      FROM publicacion_carga
      FROM publicacion_carga AS pc
      INNER JOIN carga AS c ON c.id_carga = pc.carga_id
      WHERE pc.id_publicacion = $1 AND c.cliente_id = $2
      FOR UPDATE OF pc
    `, [id, clienteId])

    if (existingResult.rowCount === 0) return null

    await client.query(`
      UPDATE carga
      SET
        tipo_carga_id = $1,
        descripcion = $2,
        peso_kg = $3,
        volumen_m3 = $4,
        valor_declarado = $5
      WHERE id_carga = $6
    `, [
      publication.tipoCargaId,
      publication.descripcion,
      publication.pesoKg,
      publication.volumenM3,
      publication.valorDeclarado,
      existingResult.rows[0].carga_id,
    ])

    await client.query(`
      UPDATE publicacion_carga
      SET
        ruta_id = $1,
        fecha_limite_postulacion = $2,
        tarifa_ofrecida = $3,
        estado = $4
      WHERE id_publicacion = $5
    `, [
      publication.rutaId,
      publication.fechaLimitePostulacion,
      publication.tarifaOfrecida,
      publication.estado,
      id,
    ])

    return findPublicationById(client, id)
  })
}
