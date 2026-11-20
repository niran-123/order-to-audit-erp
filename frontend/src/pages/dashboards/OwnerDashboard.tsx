import React, { useState, useEffect } from 'react';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  DollarSign,
  Factory,
  Package,
  AlertTriangle,
  Clock,
  Boxes,
  Activity,
  Calendar,
  Layers,
} from 'lucide-react';
import { ReportService, OwnerDashboardData } from '../../services/reportService';

export const OwnerDashboard: React.FC = () => {
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await ReportService.getOwnerDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load owner dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Cockpit (Owner)</h2>
            <StatusBadge status="healthy" label="Real-time BI Data" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic executive overview of sales velocity, manufacturing yield, inventory capitalization, and collections.
          </p>
        </div>
      </div>

      {/* Row 1: Core Financial & Production KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sales Revenue"
          value={data ? `₹ ${data.totalSalesRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '...'}
          subtitle={data ? `Today: ₹ ${data.todaySalesAmount.toFixed(2)} (${data.todayOrdersCount} orders)` : 'Loading...'}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <MetricCard
          title="Total Production Output"
          value={data ? `${data.totalProductionGoodPackets} pkts` : '...'}
          subtitle="Benchmark Murukku 200g"
          icon={<Factory className="w-5 h-5 text-brand-600" />}
        />
        <MetricCard
          title="Cost Per Packet"
          value={data ? `₹ ${data.benchmarkCostPerPacket.toFixed(4)}` : '...'}
          subtitle="Absorption Cost (Ind AS 2)"
          icon={<Activity className="w-5 h-5 text-indigo-600" />}
        />
        <MetricCard
          title="Outstanding Receivables"
          value={data ? `₹ ${data.totalOutstandingReceivables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '...'}
          subtitle="Active customer balances"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Row 2: Inventory & Working Capital Assets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available FG Stock</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{data?.availableFinishedGoodsPackets ?? 0}</span>
            <span className="text-xs text-slate-500">packets ready for dispatch</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Directly decremented upon confirmed dispatch challans</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Raw Material Valuation</span>
            <Boxes className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹ {data ? data.rawMaterialValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Weighted-average inventory valuation basis</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Packaging Valuation</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹ {data ? data.packagingMaterialValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pouches, corrugated cartons, packing tapes</p>
        </div>
      </div>

      {/* Row 3: Alerts & Variance Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Inventory Low-Stock Alerts</h3>
            </div>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
              {data?.lowStockAlertsCount || 0} flagged
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400">Loading alerts...</p>
          ) : data?.lowStockItems && data.lowStockItems.length > 0 ? (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {data.lowStockItems.map((item) => (
                <div key={item.code} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{item.name}</span>
                    <span className="text-slate-500 block text-[11px]">
                      Code: {item.code} | Category: {item.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-600">
                      {item.stock} {item.unit}
                    </span>
                    <span className="text-slate-400 block text-[11px]">Reorder at: {item.reorderLevel} {item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-600 font-medium">All material stock levels healthy.</p>
          )}
        </div>

        {/* Production Variance Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">Production Variance Alerts (&gt; 3% Threshold)</h3>
            </div>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-200">
              {data?.productionVarianceAlertsCount || 0} alerts
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400">Loading alerts...</p>
          ) : data?.activeVarianceAlerts && data.activeVarianceAlerts.length > 0 ? (
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {data.activeVarianceAlerts.map((v, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{v.runNumber} - {v.productName}</span>
                    <span className="text-slate-500 block text-[11px]">{v.description}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${v.variancePct > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {v.variancePct > 0 ? `+${v.variancePct.toFixed(1)}%` : `${v.variancePct.toFixed(1)}%`}
                    </span>
                    <span className="text-slate-400 block text-[11px]">{v.metric}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-600 font-medium">No production variance exceptions detected.</p>
          )}
        </div>
      </div>

      {/* Row 4: Monthly Sales Trends */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">Monthly Sales Trends (Trailing 6 Months)</h3>
          </div>
          <span className="text-xs text-slate-500">Computed dynamically from GST Invoices</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {data?.monthlySalesTrends?.map((m) => (
            <div key={m.month} className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
              <span className="text-xs font-semibold text-slate-600 block">{m.month}</span>
              <span className="text-sm font-bold text-slate-900 mt-1 block">
                ₹ {m.salesAmount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">{m.ordersCount} orders</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
