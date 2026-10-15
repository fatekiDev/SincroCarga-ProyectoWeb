import {
  confirmJourneyReceipt as confirmJourneyReceiptRecord,
  getActiveJourneyTracking,
  getJourneyReview as getJourneyReviewRecord,
  reportJourneyIncident,
  saveJourneyRating,
} from '../services/seguimiento.service.js'

const ALLOWED_REVIEW_TAGS = new Set(['Puntual', 'Buen trato', 'Carga en buen estado'])

function parseJourneyId(value) {
  const viajeId = Number(value)
  return Number.isSafeInteger(viajeId) && viajeId > 0 ? viajeId : null
}

export async function getActiveTracking(req, res) {
  const tracking = await getActiveJourneyTracking(req.user.cliente_id)
  res.status(200).json({ data: tracking })
}

export async function getJourneyReview(req, res) {
  const review = await getJourneyReviewRecord(req.user.cliente_id)
  res.status(200).json({ data: review })
}

export async function confirmReceipt(req, res) {
  const viajeId = parseJourneyId(req.params.viajeId)
  if (!viajeId) {
    return res.status(400).json({ error: 'El id del viaje debe ser un entero positivo' })
  }

  const review = await confirmJourneyReceiptRecord(viajeId, req.user.cliente_id)
  if (review?.blockedByIncident) {
    return res.status(409).json({
      error: 'Hay un problema reportado. La recepción queda bloqueada hasta resolverlo con soporte.',
    })
  }
  if (review?.blockedByPayment) {
    return res.status(409).json({
      error: 'No hay un pago simulado retenido para este viaje',
    })
  }
  if (!review) {
    return res.status(404).json({ error: 'No se encontró un viaje propio que pueda cerrarse' })
  }

  res.status(200).json({ data: review })
}

export async function createJourneyRating(req, res) {
  const viajeId = parseJourneyId(req.params.viajeId)
  if (!viajeId) {
    return res.status(400).json({ error: 'El id del viaje debe ser un entero positivo' })
  }

  const puntaje = req.body?.puntaje
  const comentario = typeof req.body?.comentario === 'string' ? req.body.comentario.trim() : ''
  const requestedTags = req.body?.etiquetas ?? []
  if (!Number.isInteger(puntaje) || puntaje < 1 || puntaje > 5) {
    return res.status(400).json({
      error: 'Selecciona una puntuación entre 1 y 5 estrellas',
      details: ['puntaje debe ser un entero entre 1 y 5'],
    })
  }
  if (comentario.length > 200) {
    return res.status(400).json({
      error: 'La reseña admite hasta 200 caracteres',
      details: ['comentario debe tener como máximo 200 caracteres'],
    })
  }
  if (!Array.isArray(requestedTags) || requestedTags.some((tag) => !ALLOWED_REVIEW_TAGS.has(tag))) {
    return res.status(400).json({
      error: 'Una o más etiquetas de reseña no son válidas',
      details: ['etiquetas solo admite Puntual, Buen trato y Carga en buen estado'],
    })
  }

  const etiquetas = [...new Set(requestedTags)]
  const comentarioCompleto = [etiquetas.join(' · '), comentario].filter(Boolean).join(' — ') || null
  const result = await saveJourneyRating(viajeId, req.user.cliente_id, {
    puntaje,
    comentario: comentarioCompleto,
  })
  if (!result) {
    return res.status(409).json({ error: 'Confirma la recepción antes de enviar una evaluación' })
  }

  res.status(result.alreadyRated ? 200 : 201).json({ data: result })
}

export async function createTrackingIncident(req, res) {
  const viajeId = parseJourneyId(req.params.viajeId)
  if (!viajeId) {
    return res.status(400).json({ error: 'El id del viaje debe ser un entero positivo' })
  }

  const description = typeof req.body?.descripcion === 'string'
    ? req.body.descripcion.trim()
    : ''
  if (!description || description.length > 500) {
    return res.status(400).json({
      error: 'Describe el problema en un máximo de 500 caracteres',
      details: ['descripcion es obligatoria y debe tener como máximo 500 caracteres'],
    })
  }

  const event = await reportJourneyIncident(viajeId, req.user.cliente_id, description)
  if (!event) {
    return res.status(404).json({ error: 'Viaje activo no encontrado' })
  }

  res.status(201).json({
    data: {
      id: event.id_historial,
      type: event.tipo_evento,
      description: event.descripcion,
      timestamp: event.fecha_evento,
    },
  })
}