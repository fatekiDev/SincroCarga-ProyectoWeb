import {
  cancelCarrierTransportPublication as cancelTransportRecord,
  createCarrierApplication as createApplicationRecord,
  createCarrierTransportPublication as createTransportRecord,
  findAvailableLoads,
  findCarrierApplications,
  findCarrierCatalogs,
  findCarrierJourneys,
  findCarrierTransportPublications,
  withdrawCarrierApplication as withdrawApplicationRecord,
} from '../models/transportista.model.js'

export function getCarrierCatalogs(transportistaId) {
  return findCarrierCatalogs(transportistaId)
}

export function getAvailableLoads(transportistaId) {
  return findAvailableLoads(transportistaId)
}

export function getCarrierApplications(transportistaId) {
  return findCarrierApplications(transportistaId)
}

export function createCarrierApplication(transportistaId, application) {
  return createApplicationRecord(transportistaId, application)
}

export function withdrawCarrierApplication(transportistaId, applicationId) {
  return withdrawApplicationRecord(transportistaId, applicationId)
}

export function getCarrierTransportPublications(transportistaId) {
  return findCarrierTransportPublications(transportistaId)
}

export function createCarrierTransportPublication(transportistaId, publication) {
  return createTransportRecord(transportistaId, publication)
}

export function cancelCarrierTransportPublication(transportistaId, publicationId) {
  return cancelTransportRecord(transportistaId, publicationId)
}

export function getCarrierJourneys(transportistaId) {
  return findCarrierJourneys(transportistaId)
}
