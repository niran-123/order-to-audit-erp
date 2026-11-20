import { prisma, isPostgresPortListening } from '../../services/prisma';
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
 * Non-blocking in-memory capture with background DB sync when PostgreSQL is online.
 */
export async function recordSecurityAudit(params: SecurityAuditParams): Promise<void> {
  auditLogs.push(params);

  const isDbLive = await isPostgresPortListening('127.0.0.1', 5432, 50);
  if (!isDbLive) {
    return;
  }

  // Fire-and-forget DB persistence so client response is not delayed
  prisma.auditLog
    .create({
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
    })
    .catch(() => {});
}
