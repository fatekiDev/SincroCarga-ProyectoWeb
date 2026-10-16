import { pool } from '../db/pool.js'

function mapRoute(row) {
  return {
    id: row.id_ruta,
    origen: row.origen,
    destino: row.destino,
    distanciaKm: Number(row.distancia_km),
    cruceMaritimo: row.cruce_maritimo,
    duracionEstimadaMin: row.duracion_estimada_min,
  }
}

function mapApplication(row) {
  return {
    id: row.id_postulacion,
    fecha: row.fecha_postulacion,
    tarifaPropuesta: Number(row.tarifa_propuesta),
    comentario: row.comentario,
    estado: row.estado,
    publicacionId: row.publicacion_id,
    carga: row.descripcion,
    tipoCarga: row.tipo_carga,
    pesoKg: Number(row.peso_kg),
    volumenM3: Number(row.volumen_m3),
    ruta: mapRoute(row),
    viaje: row.id_viaje == null ? null : {
      id: row.id_viaje,
      estado: row.estado_viaje,
      fechaInicio: row.fecha_inicio,
      fechaFin: row.fecha_fin,
    },
  }
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
      console.error('Error al revertir la transacción del transportista:', rollbackError)
    }
    throw error
  } finally {
    client.release()
  }
}

export async function findCarrierCatalogs(transportistaId) {
  const [routes, trucks] = await Promise.all([
    pool.query(`
      SELECT r.id_ruta, r.origen, r.destino, r.distancia_km,
        cm.nombre AS cruce_maritimo, cm.duracion_estimada_min
      FROM ruta AS r
      LEFT JOIN cruce_maritimo AS cm ON cm.id_cruce = r.cruce_maritimo_id
      ORDER BY r.origen, r.destino
    `),
    pool.query(`
      SELECT id_camion, patente, marca, modelo, capacidad_kg, capacidad_m3
      FROM camion
      WHERE transportista_id = $1 AND activo = TRUE
      ORDER BY patente
    `, [transportistaId]),
  ])

  return {
    rutas: routes.rows.map(mapRoute),
    camiones: trucks.rows.map((truck) => ({
      id: truck.id_camion,
      patente: truck.patente,
      vehiculo: [truck.marca, truck.modelo].filter(Boolean).join(' '),
      capacidadKg: Number(truck.capacidad_kg),
      capacidadM3: Number(truck.capacidad_m3),
    })),
  }
}

export async function findAvailableLoads(transportistaId) {
  const { rows } = await pool.query(`
    SELECT pc.id_publicacion, pc.tarifa_ofrecida, pc.fecha_limite_postulacion,
      c.descripcion, c.peso_kg, c.volumen_m3, c.tipo_carga_id, tc.nombre AS tipo_carga,
      tc.requiere_refrigeracion, tc.es_peligrosa,
      r.id_ruta, r.origen, r.destino, r.distancia_km,
      cm.nombre AS cruce_maritimo, cm.duracion_estimada_min,
      EXISTS (
        SELECT 1 FROM camion AS ca
        WHERE ca.transportista_id = $1 AND ca.activo = TRUE
          AND ca.capacidad_kg >= c.peso_kg AND ca.capacidad_m3 >= c.volumen_m3
      ) AS tiene_camion_compatible,
      EXISTS (
        SELECT 1 FROM chofer AS ch
        WHERE ch.transportista_id = $1 AND ch.activo = TRUE
          AND ch.fecha_vencimiento_licencia >= CURRENT_DATE
      ) AS tiene_licencia_vigente
    FROM publicacion_carga AS pc
    INNER JOIN carga AS c ON c.id_carga = pc.carga_id
    INNER JOIN tipo_carga AS tc ON tc.id_tipo_carga = c.tipo_carga_id
    INNER JOIN ruta AS r ON r.id_ruta = pc.ruta_id
    LEFT JOIN cruce_maritimo AS cm ON cm.id_cruce = r.cruce_maritimo_id
    WHERE pc.estado = 'Disponible'
      AND pc.fecha_limite_postulacion >= CURRENT_DATE
      AND NOT EXISTS (
        SELECT 1 FROM postulacion AS p
        WHERE p.publicacion_id = pc.id_publicacion
          AND p.transportista_id = $1
          AND p.estado <> 'Retirada'
      )
    ORDER BY pc.fecha_limite_postulacion, pc.fecha_publicacion DESC
  `, [transportistaId])

  return rows.map((row) => ({
    id: row.id_publicacion,
    tarifaOfrecida: Number(row.tarifa_ofrecida),
    fechaLimitePostulacion: row.fecha_limite_postulacion,
    carga: row.descripcion,
    tipoCarga: row.tipo_carga,
    tipoCargaId: row.tipo_carga_id,
    pesoKg: Number(row.peso_kg),
    volumenM3: Number(row.volumen_m3),
    requiereRefrigeracion: row.requiere_refrigeracion,
    esPeligrosa: row.es_peligrosa,
    ruta: mapRoute(row),
    puedePostular: row.tiene_camion_compatible && row.tiene_licencia_vigente,
    tieneCamionCompatible: row.tiene_camion_compatible,
    tieneLicenciaVigente: row.tiene_licencia_vigente,
  }))
}

