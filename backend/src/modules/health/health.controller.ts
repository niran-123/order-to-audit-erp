import { Request, Response, NextFunction } from 'express';
import { getSystemHealth } from './health.service';
import { checkDatabaseConnection } from '../../services/prisma';
import { sendSuccess } from '../../utils/apiResponse';

export async function healthCheckHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const health = await getSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : 207; // Multi-status if degraded
    return sendSuccess(res, health, 'System health report', statusCode);
  } catch (error) {
    next(error);
  }
}

export function pingHandler(_req: Request, res: Response) {
  return res.status(200).json({ status: 'pong', timestamp: new Date().toISOString() });
}

export function livenessHandler(_req: Request, res: Response) {
  return res.status(200).json({
    status: 'alive',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

export async function readinessHandler(_req: Request, res: Response) {
  const dbHealth = await checkDatabaseConnection();
  if (dbHealth.connected) {
    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      latencyMs: dbHealth.latencyMs,
      timestamp: new Date().toISOString(),
    });
  } else {
    return res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
}
