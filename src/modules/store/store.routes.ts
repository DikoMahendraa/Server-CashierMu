import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import { updateStoreSchema } from './store.schema';
import * as storeController from './store.controller';

const router = Router();

router.get('/', authenticate, storeController.getStore);
router.patch('/', authenticate, requireRole('owner'), validate(updateStoreSchema), storeController.updateStore);

export default router;
