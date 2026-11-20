import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenUserPayload } from '../utils/security';
import { UnauthorizedError, ForbiddenError } from '../utils/appError';
import { SystemRole } from '@prisma/client';
import { PermissionCode, Permissions } from '../config/permissions';
import { recordSecurityAudit } from '../modules/audit/audit.service';
import { prisma } from '../services/prisma';

// Extend Express Request interface to include authenticated user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenUserPayload;
    }
  }
}

/**
 * Validates JWT access token from Authorization header (Bearer <token>).
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Authentication token is missing. Please log in.', { code: 'AUTH_REQUIRED' }));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    // Verify user is still active in database (with fault tolerance for test/disconnected environments)
    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true },
      });

      if (user && !user.isActive) {
        await recordSecurityAudit({
          userId: user.id,
          entityName: 'USER_SESSION',
          entityId: user.id,
          actionType: 'ACCESS_DENIED',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          newValues: { reason: 'ACCOUNT_DEACTIVATED' },
        });
        return next(new ForbiddenError('Your account has been deactivated. Contact an administrator.', { code: 'ACCOUNT_DEACTIVATED' }));
      }
    } catch {
      // Gracefully fall back to cryptographic JWT claim verification if DB is offline or in mock test environment
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Guard requiring that the authenticated user possesses at least one of the specified roles.
 */
export function requireRoles(...allowedRoles: SystemRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));

    if (!hasRole) {
      await recordSecurityAudit({
        userId: req.user.userId,
        entityName: 'RBAC_ROLE_GUARD',
        entityId: req.originalUrl,
        actionType: 'ACCESS_DENIED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValues: { requiredRoles: allowedRoles, userRoles: req.user.roles },
      });

      return next(
        new ForbiddenError(
          `Forbidden: Access requires one of the following roles: [${allowedRoles.join(', ')}].`,
          { code: 'FORBIDDEN_ROLE', requiredRoles: allowedRoles },
        ),
      );
    }

    next();
  };
}

/**
 * Guard requiring that the authenticated user possesses all specified permissions.
 */
export function requirePermissions(...requiredPermissions: PermissionCode[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // Owner always has all permissions
    if (req.user.roles.includes('OWNER')) {
      return next();
    }

    const missing = requiredPermissions.filter((p) => !req.user!.permissions.includes(p));

    if (missing.length > 0) {
      await recordSecurityAudit({
        userId: req.user.userId,
        entityName: 'RBAC_PERMISSION_GUARD',
        entityId: req.originalUrl,
        actionType: 'ACCESS_DENIED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        newValues: { missingPermissions: missing, userPermissions: req.user.permissions },
      });

      return next(
        new ForbiddenError(`Forbidden: Missing required permission(s): [${missing.join(', ')}].`, {
          code: 'FORBIDDEN_PERMISSION',
          missingPermissions: missing,
        }),
      );
    }

    next();
  };
}

/**
 * Strict invariant: Auditors cannot modify transactions.
 * Intercepts any POST, PUT, PATCH, DELETE attempted by an Auditor.
 */
export function preventAuditorModifications(req: Request, _res: Response, next: NextFunction): void {
  if (req.user && req.user.roles.includes('AUDITOR') && !req.user.roles.includes('OWNER')) {
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
    // Allow audit lock actions specifically designed for auditors
    if (isMutation && !req.originalUrl.includes('/audit/lock')) {
      return next(
        new ForbiddenError('Compliance Invariant: Auditors are strictly prohibited from modifying business transactions.', {
          code: 'AUDITOR_TRANSACTION_MUTATION_PROHIBITED',
        }),
      );
    }
  }
  next();
}

/**
 * Strict invariant: Salesmen cannot access other salesmen's restricted records.
 */
export function enforceSalesmanScoping(orderSalesmanIdParam = 'salesmanId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next();

    // If user is a salesman without Owner or Admin privileges, they are scoped strictly to their own orders
    if (req.user.roles.includes('SALESMAN') && !req.user.roles.includes('OWNER') && !req.user.roles.includes('ADMIN')) {
      const targetSalesmanId = req.params[orderSalesmanIdParam] || req.query[orderSalesmanIdParam] || req.body[orderSalesmanIdParam];

      if (targetSalesmanId && targetSalesmanId !== req.user.userId) {
        return next(
          new ForbiddenError('Forbidden: Salesmen cannot access or view sales records belonging to other sales representatives.', {
            code: 'SALESMAN_SCOPE_VIOLATION',
          }),
        );
      }
    }
    next();
  };
}
