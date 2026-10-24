import { pool } from '../db/pool.js'

const CARRIER_SELECT = `
  SELECT t.id_transportista,
    COALESCE(ch.nombre_completo, t.razon_social) AS nombre,
    COALESCE(ch.rut, t.rut_empresa) AS rut,
    t.rut_empresa,
    t.razon_social,
    t.email,
    t.telefono,
    t.activo,
    t.estado_verificacion,
    t.motivo_revision,
    t.fecha_registro,
    ch.licencia_conducir,
    ch.fecha_vencimiento_licencia,
    ch.chofer_telefono,
    ca.id_camion,
    ca.patente,
    ca.marca,
    ca.modelo,
    ca.tipo_vehiculo,
    ca.anio,
    ca.capacidad_kg,
    ca.capacidad_m3,
    (ch.fecha_vencimiento_licencia >= CURRENT_DATE) AS licencia_vigente,
    EXISTS (
      SELECT 1
      FROM match AS m
      INNER JOIN viaje AS v ON v.match_id = m.id_match
      INNER JOIN postulacion AS p ON p.id_postulacion = m.postulacion_id
      WHERE p.transportista_id = t.id_transportista AND v.estado = 'En Progreso'
    ) AS en_ruta
  FROM transportista AS t
  LEFT JOIN LATERAL (
    SELECT id_chofer, rut, nombre_completo, licencia_conducir,
      fecha_vencimiento_licencia, telefono AS chofer_telefono
    FROM chofer
    WHERE transportista_id = t.id_transportista
    ORDER BY id_chofer
    LIMIT 1
  ) AS ch ON TRUE
  LEFT JOIN LATERAL (
    SELECT id_camion, patente, marca, modelo, tipo_vehiculo, anio,
      capacidad_kg, capacidad_m3
    FROM camion
    WHERE transportista_id = t.id_transportista
    ORDER BY id_camion
    LIMIT 1
  ) AS ca ON TRUE
`

function mapCarrier(row) {
  const estado = row.estado_verificacion === 'Rechazado'
    ? 'Rechazado'
    : !row.activo ? 'Suspendido' : row.estado_verificacion
  const vehiculo = [row.marca, row.modelo].filter(Boolean).join(' ')

  return {
    id: row.id_transportista,
    nombre: row.nombre,
    rut: row.rut,
    patente: row.patente || '—',
    vehiculo: vehiculo || row.tipo_vehiculo || '—',
    telefono: row.chofer_telefono || row.telefono,
    email: row.email,
    estado,
    enRuta: row.en_ruta,
    fechaRegistro: row.fecha_registro,
    motivoRevision: row.motivo_revision,
    licencia: row.licencia_conducir,
    vencimientoLicencia: row.fecha_vencimiento_licencia,
    licenciaVigente: Boolean(row.licencia_vigente),
    empresaRut: row.rut_empresa,
    empresa: row.razon_social,
    anio: row.anio,
    capacidadKg: row.capacidad_kg == null ? null : Number(row.capacidad_kg),
    capacidadM3: row.capacidad_m3 == null ? null : Number(row.capacidad_m3),
  }
}

async function findCarriers(where = '', params = []) {
  const { rows } = await pool.query(`${CARRIER_SELECT} ${where}`, params)
  return rows
}

export async function getCarrierVerification(transportistaId) {
  if (!transportistaId) return null
  const { rows } = await pool.query(`
    SELECT activo, estado_verificacion, motivo_revision
    FROM transportista
    WHERE id_transportista = $1
  `, [transportistaId])
  return rows[0] ?? null
}

