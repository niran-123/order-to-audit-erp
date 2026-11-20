/**
 * Inventory & Purchasing API Routes
 * Order-to-Audit Manufacturing ERP
 */

import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate, requireRoles, preventAuditorModifications } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';
import {
  createPurchaseSchema,
  confirmPurchaseSchema,
  reconcileStockSchema,
  recordManualMovementSchema,
  stockLedgerQuerySchema,
} from './inventory.schema';

// Inventory Router
export const inventoryRoutes = Router();

// Purchases Router
export const purchaseRoutes = Router();

// Protect all routes with JWT Authentication
inventoryRoutes.use(authenticate);
purchaseRoutes.use(authenticate);

// ==========================================
// INVENTORY ROUTES
// ==========================================

// Dashboard: All authenticated users can view
inventoryRoutes.get('/dashboard', InventoryController.getDashboard);

// Balances: All authenticated users can view
inventoryRoutes.get('/balances', InventoryController.getStockBalances);
inventoryRoutes.get('/balances/:id', InventoryController.getItemById);

// Stock Ledger: Authenticated users can view
inventoryRoutes.get('/ledger', validateRequest(stockLedgerQuerySchema), InventoryController.getStockLedger);

// Stock Reconciliation: OWNER, ADMIN, PRODUCTION_SUPERVISOR, AUDITOR
inventoryRoutes.post(
  '/reconcile',
  requireRoles('OWNER', 'ADMIN', 'PRODUCTION_SUPERVISOR', 'AUDITOR'),
  validateRequest(reconcileStockSchema),
  InventoryController.reconcileStock
);

// Manual Movement: OWNER, ADMIN, PRODUCTION_SUPERVISOR
inventoryRoutes.post(
  '/movements',
  requireRoles('OWNER', 'ADMIN', 'PRODUCTION_SUPERVISOR'),
  preventAuditorModifications,
  validateRequest(recordManualMovementSchema),
  InventoryController.recordManualMovement
);

// ==========================================
// PURCHASES ROUTES
// ==========================================

// List & Get POs
purchaseRoutes.get('/', InventoryController.listPurchases);
purchaseRoutes.get('/:id', InventoryController.getPurchaseById);

// Create PO: OWNER, ADMIN, ACCOUNTANT
purchaseRoutes.post(
  '/',
  requireRoles('OWNER', 'ADMIN', 'ACCOUNTANT'),
  preventAuditorModifications,
  validateRequest(createPurchaseSchema),
  InventoryController.createPurchase
);

// Confirm PO & Generate GRN: OWNER, ADMIN, PRODUCTION_SUPERVISOR
purchaseRoutes.post(
  '/:id/confirm',
  requireRoles('OWNER', 'ADMIN', 'PRODUCTION_SUPERVISOR'),
  preventAuditorModifications,
  validateRequest(confirmPurchaseSchema),
  InventoryController.confirmPurchase
);
