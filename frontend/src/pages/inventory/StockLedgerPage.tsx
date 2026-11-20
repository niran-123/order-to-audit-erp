import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  inventoryService,
  StockLedgerEntry,
  InventoryCategory,
} from '../../services/inventoryService';

export const StockLedgerPage: React.FC = () => {
  const [entries, setEntries] = useState<StockLedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<InventoryCategory | ''>('');
  const [movementType, setMovementType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLedger = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryService.getLedger({
        page,
        limit,
        search: search || undefined,
        category: category || undefined,
        movementType: movementType || undefined,
      });
      setEntries(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to load stock ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [page, category, movementType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLedger();
  };

  const exportCSV = () => {
    if (entries.length === 0) return;
    const headers = [
      'Transaction ID',
      'Timestamp',
      'Item Code',
      'Item Name',
      'Category',
      'Movement Type',
      'Qty In',
      'Qty Out',
      'Running Balance',
      'Unit Cost (INR)',
      'Total Value (INR)',
      'Source Document',
      'Performed By',
      'Notes',
    ];

    const rows = entries.map((e) => [
      e.transactionId,
      e.timestamp,
      e.itemCode,
      `"${e.itemName.replace(/"/g, '""')}"`,
      e.category,
      e.movementType,
      e.quantityIn,
      e.quantityOut,
      e.runningBalance,
      e.unitCost,
      e.totalValue,
      `"${e.sourceDocumentType} #${e.sourceDocumentId}"`,
      `"${e.performerName || e.performedBy}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'OPENING_BALANCE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'GRN_RECEIPT':
      case 'FG_RECEIPT':
      case 'PRODUCTION_RETURN':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PRODUCTION_ISSUE':
      case 'DISPATCH_OUT':
      case 'SCRAP_DISPOSAL':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'STOCK_ADJUSTMENT':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-400" />
            Stock Ledger & Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable perpetual inventory journal linking all transactions to source documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/inventory"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            ← Back to Overview
          </Link>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Txn ID, SKU, Item Name, PO#, Run#..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as any);
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Categories</option>
              <option value="RAW_MATERIAL">Raw Materials</option>
              <option value="PACKAGING_MATERIAL">Packaging Materials</option>
              <option value="WORK_IN_PROGRESS">Work In Progress (WIP)</option>
              <option value="FINISHED_GOODS">Finished Goods</option>
            </select>

            {/* Movement Type Filter */}
            <select
              value={movementType}
              onChange={(e) => {
                setMovementType(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Movement Types</option>
              <option value="OPENING_BALANCE">Opening Balance</option>
              <option value="GRN_RECEIPT">GRN Receipt (Procurement)</option>
              <option value="PRODUCTION_ISSUE">Production Issue</option>
              <option value="PRODUCTION_RETURN">Production Return</option>
              <option value="FG_RECEIPT">Finished Goods Receipt</option>
              <option value="DISPATCH_OUT">Dispatch Out (Sales)</option>
              <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
              <option value="SCRAP_DISPOSAL">Scrap Disposal</option>
            </select>

            <button
              onClick={() => {
                setSearch('');
                setCategory('');
                setMovementType('');
                setPage(1);
                loadLedger();
              }}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Item Name & SKU</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">In (+)</th>
                <th className="py-2.5 px-3 text-right">Out (-)</th>
                <th className="py-2.5 px-3 text-right font-bold text-white">Running Balance</th>
                <th className="py-2.5 px-3 text-right">Unit Rate</th>
                <th className="py-2.5 px-3 text-right">Txn Value</th>
                <th className="py-2.5 px-3">Source Document</th>
                <th className="py-2.5 px-3">Performer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500 font-sans">
                    Loading ledger movements...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500 font-sans">
                    No ledger entries match the criteria.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                      {entry.transactionId}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-slate-200">{entry.itemName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {entry.itemCode}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getMovementBadge(
                          entry.movementType
                        )}`}
                      >
                        {entry.movementType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">
                      {entry.quantityIn > 0 ? `+${entry.quantityIn.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-400">
                      {entry.quantityOut > 0 ? `-${entry.quantityOut.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-white text-sm bg-slate-800/30">
                      {entry.runningBalance.toLocaleString()} {entry.unitCode}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      ₹{entry.unitCost.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200 font-semibold">
                      ₹{entry.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-xs">
                      <div className="text-slate-300 font-medium font-mono">
                        {entry.sourceDocumentType}
                      </div>
                      <div className="text-[10px] text-brand-400 font-mono">
                        #{entry.sourceDocumentId}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[11px] text-slate-400">
                      {entry.performerName || entry.performedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
          <span>
            Showing {entries.length} of {total} transactions
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
