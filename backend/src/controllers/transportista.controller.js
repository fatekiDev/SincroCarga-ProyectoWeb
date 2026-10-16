import {
  cancelCarrierTransportPublication as cancelTransportRecord,
  createCarrierApplication as createApplicationRecord,
  createCarrierTransportPublication as createTransportRecord,
  getAvailableLoads as getAvailableLoadsRecord,
  getCarrierApplications as getCarrierApplicationsRecord,
  getCarrierCatalogs as getCarrierCatalogsRecord,
  getCarrierJourneys as getCarrierJourneysRecord,
  getCarrierTransportPublications as getCarrierTransportPublicationsRecord,
  withdrawCarrierApplication as withdrawApplicationRecord,
} from '../services/transportista.service.js'

function parseId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export async function getCarrierCatalogs(req, res) {
  res.status(200).json({ data: await getCarrierCatalogsRecord(req.user.transportista_id) })
}

export async function getAvailableLoads(req, res) {
  res.status(200).json({ data: await getAvailableLoadsRecord(req.user.transportista_id) })
}

export async function getCarrierApplications(req, res) {
  res.status(200).json({ data: await getCarrierApplicationsRecord(req.user.transportista_id) })
}

export async function createCarrierApplication(req, res) {
  const publicacionId = parseId(req.params.publicacionId)
  const tarifaPropuesta = Number(req.body?.tarifaPropuesta)
  const comentario = req.body?.comentario

  if (!publicacionId) {
    return res.status(400).json({ error: 'La publicación indicada no es válida' })
  }
  if (!Number.isFinite(tarifaPropuesta) || tarifaPropuesta <= 0) {
    return res.status(400).json({ error: 'Ingresa una tarifa propuesta mayor que cero' })
  }
  if (comentario != null && (typeof comentario !== 'string' || comentario.trim().length > 500)) {
    return res.status(400).json({ error: 'El comentario admite hasta 500 caracteres' })
  }

  const result = await createApplicationRecord(req.user.transportista_id, {
    publicacionId,
    tarifaPropuesta,
    comentario: comentario?.trim() || '',
  })
  if (result.unavailable) {
    return res.status(409).json({ error: 'Esta carga ya no está disponible para postular' })
  }
  if (result.ineligible) {
    return res.status(409).json({
      error: 'Necesitas un camión con capacidad suficiente y una licencia de conducir vigente para postular',
    })
  }

  res.status(201).json({ data: result })
}

export async function withdrawCarrierApplication(req, res) {
  const applicationId = parseId(req.params.postulacionId)
  if (!applicationId) {
    return res.status(400).json({ error: 'La postulación indicada no es válida' })
  }

  const result = await withdrawApplicationRecord(req.user.transportista_id, applicationId)
  if (!result) {
    return res.status(409).json({
      error: 'Solo puedes retirar una postulación propia que siga pendiente',
    })
  }

  res.status(200).json({ data: result })
}

export async function getCarrierTransportPublications(req, res) {
  res.status(200).json({
    data: await getCarrierTransportPublicationsRecord(req.user.transportista_id),
  })
}

export async function createCarrierTransportPublication(req, res) {
  const body = req.body
  if (!isRecord(body)) {
    return res.status(400).json({ error: 'Completa los datos del espacio disponible' })
  }

  const camionId = parseId(body.camionId)
  const rutaId = parseId(body.rutaId)
  const capacidadKg = Number(body.capacidadKg)
  const capacidadM3 = Number(body.capacidadM3)
  const tarifaReferencial = body.tarifaReferencial === '' || body.tarifaReferencial == null
    ? null
    : Number(body.tarifaReferencial)

  if (!camionId || !rutaId) {
    return res.status(400).json({ error: 'Selecciona un camión y una ruta válidos' })
  }
  if (!validDate(body.fechaDesde) || !validDate(body.fechaHasta)
    || body.fechaHasta <= body.fechaDesde) {
    return res.status(400).json({ error: 'El período debe tener fechas válidas y una fecha final posterior a la inicial' })
  }
  if (body.fechaDesde < new Date().toISOString().slice(0, 10)) {
    return res.status(400).json({ error: 'La fecha de inicio no puede ser anterior a hoy' })
  }
  if (!Number.isFinite(capacidadKg) || capacidadKg <= 0
    || !Number.isFinite(capacidadM3) || capacidadM3 <= 0) {
    return res.status(400).json({ error: 'Indica capacidad disponible en kg y m³, mayor que cero' })
  }
  if (tarifaReferencial !== null
    && (!Number.isFinite(tarifaReferencial) || tarifaReferencial < 0)) {
    return res.status(400).json({ error: 'La tarifa referencial no puede ser negativa' })
  }

  const result = await createTransportRecord(req.user.transportista_id, {
    camionId,
    rutaId,
    fechaDesde: body.fechaDesde,
    fechaHasta: body.fechaHasta,
    capacidadKg,
    capacidadM3,
    tarifaReferencial,
  })
  if (!result) {
    return res.status(409).json({
      error: 'El camión no existe, no está activo o la capacidad supera la disponible; revisa también la ruta',
    })
  }

  res.status(201).json({ data: result })
}

export async function cancelCarrierTransportPublication(req, res) {
  const publicationId = parseId(req.params.publicacionId)
  if (!publicationId) {
    return res.status(400).json({ error: 'La publicación indicada no es válida' })
  }

  const result = await cancelTransportRecord(req.user.transportista_id, publicationId)
  if (!result) {
    return res.status(409).json({
      error: 'Solo puedes cancelar un espacio propio que siga disponible',
    })
  }

  res.status(200).json({ data: result })
}

export async function getCarrierJourneys(req, res) {
  res.status(200).json({ data: await getCarrierJourneysRecord(req.user.transportista_id) })
}
