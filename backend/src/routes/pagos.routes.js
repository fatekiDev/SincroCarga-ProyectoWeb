import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/require-auth.js'
import { getCurrentPayment, simulatePayment } from '../controllers/pagos.controller.js'

const router = Router()

router.use(requireAuth, requireRole('cliente'))
router.get('/actual', getCurrentPayment)
router.post('/:viajeId/simular', simulatePayment)

export default router