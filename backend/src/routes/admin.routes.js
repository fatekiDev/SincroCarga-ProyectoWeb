import { Router } from 'express'
import {
  approveVerification,
  carriers,
  listVerificationRequests,
  rejectVerification,
  reports,
  summary,
  updateCarrier,
  verificationDetails,
} from '../controllers/admin.controller.js'
import { requireAuth, requireRole } from '../middleware/require-auth.js'

const router = Router()

router.use(requireAuth, requireRole('admin'))
router.get('/resumen', summary)
router.get('/solicitudes', listVerificationRequests)
router.get('/solicitudes/:id', verificationDetails)
router.put('/solicitudes/:id/aprobar', approveVerification)
router.put('/solicitudes/:id/rechazar', rejectVerification)
router.get('/transportistas', carriers)
router.patch('/transportistas/:id', updateCarrier)
router.get('/reportes', reports)

export default router
