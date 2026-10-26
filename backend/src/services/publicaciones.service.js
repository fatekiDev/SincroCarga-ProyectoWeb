import {
  acceptApplication,
  cancelClientPublication as cancelPublicationRecord,
  findClientPublications,
  createPublication as insertPublication,
  findPublicationApplications,
  findPublicationCatalogs,
  findPublicationQuote,
  findAvailablePublications,
  findPublication as findPublicationById,
  updatePublication as savePublicationChanges,
} from '../models/publicacion.model.js'

export function listAvailablePublications() {
  return findAvailablePublications()
}

export function listClientPublications(clienteId) {
  return findClientPublications(clienteId)
}

export function getPublicationCatalogs() {
  return findPublicationCatalogs()
}

export function getPublicationQuote(criteria) {
  return findPublicationQuote(criteria)
}

export function getPublication(id) {
  return findPublicationById(id)
}

export function createPublication(publication, clienteId) {
  return insertPublication(publication, clienteId)
}

export function updatePublication(id, publication, clienteId) {
  return savePublicationChanges(id, publication, clienteId)
}

export function cancelPublication(id, clienteId) {
  return cancelPublicationRecord(id, clienteId)
}

export function listPublicationApplications(clienteId, publicacionId) {
  return findPublicationApplications(clienteId, publicacionId)
}

export function acceptPublicationApplication(clienteId, publicacionId, postulacionId) {
  return acceptApplication(clienteId, publicacionId, postulacionId)
}