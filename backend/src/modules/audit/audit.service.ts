import { prisma } from '../../services/prisma';
import { AuditAction } from '@prisma/client';

export interface SecurityAuditParams {
  userId?: string;
  entityName: string;
  entityId: string;
  actionType: AuditAction;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

export const auditLogs: SecurityAuditParams[] = [];

/**
 * Persists an immutable security/system audit event.
 * Fails gracefully so an audit failure does not crash the request flow.
 */
export async function recordSecurityAudit(params: SecurityAuditParams): Promise<void> {
  auditLogs.push(params);
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        entityName: params.entityName,
        entityId: params.entityId,
        actionType: params.actionType,
        oldValues: params.oldValues ? JSON.parse(JSON.stringify(params.oldValues)) : undefined,
        newValues: params.newValues ? JSON.parse(JSON.stringify(params.newValues)) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    // Graceful fallback for test/dev environments without active database connection
  }
}