const APPLICATION_QUERY = `
  SELECT p.id_postulacion, p.fecha_postulacion, p.tarifa_propuesta, p.comentario, p.estado,
    pc.id_publicacion AS publicacion_id, c.descripcion, c.peso_kg, c.volumen_m3,
    tc.nombre AS tipo_carga, r.id_ruta, r.origen, r.destino, r.distancia_km,
    cm.nombre AS cruce_maritimo, cm.duracion_estimada_min,
    v.id_viaje, v.estado AS estado_viaje, v.fecha_inicio, v.fecha_fin
  FROM postulacion AS p
  INNER JOIN publicacion_carga AS pc ON pc.id_publicacion = p.publicacion_id
  INNER JOIN carga AS c ON c.id_carga = pc.carga_id
  INNER JOIN tipo_carga AS tc ON tc.id_tipo_carga = c.tipo_carga_id
  INNER JOIN ruta AS r ON r.id_ruta = pc.ruta_id
  LEFT JOIN cruce_maritimo AS cm ON cm.id_cruce = r.cruce_maritimo_id
  LEFT JOIN match AS m ON m.postulacion_id = p.id_postulacion
  LEFT JOIN viaje AS v ON v.match_id = m.id_match
`

export async function findCarrierApplications(transportistaId) {
  const { rows } = await pool.query(`${APPLICATION_QUERY}
    WHERE p.transportista_id = $1
    ORDER BY p.fecha_postulacion DESC, p.id_postulacion DESC
  `, [transportistaId])

  return rows.map(mapApplication)
}

