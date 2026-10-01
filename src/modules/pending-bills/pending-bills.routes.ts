import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createPendingBillSchema, updatePendingBillSchema } from './pending-bills.schema';
import * as pendingBillsController from './pending-bills.controller';

const router = Router();

router.get('/', authenticate, pendingBillsController.listPendingBills);
router.post('/', authenticate, validate(createPendingBillSchema), pendingBillsController.createPendingBill);
router.patch('/:id', authenticate, validate(updatePendingBillSchema), pendingBillsController.updatePendingBill);
router.delete('/:id', authenticate, pendingBillsController.deletePendingBill);

export default router;
