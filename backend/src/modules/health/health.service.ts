import { checkDatabaseConnection } from '../../services/prisma';
import { env } from '../../config/env';

export interface HealthCheckData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  database: {
    status: 'connected' | 'disconnected';
    latencyMs: number;
  };
  memory: {
    rssMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
  };
}

export async function getSystemHealth(): Promise<HealthCheckData> {
  const dbCheck = await checkDatabaseConnection();
  const mem = process.memoryUsage();

  return {
    status: dbCheck.connected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
    database: {
      status: dbCheck.connected ? 'connected' : 'disconnected',
      latencyMs: dbCheck.latencyMs,
    },
    memory: {
      rssMB: +(mem.rss / 1024 / 1024).toFixed(2),
      heapUsedMB: +(mem.heapUsed / 1024 / 1024).toFixed(2),
      heapTotalMB: +(mem.heapTotal / 1024 / 1024).toFixed(2),
    },
  };
}
