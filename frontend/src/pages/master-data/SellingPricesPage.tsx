import React, { useState, useEffect } from 'react';
import { masterDataService } from '../../services/masterDataService';
import {
  Tag,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export const SellingPricesPage: React.FC = () => {
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    productId: '',
    customerType: 'RETAILER',
    tierName: '',
    price: 52.0,
    minQty: 50,
    effectiveFrom: new Date().toISOString(),
    status: 'ACTIVE',
  });

  const loadData = async () => {
    try {
      const [prices, prods] = await Promise.all([
        masterDataService.getSellingPrices(selectedProduct || undefined),
        masterDataService.getProducts({ limit: 50 }),
      ]);
      setPricingTiers(prices);
      setProducts(prods.items);
      if (prods.items.length > 0 && !form.productId) {
        setForm((prev) => ({ ...prev, productId: prods.items[0].id }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load pricing');
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProduct]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await masterDataService.createSellingPrice(form);
      setSuccessMsg(`Price tier ${form.tierName} registered.`);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-rose-600" />
            <span>Selling Price List Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain wholesale volume pricing, distributor contracts, and minimum order commitments.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Price Tier</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-800">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-3.5 h-3.5 text-rose-600" />
          </button>
        </div>
      )}

      {/* Filter by Product */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700">Filter by Product:</span>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white"
          >
            <option value="">All Manufactured Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Active Tiers: <strong>{pricingTiers.length}</strong>
        </span>
      </div>

      {/* Pricing Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Tier Name</th>
              <th className="py-3 px-4">Target Channel</th>
              <th className="py-3 px-4">Min Order Commitment</th>
              <th className="py-3 px-4">Contract Price (INR)</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {pricingTiers.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4 font-medium text-slate-900">
                  <div className="font-bold text-amber-800 font-mono text-[11px]">{t.productCode}</div>
                  <div>{t.productName}</div>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-800">{t.tierName}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      t.customerType === 'DISTRIBUTOR'
                        ? 'bg-purple-100 text-purple-800'
                        : t.customerType === 'RETAILER'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t.customerType}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono font-medium text-slate-700">
                  {t.minQty.toLocaleString()} Packets
                </td>
                <td className="py-3 px-4 font-mono font-bold text-rose-700 text-sm">
                  ₹{t.price.toFixed(2)}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Register Price Tier</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Product *</label>
                <select
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Channel *</label>
                <select
                  value={form.customerType}
                  onChange={(e) => setForm({ ...form, customerType: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="ALL">All Customers (Base)</option>
                  <option value="RETAILER">Retailer</option>
                  <option value="DISTRIBUTOR">Distributor / Wholesaler</option>
                  <option value="INSTITUTIONAL">Modern Trade / Supermarket</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tier Name *</label>
                <input
                  type="text"
                  required
                  value={form.tierName}
                  onChange={(e) => setForm({ ...form, tierName: e.target.value })}
                  placeholder="e.g. Festival Volume Tier (20+ Cartons)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Price (INR) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Min Order Quantity (Pkts)</label>
                <input
                  type="number"
                  value={form.minQty}
                  onChange={(e) => setForm({ ...form, minQty: parseFloat(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg"
                >
                  Save Tier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
