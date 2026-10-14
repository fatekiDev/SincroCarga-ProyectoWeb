import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/require-auth.js'
import {
  createPublication,
  getAvailablePublications,
  getPublication,
  updatePublication,
} from '../controllers/publicaciones.controller.js'

const router = Router()

router.get('/', getAvailablePublications)
router.get('/:id', getPublication)
router.post('/', requireAuth, requireRole('cliente'), createPublication)
router.put('/:id', requireAuth, requireRole('cliente'), updatePublication)

export default router
