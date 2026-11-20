import { Router } from 'express';
import { createUserHandler, updateUserStatusHandler, listUsersHandler } from './users.controller';
import { authenticate, requireRoles, requirePermissions } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';
import { createUserSchema, updateUserStatusSchema } from './users.schema';
import { Permissions } from '../../config/permissions';

const router = Router();

// All user routes require authentication and Admin/Owner role or specific user management permission
router.use(authenticate);

router.post(
  '/',
  requireRoles('ADMIN', 'OWNER'),
  requirePermissions(Permissions.USER_CREATE),
  validateRequest(createUserSchema),
  createUserHandler,
);

router.patch(
  '/:id/status',
  requireRoles('ADMIN', 'OWNER'),
  requirePermissions(Permissions.USER_UPDATE_STATUS),
  validateRequest(updateUserStatusSchema),
  updateUserStatusHandler,
);

router.get(
  '/',
  requireRoles('ADMIN', 'OWNER', 'AUDITOR'),
  requirePermissions(Permissions.USER_READ),
  listUsersHandler,
);

export default router;
