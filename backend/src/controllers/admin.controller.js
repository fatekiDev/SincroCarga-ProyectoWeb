import {
  getAdminReport,
  getAdminSummary,
  getVerificationDetails,
  getVerificationRequests,
  listAdminCarriers,
  reviewCarrier,
  updateAdminCarrier,
} from '../models/admin.model.js'

const CARRIER_STATUSES = new Set(['Verificado', 'Pendiente', 'Rechazado', 'Suspendido'])
const UPDATABLE_CARRIER_STATUSES = new Set(['Verificado', 'Pendiente', 'Suspendido'])
const REPORT_PERIODS = new Set(['7d', '30d', '90d', '365d', 'all'])

function parseId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export async function summary(_req, res) {
  res.json({ data: await getAdminSummary() })
}

export async function listVerificationRequests(_req, res) {
  res.json({ data: await getVerificationRequests() })
}

export async function verificationDetails(req, res) {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'El identificador de transportista no es válido.' })
  const details = await getVerificationDetails(id)
  if (!details) return res.status(404).json({ error: 'No se encontró la solicitud de verificación.' })
  res.json({ data: details })
}

export async function approveVerification(req, res) {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'El identificador de transportista no es válido.' })
  const updated = await reviewCarrier(id, 'Verificado')
  if (!updated) {
    return res.status(409).json({ error: 'La solicitud ya fue revisada o no está disponible.' })
  }
  res.json({ data: { id, estado: 'Verificado' } })
}

export async function rejectVerification(req, res) {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'El identificador de transportista no es válido.' })
  const reason = typeof req.body?.motivo === 'string' ? req.body.motivo.trim() : ''
  if (reason.length < 5 || reason.length > 500) {
    return res.status(400).json({ error: 'El motivo debe tener entre 5 y 500 caracteres.' })
  }
  const updated = await reviewCarrier(id, 'Rechazado', reason)
  if (!updated) {
    return res.status(409).json({ error: 'La solicitud ya fue revisada o no está disponible.' })
  }
  res.json({ data: { id, estado: 'Rechazado' } })
}

export async function carriers(req, res) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : ''
  const status = typeof req.query.estado === 'string' ? req.query.estado : 'Todos'
  const page = Number(req.query.page ?? 1)
  const pageSize = Number(req.query.pageSize ?? 5)
  if (!['Todos', ...CARRIER_STATUSES].includes(status)) {
    return res.status(400).json({ error: 'El filtro de estado no es válido.' })
  }
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    return res.status(400).json({ error: 'La paginación solicitada no es válida.' })
  }
  res.json({ data: await listAdminCarriers({ search, status, page, pageSize }) })
}

export async function updateCarrier(req, res) {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'El identificador de transportista no es válido.' })
  const { estado, telefono } = req.body ?? {}
  if (estado !== undefined && !UPDATABLE_CARRIER_STATUSES.has(estado)) {
    return res.status(400).json({ error: 'El estado solicitado no es válido.' })
  }
  if (telefono !== undefined && (typeof telefono !== 'string' || telefono.trim().length < 6 || telefono.trim().length > 20)) {
    return res.status(400).json({ error: 'El teléfono debe tener entre 6 y 20 caracteres.' })
  }
  const carrier = await updateAdminCarrier(id, {
    status: estado,
    phone: telefono?.trim(),
  })
  if (!carrier) return res.status(404).json({ error: 'No se encontró el transportista.' })
  res.json({ data: carrier })
}

export async function reports(req, res) {
  const period = typeof req.query.periodo === 'string' ? req.query.periodo : '30d'
  if (!REPORT_PERIODS.has(period)) {
    return res.status(400).json({ error: 'El período solicitado no es válido.' })
  }
  res.json({ data: await getAdminReport(period) })
}
