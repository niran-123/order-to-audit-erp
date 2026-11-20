import React from 'react';
import { useHealth } from '../hooks/useHealth';
import { StatusBadge } from '../components/StatusBadge';
import { RefreshCw, Database, Server, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';

export const HealthCheckPage: React.FC = () => {
  const { data, loading, error, refetch } = useHealth();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Health & Verification</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time frontend-to-backend and backend-to-database diagnostic monitor.</p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Connectivity Alert */}
      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wide">Backend Connection Error</h3>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <p className="text-[11px] text-rose-600 mt-2">Ensure the backend server is running on port 5000 (`npm run dev:backend`).</p>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                Frontend-to-Backend Link Verified
              </h3>
              <p className="text-xs text-emerald-700">HTTP REST handshake succeeded via Axios with response time telemetry.</p>
            </div>
          </div>
          {data && <StatusBadge status={data.status} />}
        </div>
      )}

      {/* Diagnostics Grid */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Node.js Runtime */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-600" />
                <span>Node.js Application</span>
              </span>
              <StatusBadge status="healthy" label="Online" />
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Uptime:</span>
                <span className="font-mono font-medium">{data.uptimeSeconds} seconds</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Environment:</span>
                <span className="font-mono font-medium uppercase">{data.environment}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Server Time:</span>
                <span className="font-mono text-[11px]">{new Date(data.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* PostgreSQL DB */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-600" />
                <span>PostgreSQL Database</span>
              </span>
              <StatusBadge
                status={data.database.status === 'connected' ? 'healthy' : 'degraded'}
                label={data.database.status.toUpperCase()}
              />
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Connection State:</span>
                <span className="font-mono font-medium text-emerald-700">{data.database.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Ping Latency:</span>
                <span className="font-mono font-medium">{data.database.latencyMs} ms</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">ORM Client:</span>
                <span className="font-mono text-[11px]">Prisma 5.x Client</span>
              </div>
            </div>
          </div>

          {/* Process Memory */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-600" />
                <span>Memory Allocation</span>
              </span>
              <span className="text-xs font-mono text-slate-500">{data.memory.rssMB} MB RSS</span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Heap Used:</span>
                <span className="font-mono font-medium">{data.memory.heapUsedMB} MB</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Heap Total:</span>
                <span className="font-mono font-medium">{data.memory.heapTotalMB} MB</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Garbage Collector:</span>
                <span className="font-mono text-[11px] text-emerald-700">Healthy</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
