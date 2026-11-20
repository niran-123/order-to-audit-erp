import React, { useState, useEffect } from 'react';
import {
  Factory,
  Layers,
  TrendingUp,
  Scale,
  ShieldCheck,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import {
  financeService,
  ProductionCosting,
  ProductProfitability,
} from '../../services/financeService';

export const ProductionCostingPage: React.FC = () => {
  const [costing, setCosting] = useState<ProductionCosting | null>(null);
  const [profitability, setProfitability] = useState<ProductProfitability | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [costData, profitData] = await Promise.all([
        financeService.getProductionCosting(),
        financeService.getProductProfitability(),
      ]);
      setCosting(costData);
      setProfitability(profitData);
    } catch (err: any) {
      console.error('Failed to load production costing:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider border border-amber-200">
              Management Cost Accounting
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-mono">
              Ind AS 2 / IAS 2 Standard
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Production Costing & Profitability
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Actual raw-material weighted-average cost valuation, manufacturing overhead absorption, and unit cost per sound finished packet.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white">
            Run: {costing?.runNumber || 'RUN-2026-00101'}
          </span>
        </div>
      </div>

      {/* Accounting Methodology Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg border border-slate-700 space-y-3">
        <div className="flex items-center gap-2 text-brand-400">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Cost Accounting Standard & Methodology (Ind AS 2 / IAS 2 Compliance)
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>1. Direct Material Valuation:</strong> Materials issued are valued using the <strong>prevailing Weighted-Average Cost (WAC)</strong> recorded in the perpetual inventory ledger at the time of consumption.
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>2. Manufacturing Overhead Absorption:</strong> Conversion overheads (Direct Labour ₹1,200.00 and Process Gas/Power ₹600.00) are absorbed directly by the batch run using discrete process tracing.
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>3. Defective Unit Absorption Invariant:</strong> Cost per good packet is strictly calculated as <strong>Total Production Cost divided by Actual Good Output (188 pkts)</strong>, not planned output (200 pkts). Normal production shrinkage and damaged packaging scrap are absorbed into the cost of sound commercial packets.
        </p>
      </div>

      {/* 4 Primary Cost Accounting Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-blue-200 bg-blue-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase">Direct Material Cost</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">
            ₹{(costing?.totalDirectMaterialCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-blue-600">Weighted-average inventory rates</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase">Manufacturing Overheads</span>
            <Factory className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">
            ₹{(costing?.overheads.totalOverheadCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-amber-600">Labour: ₹1,200 | Gas/Power: ₹600</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-purple-200 bg-purple-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase">Total Batch Cost</span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">
            ₹{(costing?.totalProductionCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-purple-600">Material + Absorbed Overheads</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase">Cost Per Good Packet</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            ₹{(costing?.costPerGoodPacket || 0).toFixed(4)}
          </p>
          <span className="text-[10px] text-emerald-600">Per 188 sound good packets</span>
        </div>
      </div>

      {/* Direct Material Cost Breakdown Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Actual Material Consumption & Valuation Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated strictly from prevailing inventory weighted-average valuation rates.
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-slate-800">
            Total Material Cost: ₹{(costing?.totalDirectMaterialCost || 0).toFixed(2)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Item Code</th>
                <th className="py-2.5 px-3">Material Name</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3 text-right">Actual Issued Qty</th>
                <th className="py-2.5 px-3 text-right">WAC Inventory Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">Direct Material Cost (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">Loading costing...</td>
                </tr>
              ) : (
                (costing?.directMaterialLines || []).map((m) => (
                  <tr key={m.materialId} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-brand-600">{m.materialCode}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{m.materialName}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {m.itemType === 'RAW_MATERIAL' ? 'Raw Material' : 'Packaging'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {m.actualQty} {m.unitCode}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      ₹{m.valuationRate.toFixed(4)} / {m.unitCode}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      ₹{m.totalCost.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Defective Units Scrap Absorption & Planned vs Actual Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scrap Impact Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
              Scrap & Defective Unit Cost Absorption
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            In standard cost accounting, damaged units produced during extrusion and baking are fully absorbed into the cost of prime sound packets:
          </p>

          <div className="space-y-2 pt-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span>Actual Good Output:</span>
              <span className="font-bold text-emerald-700">{costing?.actualGoodOutput} packets</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span>Damaged Finished Packets:</span>
              <span className="font-bold text-rose-600">{costing?.damagedOutput} packets (6% variance)</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span>Damaged Packaging Scrap:</span>
              <span className="font-bold text-amber-600">{costing?.damagedPackagingQty} pouches</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span>Cost if 200 Packets Produced:</span>
              <span className="font-mono text-slate-600">₹{costing?.costPerPlannedPacket.toFixed(4)} / pkt</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-amber-50 border border-amber-200 font-bold text-amber-900">
              <span>Scrap Impact Per Good Packet:</span>
              <span>+₹{costing?.scrapLossImpact.toFixed(4)} / pkt absorbed</span>
            </div>
          </div>
        </div>

        {/* Product Profitability & Margins Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
              Profitability & Gross Margins by Channel
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Dynamic gross profit contribution based on prevailing manufacturing cost:
          </p>

          <div className="space-y-3 pt-2">
            {(profitability?.pricingTiers || []).map((tier) => (
              <div key={tier.tierName} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-900">{tier.tierName}</h3>
                  <span className="text-xs font-black text-emerald-700">
                    Margin: {tier.grossMarginPct}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Selling Price</span>
                    <span className="font-bold text-slate-800">₹{tier.sellingPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Cost Per Packet</span>
                    <span className="font-mono text-slate-600">₹{(costing?.costPerGoodPacket || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Gross Profit</span>
                    <span className="font-bold text-emerald-700">₹{tier.grossProfitPerPacket.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
