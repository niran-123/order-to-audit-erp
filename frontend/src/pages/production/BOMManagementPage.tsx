import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  productionService,
  BillOfMaterialDTO,
} from '../../services/productionService';
import { inventoryService } from '../../services/inventoryService';

export const BOMManagementPage: React.FC = () => {
  const [boms, setBoms] = useState<BillOfMaterialDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBOM, setSelectedBOM] = useState<BillOfMaterialDTO | null>(null);

  // Create BOM Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [packagingMaterials, setPackagingMaterials] = useState<any[]>([]);

  // Form fields
  const [productId, setProductId] = useState('');
  const [version, setVersion] = useState('V2.0');
  const [batchSize, setBatchSize] = useState(200);
  const [expectedOutput, setExpectedOutput] = useState(200);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<
    {
      itemType: 'RAW_MATERIAL' | 'PACKAGING_MATERIAL';
      materialId: string;
      standardQty: number;
      unitCode: string;
      expectedWastagePct: number;
    }[]
  >([
    {
      itemType: 'RAW_MATERIAL',
      materialId: 'inv-rm-rice-01',
      standardQty: 40,
      unitCode: 'KG',
      expectedWastagePct: 1,
    },
    {
      itemType: 'RAW_MATERIAL',
      materialId: 'inv-rm-oil-01',
      standardQty: 10,
      unitCode: 'LTR',
      expectedWastagePct: 0,
    },
    {
      itemType: 'RAW_MATERIAL',
      materialId: 'inv-rm-spice-01',
      standardQty: 1.2,
      unitCode: 'KG',
      expectedWastagePct: 0.5,
    },
    {
      itemType: 'PACKAGING_MATERIAL',
      materialId: 'inv-pm-pouch-01',
      standardQty: 200,
      unitCode: 'PCS',
      expectedWastagePct: 1,
    },
    {
      itemType: 'PACKAGING_MATERIAL',
      materialId: 'inv-pm-ctn-01',
      standardQty: 10,
      unitCode: 'PCS',
      expectedWastagePct: 0,
    },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bomData, fgBalances, rmBalances, pmBalances] = await Promise.all([
        productionService.listBOMs(),
        inventoryService.getBalances({ category: 'FINISHED_GOODS' }),
        inventoryService.getBalances({ category: 'RAW_MATERIAL' }),
        inventoryService.getBalances({ category: 'PACKAGING_MATERIAL' }),
      ]);
      setBoms(bomData);
      setProducts(fgBalances);
      setRawMaterials(rmBalances);
      setPackagingMaterials(pmBalances);
      if (bomData.length > 0 && !selectedBOM) {
        setSelectedBOM(bomData[0]);
      }
      if (fgBalances.length > 0 && !productId) {
        setProductId(fgBalances[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load BOM records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemType: 'RAW_MATERIAL',
        materialId: rawMaterials[0]?.id || 'inv-rm-rice-01',
        standardQty: 10,
        unitCode: 'KG',
        expectedWastagePct: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: val };
        if (field === 'materialId') {
          const mat =
            updated.itemType === 'RAW_MATERIAL'
              ? rawMaterials.find((r) => r.id === val)
              : packagingMaterials.find((p) => p.id === val);
          if (mat) updated.unitCode = mat.unitCode;
        }
        return updated;
      })
    );
  };

  const handleCreateBOMSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      alert('Please select a finished product');
      return;
    }

    try {
      await productionService.createBOM({
        productId,
        version,
        batchSize: Number(batchSize),
        batchUnit: 'PKT',
        expectedOutput: Number(expectedOutput),
        notes,
        items: items.map((i) => ({
          ...i,
          standardQty: Number(i.standardQty),
          expectedWastagePct: Number(i.expectedWastagePct),
        })),
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create BOM');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-purple-400" />
            Bill of Materials (BOM) Master Recipes
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Standard manufacturing ingredient formulations, packaging specifications, and unit batch costing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/production"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            ← Back to Production Floor
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Create New BOM
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Main Content Grid: BOM List & Selected BOM Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: BOM Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Product Formulations ({boms.length})
            </span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <p className="text-xs text-slate-500 py-6 text-center">Loading BOM recipes...</p>
            ) : boms.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No BOM recipes defined yet.</p>
            ) : (
              boms.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBOM(b)}
                className={`cursor-pointer rounded-xl p-4 border transition ${
                  selectedBOM?.id === b.id
                    ? 'bg-slate-850 border-purple-500 ring-1 ring-purple-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">{b.productName}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {b.version}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  BOM #{b.bomNumber}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">
                    Output: <strong className="text-white">{b.expectedOutput} {b.batchUnit}</strong>
                  </span>
                  <span className="text-emerald-400 font-bold">
                    ₹{b.costPerUnitOutput.toFixed(2)} / pkt
                  </span>
                </div>
              </div>
            ))
            )}
          </div>
        </div>

        {/* Right Column: Detailed Recipe Breakdown */}
        {selectedBOM && (
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{selectedBOM.productName}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                    {selectedBOM.version}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Formula #{selectedBOM.bomNumber} • Batch Size: {selectedBOM.batchSize} {selectedBOM.batchUnit} • Expected Output: {selectedBOM.expectedOutput} {selectedBOM.batchUnit}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Unit Cost / Packet</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">
                  ₹{selectedBOM.costPerUnitOutput.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Ingredients Table */}
            <div>
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Standard Batch Ingredients & Packaging Requirements
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Material Name & SKU</th>
                      <th className="py-2 px-3 text-right">Standard Qty</th>
                      <th className="py-2 px-3 text-right">Wastage %</th>
                      <th className="py-2 px-3 text-right">Prevailing Rate</th>
                      <th className="py-2 px-3 text-right font-bold text-white">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {selectedBOM.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-850/50">
                        <td className="py-2 px-3 whitespace-nowrap font-sans">
                          <span
                            className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                              item.itemType === 'RAW_MATERIAL'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-blue-500/10 text-blue-400'
                            }`}
                          >
                            {item.itemType === 'RAW_MATERIAL' ? 'Raw Mat' : 'Packaging'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-sans">
                          <div className="font-semibold text-white">{item.materialName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.materialCode}</div>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-200">
                          {item.standardQty} {item.unitCode}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">
                          {item.expectedWastagePct}%
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">
                          ₹{item.unitCost.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          ₹{item.lineCost.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cost Breakdown Summary */}
            <div className="grid grid-cols-3 gap-3 bg-slate-850 p-3.5 rounded-lg border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">
                  Direct Raw Materials
                </span>
                <span className="text-base font-bold text-white mt-0.5 block">
                  ₹{selectedBOM.totalRawMaterialCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">
                  Packaging Consumables
                </span>
                <span className="text-base font-bold text-white mt-0.5 block">
                  ₹{selectedBOM.totalPackagingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">
                  Total Batch Formula Cost
                </span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                  ₹{selectedBOM.totalBatchCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE NEW BOM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                Create New BOM Master Recipe
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBOMSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Select Product *
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.itemName} ({p.itemCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    BOM Version *
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. V2.0"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Expected Batch Output *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expectedOutput}
                    onChange={(e) => {
                      setExpectedOutput(Number(e.target.value));
                      setBatchSize(Number(e.target.value));
                    }}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              {/* Recipe Line Items */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    Ingredients & Packaging Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Ingredient
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800 items-center text-xs"
                    >
                      <div className="col-span-3">
                        <select
                          value={item.itemType}
                          onChange={(e) =>
                            handleItemChange(idx, 'itemType', e.target.value)
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
                            handleItemChange(idx, 'materialId', e.target.value)
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        >
                          {item.itemType === 'RAW_MATERIAL'
                            ? rawMaterials.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.itemName} ({r.itemCode})
                                </option>
                              ))
                            : packagingMaterials.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.itemName} ({p.itemCode})
                                </option>
                              ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          placeholder="Standard Qty"
                          value={item.standardQty}
                          onChange={(e) =>
                            handleItemChange(idx, 'standardQty', Number(e.target.value))
                          }
                          required
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="Wastage %"
                          value={item.expectedWastagePct}
                          onChange={(e) =>
                            handleItemChange(idx, 'expectedWastagePct', Number(e.target.value))
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Formula Notes & Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Traditional handmade dough recipe with 80-mesh steam cleaned flour..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Save BOM Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
