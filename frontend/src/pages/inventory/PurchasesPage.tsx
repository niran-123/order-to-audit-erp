import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  FileCheck,
  Trash2,
} from 'lucide-react';
import {
  inventoryService,
  PurchaseOrderDTO,
  CreatePurchaseRequest,
} from '../../services/inventoryService';
import { masterDataService } from '../../services/masterDataService';

export const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseOrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Creation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [packagingMaterials, setPackagingMaterials] = useState<any[]>([]);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [lineItems, setLineItems] = useState<
    {
      itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
      materialId: string;
      orderedQty: number;
      unitPrice: number;
      taxRate: number;
    }[]
  >([
    {
      itemType: 'RAW_MATERIAL',
      materialId: 'rm-rice-01',
      orderedQty: 60,
      unitPrice: 45,
      taxRate: 5,
    },
  ]);

  // Confirmation Prompt State
  const [confirmingPO, setConfirmingPO] = useState<PurchaseOrderDTO | null>(null);
  const [confirmInvoiceNo, setConfirmInvoiceNo] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getPurchases({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setPurchases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const loadMasterDataForPO = async () => {
    try {
      const [supData, rmData, pmData] = await Promise.all([
        masterDataService.getSuppliers({ limit: 50 }),
        masterDataService.getRawMaterials({ limit: 50 }),
        masterDataService.getPackagingMaterials({ limit: 50 }),
      ]);
      setSuppliers(supData.items || []);
      setRawMaterials(rmData.items || []);
      setPackagingMaterials(pmData.items || []);

      if (supData.items && supData.items.length > 0) {
        setSelectedSupplierId(supData.items[0].id);
      }
    } catch {
      // Fallback defaults
    }
  };

  useEffect(() => {
    loadPurchases();
    loadMasterDataForPO();
  }, [statusFilter]);

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        itemType: 'RAW_MATERIAL',
        materialId: rawMaterials[0]?.id || 'rm-rice-01',
        orderedQty: 10,
        unitPrice: 40,
        taxRate: 5,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: string, value: any) => {
    setLineItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        // If material changed, adjust default unit price
        if (field === 'materialId') {
          if (updated.itemType === 'RAW_MATERIAL') {
            const rm = rawMaterials.find((r) => r.id === value || r.code === value);
            if (rm) updated.unitPrice = rm.defaultPurchaseRate || rm.purchaseRate || 40;
          } else {
            const pm = packagingMaterials.find((p) => p.id === value || p.code === value);
            if (pm) updated.unitPrice = pm.purchaseRate || 2;
          }
        }
        return updated;
      })
    );
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((acc, curr) => acc + curr.orderedQty * curr.unitPrice, 0);
  };

  const calculateTax = () => {
    return lineItems.reduce(
      (acc, curr) => acc + (curr.orderedQty * curr.unitPrice * curr.taxRate) / 100,
      0
    );
  };

  const handleCreatePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert('Please select a supplier');
      return;
    }
    if (lineItems.length === 0) {
      alert('Please add at least one line item');
      return;
    }

    try {
      const payload: CreatePurchaseRequest = {
        supplierId: selectedSupplierId,
        supplierInvoiceNumber: supplierInvoiceNumber || undefined,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        items: lineItems.map((item) => ({
          itemType: item.itemType,
          materialId: item.materialId,
          orderedQty: Number(item.orderedQty),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate),
        })),
      };

      await inventoryService.createPurchase(payload);
      setIsModalOpen(false);
      loadPurchases();
    } catch (err: any) {
      alert(err.message || 'Failed to create purchase order');
    }
  };

  const handleConfirmPO = async (po: PurchaseOrderDTO) => {
    setConfirmingPO(po);
    setConfirmInvoiceNo(po.supplierInvoiceNumber || '');
  };

  const executeConfirmReceipt = async () => {
    if (!confirmingPO) return;
    try {
      setConfirmLoading(true);
      await inventoryService.confirmPurchase(confirmingPO.id, {
        supplierInvoiceNumber: confirmInvoiceNo || undefined,
      });
      setConfirmingPO(null);
      loadPurchases();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm purchase receipt');
    } finally {
      setConfirmLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CONFIRMED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'RECEIVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
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
            <Truck className="w-7 h-7 text-emerald-400" />
            Purchasing & Goods Receipt Notes (GRN)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Supplier purchase orders, inbound goods receipt, and automated inventory valuation updates
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            New Purchase Order
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Filter & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by PO#, Supplier, Invoice#, GRN#..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="RECEIVED">Received (GRN Posted)</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* PO Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">PO Number</th>
                <th className="py-2.5 px-3">Order Date</th>
                <th className="py-2.5 px-3">Supplier Name</th>
                <th className="py-2.5 px-3">Supplier Inv #</th>
                <th className="py-2.5 px-3">Line Items</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
                <th className="py-2.5 px-3 text-right">GST Tax</th>
                <th className="py-2.5 px-3 text-right font-bold text-white">Total Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">GRN Document</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-2.5 px-3 font-semibold font-mono text-white whitespace-nowrap">
                      {po.poNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(po.orderDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">
                      {po.supplierName}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {po.supplierInvoiceNumber || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {po.items.map((item, idx) => (
                        <div key={idx} className="text-[11px]">
                          {item.materialName}: {item.orderedQty} {item.unitCode} @ ₹{item.unitPrice}
                        </div>
                      ))}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      ₹{po.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      ₹{po.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      ₹{po.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          po.status
                        )}`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-blue-400 whitespace-nowrap">
                      {po.grnNumber ? (
                        <span className="flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {po.grnNumber}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Pending GRN</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {po.status === 'DRAFT' ? (
                        <button
                          onClick={() => handleConfirmPO(po)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition"
                          title="Confirm Goods Receipt & Recalculate Valuation"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          Confirm GRN
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PURCHASE ORDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" />
                Create New Purchase Order
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePOSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Select Supplier *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Supplier Invoice Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CAUV/2026/7821"
                    value={supplierInvoiceNumber}
                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Purchased Materials & Consumables
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Material
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800 items-center text-xs"
                    >
                      <div className="col-span-3">
                        <select
                          value={item.itemType}
                          onChange={(e) =>
                            handleLineItemChange(idx, 'itemType', e.target.value)
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        >
                          <option value="RAW_MATERIAL">Raw Material</option>
                          <option value="PACKAGING_MATERIAL">Packaging Material</option>
                        </select>
                      </div>

                      <div className="col-span-4">
                        <select
                          value={item.materialId}
                          onChange={(e) =>
                            handleLineItemChange(idx, 'materialId', e.target.value)
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        >
                          {item.itemType === 'RAW_MATERIAL'
                            ? rawMaterials.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name} ({r.code})
                                </option>
                              ))
                            : packagingMaterials.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.code})
                                </option>
                              ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          min="0.01"
                          step="any"
                          value={item.orderedQty}
                          onChange={(e) =>
                            handleLineItemChange(idx, 'orderedQty', Number(e.target.value))
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Rate (₹)"
                          min="0.01"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleLineItemChange(idx, 'unitPrice', Number(e.target.value))
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                          required
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Totals Summary */}
              <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-800 flex justify-end gap-6 text-xs font-mono">
                <div>
                  <span className="text-slate-400">Subtotal:</span>{' '}
                  <span className="text-white font-semibold">
                    ₹{calculateSubtotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">GST Tax:</span>{' '}
                  <span className="text-white font-semibold">
                    ₹{calculateTax().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Total:</span>{' '}
                  <span className="text-emerald-400 font-bold text-sm">
                    ₹{(calculateSubtotal() + calculateTax()).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM PURCHASE & GRN RECEIPT MODAL */}
      {confirmingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Confirm Inbound Goods Receipt (GRN)
                </h3>
                <p className="text-xs text-slate-400">
                  PO #{confirmingPO.poNumber} • {confirmingPO.supplierName}
                </p>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5">
              <div className="text-slate-300 font-medium">Receipt Inflow Actions:</div>
              <ul className="list-disc list-inside text-slate-400 space-y-1 text-[11px]">
                <li>Automatically increases inventory balances for all line items</li>
                <li>
                  Recalculates <strong className="text-white">Weighted-Average Cost</strong>
                </li>
                <li>Appends immutable transaction records to the Stock Ledger</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Supplier Delivery Invoice Number *
              </label>
              <input
                type="text"
                placeholder="e.g. CAUV/2026/7821"
                value={confirmInvoiceNo}
                onChange={(e) => setConfirmInvoiceNo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmingPO(null)}
                disabled={confirmLoading}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmReceipt}
                disabled={confirmLoading}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                {confirmLoading ? 'Processing Receipt...' : 'Confirm Receipt & Inflow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
