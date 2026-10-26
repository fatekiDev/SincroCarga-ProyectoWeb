import { pool } from '../db/pool.js'
import { calculatePublicationQuote } from '../services/publicaciones.pricing.js'

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

export async function findPublicationQuote({ tipoCargaId, rutaId, pesoKg, volumenM3 }) {
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
  return calculatePublicationQuote({
    tarifaBase: base,
    recargoCruce: crossingFee,
    distanciaKm: Number(rows[0].distancia_km),
    cruceMaritimo: rows[0].cruce_maritimo,
    pesoKg,
    volumenM3,
  })
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

export async function findPublicationApplications(clienteId, publicacionId) {
  const owner = await pool.query(`
    SELECT 1
    FROM publicacion_carga AS pc
    INNER JOIN carga AS c ON c.id_carga = pc.carga_id
    WHERE pc.id_publicacion = $1
      AND c.cliente_id = $2
  `, [publicacionId, clienteId])

  if (owner.rowCount === 0) return null

  const { rows } = await pool.query(`
    SELECT p.id_postulacion, p.fecha_postulacion, p.tarifa_propuesta,
      p.comentario, p.estado, t.razon_social AS transportista
    FROM postulacion AS p
    INNER JOIN transportista AS t ON t.id_transportista = p.transportista_id
    WHERE p.publicacion_id = $1
      AND p.estado <> 'Retirada'
    ORDER BY p.fecha_postulacion DESC, p.id_postulacion DESC
  `, [publicacionId])

  return rows.map((row) => ({
    id: row.id_postulacion,
    fecha: row.fecha_postulacion,
    tarifaPropuesta: Number(row.tarifa_propuesta),
    comentario: row.comentario,
    estado: row.estado,
    transportista: row.transportista,
  }))
}

export async function acceptApplication(clienteId, publicacionId, postulacionId) {
  try {
    return await withTransaction(async (client) => {
      const publication = await client.query(`
        SELECT pc.estado, c.peso_kg, c.volumen_m3
        FROM publicacion_carga AS pc
        INNER JOIN carga AS c ON c.id_carga = pc.carga_id
        WHERE pc.id_publicacion = $1
          AND c.cliente_id = $2
        FOR UPDATE OF pc
      `, [publicacionId, clienteId])

      if (!publication.rows[0]) return { notFound: true }
      if (publication.rows[0].estado !== 'Disponible') return { unavailable: true }

      const application = await client.query(`
        SELECT transportista_id, tarifa_propuesta
        FROM postulacion
        WHERE id_postulacion = $1
          AND publicacion_id = $2
          AND estado = 'Pendiente'
        FOR UPDATE
      `, [postulacionId, publicacionId])

      if (!application.rows[0]) return { notFound: true }

      const { transportista_id: transportistaId, tarifa_propuesta: tarifa } = application.rows[0]

      const truck = await client.query(`
        SELECT ca.id_camion
        FROM camion AS ca
        WHERE ca.transportista_id = $1
          AND ca.activo = TRUE
          AND ca.capacidad_kg >= $2
          AND ca.capacidad_m3 >= $3
          AND NOT EXISTS (
            SELECT 1 FROM viaje AS v
            WHERE v.camion_id_actual = ca.id_camion
              AND v.estado <> 'Cancelado'
              AND COALESCE(v.fecha_fin, 'infinity'::timestamp) > NOW()
          )
        ORDER BY ca.capacidad_kg ASC, ca.id_camion ASC
        LIMIT 1
      `, [transportistaId, publication.rows[0].peso_kg, publication.rows[0].volumen_m3])

      const driver = await client.query(`
        SELECT ch.id_chofer
        FROM chofer AS ch
        WHERE ch.transportista_id = $1
          AND ch.activo = TRUE
          AND ch.fecha_vencimiento_licencia >= CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM viaje AS v
            WHERE v.chofer_id_actual = ch.id_chofer
              AND v.estado <> 'Cancelado'
              AND COALESCE(v.fecha_fin, 'infinity'::timestamp) > NOW()
          )
        ORDER BY ch.id_chofer ASC
        LIMIT 1
      `, [transportistaId])

      if (!truck.rows[0] || !driver.rows[0]) return { noResources: true }

      await client.query(
        `UPDATE postulacion SET estado = 'Aceptada' WHERE id_postulacion = $1`,
        [postulacionId],
      )

      await client.query(`
        UPDATE postulacion
        SET estado = 'Rechazada'
        WHERE publicacion_id = $1
          AND id_postulacion <> $2
          AND estado = 'Pendiente'
      `, [publicacionId, postulacionId])

      const match = await client.query(`
        INSERT INTO match (postulacion_id, camion_id, chofer_id)
        VALUES ($1, $2, $3)
        RETURNING id_match
      `, [postulacionId, truck.rows[0].id_camion, driver.rows[0].id_chofer])

      const journey = await client.query(`
        INSERT INTO viaje (match_id, fecha_inicio, tarifa_final)
        VALUES ($1, NOW(), $2)
        RETURNING id_viaje
      `, [match.rows[0].id_match, tarifa])

      await client.query(
        `UPDATE publicacion_carga SET estado = 'Asignada' WHERE id_publicacion = $1`,
        [publicacionId],
      )

      return { viajeId: journey.rows[0].id_viaje }
    })
  } catch (error) {
    if (error.code === '23P01') return { noResources: true }
    throw error
  }
}

