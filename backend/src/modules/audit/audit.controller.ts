import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/apiResponse';

export async function getAuditSummaryHandler(_req: Request, res: Response) {
  // Foundation mock audit events
  const mockAuditTrails = [
    {
      id: 'aud-001',
      entityName: 'SYSTEM_PERIOD_LOCK',
      entityId: 'LOCK-2026-10',
      actionType: 'POST',
      user: 'auditor@enterprise.com',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      summary: 'October 2026 accounting period sealed with cryptographic hash',
    },
    {
      id: 'aud-002',
      entityName: 'STOCK_MOVEMENT',
      entityId: 'MV-2026-0001',
      actionType: 'CREATE',
      user: 'production@enterprise.com',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      summary: 'Inward GRN receipt of 1000.0000 KG SS 316 Round Bar into Bin A01',
    },
  ];

  return sendSuccess(res, { logs: mockAuditTrails, count: mockAuditTrails.length }, 'Audit trail records retrieved');
}
