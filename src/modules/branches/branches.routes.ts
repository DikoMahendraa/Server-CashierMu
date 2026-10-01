import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';
import { createBranchSchema, updateBranchSchema } from './branches.schema';
import * as branchesController from './branches.controller';

const router = Router();

router.get('/', authenticate, branchesController.listBranches);
router.post('/', authenticate, requireRole('owner'), validate(createBranchSchema), branchesController.createBranch);
router.patch('/:id', authenticate, requireRole('owner'), validate(updateBranchSchema), branchesController.updateBranch);
router.patch('/:id/status', authenticate, requireRole('owner'), branchesController.toggleStatus);

export default router;
