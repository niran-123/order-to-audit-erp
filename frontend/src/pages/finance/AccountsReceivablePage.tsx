import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Search,
  DollarSign,
} from 'lucide-react';
import {
  financeService,
  ReceivablesSummary,
} from '../../services/financeService';
import { Link } from 'react-router-dom';

export const AccountsReceivablePage: React.FC = () => {
  const [summary, setSummary] = useState<ReceivablesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bucketFilter, setBucketFilter] = useState<string>('ALL');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await financeService.getAccountsReceivable();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load accounts receivable:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredInvoices = (summary?.invoices || []).filter((inv) => {
    const matchesSearch =
      !searchQuery ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.soNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBucket = bucketFilter === 'ALL' || inv.ageingBucket === bucketFilter;
    return matchesSearch && matchesBucket;
  });

  const collectionRate =
    summary && summary.totalInvoiced > 0
      ? Number(((summary.totalCollected / summary.totalInvoiced) * 100).toFixed(1))
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-200">
              Credit Management & AR
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-mono">
              Ageing & Collections
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Accounts Receivable & Ageing Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor open invoices, customer outstanding exposure, collection efficiency, and 30-60-90 day ageing analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/payments"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" /> Go to Payment Receipts
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-rose-200 bg-rose-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase">Total Receivables</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">
            ₹{(summary?.totalReceivables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-rose-600">Outstanding customer balance</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Invoiced</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ₹{(summary?.totalInvoiced || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">Total billings across all accounts</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase">Total Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            ₹{(summary?.totalCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-600">Settled remittances received</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-brand-200 bg-brand-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-brand-700 uppercase">Collection Efficiency</span>
            <TrendingUp className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-black text-brand-700 mt-2">{collectionRate}%</p>
          <span className="text-[10px] text-brand-600">Collected vs Billed Ratio</span>
        </div>
      </div>

      {/* Real-time Ageing Analysis Grid (0-30, 31-60, 61-90, >90 days) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Statutory AR Ageing Analysis
            </h2>
            <p className="text-xs text-slate-500">
              Maturity profiling of unpaid accounts receivable categorized by aging bands.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700">
            Total Overdue: ₹{(summary?.totalReceivables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 0-30 Days */}
          <div
            onClick={() => setBucketFilter(bucketFilter === '0-30' ? 'ALL' : '0-30')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              bucketFilter === '0-30'
                ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Current (0–30 Days)</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                {summary?.ageingAnalysis.bucket0_30.count || 0} Invoices
              </span>
            </div>
            <p className="text-xl font-black text-slate-900 mt-2">
              ₹{(summary?.ageingAnalysis.bucket0_30.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    summary?.totalReceivables
                      ? Math.min(100, ((summary.ageingAnalysis.bucket0_30.amount || 0) / summary.totalReceivables) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* 31-60 Days */}
          <div
            onClick={() => setBucketFilter(bucketFilter === '31-60' ? 'ALL' : '31-60')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              bucketFilter === '31-60'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">31–60 Days</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                {summary?.ageingAnalysis.bucket31_60.count || 0} Invoices
              </span>
            </div>
            <p className="text-xl font-black text-slate-900 mt-2">
              ₹{(summary?.ageingAnalysis.bucket31_60.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    summary?.totalReceivables
                      ? Math.min(100, ((summary.ageingAnalysis.bucket31_60.amount || 0) / summary.totalReceivables) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* 61-90 Days */}
          <div
            onClick={() => setBucketFilter(bucketFilter === '61-90' ? 'ALL' : '61-90')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              bucketFilter === '61-90'
                ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-300'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">61–90 Days</span>
              <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-bold">
                {summary?.ageingAnalysis.bucket61_90.count || 0} Invoices
              </span>
            </div>
            <p className="text-xl font-black text-slate-900 mt-2">
              ₹{(summary?.ageingAnalysis.bucket61_90.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-orange-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    summary?.totalReceivables
                      ? Math.min(100, ((summary.ageingAnalysis.bucket61_90.amount || 0) / summary.totalReceivables) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Above 90 Days */}
          <div
            onClick={() => setBucketFilter(bucketFilter === '>90' ? 'ALL' : '>90')}
            className={`cursor-pointer p-4 rounded-xl border transition-all ${
              bucketFilter === '>90'
                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-300'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Above 90 Days</span>
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                {summary?.ageingAnalysis.bucketAbove90.count || 0} Invoices
              </span>
            </div>
            <p className="text-xl font-black text-rose-700 mt-2">
              ₹{(summary?.ageingAnalysis.bucketAbove90.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-rose-500 h-1.5 rounded-full"
                style={{
                  width: `${
                    summary?.totalReceivables
                      ? Math.min(100, ((summary.ageingAnalysis.bucketAbove90.amount || 0) / summary.totalReceivables) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Customer-wise Outstanding Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-5">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Customer Exposure & Outstanding Balances
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Customer Code</th>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Channel Type</th>
                <th className="py-2.5 px-3 text-right">Invoiced (₹)</th>
                <th className="py-2.5 px-3 text-right">Paid (₹)</th>
                <th className="py-2.5 px-3 text-right">Outstanding (₹)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {(summary?.customerBreakdown || []).map((c) => (
                <tr key={c.customerId} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-brand-600">{c.customerCode}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{c.customerName}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                      {c.customerType}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    ₹{c.totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700">
                    ₹{c.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                    ₹{c.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.status === 'CLEAR'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900">
            Invoice Aging Details ({filteredInvoices.length})
          </h2>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search invoice #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4 text-center">Aging Days</th>
                <th className="py-3 px-4 text-center">Aging Bucket</th>
                <th className="py-3 px-4 text-right">Invoice Total (₹)</th>
                <th className="py-3 px-4 text-right">Paid (₹)</th>
                <th className="py-3 px-4 text-right">Outstanding (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading receivables ledger...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No invoices matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">
                      {inv.invoiceNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        SO: {inv.soNumber}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{inv.customerName}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-center font-bold">
                      {inv.daysOutstanding} days
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-800">
                        {inv.ageingBucket} days
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      ₹{inv.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-rose-700">
                      ₹{inv.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
