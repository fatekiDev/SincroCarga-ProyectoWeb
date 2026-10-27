import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/require-auth.js'
import {
  acceptApplication,
  cancelMyPublication,
  createPublication,
  getMyPublications,
  getPublicationApplications,
  getPublicationCatalogs,
  getAvailablePublications,
  getPublication,
  getPublicationQuote,
  updatePublication,
} from '../controllers/publicaciones.controller.js'

const router = Router()

router.get('/', getAvailablePublications)
router.get('/catalogos', getPublicationCatalogs)
router.get('/mine', requireAuth, requireRole('cliente'), getMyPublications)
router.post('/cotizacion', getPublicationQuote)
router.get('/:id', getPublication)
router.get('/:id/postulaciones', requireAuth, requireRole('cliente'), getPublicationApplications)
router.post('/', requireAuth, requireRole('cliente'), createPublication)
router.post('/:id/cancelar', requireAuth, requireRole('cliente'), cancelMyPublication)
// DELETE equivalente a POST /:id/cancelar: borrado lógico (estado = 'Cancelada')
router.delete('/:id', requireAuth, requireRole('cliente'), cancelMyPublication)
router.put('/:id', requireAuth, requireRole('cliente'), updatePublication)
router.put('/:id/postulaciones/:postulacionId/aceptar', requireAuth, requireRole('cliente'), acceptApplication)

export default router