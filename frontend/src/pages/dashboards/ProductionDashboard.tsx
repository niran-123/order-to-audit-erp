import React, { useState, useEffect } from 'react';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Factory,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldAlert,
  Boxes,
  Trash2,
  Package,
} from 'lucide-react';
import api from '../../services/api';
import { ReportService, ProductionDashboardData } from '../../services/reportService';

export const ProductionDashboard: React.FC = () => {
  const [data, setData] = useState<ProductionDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceAttemptMsg, setInvoiceAttemptMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await ReportService.getProductionDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load production dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const testInvoiceCreation = async () => {
    try {
      setInvoiceAttemptMsg(null);
      // Attempt to call invoice creation (which is forbidden for production supervisors)
      await api.post('/invoices', { customerId: 'c-1', amount: 1000 });
      setInvoiceAttemptMsg('Unexpected: Invoice created!');
    } catch (err: any) {
      setInvoiceAttemptMsg(`Policy Enforced: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Shop-Floor Production Console</h2>
            <StatusBadge status="in_progress" label="Supervisor Clearance" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift production runs, planned vs actual output, raw-material consumption, wastage tracking, and yield variance.
          </p>
        </div>
        <button
          onClick={testInvoiceCreation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-100 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Test Invoice Creation Guard</span>
        </button>
      </div>

      {invoiceAttemptMsg && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span><strong>Security Constraint Verified:</strong> {invoiceAttemptMsg}</span>
        </div>
      )}

      {/* Row 1: Production Run KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Production Runs"
          value={data ? `${data.totalProductionRuns} Runs` : '...'}
          subtitle={data ? `Completed: ${data.completedRunsCount} | In Progress: ${data.inProgressRunsCount}` : '...'}
          icon={<Factory className="w-5 h-5 text-brand-600" />}
        />
        <MetricCard
          title="Actual Good Output"
          value={data ? `${data.plannedVsActual.actualGoodOutput} pkts` : '...'}
          subtitle={data ? `Planned: ${data.plannedVsActual.plannedOutput} pkts` : '...'}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <MetricCard
          title="Overall Yield Percentage"
          value={data ? `${data.plannedVsActual.overallYieldPct.toFixed(1)}%` : '...'}
          subtitle="Good Packets / Planned Batch"
          icon={<CheckCircle2 className="w-5 h-5 text-indigo-600" />}
        />
        <MetricCard
          title="Total Production Wastage"
          value={data ? `₹ ${data.productionWastage.totalWastageValue.toFixed(2)}` : '...'}
          subtitle={data ? `${data.productionWastage.totalDamagedPackets} pkts + ${data.productionWastage.totalScrapPouches} scrap pouches` : '...'}
          icon={<Trash2 className="w-5 h-5 text-rose-600" />}
        />
      </div>

      {/* Row 2: Material Consumption & Yield Variance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Consumption Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-brand-600" />
            <span>Actual vs Planned Material Consumption</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2 px-3">Material</th>
                  <th className="py-2 px-3 text-right">Planned</th>
                  <th className="py-2 px-3 text-right">Actual</th>
                  <th className="py-2 px-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-3 text-center text-slate-400">Loading consumption...</td>
                  </tr>
                ) : data?.rawMaterialConsumption && data.rawMaterialConsumption.length > 0 ? (
                  data.rawMaterialConsumption.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-medium text-slate-900">{m.materialName}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{m.plannedQty} {m.unit}</td>
                      <td className="py-2 px-3 text-right font-medium text-slate-900">{m.actualQty} {m.unit}</td>
                      <td className={`py-2 px-3 text-right font-bold ${Math.abs(m.variancePct) > 3.0 ? 'text-rose-600' : 'text-slate-600'}`}>
                        {m.variancePct > 0 ? `+${m.variancePct.toFixed(1)}%` : `${m.variancePct.toFixed(1)}%`}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-center text-slate-400">No consumption records available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Yield Variance Monitor */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Yield Variance Alerts by Run</span>
          </h3>

          <div className="divide-y divide-slate-100 text-xs max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-xs text-slate-400">Loading variances...</p>
            ) : data?.yieldVariances && data.yieldVariances.length > 0 ? (
              data.yieldVariances.map((y, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">{y.runNumber} - {y.productName}</span>
                    <span className="text-slate-500 block text-[11px]">Yield: {y.yieldPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${y.hasAlert ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {y.yieldVariancePercentage > 0 ? `+${y.yieldVariancePercentage.toFixed(1)}%` : `${y.yieldVariancePercentage.toFixed(1)}%`}
                    </span>
                    <span className="text-slate-400 block text-[10px]">{y.hasAlert ? 'ALERT (> 3%)' : 'NORMAL'}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No runs evaluated.</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Finished Goods In Stock */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-4 h-4 text-emerald-600" />
          <span>Finished Goods Warehouse Balances</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data?.finishedGoodsStock?.map((fg, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 text-xs">{fg.productName}</span>
                <span className="text-slate-500 block text-[11px]">Current Total: {fg.currentStock} pkts</span>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-emerald-600">{fg.availablePackets}</span>
                <span className="text-slate-400 block text-[10px]">Available for Order</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
