import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/require-auth.js'
import {
  cancelMyPublication,
  createPublication,
  getMyPublications,
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
router.post('/', requireAuth, requireRole('cliente'), createPublication)
router.post('/:id/cancelar', requireAuth, requireRole('cliente'), cancelMyPublication)
router.put('/:id', requireAuth, requireRole('cliente'), updatePublication)

export default router
