import React, { useState, useEffect } from 'react';
import { masterDataService } from '../../services/masterDataService';
import {
  Scale,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Calculator,
} from 'lucide-react';

export const UnitsAndConversionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'units' | 'conversions'>('units');
  const [units, setUnits] = useState<any[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isConvModalOpen, setIsConvModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Conversion Calculator State
  const [calcQty, setCalcQty] = useState<number>(100);
  const [calcFrom, setCalcFrom] = useState<string>('KG');
  const [calcTo, setCalcTo] = useState<string>('G');
  const [calcResult, setCalcResult] = useState<number | null>(100000);

  const [unitForm, setUnitForm] = useState({
    code: '',
    name: '',
    symbol: '',
    unitType: 'WEIGHT',
    isBaseUnit: false,
    status: 'ACTIVE',
  });

  const [convForm, setConvForm] = useState({
    fromUnitId: '',
    toUnitId: '',
    multiplier: 1,
    productId: '',
  });

  const loadData = async () => {
    try {
      const [uData, cData] = await Promise.all([
        masterDataService.getUnits({ limit: 50 }),
        masterDataService.getConversions(),
      ]);
      setUnits(uData.items);
      setConversions(cData);
      if (uData.items.length >= 2 && !convForm.fromUnitId) {
        setConvForm({
          fromUnitId: uData.items[0].id,
          toUnitId: uData.items[1].id,
          multiplier: 1000,
          productId: '',
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load units data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculate = async () => {
    try {
      const res = await masterDataService.convertUnits(calcQty, calcFrom, calcTo);
      setCalcResult(res.convertedQty);
    } catch (err: any) {
      setErrorMsg(err.message || 'Conversion calculation error');
    }
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await masterDataService.createUnit(unitForm);
      setSuccessMsg(`Unit ${unitForm.code} created.`);
      setIsUnitModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleSaveConv = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await masterDataService.createConversion({
        ...convForm,
        productId: convForm.productId || null,
      });
      setSuccessMsg(`Unit conversion registered.`);
      setIsConvModalOpen(false);
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
            <Scale className="w-5 h-5 text-violet-600" />
            <span>Units of Measurement & Conversions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard metric weight, volumetric, packaging count units, and relational conversion mathematics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'units' ? (
            <button
              onClick={() => setIsUnitModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Define Unit</span>
            </button>
          ) : (
            <button
              onClick={() => setIsConvModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Conversion</span>
            </button>
          )}
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

      {/* Interactive Conversion Calculator Card */}
      <div className="bg-gradient-to-r from-violet-900 to-indigo-900 rounded-xl p-4 text-white shadow-md border border-violet-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-700/60 flex items-center justify-center text-violet-200">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-violet-100">Interactive Conversion Engine</h4>
              <p className="text-[11px] text-violet-300">Test mathematical conversions in real time across units.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <input
              type="number"
              value={calcQty}
              onChange={(e) => setCalcQty(parseFloat(e.target.value) || 0)}
              className="w-20 px-2.5 py-1.5 rounded-lg bg-white/10 border border-violet-600 text-white font-mono text-center focus:outline-none"
            />
            <select
              value={calcFrom}
              onChange={(e) => setCalcFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-violet-800 border border-violet-600 text-white font-mono focus:outline-none"
            >
              <option value="KG">KG</option>
              <option value="G">G</option>
              <option value="LTR">LTR</option>
              <option value="ML">ML</option>
              <option value="CTN">CTN</option>
              <option value="PKT">PKT</option>
            </select>
            <span className="text-violet-300 font-bold">➔</span>
            <select
              value={calcTo}
              onChange={(e) => setCalcTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-violet-800 border border-violet-600 text-white font-mono focus:outline-none"
            >
              <option value="G">G</option>
              <option value="KG">KG</option>
              <option value="ML">ML</option>
              <option value="LTR">LTR</option>
              <option value="PKT">PKT</option>
            </select>
            <button
              onClick={handleCalculate}
              className="px-3 py-1.5 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-lg shadow-sm"
            >
              Calculate
            </button>
            {calcResult !== null && (
              <span className="ml-2 font-mono font-bold text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-500/30">
                = {calcResult.toLocaleString()} {calcTo}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('units')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'units'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Units of Measure ({units.length})
        </button>
        <button
          onClick={() => setActiveTab('conversions')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'conversions'
              ? 'border-violet-600 text-violet-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Conversion Matrix ({conversions.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'units' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Unit Name</th>
                <th className="py-3 px-4">Symbol</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Base Unit Flag</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {units.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-violet-800">{u.code}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600">{u.symbol}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {u.unitType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {u.isBaseUnit ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        Base Unit
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Derived</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">From Unit</th>
                <th className="py-3 px-4">To Unit</th>
                <th className="py-3 px-4">Multiplier</th>
                <th className="py-3 px-4">Formula Representation</th>
                <th className="py-3 px-4">Scope / Product Specific</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {conversions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.fromUnitCode}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.toUnitCode}</td>
                  <td className="py-3 px-4 font-mono font-bold text-violet-700">{c.multiplier}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    1 {c.fromUnitCode} = {c.multiplier} {c.toUnitCode}
                  </td>
                  <td className="py-3 px-4">
                    {c.productName ? (
                      <span className="px-2 py-0.5 rounded text-[11px] bg-amber-100 text-amber-900 font-medium">
                        {c.productName}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Universal Global Conversion</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Define Unit Modal */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Define Unit of Measure</h3>
              <button onClick={() => setIsUnitModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveUnit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Code (Uppercase) *</label>
                <input
                  type="text"
                  required
                  value={unitForm.code}
                  onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. BDL"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Name *</label>
                <input
                  type="text"
                  required
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  placeholder="e.g. Bundle"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Symbol *</label>
                <input
                  type="text"
                  required
                  value={unitForm.symbol}
                  onChange={(e) => setUnitForm({ ...unitForm, symbol: e.target.value })}
                  placeholder="e.g. bdl"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Type *</label>
                <select
                  value={unitForm.unitType}
                  onChange={(e) => setUnitForm({ ...unitForm, unitType: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  <option value="WEIGHT">Weight</option>
                  <option value="VOLUME">Volume</option>
                  <option value="COUNT">Count / Packaging</option>
                </select>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg"
                >
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Conversion Modal */}
      {isConvModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add Unit Conversion</h3>
              <button onClick={() => setIsConvModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSaveConv} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">From Unit *</label>
                <select
                  value={convForm.fromUnitId}
                  onChange={(e) => setConvForm({ ...convForm, fromUnitId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} ({u.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">To Unit *</label>
                <select
                  value={convForm.toUnitId}
                  onChange={(e) => setConvForm({ ...convForm, toUnitId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.code} ({u.name})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Multiplier *</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={convForm.multiplier}
                  onChange={(e) => setConvForm({ ...convForm, multiplier: parseFloat(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsConvModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg"
                >
                  Save Conversion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
