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
