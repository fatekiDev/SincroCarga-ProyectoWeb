import {
  getCurrentPayment as getCurrentPaymentRecord,
  startSimulatedPayment,
} from '../services/pagos.service.js'

export async function getCurrentPayment(req, res) {
  const payment = await getCurrentPaymentRecord(req.user.cliente_id)
  res.status(200).json({ data: payment })
}

export async function simulatePayment(req, res) {
  const viajeId = Number(req.params.viajeId)
  if (!Number.isSafeInteger(viajeId) || viajeId < 1) {
    return res.status(400).json({ error: 'El id del viaje debe ser un entero positivo' })
  }
  if (req.body?.aceptoTerminos !== true) {
    return res.status(400).json({
      error: 'Debes aceptar las condiciones para iniciar el pago simulado',
      details: ['aceptoTerminos debe ser true'],
    })
  }

  const payment = await startSimulatedPayment(viajeId, req.user.cliente_id)
  if (!payment) {
    return res.status(404).json({
      error: 'No se encontró una postulación aceptada con viaje activo para este cliente',
    })
  }

  res.status(200).json({ data: payment })
}