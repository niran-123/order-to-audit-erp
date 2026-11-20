import { Router } from 'express';
import { authenticate, requirePermissions, preventAuditorModifications } from '../../middleware/auth';
import { Permissions } from '../../config/permissions';
import { SalesController } from '../sales/sales.controller';

const router = Router();

router.use(authenticate);
router.use(preventAuditorModifications);

/**
 * List all GST Invoices
 */
router.get('/', requirePermissions(Permissions.INVOICE_READ), SalesController.listInvoices);

/**
 * Get Single GST Invoice by ID or Invoice Number
 */
router.get('/:id', requirePermissions(Permissions.INVOICE_READ), SalesController.getInvoiceById);

/**
 * Generate GST Tax Invoice directly via invoice module
 */
router.post('/', requirePermissions(Permissions.INVOICE_CREATE), SalesController.generateInvoice);

/**
 * Posted Invoice Immutability: Delete is forbidden by statutory rules
 */
router.delete('/:id', SalesController.deleteInvoice);

export default router;
