import api from './api';
import { ApiResponse } from '../types/api';
import { HealthCheckData } from '../types/health';

export async function fetchSystemHealth(): Promise<HealthCheckData> {
  const response = await api.get<ApiResponse<HealthCheckData>>('/health');
  return response.data.data;
}

export async function pingBackend(): Promise<{ status: string }> {
  const response = await api.get<{ status: string }>('/health/ping');
  return response.data;
}
