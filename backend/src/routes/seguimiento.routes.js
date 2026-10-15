import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/require-auth.js'
import {
  confirmReceipt,
  createTrackingIncident,
  createJourneyRating,
  getActiveTracking,
  getJourneyReview,
} from '../controllers/seguimiento.controller.js'

const router = Router()

router.use(requireAuth, requireRole('cliente'))
router.get('/activo', getActiveTracking)
router.get('/revision', getJourneyReview)
router.post('/:viajeId/incidencias', createTrackingIncident)
router.post('/:viajeId/confirmar-recepcion', confirmReceipt)
router.post('/:viajeId/calificacion', createJourneyRating)

export default router