import React, { useState, useEffect } from 'react';
import { masterDataService } from '../../services/masterDataService';
import {
  Box,
  Search,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  PowerOff,
} from 'lucide-react';

export const PackagingMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    unitId: '',
    description: '',
    hsnCode: '',
    purchaseRate: 2.25,
    reorderLevel: 5000,
    safetyStock: 10000,
    status: 'ACTIVE',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [matData, unitData] = await Promise.all([
        masterDataService.getPackagingMaterials({ page, limit: 15, search }),
        masterDataService.getUnits({}),
      ]);
      setMaterials(matData.items);
      setTotal(matData.total);
      setUnits(unitData.items);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load packaging materials');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, search]);

  const handleOpenModal = (item?: any) => {
    setErrorMsg(null);
    if (item) {
      setEditingMaterial(item);
      setForm({ ...item });
    } else {
      setEditingMaterial(null);
      setForm({
        code: `PM-${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        unitId: units[0]?.id || '',
        description: '',
        hsnCode: '',
        purchaseRate: 2.25,
        reorderLevel: 5000,
        safetyStock: 10000,
        status: 'ACTIVE',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingMaterial) {
        await masterDataService.updatePackagingMaterial(editingMaterial.id, form);
        setSuccessMsg(`Packaging material ${form.name} updated.`);
      } else {
        await masterDataService.createPackagingMaterial(form);
        setSuccessMsg(`Packaging material ${form.name} registered.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate packaging material "${name}"?`)) return;
    try {
      await masterDataService.deactivatePackagingMaterial(id);
      setSuccessMsg(`Packaging material deactivated.`);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleExportCsv = async () => {
    try {
      await masterDataService.downloadCsv('packaging-materials');
    } catch (err: any) {
      setErrorMsg(err.message || 'CSV export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Box className="w-5 h-5 text-cyan-600" />
            <span>Packaging Material Catalog</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Primary flexible pouches, corrugated master shippers, oxygen barrier sachets, and sealing consumables.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Register Packaging Item</span>
          </button>
        </div>
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

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search code, packaging name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Total Items: <strong>{total}</strong>
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Material Code</th>
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">UOM</th>
                <th className="py-3 px-4">Purchase Rate</th>
                <th className="py-3 px-4">Reorder Level</th>
                <th className="py-3 px-4">Safety Buffer</th>
                <th className="py-3 px-4">HSN</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400">
                    Loading packaging materials...
                  </td>
                </tr>
              ) : (
                materials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-cyan-800">{m.code}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{m.description}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{m.unitCode}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ₹{m.purchaseRate.toFixed(2)} / {m.unitCode}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-700 font-semibold">
                      {m.reorderLevel.toLocaleString()} {m.unitCode}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {m.safetyStock.toLocaleString()} {m.unitCode}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{m.hsnCode || '—'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(m)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 mr-1"
                        title="Edit Item"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {m.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleDeactivate(m.id, m.name)}
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"
                          title="Deactivate Material"
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {total > 15 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Showing Page {page} of {Math.ceil(total / 15)}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= Math.ceil(total / 15)}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Packaging Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingMaterial ? `Edit Packaging: ${editingMaterial.code}` : 'Register Packaging Material'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Material Code *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    disabled={!!editingMaterial}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure *</label>
                  <select
                    value={form.unitId}
                    onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Item Description *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Murukku 200g 3-Ply Nitrogen Flush Pouch"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Rate (INR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.purchaseRate}
                    onChange={(e) => setForm({ ...form, purchaseRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level *</label>
                  <input
                    type="number"
                    required
                    value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Safety Stock Buffer</label>
                  <input
                    type="number"
                    value={form.safetyStock}
                    onChange={(e) => setForm({ ...form, safetyStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={form.hsnCode}
                    onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
                    placeholder="39232100"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Technical Specs</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg"
                >
                  {editingMaterial ? 'Update Item' : 'Save Packaging Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
