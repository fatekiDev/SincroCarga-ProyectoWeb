import {
  createPublication as createPublicationRecord,
  getPublication as getPublicationRecord,
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

  const publication = await createPublicationRecord(req.body, req.user.cliente_id)
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

  const publication = await updatePublicationRecord(id, req.body, req.user.cliente_id)
  if (!publication) {
    return res.status(404).json({ error: 'Publicación no encontrada' })
  }

  res.status(200).json({ data: publication })
}
