import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sliders,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  inventoryService,
  InventoryItemState,
  StockLedgerEntry,
} from '../../services/inventoryService';

export const StockReconciliationPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItemState[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [physicalCount, setPhysicalCount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recent reconciliation movements
  const [recentAdjustments, setRecentAdjustments] = useState<StockLedgerEntry[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balances, ledgerRes] = await Promise.all([
        inventoryService.getBalances(),
        inventoryService.getLedger({ movementType: 'STOCK_ADJUSTMENT', limit: 10 }),
      ]);
      setItems(balances);
      setRecentAdjustments(ledgerRes.items);
      if (balances.length > 0 && !selectedItemId) {
        setSelectedItemId(balances[0].id);
        setPhysicalCount(balances[0].currentStock);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const currentStock = selectedItem ? selectedItem.currentStock : 0;
  const countNum = typeof physicalCount === 'number' ? physicalCount : 0;
  const variance = Number((countNum - currentStock).toFixed(4));

  const handleItemSelect = (id: string) => {
    setSelectedItemId(id);
    const item = items.find((i) => i.id === id);
    if (item) {
      setPhysicalCount(item.currentStock);
    }
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;
    if (physicalCount === '') {
      setErrorMessage('Please enter physical count');
      return;
    }
    if (variance === 0) {
      setErrorMessage('Physical count matches system stock exactly. No variance to adjust.');
      return;
    }
    if (!reason || reason.trim().length < 3) {
      setErrorMessage('Please provide a descriptive reason for this reconciliation (min 3 chars)');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      await inventoryService.reconcileStock({
        itemId: selectedItemId,
        physicalCount: Number(physicalCount),
        reason: reason.trim(),
      });
      setSuccessMessage(
        `Successfully posted stock adjustment for ${selectedItem?.itemName}. System balance synchronized to ${physicalCount} ${selectedItem?.unitCode}.`
      );
      setReason('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to post stock adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-7 h-7 text-amber-400" />
            Physical Stock Reconciliation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Reconcile physical warehouse counts with immutable STOCK_ADJUSTMENT ledger movements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/inventory"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            ← Back to Overview
          </Link>
          <Link
            to="/inventory/ledger"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            View Stock Ledger
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Reconciliation Tool */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
            Post Physical Count Adjustment
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            In compliance with ERP integrity standards, stock balances are never directly overwritten.
            Submitting a physical count automatically generates an immutable audit movement.
          </p>

          <form onSubmit={handleReconcileSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Select Item to Reconcile *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => handleItemSelect(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.category}] {item.itemName} ({item.itemCode}) — Stock: {item.currentStock} {item.unitCode}
                  </option>
                ))}
              </select>
            </div>

            {selectedItem && (
              <div className="grid grid-cols-3 gap-3 bg-slate-850 p-3.5 rounded-lg border border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    System Stock
                  </div>
                  <div className="text-base font-bold text-white font-mono mt-0.5">
                    {selectedItem.currentStock} {selectedItem.unitCode}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    Physical Count
                  </div>
                  <div className="text-base font-bold text-brand-400 font-mono mt-0.5">
                    {physicalCount === '' ? 0 : physicalCount} {selectedItem.unitCode}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Variance</div>
                  <div
                    className={`text-base font-bold font-mono mt-0.5 ${
                      variance === 0
                        ? 'text-slate-400'
                        : variance > 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {variance > 0 ? `+${variance}` : variance} {selectedItem.unitCode}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Physical Count Quantity *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={physicalCount}
                  onChange={(e) =>
                    setPhysicalCount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  required
                  placeholder="Enter counted stock"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Storage Bin / Location
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedItem?.storageLocation || 'N/A'}
                  className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Audit Reason & Discrepancy Explanation *
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Month-end cycle count variance; 5 kg package seal rupture damage identified during rack inspection..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || variance === 0}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                {submitting ? 'Posting Adjustment...' : 'Post Stock Adjustment'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Recent Reconciliation Audit Log */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-blue-400" />
              Recent Reconciliations
            </h3>
            <span className="text-[10px] text-slate-400">STOCK_ADJUSTMENT</span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                Loading reconciliation history...
              </p>
            ) : recentAdjustments.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No stock reconciliation adjustments recorded yet.
              </p>
            ) : (
              recentAdjustments.map((adj) => (
                <div
                  key={adj.id}
                  className="bg-slate-800/40 border border-slate-800 rounded-lg p-3 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{adj.itemName}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        adj.quantityIn > 0
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {adj.quantityIn > 0 ? `+${adj.quantityIn}` : `-${adj.quantityOut}`} {adj.unitCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Doc: <span className="text-brand-400 font-mono">{adj.sourceDocumentId}</span> • Post-Adj Stock:{' '}
                    <span className="text-white font-mono font-semibold">{adj.runningBalance} {adj.unitCode}</span>
                  </div>
                  {adj.notes && (
                    <div className="text-[10px] text-slate-500 italic bg-slate-800/50 p-1.5 rounded">
                      {adj.notes}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>By: {adj.performerName || adj.performedBy}</span>
                    <span>{new Date(adj.timestamp).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
