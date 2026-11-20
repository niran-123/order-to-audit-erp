import { Router } from 'express';
import { healthCheckHandler, pingHandler, livenessHandler, readinessHandler } from './health.controller';

const router = Router();

router.get('/', healthCheckHandler);
router.get('/ping', pingHandler);
router.get('/live', livenessHandler);
router.get('/ready', readinessHandler);

export default router;
