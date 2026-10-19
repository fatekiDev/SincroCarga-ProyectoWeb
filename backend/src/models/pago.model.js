import { pool } from '../db/pool.js'

async function findPaymentContext(client, clienteId, viajeId = null) {
  const { rows } = await client.query(`
    SELECT
      v.id_viaje,
      v.estado AS estado_viaje,
      v.fecha_inicio,
      post.tarifa_propuesta,
      c.descripcion AS carga,
      c.peso_kg,
      c.volumen_m3,
      r.id_ruta,
      r.origen,
      r.destino,
      r.distancia_km,
      ch.nombre_completo AS chofer,
      ch.telefono AS telefono_chofer,
      ca.marca,
      ca.modelo,
      ca.patente,
      t.razon_social AS transportista,
      cli.rut AS rut_facturacion,
      cli.nombre_razon_social AS razon_social_facturacion,
      cli.email AS email_facturacion,
      pay.id_pago,
      pay.estado AS estado_pago,
      pay.tarifa_propuesta AS pago_tarifa_propuesta,
      pay.comision_porcentaje,
      pay.comision AS monto_comision,
      pay.iva_porcentaje,
      pay.iva AS monto_iva,
      pay.total_cliente,
      pay.terminos_aceptados_en,
      pay.fecha_creacion AS fecha_pago
    FROM viaje AS v
    INNER JOIN match AS m ON m.id_match = v.match_id
    INNER JOIN postulacion AS post ON post.id_postulacion = m.postulacion_id
    INNER JOIN publicacion_carga AS pc ON pc.id_publicacion = post.publicacion_id
    INNER JOIN carga AS c ON c.id_carga = pc.carga_id
    INNER JOIN cliente AS cli ON cli.id_cliente = c.cliente_id
    INNER JOIN ruta AS r ON r.id_ruta = pc.ruta_id
    INNER JOIN chofer AS ch ON ch.id_chofer = m.chofer_id
    INNER JOIN camion AS ca ON ca.id_camion = m.camion_id
    INNER JOIN transportista AS t ON t.id_transportista = ca.transportista_id
    LEFT JOIN pago AS pay ON pay.viaje_id = v.id_viaje
    WHERE cli.id_cliente = $1
      AND post.estado = 'Aceptada'
      AND m.estado = 'Confirmado'
      AND v.estado IN ('En Progreso', 'Completado')
      AND ($2::INTEGER IS NULL OR v.id_viaje = $2)
    ORDER BY v.fecha_inicio DESC, v.id_viaje DESC
    LIMIT 1
  `, [clienteId, viajeId])

  return rows[0] ?? null
}

export function findCurrentPaymentContext(clienteId) {
  return findPaymentContext(pool, clienteId)
}

export async function createSimulatedPayment(viajeId, clienteId, {
  commissionPercent,
  ivaPercent,
}) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const journeyResult = await client.query(`
      SELECT v.id_viaje, v.estado, post.tarifa_propuesta
      FROM viaje AS v
      INNER JOIN match AS m ON m.id_match = v.match_id
      INNER JOIN postulacion AS post ON post.id_postulacion = m.postulacion_id
      INNER JOIN publicacion_carga AS pc ON pc.id_publicacion = post.publicacion_id
      INNER JOIN carga AS c ON c.id_carga = pc.carga_id
      WHERE v.id_viaje = $1
        AND c.cliente_id = $2
        AND post.estado = 'Aceptada'
        AND m.estado = 'Confirmado'
        AND v.estado = 'En Progreso'
      FOR UPDATE OF v
    `, [viajeId, clienteId])

    if (journeyResult.rowCount === 0) {
      await client.query('COMMIT')
      return null
    }

    const baseFare = Number(journeyResult.rows[0].tarifa_propuesta)
    const commission = Math.round(baseFare * commissionPercent / 100)
    const iva = Math.round(commission * ivaPercent / 100)
    const total = baseFare + commission + iva
    await client.query(`
      INSERT INTO pago (
        viaje_id,
        cliente_id,
        tarifa_propuesta,
        comision_porcentaje,
        comision,
        iva_porcentaje,
        iva,
        total_cliente,
        estado,
        terminos_aceptados_en
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Procesando', NOW())
      ON CONFLICT (viaje_id) DO NOTHING
    `, [viajeId, clienteId, baseFare, commissionPercent, commission, ivaPercent, iva, total])

    const paymentContext = await findPaymentContext(client, clienteId, viajeId)
    await client.query('COMMIT')
    return paymentContext
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error('Error al revertir el pago de demostración:', rollbackError)
    }
    throw error
  } finally {
    client.release()
  }
}

export async function retainSimulatedPayment(paymentId, clienteId) {
  await pool.query(`
    UPDATE pago
    SET estado = 'Retenido', fecha_retenido = NOW(), fecha_actualizacion = NOW()
    WHERE id_pago = $1
      AND cliente_id = $2
      AND estado = 'Procesando'
      AND fecha_creacion <= NOW() - INTERVAL '2 seconds'
  `, [paymentId, clienteId])
}