import { useState, useEffect } from 'react';
import { fetchSystemHealth } from '../services/healthService';
import { HealthCheckData } from '../types/health';

export function useHealth(pollIntervalMs = 15000) {
  const [data, setData] = useState<HealthCheckData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    try {
      setLoading(true);
      const res = await fetchSystemHealth();
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollIntervalMs]);

  return { data, loading, error, refetch: check };
}