export async function createCarrierApplication(transportistaId, application) {
  return withTransaction(async (client) => {
    const publication = await client.query(`
      SELECT pc.id_publicacion, pc.estado, pc.fecha_limite_postulacion, c.peso_kg, c.volumen_m3
      FROM publicacion_carga AS pc
      INNER JOIN carga AS c ON c.id_carga = pc.carga_id
      WHERE pc.id_publicacion = $1
        AND pc.fecha_limite_postulacion >= CURRENT_DATE
      FOR UPDATE OF pc
    `, [application.publicacionId])
    if (!publication.rows[0] || publication.rows[0].estado !== 'Disponible') {
      return { unavailable: true }
    }

    const eligibility = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM camion
        WHERE transportista_id = $1 AND activo = TRUE
          AND capacidad_kg >= $2 AND capacidad_m3 >= $3
      ) AS truck_available,
      EXISTS (
        SELECT 1 FROM chofer
        WHERE transportista_id = $1 AND activo = TRUE
          AND fecha_vencimiento_licencia >= CURRENT_DATE
      ) AS driver_available
    `, [
      transportistaId,
      publication.rows[0].peso_kg,
      publication.rows[0].volumen_m3,
    ])
    if (!eligibility.rows[0].truck_available || !eligibility.rows[0].driver_available) {
      return { ineligible: true }
    }

    const existing = await client.query(`
      SELECT id_postulacion, estado
      FROM postulacion
      WHERE publicacion_id = $1 AND transportista_id = $2
      FOR UPDATE
    `, [application.publicacionId, transportistaId])
    if (existing.rows[0]) {
      if (existing.rows[0].estado !== 'Retirada') return { unavailable: true }
      await client.query(`
        UPDATE postulacion
        SET estado = 'Pendiente', tarifa_propuesta = $2, comentario = $3,
          fecha_postulacion = NOW()
        WHERE id_postulacion = $1
      `, [
        existing.rows[0].id_postulacion,
        application.tarifaPropuesta,
        application.comentario || null,
      ])
      return { id: existing.rows[0].id_postulacion, reapplied: true }
    }

    const { rows } = await client.query(`
      INSERT INTO postulacion (
        publicacion_id, transportista_id, tarifa_propuesta, comentario
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id_postulacion
    `, [
      application.publicacionId,
      transportistaId,
      application.tarifaPropuesta,
      application.comentario || null,
    ])

    return { id: rows[0].id_postulacion }
  })
}

export async function withdrawCarrierApplication(transportistaId, applicationId) {
  const { rows } = await pool.query(`
    UPDATE postulacion
    SET estado = 'Retirada'
    WHERE id_postulacion = $1
      AND transportista_id = $2
      AND estado = 'Pendiente'
    RETURNING id_postulacion
  `, [applicationId, transportistaId])

  return rows[0] ?? null
}

export async function findCarrierTransportPublications(transportistaId) {
  const { rows } = await pool.query(`
    SELECT pt.id_publicacion_transporte, pt.camion_id, ca.patente, ca.marca, ca.modelo,
      pt.fecha_disponible_desde, pt.fecha_disponible_hasta,
      pt.capacidad_disponible_kg, pt.capacidad_disponible_m3,
      pt.tarifa_referencial_ofrecida, pt.estado,
      r.id_ruta, r.origen, r.destino, r.distancia_km,
      cm.nombre AS cruce_maritimo, cm.duracion_estimada_min
    FROM publicacion_transporte AS pt
    INNER JOIN camion AS ca ON ca.id_camion = pt.camion_id
    INNER JOIN ruta AS r ON r.id_ruta = pt.ruta_id
    LEFT JOIN cruce_maritimo AS cm ON cm.id_cruce = r.cruce_maritimo_id
    WHERE pt.transportista_id = $1
    ORDER BY pt.fecha_publicacion DESC, pt.id_publicacion_transporte DESC
  `, [transportistaId])

  return rows.map((row) => ({
    id: row.id_publicacion_transporte,
    camionId: row.camion_id,
    patente: row.patente,
    vehiculo: [row.marca, row.modelo].filter(Boolean).join(' '),
    fechaDesde: row.fecha_disponible_desde,
    fechaHasta: row.fecha_disponible_hasta,
    capacidadKg: Number(row.capacidad_disponible_kg),
    capacidadM3: Number(row.capacidad_disponible_m3),
    tarifaReferencial: row.tarifa_referencial_ofrecida == null
      ? null
      : Number(row.tarifa_referencial_ofrecida),
    estado: row.estado,
    ruta: mapRoute(row),
  }))
}

export async function createCarrierTransportPublication(transportistaId, publication) {
  const { rows } = await pool.query(`
    INSERT INTO publicacion_transporte (
      transportista_id, camion_id, ruta_id, fecha_disponible_desde,
      fecha_disponible_hasta, capacidad_disponible_kg, capacidad_disponible_m3,
      tarifa_referencial_ofrecida
    )
    SELECT $1, ca.id_camion, r.id_ruta, $4, $5, $6, $7, $8
    FROM camion AS ca
    CROSS JOIN ruta AS r
    WHERE ca.id_camion = $2
      AND ca.transportista_id = $1
      AND ca.activo = TRUE
      AND ca.capacidad_kg >= $6
      AND ca.capacidad_m3 >= $7
      AND r.id_ruta = $3
    RETURNING id_publicacion_transporte
  `, [
    transportistaId,
    publication.camionId,
    publication.rutaId,
    publication.fechaDesde,
    publication.fechaHasta,
    publication.capacidadKg,
    publication.capacidadM3,
    publication.tarifaReferencial,
  ])

  return rows[0] ?? null
}

export async function cancelCarrierTransportPublication(transportistaId, publicationId) {
  const { rows } = await pool.query(`
    UPDATE publicacion_transporte
    SET estado = 'Cancelada'
    WHERE id_publicacion_transporte = $1
      AND transportista_id = $2
      AND estado = 'Disponible'
    RETURNING id_publicacion_transporte
  `, [publicationId, transportistaId])

  return rows[0] ?? null
}

export async function findCarrierJourneys(transportistaId) {
  const { rows } = await pool.query(`
    SELECT v.id_viaje, v.estado, v.fecha_inicio, v.fecha_fin, v.tarifa_final,
      c.descripcion, c.peso_kg, c.volumen_m3,
      r.id_ruta, r.origen, r.destino, r.distancia_km,
      cm.nombre AS cruce_maritimo, cm.duracion_estimada_min,
      ca.patente, ca.marca, ca.modelo
    FROM viaje AS v
    INNER JOIN match AS m ON m.id_match = v.match_id
    INNER JOIN postulacion AS p ON p.id_postulacion = m.postulacion_id
    INNER JOIN publicacion_carga AS pc ON pc.id_publicacion = p.publicacion_id
    INNER JOIN carga AS c ON c.id_carga = pc.carga_id
    INNER JOIN ruta AS r ON r.id_ruta = pc.ruta_id
    INNER JOIN camion AS ca ON ca.id_camion = m.camion_id
    LEFT JOIN cruce_maritimo AS cm ON cm.id_cruce = r.cruce_maritimo_id
    WHERE p.transportista_id = $1
    ORDER BY v.fecha_inicio DESC, v.id_viaje DESC
  `, [transportistaId])

  return rows.map((row) => ({
    id: row.id_viaje,
    estado: row.estado,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin,
    tarifaFinal: Number(row.tarifa_final),
    carga: row.descripcion,
    pesoKg: Number(row.peso_kg),
    volumenM3: Number(row.volumen_m3),
    camion: [row.marca, row.modelo, row.patente].filter(Boolean).join(' · '),
    ruta: mapRoute(row),
  }))
}
