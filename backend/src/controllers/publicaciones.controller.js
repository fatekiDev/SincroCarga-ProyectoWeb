import {
  acceptPublicationApplication as acceptApplicationRecord,
  cancelPublication as cancelPublicationRecord,
  createPublication as createPublicationRecord,
  getPublicationCatalogs as getPublicationCatalogsRecord,
  getPublicationQuote as getPublicationQuoteRecord,
  getPublication as getPublicationRecord,
  listClientPublications,
  listAvailablePublications,
  listPublicationApplications,
  updatePublication as updatePublicationRecord,
} from '../services/publicaciones.service.js'
import {
  validateNewPublication,
  validateUpdatedPublication,
} from '../services/publicaciones.validation.js'

export async function getAvailablePublications(_req, res) {
  const publications = await listAvailablePublications()
  res.status(200).json({ data: publications })
}

export async function getPublicationCatalogs(_req, res) {
  const catalogs = await getPublicationCatalogsRecord()
  res.status(200).json({ data: catalogs })
}

export async function getPublicationQuote(req, res) {
  const tipoCargaId = Number(req.body?.tipoCargaId)
  const rutaId = Number(req.body?.rutaId)
  const pesoKg = Number(req.body?.pesoKg)
  const volumenM3 = Number(req.body?.volumenM3)
  if (!Number.isSafeInteger(tipoCargaId) || tipoCargaId < 1
    || !Number.isSafeInteger(rutaId) || rutaId < 1
    || !Number.isFinite(pesoKg) || pesoKg <= 0
    || !Number.isFinite(volumenM3) || volumenM3 <= 0) {
    return res.status(400).json({
      error: 'Indica un tipo de carga, ruta, peso y volumen válidos',
      details: ['tipoCargaId y rutaId deben ser enteros positivos; pesoKg y volumenM3 deben ser mayores que cero'],
    })
  }

  const quote = await getPublicationQuoteRecord({ tipoCargaId, rutaId, pesoKg, volumenM3 })
  if (!quote || quote.tarifaOfrecida <= 0) {
    return res.status(404).json({
      error: 'No hay una tarifa referencial positiva vigente para esta combinación de ruta y carga',
    })
  }

  res.status(200).json({ data: quote })
}

export async function getMyPublications(req, res) {
  const publications = await listClientPublications(req.user.cliente_id)
  res.status(200).json({ data: publications })
}

export async function getPublication(req, res) {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' })
  }

  const publication = await getPublicationRecord(id)
  if (!publication) {
    return res.status(404).json({ error: 'Publicación no encontrada' })
  }

  res.status(200).json({ data: publication })
}

export async function createPublication(req, res) {
  const errors = validateNewPublication(req.body)
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Datos de publicación inválidos', details: errors })
  }

  const quote = await getPublicationQuoteRecord({
    tipoCargaId: req.body.tipoCargaId,
    rutaId: req.body.rutaId,
    pesoKg: req.body.pesoKg,
    volumenM3: req.body.volumenM3,
  })
  if (!quote || quote.tarifaOfrecida <= 0) {
    return res.status(404).json({
      error: 'No hay una tarifa referencial positiva vigente para esta combinación de ruta y carga',
    })
  }

  const publication = await createPublicationRecord({
    ...req.body,
    tarifaOfrecida: quote.tarifaOfrecida,
  }, req.user.cliente_id)
  res.status(201)
    .location(`/api/publicaciones/${publication.id}`)
    .json({ data: publication })
}

export async function updatePublication(req, res) {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' })
  }

  const errors = validateUpdatedPublication(req.body)
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Datos de publicación inválidos', details: errors })
  }

  const quote = await getPublicationQuoteRecord({
    tipoCargaId: req.body.tipoCargaId,
    rutaId: req.body.rutaId,
    pesoKg: req.body.pesoKg,
    volumenM3: req.body.volumenM3,
  })
  if (!quote || quote.tarifaOfrecida <= 0) {
    return res.status(404).json({
      error: 'No hay una tarifa referencial positiva vigente para esta combinación de ruta y carga',
    })
  }

  const publication = await updatePublicationRecord(id, {
    ...req.body,
    tarifaOfrecida: quote.tarifaOfrecida,
  }, req.user.cliente_id)
  if (!publication) {
    return res.status(404).json({ error: 'Publicación no encontrada' })
  }

  res.status(200).json({ data: publication })
}

export async function cancelMyPublication(req, res) {
  const id = Number(req.params.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' })
  }

  const publication = await cancelPublicationRecord(id, req.user.cliente_id)
  if (!publication) {
    return res.status(404).json({
      error: 'Publicación no encontrada o no disponible para cancelar',
    })
  }

  res.status(200).json({ data: publication })
}

function parseId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id >= 1 ? id : null
}

export async function getPublicationApplications(req, res) {
  const publicacionId = parseId(req.params.id)
  if (!publicacionId) {
    return res.status(400).json({ error: 'El id debe ser un entero positivo' })
  }

  const applications = await listPublicationApplications(req.user.cliente_id, publicacionId)
  if (!applications) {
    return res.status(404).json({ error: 'Publicación no encontrada' })
  }

  res.status(200).json({ data: applications })
}

export async function acceptApplication(req, res) {
  const publicacionId = parseId(req.params.id)
  const postulacionId = parseId(req.params.postulacionId)
  if (!publicacionId || !postulacionId) {
    return res.status(400).json({ error: 'Los ids deben ser enteros positivos' })
  }

  const result = await acceptApplicationRecord(req.user.cliente_id, publicacionId, postulacionId)

  if (result.notFound) {
    return res.status(404).json({ error: 'Publicación o postulación no encontrada' })
  }
  if (result.unavailable) {
    return res.status(409).json({ error: 'Esta publicación ya no está disponible' })
  }
  if (result.noResources) {
    return res.status(409).json({
      error: 'El transportista no tiene un camión y un chofer disponibles para este viaje',
    })
  }

  res.status(200).json({ data: { viajeId: result.viajeId } })
}