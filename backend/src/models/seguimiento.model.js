import { pool } from '../db/pool.js'

export async function findActiveJourneyForClient(clienteId) {
  const { rows } = await pool.query(`
    SELECT
      v.id_viaje,
      v.estado AS estado_viaje,
      v.fecha_inicio,
      c.descripcion AS carga,
      c.peso_kg,
      c.volumen_m3,
      c.valor_declarado,
      r.id_ruta,
      r.origen,
      r.destino,
      r.distancia_km,
      cm.nombre AS cruce_maritimo,
      cm.duracion_estimada_min,
      ch.nombre_completo AS chofer,
      ch.telefono AS telefono_chofer,
      ca.marca,
      ca.modelo,
      ca.patente,
      t.razon_social AS transportista,
      t.telefono AS telefono_transportista,
      (
        SELECT ROUND(AVG(cal.puntaje), 1)
        FROM calificacion AS cal
        WHERE cal.viaje_id = v.id_viaje AND cal.emisor = 'Cliente'
      ) AS calificacion,
      (
        SELECT COUNT(*)
        FROM calificacion AS cal
        WHERE cal.viaje_id = v.id_viaje AND cal.emisor = 'Cliente'
      ) AS total_calificaciones
    FROM viaje AS v
    INNER JOIN match AS m ON m.id_match = v.match_id
    INNER JOIN postulacion AS p ON p.id_postulacion = m.postulacion_id
    INNER JOIN publicacion_carga AS pc ON pc.id_publicacion = p.publicacion_id
    INNER JOIN carga AS c ON c.id_carga = pc.carga_id
    INNER JOIN cliente AS cli ON cli.id_cliente = c.cliente_id
    INNER JOIN ruta AS r ON r.id_ruta = pc.ruta_id
    INNER JOIN chofer AS ch ON ch.id_chofer = m.chofer_id
    INNER JOIN camion AS ca ON ca.id_camion = m.camion_id
    INNER JOIN transportista AS t ON t.id_transportista = ca.transportista_id
    LEFT JOIN cruce_maritimo AS cm ON cm.id_cruce = r.cruce_maritimo_id
    WHERE cli.id_cliente = $1 AND v.estado = 'En Progreso'
    ORDER BY v.fecha_inicio DESC, v.id_viaje DESC
    LIMIT 1
  `, [clienteId])

  return rows[0] ?? null
}

export async function findJourneyHistory(viajeId) {
  const { rows } = await pool.query(`
    SELECT id_historial, tipo_evento, descripcion, fecha_evento
    FROM historial_cumplimiento
    WHERE viaje_id = $1
    ORDER BY fecha_evento ASC, id_historial ASC
  `, [viajeId])

  return rows
}

export async function addJourneyIncident(viajeId, clienteId, description) {
  const { rows } = await pool.query(`
    INSERT INTO historial_cumplimiento (viaje_id, tipo_evento, descripcion)
    SELECT v.id_viaje, 'Incidencia', $3
    FROM viaje AS v
    INNER JOIN match AS m ON m.id_match = v.match_id
    INNER JOIN postulacion AS p ON p.id_postulacion = m.postulacion_id
    INNER JOIN publicacion_carga AS pc ON pc.id_publicacion = p.publicacion_id
    INNER JOIN carga AS c ON c.id_carga = pc.carga_id
    WHERE v.id_viaje = $1
      AND c.cliente_id = $2
      AND v.estado = 'En Progreso'
    RETURNING id_historial, tipo_evento, descripcion, fecha_evento
  `, [viajeId, clienteId, description])

  return rows[0] ?? null
}

async function selectJourneyReview(client, clienteId, viajeId = null) {
  const { rows } = await client.query(`
    SELECT
      v.id_viaje,
      v.estado AS estado_viaje,
      v.fecha_inicio,
      v.fecha_fin,
      v.tarifa_final,
      c.descripcion AS carga,
      c.tipo_carga_id,
      c.peso_kg,
      c.volumen_m3,
      c.valor_declarado,
      r.id_ruta,
      r.origen,
      r.destino,
      ch.nombre_completo AS chofer,
      ch.telefono AS telefono_chofer,
      ca.marca,
      ca.modelo,
      ca.patente,
      t.razon_social AS transportista,
      t.telefono AS telefono_transportista,
      rating.id_calificacion,
      rating.puntaje,
      rating.comentario AS comentario_calificacion,
      rating.fecha_calificacion,
      pay.id_pago,
      pay.estado AS estado_pago,
      pay.tarifa_propuesta AS tarifa_pagada,
      pay.comision_porcentaje,
      pay.comision AS monto_comision,
      pay.iva_porcentaje,
      pay.iva AS monto_iva,
      pay.total_cliente,
      EXISTS (
        SELECT 1
        FROM historial_cumplimiento AS issue
        WHERE issue.viaje_id = v.id_viaje AND issue.tipo_evento = 'Incidencia'
      ) AS tiene_incidencia
    FROM viaje AS v
    INNER JOIN match AS m ON m.id_match = v.match_id
    INNER JOIN postulacion AS p ON p.id_postulacion = m.postulacion_id
    INNER JOIN publicacion_carga AS pc ON pc.id_publicacion = p.publicacion_id
    INNER JOIN carga AS c ON c.id_carga = pc.carga_id
    INNER JOIN cliente AS cli ON cli.id_cliente = c.cliente_id
    INNER JOIN ruta AS r ON r.id_ruta = pc.ruta_id
    INNER JOIN chofer AS ch ON ch.id_chofer = m.chofer_id
    INNER JOIN camion AS ca ON ca.id_camion = m.camion_id
    INNER JOIN transportista AS t ON t.id_transportista = ca.transportista_id
    LEFT JOIN pago AS pay ON pay.viaje_id = v.id_viaje
    LEFT JOIN LATERAL (
      SELECT id_calificacion, puntaje, comentario, fecha_calificacion
      FROM calificacion
      WHERE viaje_id = v.id_viaje AND emisor = 'Cliente'
      ORDER BY fecha_calificacion DESC, id_calificacion DESC
      LIMIT 1
    ) AS rating ON TRUE
    WHERE cli.id_cliente = $1
      AND v.estado IN ('En Progreso', 'Completado')
      AND ($2::INTEGER IS NULL OR v.id_viaje = $2)
    ORDER BY v.fecha_inicio DESC, v.id_viaje DESC
    LIMIT 1
  `, [clienteId, viajeId])

  return rows[0] ?? null
}

