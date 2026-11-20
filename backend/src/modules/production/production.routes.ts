/**
 * Production & BOM Routes
 * Order-to-Audit Manufacturing ERP
 */

import { Router } from 'express';
import { ProductionController } from './production.controller';
import { authenticate, requireRoles, preventAuditorModifications } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';
import {
  createBOMSchema,
  createProductionRunSchema,
  completeProductionRunSchema,
} from './production.schema';

export const productionRoutes = Router();
export const bomRoutes = Router();

// Protect all routes with JWT authentication
productionRoutes.use(authenticate);
bomRoutes.use(authenticate);

// ==========================================
// BOM ROUTES
// ==========================================

bomRoutes.get('/', ProductionController.listBOMs);
bomRoutes.get('/:id', ProductionController.getBOMById);
bomRoutes.get('/:id/requirements', ProductionController.calculateRequirements);

// Create BOM: OWNER, ADMIN, PRODUCTION_SUPERVISOR
bomRoutes.post(
  '/',
  requireRoles('OWNER', 'ADMIN', 'PRODUCTION_SUPERVISOR'),
  preventAuditorModifications,
  validateRequest(createBOMSchema),
  ProductionController.createBOM
);

// ==========================================
// PRODUCTION RUN ROUTES
// ==========================================

productionRoutes.get('/dashboard', ProductionController.getDashboard);
productionRoutes.get('/runs', ProductionController.listProductionRuns);
productionRoutes.get('/runs/:id', ProductionController.getProductionRunById);

// Create Run: OWNER, ADMIN, PRODUCTION_SUPERVISOR
productionRoutes.post(
  '/runs',
  requireRoles('OWNER', 'ADMIN', 'PRODUCTION_SUPERVISOR'),
  preventAuditorModifications,
  validateRequest(createProductionRunSchema),
  ProductionController.createProductionRun
);

// Complete & Post Run: OWNER, ADMIN, PRODUCTION_SUPERVISOR
productionRoutes.post(
  '/runs/:id/complete',
  requireRoles('OWNER', 'ADMIN', 'PRODUCTION_SUPERVISOR'),
  preventAuditorModifications,
  validateRequest(completeProductionRunSchema),
  ProductionController.completeAndPostRun
);

// Cancel Run: OWNER, ADMIN, PRODUCTION_SUPERVISOR
productionRoutes.post(
  '/runs/:id/cancel',
  requireRoles('OWNER', 'ADMIN', 'PRODUCTION_SUPERVISOR'),
  preventAuditorModifications,
  ProductionController.cancelProductionRun
);
