import { Router } from 'express';
import { loginHandler, refreshHandler, logoutHandler, getMeHandler } from './auth.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { authenticate } from '../../middleware/auth';
import { loginSchema, refreshSchema, logoutSchema } from './auth.schema';

const router = Router();

router.post('/login', validateRequest(loginSchema), loginHandler);
router.post('/refresh', validateRequest(refreshSchema), refreshHandler);
router.post('/logout', validateRequest(logoutSchema), logoutHandler);
router.get('/me', authenticate, getMeHandler);

export default router;