export async function getAdminSummary() {
  const [counts, pending, activity] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM transportista WHERE estado_verificacion = 'Pendiente') AS solicitudes_pendientes,
        (SELECT COUNT(*)::int FROM transportista WHERE estado_verificacion = 'Verificado' AND activo = TRUE) AS camioneros_verificados,
        (SELECT COUNT(*)::int FROM viaje WHERE estado = 'En Progreso') AS fletes_activos,
        (SELECT COALESCE(SUM(total_cliente), 0)::numeric FROM pago WHERE estado = 'Retenido') AS pagos_retenidos
    `),
    findCarriers(`WHERE t.estado_verificacion = 'Pendiente' ORDER BY t.fecha_registro ASC`),
    pool.query(`
      SELECT texto, fecha
      FROM (
        SELECT 'Nueva cuenta transportista: ' || COALESCE(ch.nombre_completo, t.razon_social) AS texto,
          t.fecha_registro AS fecha
        FROM transportista AS t
        LEFT JOIN LATERAL (
          SELECT nombre_completo FROM chofer
          WHERE transportista_id = t.id_transportista
          ORDER BY id_chofer LIMIT 1
        ) AS ch ON TRUE
        UNION ALL
        SELECT 'Viaje ' || v.id_viaje || ' · ' || v.estado AS texto,
          COALESCE(v.fecha_fin, v.fecha_inicio) AS fecha
        FROM viaje AS v
      ) AS eventos
      ORDER BY fecha DESC
      LIMIT 5
    `),
  ])

  const summary = counts.rows[0]
  return {
    solicitudesPendientes: summary.solicitudes_pendientes,
    camionerosVerificados: summary.camioneros_verificados,
    fletesActivos: summary.fletes_activos,
    pagosRetenidos: Number(summary.pagos_retenidos),
    verificacionesPendientes: pending.map(mapCarrier),
    actividadReciente: activity.rows.map((item) => ({
      texto: item.texto,
      hace: new Intl.RelativeTimeFormat('es-CL', { numeric: 'auto' })
        .format(-Math.floor((Date.now() - new Date(item.fecha).getTime()) / 3600000), 'hour'),
    })),
  }
}

export async function getActiveAdminJourneys() {
  const { rows } = await pool.query(`
    SELECT
      v.id_viaje,
      v.fecha_inicio,
      r.origen,
      r.destino,
      c.descripcion AS carga,
      ch.nombre_completo AS chofer,
      t.razon_social AS transportista,
      ca.patente
    FROM viaje AS v
    INNER JOIN match AS m ON m.id_match = v.match_id
    INNER JOIN postulacion AS po ON po.id_postulacion = m.postulacion_id
    INNER JOIN publicacion_carga AS pc ON pc.id_publicacion = po.publicacion_id
    INNER JOIN carga AS c ON c.id_carga = pc.carga_id
    INNER JOIN ruta AS r ON r.id_ruta = pc.ruta_id
    INNER JOIN chofer AS ch ON ch.id_chofer = m.chofer_id
    INNER JOIN camion AS ca ON ca.id_camion = m.camion_id
    INNER JOIN transportista AS t ON t.id_transportista = ca.transportista_id
    WHERE v.estado = 'En Progreso'
    ORDER BY v.fecha_inicio DESC, v.id_viaje DESC
  `)

  return rows.map((row) => ({
    id: row.id_viaje,
    fechaInicio: row.fecha_inicio,
    origen: row.origen,
    destino: row.destino,
    carga: row.carga,
    chofer: row.chofer,
    transportista: row.transportista,
    patente: row.patente,
  }))
}

export async function getVerificationRequests() {
  const rows = await findCarriers(`
    WHERE t.estado_verificacion = 'Pendiente'
    ORDER BY t.fecha_registro ASC, t.id_transportista ASC
  `)
  return rows.map(mapCarrier)
}

export async function getVerificationDetails(transportistaId) {
  const rows = await findCarriers('WHERE t.id_transportista = $1', [transportistaId])
  const row = rows[0]
  if (!row) return null

  return {
    id: row.id_transportista,
    nombre: row.nombre,
    rut: row.rut,
    email: row.email,
    telefono: row.telefono,
    empresa: row.razon_social,
    empresaRut: row.rut_empresa,
    licencia: row.licencia_conducir,
    vencimientoLicencia: row.fecha_vencimiento_licencia,
    licenciaVigente: Boolean(row.licencia_vigente),
    patente: row.patente,
    vehiculo: [row.marca, row.modelo].filter(Boolean).join(' ') || row.tipo_vehiculo,
    tipoVehiculo: row.tipo_vehiculo,
    anio: row.anio,
    capacidadKg: row.capacidad_kg == null ? null : Number(row.capacidad_kg),
    capacidadM3: row.capacidad_m3 == null ? null : Number(row.capacidad_m3),
    estado: row.estado_verificacion,
    motivoRevision: row.motivo_revision,
    fechaRegistro: row.fecha_registro,
  }
}

export async function reviewCarrier(transportistaId, decision, reason = null) {
  const { rows } = await pool.query(`
    UPDATE transportista
    SET estado_verificacion = $2::varchar,
      motivo_revision = $3,
      fecha_revision = NOW(),
      activo = CASE WHEN $2::varchar = 'Rechazado' THEN FALSE ELSE TRUE END
    WHERE id_transportista = $1
      AND estado_verificacion = 'Pendiente'
    RETURNING id_transportista
  `, [transportistaId, decision, reason])
  return rows.length > 0
}

export async function listAdminCarriers({ search, status, page, pageSize }) {
  const allRows = await findCarriers(
    `WHERE (
      $1 = '' OR
      COALESCE(ch.nombre_completo, t.razon_social) ILIKE '%' || $1 || '%' OR
      COALESCE(ch.rut, t.rut_empresa) ILIKE '%' || $1 || '%' OR
      COALESCE(ca.patente, '') ILIKE '%' || $1 || '%'
    ) AND ${
      status === 'Suspendido'
        ? 't.activo = FALSE'
        : status === 'Todos'
          ? 'TRUE'
          : 't.estado_verificacion = $2'
    }
    ORDER BY t.fecha_registro DESC, t.id_transportista DESC`,
    status === 'Todos' || status === 'Suspendido' ? [search] : [search, status],
  )

  const total = allRows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const items = allRows
    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
    .map(mapCarrier)
  const { rows: stats } = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE estado_verificacion = 'Verificado' AND activo)::int AS verificados,
      COUNT(*) FILTER (WHERE activo = FALSE)::int AS suspendidos,
      COALESCE((
        SELECT COUNT(DISTINCT p.transportista_id)::int
        FROM match AS m
        INNER JOIN viaje AS v ON v.match_id = m.id_match
        INNER JOIN postulacion AS p ON p.id_postulacion = m.postulacion_id
        WHERE v.estado = 'En Progreso'
      ), 0) AS activos,
      COALESCE((
        SELECT AVG(ca.puntaje)::numeric
        FROM calificacion AS ca
      ), 0) AS calificacion_promedio
    FROM transportista
  `)

  return {
    items,
    page: currentPage,
    pageSize,
    total,
    totalPages,
    totalTransportistas: stats[0].total,
    verificados: stats[0].verificados,
    activos: stats[0].activos,
    calificacionPromedio: Number(stats[0].calificacion_promedio),
  }
}

