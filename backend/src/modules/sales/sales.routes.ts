import { Router } from 'express';
import { authenticate, requirePermissions, preventAuditorModifications } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';
import { Permissions } from '../../config/permissions';
import { SalesController } from './sales.controller';
import {
  createSalesOrderSchema,
  approveOrderSchema,
  rejectOrderSchema,
  createDispatchSchema,
} from './sales.schema';

const router = Router();

router.use(authenticate);
router.use(preventAuditorModifications);

/**
 * Sales Analytics / Customer-wise summary
 */
router.get('/customer-sales', SalesController.getCustomerWiseSales);

/**
 * Dispatches Listing
 */
router.get('/dispatches', SalesController.listDispatches);

/**
 * Orders: List & Create
 */
router.get('/orders', SalesController.listOrders);

router.post(
  '/orders',
  requirePermissions(Permissions.ORDER_CREATE),
  validateRequest(createSalesOrderSchema),
  SalesController.createOrder
);

/**
 * Order by ID
 */
router.get('/orders/:id', SalesController.getOrderById);

/**
 * Order Approval (Admin / Owner)
 */
router.post(
  '/orders/:id/approve',
  requirePermissions(Permissions.ORDER_APPROVE),
  validateRequest(approveOrderSchema),
  SalesController.approveOrder
);

/**
 * Order Rejection with mandatory reason (Admin / Owner)
 */
router.post(
  '/orders/:id/reject',
  requirePermissions(Permissions.ORDER_APPROVE),
  validateRequest(rejectOrderSchema),
  SalesController.rejectOrder
);

/**
 * Real-time Stock Availability & Shortage Check for an Order Item
 */
router.get('/orders/:id/check-stock/:productId', SalesController.checkStockAvailability);
router.get('/check-stock/:productId', SalesController.checkStockAvailability);

/**
 * Generate GST Tax Invoice from Approved Order
 * Requires INVOICE_CREATE permission (Accountant / Owner)
 * Strictly forbidden for Production Supervisors
 */
router.post(
  '/orders/:id/invoice',
  requirePermissions(Permissions.INVOICE_CREATE),
  SalesController.generateInvoice
);

/**
 * Dispatch Execution: Validate FG Stock, create Delivery Challan, deduct FG stock
 * Requires STOCK_MOVE permission (Owner / Production Supervisor)
 */
router.post(
  '/orders/:id/dispatch',
  requirePermissions(Permissions.STOCK_MOVE),
  validateRequest(createDispatchSchema),
  SalesController.createDispatch
);

export default router;
