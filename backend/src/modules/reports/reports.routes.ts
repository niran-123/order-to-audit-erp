/**
 * BI & Reporting Routes
 * Order-to-Audit Manufacturing ERP
 */

import { Router } from 'express';
import { authenticate, requireRoles } from '../../middleware/auth';
import { SystemRole } from '@prisma/client';
import { ReportsController } from './reports.controller';

const router = Router();

// Require valid authentication token for all report routes
router.use(authenticate);

// ----------------------------------------------------
// Dashboard Endpoints
// ----------------------------------------------------
router.get(
  '/dashboards/owner',
  requireRoles(SystemRole.OWNER),
  ReportsController.getOwnerDashboard
);

router.get(
  '/dashboards/admin',
  requireRoles(SystemRole.OWNER, SystemRole.ADMIN),
  ReportsController.getAdminDashboard
);

router.get(
  '/dashboards/production',
  requireRoles(SystemRole.OWNER, SystemRole.ADMIN, SystemRole.PRODUCTION_SUPERVISOR),
  ReportsController.getProductionDashboard
);

// ----------------------------------------------------
// Audit Trail Endpoint
// ----------------------------------------------------
router.get(
  '/audit-trail',
  requireRoles(SystemRole.OWNER, SystemRole.ADMIN, SystemRole.AUDITOR),
  ReportsController.getAuditTrail
);

// ----------------------------------------------------
// Specific 17 Accountant & Auditor Report Endpoints
// ----------------------------------------------------
const reportingRoles = [
  SystemRole.OWNER,
  SystemRole.ADMIN,
  SystemRole.ACCOUNTANT,
  SystemRole.AUDITOR,
  SystemRole.PRODUCTION_SUPERVISOR,
];

router.get('/sales-register', requireRoles(...reportingRoles), ReportsController.getSalesRegister);
router.get('/customer-sales', requireRoles(...reportingRoles), ReportsController.getCustomerSales);
router.get('/product-sales', requireRoles(...reportingRoles), ReportsController.getProductSales);
router.get('/gst-outward', requireRoles(...reportingRoles), ReportsController.getGSTOutwardSupplies);
router.get('/purchase-register', requireRoles(...reportingRoles), ReportsController.getPurchaseRegister);
router.get('/raw-material-stock', requireRoles(...reportingRoles), ReportsController.getRawMaterialStock);
router.get('/packaging-stock', requireRoles(...reportingRoles), ReportsController.getPackagingMaterialStock);
router.get('/finished-goods-stock', requireRoles(...reportingRoles), ReportsController.getFinishedGoodsStock);
router.get('/stock-ledger', requireRoles(...reportingRoles), ReportsController.getStockLedger);
router.get('/production-report', requireRoles(...reportingRoles), ReportsController.getProductionReport);
router.get('/consumption-variance', requireRoles(...reportingRoles), ReportsController.getConsumptionVariance);
router.get('/yield-report', requireRoles(...reportingRoles), ReportsController.getProductionYield);
router.get('/wastage-report', requireRoles(...reportingRoles), ReportsController.getWastageReport);
router.get('/cost-per-packet', requireRoles(...reportingRoles), ReportsController.getCostPerPacket);
router.get('/payments-collections', requireRoles(...reportingRoles), ReportsController.getPaymentsCollections);
router.get('/customer-outstanding', requireRoles(...reportingRoles), ReportsController.getCustomerOutstanding);
router.get('/receivables-ageing', requireRoles(...reportingRoles), ReportsController.getReceivablesAgeing);

// Dynamic Report Dispatcher: /api/v1/reports/:slug
router.get('/:slug', requireRoles(...reportingRoles), ReportsController.getDynamicReport);

export default router;
