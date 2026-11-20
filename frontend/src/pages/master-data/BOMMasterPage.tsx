import React, { useState, useEffect } from 'react';
import { masterDataService } from '../../services/masterDataService';
import {
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Wheat,
  Box,
} from 'lucide-react';

export const BOMMasterPage: React.FC = () => {
  const [boms, setBOMs] = useState<any[]>([]);
  const [selectedBOM, setSelectedBOM] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [packMaterials, setPackMaterials] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New BOM Form State
  const [form, setForm] = useState({
    bomNumber: 'BOM-MUR-200G-V2',
    productId: '',
    version: 'V2.0',
    batchSize: 100,
    unitId: '',
    status: 'ACTIVE',
    items: [
      { itemType: 'RAW_MATERIAL', materialId: '', standardQty: 65, scrapPercentage: 1, unitId: '' },
      { itemType: 'PACKAGING_MATERIAL', materialId: '', standardQty: 500, scrapPercentage: 1.5, unitId: '' },
    ],
  });

  const loadData = async () => {
    try {
      const [bomData, prodData, rmData, pmData, unitData] = await Promise.all([
        masterDataService.getBOMs({ limit: 20 }),
        masterDataService.getProducts({ limit: 50 }),
        masterDataService.getRawMaterials({ limit: 50 }),
        masterDataService.getPackagingMaterials({ limit: 50 }),
        masterDataService.getUnits({ limit: 50 }),
      ]);
      setBOMs(bomData.items);
      if (bomData.items.length > 0) {
        setSelectedBOM(bomData.items[0]);
      }
      setProducts(prodData.items);
      setRawMaterials(rmData.items);
      setPackMaterials(pmData.items);
      setUnits(unitData.items);

      if (prodData.items.length > 0 && rmData.items.length > 0 && unitData.items.length > 0) {
        setForm((prev) => ({
          ...prev,
          productId: prodData.items[0].id,
          unitId: unitData.items[0].id,
          items: [
            { itemType: 'RAW_MATERIAL', materialId: rmData.items[0].id, standardQty: 65, scrapPercentage: 1, unitId: unitData.items[0].id },
            { itemType: 'PACKAGING_MATERIAL', materialId: pmData.items[0]?.id || '', standardQty: 500, scrapPercentage: 1.5, unitId: unitData.items[4]?.id || unitData.items[0].id },
          ],
        }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load BOMs');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItemLine = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemType: 'RAW_MATERIAL',
          materialId: rawMaterials[0]?.id || '',
          standardQty: 10,
          scrapPercentage: 0.5,
          unitId: units[0]?.id || '',
        },
      ],
    }));
  };

  const handleRemoveItemLine = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleSaveBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const created = await masterDataService.createBOM(form);
      setSuccessMsg(`BOM ${created.bomNumber} formula successfully registered.`);
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
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <span>Bill of Materials (BOM) Master Engineering</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manufacturing formulas, ingredient ratios, scrap allowances, and unit production cost breakdowns.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Engineer New BOM</span>
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

      {/* Formula Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700">Select Production Formula:</span>
          <div className="flex gap-2">
            {boms.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBOM(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                  selectedBOM?.id === b.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {b.bomNumber} ({b.version})
              </button>
            ))}
          </div>
        </div>

        {selectedBOM && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Linked Product:</span>
            <span className="text-xs font-bold text-slate-900 bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              {selectedBOM.productName} ({selectedBOM.productCode})
            </span>
          </div>
        )}
      </div>

      {selectedBOM && (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Batch Size</span>
              <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                {selectedBOM.batchSize} {selectedBOM.unitCode}
              </div>
              <span className="text-[10px] text-slate-400">Yields 500 Packets</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Raw Material Cost</span>
              <div className="text-lg font-bold text-amber-700 mt-1 font-mono">
                ₹{selectedBOM.totalRawMaterialCost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-400">Flours, oil, seasonings</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Packaging Cost</span>
              <div className="text-lg font-bold text-cyan-700 mt-1 font-mono">
                ₹{selectedBOM.totalPackagingCost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-400">Pouches & cartons</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Batch Cost</span>
              <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                ₹{selectedBOM.totalBatchCost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-400">Direct material cost</span>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-200 shadow-sm">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">Unit Cost / Packet</span>
              <div className="text-xl font-bold text-indigo-700 mt-1 font-mono">
                ₹{selectedBOM.costPerUnit?.toFixed(3)}
              </div>
              <span className="text-[10px] text-indigo-800 font-medium">MRP ₹65.00 | Trade ₹55.00</span>
            </div>
          </div>

          {/* Recipe Items Breakdown Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recipe Ingredients & Packaging Allocations
                </h3>
                <p className="text-[11px] text-slate-500">
                  Exact bill-of-materials line items for batch execution on shop-floor.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
                {selectedBOM.items?.length || 0} Components
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Line #</th>
                    <th className="py-3 px-4">Component Type</th>
                    <th className="py-3 px-4">Material Code & Name</th>
                    <th className="py-3 px-4">Standard Qty</th>
                    <th className="py-3 px-4">Scrap %</th>
                    <th className="py-3 px-4">Standard Rate</th>
                    <th className="py-3 px-4 text-right">Line Material Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {selectedBOM.items?.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.itemType === 'RAW_MATERIAL'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-cyan-100 text-cyan-900'
                          }`}
                        >
                          {item.itemType === 'RAW_MATERIAL' ? (
                            <Wheat className="w-3 h-3" />
                          ) : (
                            <Box className="w-3 h-3" />
                          )}
                          <span>{item.itemType === 'RAW_MATERIAL' ? 'Raw Ingredient' : 'Packaging'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-800 text-[11px]">{item.materialCode}</div>
                        <div className="text-slate-900 font-medium">{item.materialName}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {item.standardQty} {item.unitCode}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {item.scrapPercentage > 0 ? (
                          <span className="text-rose-600 font-semibold">+{item.scrapPercentage}%</span>
                        ) : (
                          <span className="text-slate-400">0.0%</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        ₹{item.unitCost?.toFixed(2)} / {item.unitCode}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                        ₹{item.lineCost?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Engineer BOM Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-base font-bold text-slate-900">Engineer New Bill of Materials (BOM)</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveBOM} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">BOM Number *</label>
                  <input
                    type="text"
                    required
                    value={form.bomNumber}
                    onChange={(e) => setForm({ ...form, bomNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Version *</label>
                  <input
                    type="text"
                    required
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Manufactured Product *</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Sizing *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      value={form.batchSize}
                      onChange={(e) => setForm({ ...form, batchSize: parseFloat(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                    />
                    <select
                      value={form.unitId}
                      onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                      className="w-28 px-2 py-2 text-xs border border-slate-300 rounded-lg"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Dynamic List */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800">Formula Line Items</h4>
                  <button
                    type="button"
                    onClick={handleAddItemLine}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center gap-3 text-xs"
                    >
                      <select
                        value={item.itemType}
                        onChange={(e) => {
                          const newType = e.target.value as any;
                          const defaultMatId = newType === 'RAW_MATERIAL' ? rawMaterials[0]?.id : packMaterials[0]?.id;
                          const updated = [...form.items];
                          updated[idx] = { ...updated[idx], itemType: newType, materialId: defaultMatId };
                          setForm({ ...form, items: updated });
                        }}
                        className="px-2 py-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value="RAW_MATERIAL">Raw Material</option>
                        <option value="PACKAGING_MATERIAL">Packaging</option>
                      </select>

                      <select
                        value={item.materialId}
                        onChange={(e) => {
                          const updated = [...form.items];
                          updated[idx] = { ...updated[idx], materialId: e.target.value };
                          setForm({ ...form, items: updated });
                        }}
                        className="flex-1 px-2 py-1.5 border border-slate-300 rounded bg-white"
                      >
                        {item.itemType === 'RAW_MATERIAL'
                          ? rawMaterials.map((rm) => (
                              <option key={rm.id} value={rm.id}>
                                {rm.code} - {rm.name}
                              </option>
                            ))
                          : packMaterials.map((pm) => (
                              <option key={pm.id} value={pm.id}>
                                {pm.code} - {pm.name}
                              </option>
                            ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.standardQty}
                          onChange={(e) => {
                            const updated = [...form.items];
                            updated[idx] = { ...updated[idx], standardQty: parseFloat(e.target.value) || 0 };
                            setForm({ ...form, items: updated });
                          }}
                          className="w-16 px-2 py-1.5 border border-slate-300 rounded bg-white text-center font-mono"
                        />
                        <input
                          type="number"
                          placeholder="Scrap %"
                          value={item.scrapPercentage}
                          onChange={(e) => {
                            const updated = [...form.items];
                            updated[idx] = { ...updated[idx], scrapPercentage: parseFloat(e.target.value) || 0 };
                            setForm({ ...form, items: updated });
                          }}
                          className="w-16 px-2 py-1.5 border border-slate-300 rounded bg-white text-center font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveItemLine(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                >
                  Save BOM Formula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
