import {
  addJourneyIncident,
  confirmJourneyReceipt as confirmJourneyReceiptRecord,
  createJourneyRating as createJourneyRatingRecord,
  findActiveJourneyForClient,
  findLatestJourneyReview,
  findJourneyHistory,
} from '../models/seguimiento.model.js'

const DEMO_STAGE_DURATION_MS = 15_000
const demoStartTimes = new Map()

function createDemoStages(journey) {
  const stages = []
  const crossing = journey.cruce_maritimo

  if (crossing) {
    stages.push(
      { id: 'approach-crossing', label: `En ruta a ${crossing}`, detail: 'Trayecto simulado hacia el cruce marítimo.' },
      {
        id: 'waiting-ferry',
        label: 'Esperando barcaza',
        detail: `La barcaza de ${crossing} aún no inicia el cruce.`,
        durationEstimatedMin: journey.duracion_estimada_min,
      },
      {
        id: 'ferry-crossing',
        label: `Cruce marítimo ${crossing}`,
        detail: 'Cruce marítimo simulado en curso.',
        durationEstimatedMin: journey.duracion_estimada_min,
      },
      { id: 'destination-route', label: `En ruta a ${journey.destino}`, detail: 'Continuación simulada del trayecto.' },
    )
  } else {
    stages.push(
      { id: 'destination-route', label: `En ruta a ${journey.destino}`, detail: 'Trayecto simulado por la ruta seleccionada.' },
      { id: 'near-destination', label: `Llegando a ${journey.destino}`, detail: 'Último tramo del trayecto simulado.' },
    )
  }

  stages.push({ id: 'delivery', label: 'Entrega simulada', detail: 'La simulación llegó al destino; el viaje real no cambia de estado.' })
  return stages
}

function mapHistoryEvent(event) {
  return {
    id: event.id_historial,
    type: event.tipo_evento,
    description: event.descripcion,
    timestamp: event.fecha_evento,
  }
}

function mapDemoStage(stage, index, activeIndex, isCompleted) {
  const status = isCompleted || index < activeIndex
    ? 'done'
    : index === activeIndex ? 'active' : 'pending'

  return { ...stage, status, simulated: true }
}

export async function getActiveJourneyTracking(clienteId) {
  const journey = await findActiveJourneyForClient(clienteId)
  if (!journey) return null

  if (!demoStartTimes.has(journey.id_viaje)) {
    demoStartTimes.set(journey.id_viaje, Date.now())
  }

  const [history, stages] = await Promise.all([
    findJourneyHistory(journey.id_viaje),
    Promise.resolve(createDemoStages(journey)),
  ])
  const elapsed = Date.now() - demoStartTimes.get(journey.id_viaje)
  const totalDuration = stages.length * DEMO_STAGE_DURATION_MS
  const isCompleted = elapsed >= totalDuration
  const activeIndex = Math.min(Math.floor(elapsed / DEMO_STAGE_DURATION_MS), stages.length - 1)
  const progressPercent = Math.min(100, Math.floor((elapsed / totalDuration) * 100))

  return {
    viaje: {
      id: journey.id_viaje,
      estado: journey.estado_viaje,
      fechaInicio: journey.fecha_inicio,
      carga: journey.carga,
      pesoKg: journey.peso_kg,
      volumenM3: journey.volumen_m3,
      valorDeclarado: journey.valor_declarado,
      ruta: {
        id: journey.id_ruta,
        origen: journey.origen,
        destino: journey.destino,
        distanciaKm: journey.distancia_km,
        cruceMaritimo: journey.cruce_maritimo,
        duracionEstimadaMin: journey.duracion_estimada_min,
      },
      conductor: {
        nombre: journey.chofer,
        telefono: journey.telefono_chofer,
        transportista: journey.transportista,
        telefonoTransportista: journey.telefono_transportista,
        marca: journey.marca,
        modelo: journey.modelo,
        patente: journey.patente,
        calificacion: journey.calificacion,
        totalCalificaciones: Number(journey.total_calificaciones),
      },
    },
    historial: history.map(mapHistoryEvent),
    etapas: stages.map((stage, index) => mapDemoStage(stage, index, activeIndex, isCompleted)),
    etapaActual: isCompleted ? 'Entrega simulada' : stages[activeIndex].label,
    progreso: progressPercent,
    completado: isCompleted,
    modoDemostracion: true,
    ultimaActualizacion: new Date().toISOString(),
  }
}

export function reportJourneyIncident(viajeId, clienteId, description) {
  return addJourneyIncident(viajeId, clienteId, description)
}

function mapJourneyReview(journey) {
  if (!journey) return null

  return {
    viaje: {
      id: journey.id_viaje,
      estado: journey.estado_viaje,
      fechaInicio: journey.fecha_inicio,
      fechaFin: journey.fecha_fin,
      carga: journey.carga,
      tipoCargaId: journey.tipo_carga_id,
      pesoKg: journey.peso_kg,
      volumenM3: journey.volumen_m3,
      valorDeclarado: journey.valor_declarado,
      tarifaFinal: Number(journey.tarifa_final),
      tieneIncidencia: journey.tiene_incidencia,
      pago: journey.id_pago == null ? null : {
        estado: journey.estado_pago,
        tarifaBase: Number(journey.tarifa_pagada),
        comisionPorcentaje: Number(journey.comision_porcentaje),
        comision: Number(journey.monto_comision),
        ivaPorcentaje: Number(journey.iva_porcentaje),
        iva: Number(journey.monto_iva),
        totalCliente: Number(journey.total_cliente),
      },
      ruta: {
        id: journey.id_ruta,
        origen: journey.origen,
        destino: journey.destino,
      },
    },
    conductor: {
      nombre: journey.chofer,
      telefono: journey.telefono_chofer,
      transportista: journey.transportista,
      telefonoTransportista: journey.telefono_transportista,
      marca: journey.marca,
      modelo: journey.modelo,
      patente: journey.patente,
    },
    calificacion: journey.id_calificacion == null ? null : {
      id: journey.id_calificacion,
      puntaje: journey.puntaje,
      comentario: journey.comentario_calificacion,
      fecha: journey.fecha_calificacion,
    },
  }
}

export async function getJourneyReview(clienteId) {
  return mapJourneyReview(await findLatestJourneyReview(clienteId))
}

export async function confirmJourneyReceipt(viajeId, clienteId) {
  const result = await confirmJourneyReceiptRecord(viajeId, clienteId)
  if (result?.blockedByIncident || result?.blockedByPayment) return result
  return mapJourneyReview(result)
}

export async function saveJourneyRating(viajeId, clienteId, rating) {
  const result = await createJourneyRatingRecord(viajeId, clienteId, rating)
  if (!result) return null

  return {
    alreadyRated: result.alreadyRated,
    calificacion: {
      id: result.rating.id_calificacion,
      puntaje: result.rating.puntaje,
      comentario: result.rating.comentario,
      fecha: result.rating.fecha_calificacion,
    },
  }
}