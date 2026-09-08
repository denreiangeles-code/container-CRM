import { Router } from 'express';
import { ContractController } from '../controllers/contract.controller';
import { DeleteController } from '../controllers/delete.controller';
import { requireRoles } from '../middleware/auth.middleware';

const router = Router();

// Pickup Tracking and Customer Contracts are both in the operations nav (see App.tsx
// NAV), so operations needs the same access as admin/sales_manager here -- it was
// missing, which 403'd the whole screen and its pickup-status dropdown for that role.
router.use(requireRoles('admin', 'sales_manager', 'operations'));

router.get('/', ContractController.listContracts);
router.post('/', ContractController.createContract);
router.patch('/:id', ContractController.updateContract);
// Operations can read and progress contracts, but voiding one outright stays with
// the roles that own the revenue it represents.
router.delete('/:id', requireRoles('admin', 'sales_manager'), DeleteController.deleteContract);

export default router;
