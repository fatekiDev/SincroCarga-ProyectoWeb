import { Router } from 'express'
import { requireAuth, requireRole, requireVerifiedCarrier } from '../middleware/require-auth.js'
import {
  cancelCarrierTransportPublication,
  createCarrierApplication,
  createCarrierTransportPublication,
  getAvailableLoads,
  getCarrierApplications,
  getCarrierCatalogs,
  getCarrierJourneys,
  getCarrierTransportPublications,
  withdrawCarrierApplication,
} from '../controllers/transportista.controller.js'

const router = Router()

router.use(requireAuth, requireRole('camionero'), requireVerifiedCarrier)
router.get('/catalogos', getCarrierCatalogs)
router.get('/cargas', getAvailableLoads)
router.get('/postulaciones', getCarrierApplications)
router.post('/cargas/:publicacionId/postular', createCarrierApplication)
router.post('/postulaciones/:postulacionId/retirar', withdrawCarrierApplication)
router.get('/espacios', getCarrierTransportPublications)
router.post('/espacios', createCarrierTransportPublication)
router.post('/espacios/:publicacionId/cancelar', cancelCarrierTransportPublication)
router.get('/viajes', getCarrierJourneys)

export default router
