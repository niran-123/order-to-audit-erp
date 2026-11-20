import React from 'react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { DollarSign, Factory, Package, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Operations Cockpit</h2>
          <p className="text-xs text-slate-500 mt-0.5">High-level manufacturing throughput, stock valuation, and audit health.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/health"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-brand-600" />
            <span>Diagnostic Health</span>
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Gross Revenue (MTD)"
          value="₹ 1,48,20,000"
          delta={{ value: '12.4% vs last month', isPositive: true }}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricCard
          title="Shop-Floor OEE"
          value="84.6%"
          delta={{ value: '2.1% above target', isPositive: true }}
          icon={<Factory className="w-5 h-5" />}
        />
        <MetricCard
          title="Stock Valuation (WAC)"
          value="₹ 86,24,500"
          subtitle="RM: 58% | FG: 42%"
          icon={<Package className="w-5 h-5" />}
        />
        <MetricCard
          title="System Core Status"
          value="READY"
          subtitle="Audit Ledger Sealed"
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      {/* Active Workflows Status Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Industrial Order-to-Audit Pipeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">1. Sales Order</span>
            <span className="text-sm font-semibold text-slate-900 font-mono mt-1 block">SO-2026-90</span>
            <StatusBadge status="active" label="Confirmed" className="mt-2" />
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">2. BOM Recipe</span>
            <span className="text-sm font-semibold text-slate-900 font-mono mt-1 block">BOM-V1.0</span>
            <StatusBadge status="completed" label="Approved" className="mt-2" />
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">3. Production</span>
            <span className="text-sm font-semibold text-slate-900 font-mono mt-1 block">WO-8812</span>
            <StatusBadge status="in_progress" label="Stage 2 WIP" className="mt-2" />
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">4. Stock Ledger</span>
            <span className="text-sm font-semibold text-slate-900 font-mono mt-1 block">Double-Entry</span>
            <StatusBadge status="completed" label="Reconciled" className="mt-2" />
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">5. GST Billing</span>
            <span className="text-sm font-semibold text-slate-900 font-mono mt-1 block">INV-1104</span>
            <StatusBadge status="healthy" label="Posted" className="mt-2" />
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">6. Monthly Audit</span>
            <span className="text-sm font-semibold text-slate-900 font-mono mt-1 block">2026-10</span>
            <StatusBadge status="completed" label="Sealed" className="mt-2" />
          </div>
        </div>
      </div>

      {/* Quick Diagnostic Callout */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-brand-900">Backend Communication Channel Active</h4>
            <p className="text-[11px] text-brand-700">REST API Gateway mounted at <code>/api/v1</code> with PostgreSQL connection pooling.</p>
          </div>
        </div>
        <Link
          to="/health"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
        >
          <span>Run diagnostics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
