import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import salesRoutes from '../modules/sales/sales.routes';
import invoicesRoutes from '../modules/invoices/invoices.routes';
import auditRoutes from '../modules/audit/audit.routes';
import masterDataRoutes from '../modules/master-data/master-data.routes';
import { inventoryRoutes, purchaseRoutes } from '../modules/inventory/inventory.routes';
import { productionRoutes, bomRoutes } from '../modules/production/production.routes';
import financeRoutes from '../modules/finance/finance.routes';
import reportsRoutes from '../modules/reports/reports.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/master-data', masterDataRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/production', productionRoutes);
router.use('/bom', bomRoutes);
router.use('/sales', salesRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/payments', financeRoutes);
router.use('/finance', financeRoutes);
router.use('/reports', reportsRoutes);
router.use('/audit', auditRoutes);

export default router;
