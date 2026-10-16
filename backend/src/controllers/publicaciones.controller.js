import {
  cancelPublication as cancelPublicationRecord,
  createPublication as createPublicationRecord,
  getPublicationCatalogs as getPublicationCatalogsRecord,
  getPublicationQuote as getPublicationQuoteRecord,
  getPublication as getPublicationRecord,
  listClientPublications,
  listAvailablePublications,
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