export async function updateAdminCarrier(transportistaId, { status, phone }) {
  const statusUpdate = status === 'Suspendido'
    ? { verificationStatus: null, active: false }
    : { verificationStatus: status, active: status == null ? null : true }
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const { rows } = await client.query(`
      UPDATE transportista
      SET estado_verificacion = COALESCE($2, estado_verificacion),
        activo = COALESCE($3, activo),
        motivo_revision = CASE WHEN $2 = 'Verificado' THEN NULL ELSE motivo_revision END,
        fecha_revision = CASE WHEN $2 IS NULL THEN fecha_revision ELSE NOW() END,
        telefono = COALESCE($4, telefono)
      WHERE id_transportista = $1
      RETURNING id_transportista
    `, [
      transportistaId,
      statusUpdate.verificationStatus ?? null,
      statusUpdate.active,
      phone ?? null,
    ])
    if (rows.length === 0) {
      await client.query('ROLLBACK')
      return null
    }

    if (phone) {
      await client.query(`
        UPDATE chofer
        SET telefono = $2
        WHERE transportista_id = $1
      `, [transportistaId, phone])
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  const [carrier] = await findCarriers('WHERE t.id_transportista = $1', [transportistaId])
  return mapCarrier(carrier)
}

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }

function dateStart(daysAgo) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)
  return date
}