export function findLatestJourneyReview(clienteId) {
  return selectJourneyReview(pool, clienteId)
}

export async function confirmJourneyReceipt(viajeId, clienteId) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await client.query(`
      SELECT
        v.estado,
        pay.estado AS estado_pago,
        EXISTS (
          SELECT 1
          FROM historial_cumplimiento AS issue
          WHERE issue.viaje_id = v.id_viaje AND issue.tipo_evento = 'Incidencia'
        ) AS tiene_incidencia
      FROM viaje AS v
      INNER JOIN match AS m ON m.id_match = v.match_id
      INNER JOIN postulacion AS p ON p.id_postulacion = m.postulacion_id
      INNER JOIN publicacion_carga AS pc ON pc.id_publicacion = p.publicacion_id
      INNER JOIN carga AS c ON c.id_carga = pc.carga_id
      LEFT JOIN pago AS pay ON pay.viaje_id = v.id_viaje
      WHERE v.id_viaje = $1 AND c.cliente_id = $2
      FOR UPDATE OF v
    `, [viajeId, clienteId])

    if (result.rowCount === 0) {
      await client.query('COMMIT')
      return null
    }

    if (result.rows[0].estado === 'En Progreso' && result.rows[0].tiene_incidencia) {
      await client.query('COMMIT')
      return { blockedByIncident: true }
    }

    if (result.rows[0].estado === 'En Progreso' && result.rows[0].estado_pago !== 'Retenido') {
      await client.query('COMMIT')
      return { blockedByPayment: true }
    }

    if (result.rows[0].estado === 'En Progreso') {
      await client.query(`
        UPDATE viaje
        SET estado = 'Completado', fecha_fin = COALESCE(fecha_fin, NOW())
        WHERE id_viaje = $1
      `, [viajeId])
      await client.query(`
        INSERT INTO historial_cumplimiento (viaje_id, tipo_evento, descripcion)
        VALUES ($1, 'Entrega completada', 'Recepción confirmada por el cliente')
      `, [viajeId])
      await client.query(`
        UPDATE pago
        SET estado = 'Liberado', fecha_liberado = NOW(), fecha_actualizacion = NOW()
        WHERE viaje_id = $1 AND estado = 'Retenido'
      `, [viajeId])
    } else if (result.rows[0].estado !== 'Completado') {
      await client.query('COMMIT')
      return null
    }

    const journey = await selectJourneyReview(client, clienteId, viajeId)
    await client.query('COMMIT')
    return journey
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error('Error al revertir la confirmación de entrega:', rollbackError)
    }
    throw error
  } finally {
    client.release()
  }
}

export async function createJourneyRating(viajeId, clienteId, { puntaje, comentario }) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const journeyResult = await client.query(`
      SELECT v.estado
      FROM viaje AS v
      INNER JOIN match AS m ON m.id_match = v.match_id
      INNER JOIN postulacion AS p ON p.id_postulacion = m.postulacion_id
      INNER JOIN publicacion_carga AS pc ON pc.id_publicacion = p.publicacion_id
      INNER JOIN carga AS c ON c.id_carga = pc.carga_id
      WHERE v.id_viaje = $1 AND c.cliente_id = $2
      FOR UPDATE OF v
    `, [viajeId, clienteId])

    if (journeyResult.rowCount === 0 || journeyResult.rows[0].estado !== 'Completado') {
      await client.query('COMMIT')
      return null
    }

    const existingResult = await client.query(`
      SELECT id_calificacion, puntaje, comentario, fecha_calificacion
      FROM calificacion
      WHERE viaje_id = $1 AND emisor = 'Cliente'
      ORDER BY fecha_calificacion DESC, id_calificacion DESC
      LIMIT 1
    `, [viajeId])

    if (existingResult.rows[0]) {
      await client.query('COMMIT')
      return { rating: existingResult.rows[0], alreadyRated: true }
    }

    const ratingResult = await client.query(`
      INSERT INTO calificacion (viaje_id, emisor, puntaje, comentario)
      VALUES ($1, 'Cliente', $2, $3)
      RETURNING id_calificacion, puntaje, comentario, fecha_calificacion
    `, [viajeId, puntaje, comentario])

    await client.query('COMMIT')
    return { rating: ratingResult.rows[0], alreadyRated: false }
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error('Error al revertir la calificación del viaje:', rollbackError)
    }
    throw error
  } finally {
    client.release()
  }
}