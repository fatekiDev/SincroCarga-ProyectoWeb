import { pool } from '../db/pool.js'

function mapPublication(row) {
  if (!row) return null

  return {
    id: row.id_publicacion,
    descripcion: row.descripcion,
    pesoKg: row.peso_kg,
    volumenM3: row.volumen_m3,
    valorDeclarado: row.valor_declarado,
    tipoCargaId: row.tipo_carga_id,
    tipoCarga: row.tipo_carga,
    requiereRefrigeracion: row.requiere_refrigeracion,
    esPeligrosa: row.es_peligrosa,
    rutaId: row.ruta_id,
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
      c.valor_declarado,
      c.tipo_carga_id,
      tc.nombre AS tipo_carga,
      tc.requiere_refrigeracion,
      tc.es_peligrosa,
      pc.ruta_id,
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
    INNER JOIN tipo_carga AS tc ON tc.id_tipo_carga = c.tipo_carga_id
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
      c.valor_declarado,
      c.tipo_carga_id,
      tc.nombre AS tipo_carga,
      tc.requiere_refrigeracion,
      tc.es_peligrosa,
      pc.ruta_id,
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
    INNER JOIN tipo_carga AS tc ON tc.id_tipo_carga = c.tipo_carga_id
    WHERE pc.estado = $1
    ORDER BY pc.fecha_publicacion DESC, pc.id_publicacion DESC
  `, ['Disponible'])

  return rows.map(mapPublication)
}

export async function findPublicationCatalogs() {
  const [cargoTypes, routes] = await Promise.all([
    pool.query(`
      SELECT
        id_tipo_carga AS id,
        nombre,
        requiere_refrigeracion,
        es_peligrosa,
        descripcion
      FROM tipo_carga
      ORDER BY nombre
    `),
    pool.query(`
      SELECT
        r.id_ruta AS id,
        r.origen,
        r.destino,
        r.distancia_km,
        cm.nombre AS cruce_maritimo
      FROM ruta AS r
      LEFT JOIN cruce_maritimo AS cm ON cm.id_cruce = r.cruce_maritimo_id
      ORDER BY r.origen, r.destino
    `),
  ])

  return { tiposCarga: cargoTypes.rows, rutas: routes.rows }
}

export async function findPublicationQuote({ tipoCargaId, rutaId }) {
  const { rows } = await pool.query(`
    SELECT
      r.distancia_km,
      cm.nombre AS cruce_maritimo,
      COALESCE(cm.tarifa_cruce, 0) AS recargo_cruce,
      tr.valor AS tarifa_base
    FROM ruta AS r
    LEFT JOIN cruce_maritimo AS cm ON cm.id_cruce = r.cruce_maritimo_id
    LEFT JOIN tarifa_referencial AS tr
      ON tr.ruta_id = r.id_ruta
      AND tr.tipo_carga_id = $2
      AND tr.fecha_vigencia_desde <= CURRENT_DATE
      AND (tr.fecha_vigencia_hasta IS NULL OR tr.fecha_vigencia_hasta >= CURRENT_DATE)
    WHERE r.id_ruta = $1
    ORDER BY tr.fecha_vigencia_desde DESC NULLS LAST
    LIMIT 1
  `, [rutaId, tipoCargaId])

  if (!rows[0] || rows[0].tarifa_base === null) return null

  const base = Number(rows[0].tarifa_base)
  const crossingFee = Number(rows[0].recargo_cruce)
  return {
    tarifaBase: base,
    recargoCruce: crossingFee,
    tarifaOfrecida: base + crossingFee,
    distanciaKm: Number(rows[0].distancia_km),
    cruceMaritimo: rows[0].cruce_maritimo,
  }
}

export async function findClientPublications(clienteId) {
  const { rows } = await pool.query(`
    SELECT
      pc.id_publicacion,
      c.descripcion,
      c.peso_kg,
      c.volumen_m3,
      c.valor_declarado,
      c.tipo_carga_id,
      tc.nombre AS tipo_carga,
      tc.requiere_refrigeracion,
      tc.es_peligrosa,
      pc.ruta_id,
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
    INNER JOIN tipo_carga AS tc ON tc.id_tipo_carga = c.tipo_carga_id
    WHERE c.cliente_id = $1
    ORDER BY pc.fecha_publicacion DESC, pc.id_publicacion DESC
  `, [clienteId])

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
      SELECT pc.carga_id
      FROM publicacion_carga AS pc
      INNER JOIN carga AS c ON c.id_carga = pc.carga_id
      WHERE pc.id_publicacion = $1
        AND c.cliente_id = $2
        AND pc.estado = 'Disponible'
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
        tarifa_ofrecida = $3
      WHERE id_publicacion = $4
    `, [
      publication.rutaId,
      publication.fechaLimitePostulacion,
      publication.tarifaOfrecida,
      id,
    ])

    return findPublicationById(client, id)
  })
}

export async function cancelClientPublication(id, clienteId) {
  return withTransaction(async (client) => {
    const result = await client.query(`
      UPDATE publicacion_carga AS pc
      SET estado = 'Cancelada'
      FROM carga AS c
      WHERE pc.carga_id = c.id_carga
        AND pc.id_publicacion = $1
        AND c.cliente_id = $2
        AND pc.estado = 'Disponible'
      RETURNING pc.id_publicacion
    `, [id, clienteId])

    if (result.rowCount === 0) return null
    return findPublicationById(client, id)
  })
}
