import { Router } from 'express';
import { authenticate, requirePermissions, preventAuditorModifications } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';
import { Permissions } from '../../config/permissions';
import { FinanceController } from './finance.controller';
import { recordPaymentSchema } from './finance.schema';

const router = Router();

router.use(authenticate);
router.use(preventAuditorModifications);

/**
 * Payments Endpoints
 */
router.post(
  '/',
  requirePermissions(Permissions.PAYMENT_CREATE),
  validateRequest(recordPaymentSchema),
  FinanceController.recordPayment
);

router.get('/', requirePermissions(Permissions.PAYMENT_READ), FinanceController.listPayments);
router.get('/receivables', requirePermissions(Permissions.PAYMENT_READ), FinanceController.getAccountsReceivable);
router.get('/costing', requirePermissions(Permissions.PRODUCTION_READ), FinanceController.getProductionCosting);
router.get('/profitability', requirePermissions(Permissions.PAYMENT_READ), FinanceController.getProductProfitability);
router.get('/:id', requirePermissions(Permissions.PAYMENT_READ), FinanceController.getPaymentById);

export default router;
