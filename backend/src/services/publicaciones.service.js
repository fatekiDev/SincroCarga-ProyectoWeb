import {
  createPublication as insertPublication,
  findAvailablePublications,
  findPublication as findPublicationById,
  updatePublication as savePublicationChanges,
} from '../models/publicacion.model.js'

export function listAvailablePublications() {
  return findAvailablePublications()
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
