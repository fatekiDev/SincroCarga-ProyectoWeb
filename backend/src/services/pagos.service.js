import {
  createSimulatedPayment as createSimulatedPaymentRecord,
  findCurrentPaymentContext,
  retainSimulatedPayment,
} from '../models/pago.model.js'

const IVA_PERCENT = 19
const DEFAULT_COMMISSION_PERCENT = 10
const PROCESSING_DURATION_MS = 2000

function getCommissionPercent() {
  const percent = Number(process.env.SINCROCARGA_COMMISSION_PERCENT ?? DEFAULT_COMMISSION_PERCENT)
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new Error('SINCROCARGA_COMMISSION_PERCENT debe ser un porcentaje entre 0 y 100')
  }
  return percent
}

function mapPaymentContext(row) {
  if (!row) return null

  const baseFare = Number(row.pago_tarifa_propuesta ?? row.tarifa_propuesta)
  const commissionPercent = row.id_pago == null
    ? getCommissionPercent()
    : Number(row.comision_porcentaje)
  const commission = row.id_pago == null
    ? Math.round(baseFare * commissionPercent / 100)
    : Number(row.monto_comision)
  const ivaPercent = row.id_pago == null ? IVA_PERCENT : Number(row.iva_porcentaje)
  const iva = row.id_pago == null ? Math.round(commission * ivaPercent / 100) : Number(row.monto_iva)
  const total = row.id_pago == null ? baseFare + commission + iva : Number(row.total_cliente)

  return {
    viaje: {
      id: row.id_viaje,
      estado: row.estado_viaje,
      fechaInicio: row.fecha_inicio,
      carga: row.carga,
      pesoKg: row.peso_kg,
      volumenM3: row.volumen_m3,
      ruta: {
        id: row.id_ruta,
        origen: row.origen,
        destino: row.destino,
        distanciaKm: row.distancia_km,
      },
    },
    conductor: {
      nombre: row.chofer,
      telefono: row.telefono_chofer,
      transportista: row.transportista,
      marca: row.marca,
      modelo: row.modelo,
      patente: row.patente,
    },
    factura: {
      rut: row.rut_facturacion,
      razonSocial: row.razon_social_facturacion,
      email: row.email_facturacion,
    },
    costos: {
      tarifaBase: baseFare,
      comisionPorcentaje: commissionPercent,
      comision: commission,
      ivaPorcentaje: ivaPercent,
      iva,
      total,
    },
    pago: {
      id: row.id_pago ?? null,
      estado: row.estado_pago ?? 'Pendiente',
      modo: 'Demostracion',
      terminosAceptadosEn: row.terminos_aceptados_en ?? null,
      fechaCreacion: row.fecha_pago ?? null,
    },
  }
}

export async function getCurrentPayment(clienteId) {
  let context = await findCurrentPaymentContext(clienteId)
  if (!context) return null

  if (context.estado_pago === 'Procesando' && context.fecha_pago) {
    const elapsed = Date.now() - new Date(context.fecha_pago).getTime()
    if (elapsed >= PROCESSING_DURATION_MS) {
      await retainSimulatedPayment(context.id_pago, clienteId)
      context = await findCurrentPaymentContext(clienteId)
    }
  }

  return mapPaymentContext(context)
}

export async function startSimulatedPayment(viajeId, clienteId) {
  const context = await createSimulatedPaymentRecord(viajeId, clienteId, {
    commissionPercent: getCommissionPercent(),
    ivaPercent: IVA_PERCENT,
  })

  return mapPaymentContext(context)
}