export async function getAdminReport(period) {
  const days = PERIOD_DAYS[period]
  const { rows } = await pool.query(`
    SELECT v.id_viaje,
      COALESCE(v.fecha_fin, v.fecha_inicio)::date AS fecha,
      r.origen || ' → ' || r.destino AS ruta,
      COALESCE(ch.nombre_completo, t.razon_social) AS transportista,
      v.tarifa_final::numeric AS tarifa,
      COALESCE(p.comision, 0)::numeric AS comision,
      COALESCE(p.estado, 'Sin pago') AS estado_pago,
      COALESCE(AVG(cal.puntaje), 0)::numeric AS calificacion,
      COUNT(cal.id_calificacion)::int AS calificaciones
    FROM viaje AS v
    INNER JOIN match AS m ON m.id_match = v.match_id
    INNER JOIN postulacion AS po ON po.id_postulacion = m.postulacion_id
    INNER JOIN transportista AS t ON t.id_transportista = po.transportista_id
    LEFT JOIN LATERAL (
      SELECT nombre_completo FROM chofer
      WHERE transportista_id = t.id_transportista
      ORDER BY id_chofer LIMIT 1
    ) AS ch ON TRUE
    INNER JOIN publicacion_carga AS pc ON pc.id_publicacion = po.publicacion_id
    INNER JOIN ruta AS r ON r.id_ruta = pc.ruta_id
    LEFT JOIN pago AS p ON p.viaje_id = v.id_viaje
    LEFT JOIN calificacion AS cal ON cal.viaje_id = v.id_viaje
    WHERE v.estado = 'Completado'
      AND ($1 = 'all' OR COALESCE(v.fecha_fin, v.fecha_inicio) >= CURRENT_DATE - ($2 * INTERVAL '1 day'))
    GROUP BY v.id_viaje, v.fecha_fin, v.fecha_inicio, r.origen, r.destino,
      ch.nombre_completo, t.razon_social, v.tarifa_final, p.comision, p.estado
    ORDER BY COALESCE(v.fecha_fin, v.fecha_inicio) DESC, v.id_viaje DESC
  `, [period, days ? days * 2 : 0])

  const records = rows.map((row) => ({
    fecha: new Date(row.fecha).toISOString().slice(0, 10),
    viajeId: row.id_viaje,
    ruta: row.ruta,
    transportista: row.transportista,
    tarifa: Number(row.tarifa),
    comision: Number(row.comision),
    estadoPago: row.estado_pago,
    calificacion: Number(row.calificacion),
    calificaciones: row.calificaciones,
  }))
  const cutoff = days ? dateStart(days) : new Date(0)
  const currentRecords = records.filter((record) => new Date(`${record.fecha}T00:00:00`) >= cutoff)
  const previousCutoff = days ? dateStart(days * 2) : new Date(0)
  const previousRecords = days
    ? records.filter((record) => {
      const date = new Date(`${record.fecha}T00:00:00`)
      return date >= previousCutoff && date < cutoff
    })
    : []
  const sum = (list, field) => list.reduce((total, item) => total + item[field], 0)
  const calificacionesCount = sum(currentRecords, 'calificaciones')
  const weightedRatingSum = currentRecords.reduce(
    (total, record) => total + record.calificacion * record.calificaciones,
    0,
  )
  const routeCounts = new Map()
  currentRecords.forEach(({ ruta }) => routeCounts.set(ruta, (routeCounts.get(ruta) || 0) + 1))
  const weekly = Array.from({ length: 4 }, (_, index) => {
    const end = dateStart((3 - index) * 7)
    const start = dateStart((4 - index) * 7)
    return {
      semana: `Sem ${index + 1}`,
      cantidad: currentRecords.filter((record) => {
        const date = new Date(`${record.fecha}T00:00:00`)
        return date >= start && date < end
      }).length,
    }
  })

  return {
    periodo: period,
    fletesCompletados: currentRecords.length,
    cambioFletes: days ? currentRecords.length - previousRecords.length : null,
    pagosRetenidos: sum(currentRecords.filter((record) => record.estadoPago === 'Retenido'), 'tarifa'),
    comisiones: sum(currentRecords, 'comision'),
    calificacionPromedio: calificacionesCount ? weightedRatingSum / calificacionesCount : 0,
    calificacionesCount,
    fletesPorSemana: weekly,
    rutasFrecuentes: [...routeCounts.entries()]
      .map(([ruta, cantidad]) => ({ ruta, cantidad }))
      .sort((left, right) => right.cantidad - left.cantidad)
      .slice(0, 4),
    registros: currentRecords,
  }
}
