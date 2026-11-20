import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Layers,
  AlertTriangle,
  DollarSign,
  Search,
  Plus,
  RefreshCw,
  FileText,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import {
  inventoryService,
  InventoryItemState,
  InventoryDashboardSummary,
  InventoryCategory,
} from '../../services/inventoryService';

export const InventoryDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<InventoryDashboardSummary | null>(null);
  const [balances, setBalances] = useState<InventoryItemState[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashData, balanceData] = await Promise.all([
        inventoryService.getDashboard(),
        inventoryService.getBalances({
          category: selectedCategory === 'ALL' ? undefined : selectedCategory,
          search: search || undefined,
        }),
      ]);
      setSummary(dashData);
      setBalances(balanceData);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const getCategoryBadgeColor = (cat: InventoryCategory) => {
    switch (cat) {
      case 'RAW_MATERIAL':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PACKAGING_MATERIAL':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'WORK_IN_PROGRESS':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'FINISHED_GOODS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const formatCategoryName = (cat: InventoryCategory) => {
    switch (cat) {
      case 'RAW_MATERIAL':
        return 'Raw Materials';
      case 'PACKAGING_MATERIAL':
        return 'Packaging Materials';
      case 'WORK_IN_PROGRESS':
        return 'Work In Progress (WIP)';
      case 'FINISHED_GOODS':
        return 'Finished Goods';
      default:
        return cat;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-brand-500" />
            Inventory & Stock Valuation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time stock ledger, weighted-average costing, and 4-tier material segregation
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/inventory/reconcile"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            Physical Reconciliation
          </Link>
          <Link
            to="/inventory/ledger"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Stock Ledger
          </Link>
          <Link
            to="/inventory/purchases"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            New Purchase Order
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="underline text-xs ml-4">
            Retry
          </button>
        </div>
      )}

      {/* Top High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Inventory Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              ₹{(summary?.totalInventoryValuation ?? 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Weighted-Average Cost valuation</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Active Stock SKUs
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {summary?.totalActiveItems ?? 0}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Across all 4 material categories</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-400 tracking-tight">
              {summary?.totalLowStockItems ?? 0}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Below defined reorder thresholds</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Stock Invariant Formula
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-semibold text-purple-300 tracking-tight font-mono">
              Opn + Rec - Iss - Sales ± Adj = Cls
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Strict ledger integrity preserved</p>
          </div>
        </div>
      </div>

      {/* 4 Category Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary?.categorySummaries.map((cat) => (
          <div
            key={cat.category}
            onClick={() => setSelectedCategory(cat.category)}
            className={`cursor-pointer rounded-xl p-4 border transition ${
              selectedCategory === cat.category
                ? 'bg-slate-850 border-brand-500 shadow-md ring-1 ring-brand-500/30'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryBadgeColor(
                  cat.category
                )}`}
              >
                {formatCategoryName(cat.category)}
              </span>
              <span className="text-xs text-slate-400">{cat.itemCount} Items</span>
            </div>
            <div className="text-lg font-bold text-white mt-1">
              ₹{cat.totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>Total Qty: {cat.totalStockQuantity.toLocaleString()}</span>
              {cat.lowStockCount > 0 ? (
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {cat.lowStockCount} Low
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">Optimal</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                'ALL',
                'RAW_MATERIAL',
                'PACKAGING_MATERIAL',
                'WORK_IN_PROGRESS',
                'FINISHED_GOODS',
              ] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedCategory(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedCategory === tab
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                {tab === 'ALL'
                  ? 'All Categories'
                  : formatCategoryName(tab as InventoryCategory)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by SKU, item name, bin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title="Search"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Stock Balances Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Item / SKU</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Opening</th>
                <th className="py-2.5 px-3 text-right">Receipts (+)</th>
                <th className="py-2.5 px-3 text-right">Issues (-)</th>
                <th className="py-2.5 px-3 text-right">Sales (-)</th>
                <th className="py-2.5 px-3 text-right">Adj (±)</th>
                <th className="py-2.5 px-3 text-right font-bold text-white">Closing Balance</th>
                <th className="py-2.5 px-3 text-right">Unit Rate</th>
                <th className="py-2.5 px-3 text-right">Total Value</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    Loading inventory records...
                  </td>
                </tr>
              ) : balances.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    No items matching your criteria.
                  </td>
                </tr>
              ) : (
                balances.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{item.itemName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.itemCode} • {item.storageLocation}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getCategoryBadgeColor(
                          item.category
                        )}`}
                      >
                        {formatCategoryName(item.category)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {item.openingBalance.toLocaleString()} {item.unitCode}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                      +{item.totalReceipts.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                      -{item.totalIssues.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-400">
                      -{item.totalSalesDispatched.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {item.totalAdjustments >= 0 ? `+${item.totalAdjustments}` : item.totalAdjustments}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white text-sm bg-slate-800/30">
                      {item.currentStock.toLocaleString()} {item.unitCode}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      ₹{item.averageCost.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400">
                      ₹{item.totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Normal
                        </span>
                      )}
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
