import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import { openShiftSchema, closeShiftSchema } from './shifts.schema';
import * as shiftsController from './shifts.controller';

const router = Router();

router.post('/open', authenticate, validate(openShiftSchema), shiftsController.openShift);
router.post('/close', authenticate, validate(closeShiftSchema), shiftsController.closeShift);
router.get('/current', authenticate, shiftsController.getCurrentShift);
router.get('/', authenticate, requireRole('owner'), shiftsController.listShifts);
router.get('/:id', authenticate, requireRole('owner'), shiftsController.getShift);

export default router;
