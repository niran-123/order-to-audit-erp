import { Router } from 'express';
import { getAuditSummaryHandler } from './audit.controller';

const router = Router();

router.get('/logs', getAuditSummaryHandler);

export default router;
