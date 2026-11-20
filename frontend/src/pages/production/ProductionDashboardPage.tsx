import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Factory,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  Package,
  Layers,
  Percent,
} from 'lucide-react';
import {
  productionService,
  ProductionRunDTO,
  ProductionDashboardSummary,
  BillOfMaterialDTO,
  CreateProductionRunRequest,
  CompleteProductionRunRequest,
} from '../../services/productionService';

export const ProductionDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<ProductionDashboardSummary | null>(null);
  const [runs, setRuns] = useState<ProductionRunDTO[]>([]);
  const [boms, setBoms] = useState<BillOfMaterialDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Schedule Run Modal State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedBOMId, setSelectedBOMId] = useState('');
  const [plannedOutput, setPlannedOutput] = useState(200);
  const [plannedRequirements, setPlannedRequirements] = useState<any[]>([]);

  // Complete Run Modal State
  const [completingRun, setCompletingRun] = useState<ProductionRunDTO | null>(null);
  const [actualGoodOutput, setActualGoodOutput] = useState(188);
  const [damagedOutput, setDamagedOutput] = useState(12);
  const [damagedPackagingQty, setDamagedPackagingQty] = useState(6);
  const [actualMaterials, setActualMaterials] = useState<{ materialId: string; actualQty: number }[]>([]);
  const [labourCost, setLabourCost] = useState(450);
  const [gasCost, setGasCost] = useState(280);
  const [electricityCost, setElectricityCost] = useState(160);
  const [postingLoading, setPostingLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashData, runsData, bomsData] = await Promise.all([
        productionService.getDashboard(),
        productionService.listRuns({
          status: statusFilter || undefined,
          search: search || undefined,
        }),
        productionService.listBOMs(),
      ]);
      setSummary(dashData);
      setRuns(runsData);
      setBoms(bomsData);
      if (bomsData.length > 0 && !selectedBOMId) {
        setSelectedBOMId(bomsData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load production data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Update planned requirements when planned output or BOM changes
  useEffect(() => {
    if (selectedBOMId && plannedOutput > 0) {
      productionService
        .calculateRequirements(selectedBOMId, plannedOutput)
        .then((reqs) => setPlannedRequirements(reqs))
        .catch(() => setPlannedRequirements([]));
    }
  }, [selectedBOMId, plannedOutput]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bom = boms.find((b) => b.id === selectedBOMId);
    if (!bom) return;

    try {
      const payload: CreateProductionRunRequest = {
        productId: bom.productId,
        bomId: bom.id,
        plannedOutput: Number(plannedOutput),
        supervisorName: 'M. Senthil (Production Supervisor)',
      };
      await productionService.createRun(payload);
      setIsScheduleOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule production run');
    }
  };

  const openCompleteModal = (run: ProductionRunDTO) => {
    setCompletingRun(run);
    setActualGoodOutput(run.output.plannedOutput === 200 ? 188 : run.output.plannedOutput);
    setDamagedOutput(run.output.plannedOutput === 200 ? 12 : 0);
    setDamagedPackagingQty(run.output.plannedOutput === 200 ? 6 : 0);

    // Populate actual materials with planned quantities as defaults (with benchmark oil as 10.5)
    setActualMaterials(
      run.materials.map((m) => {
        let initialQty = m.plannedQty;
        if (m.materialCode === 'RM-OIL-01' && run.output.plannedOutput === 200) {
          initialQty = 10.5; // Benchmark oil consumption
        } else if (m.materialCode.includes('POUCH') && run.output.plannedOutput === 200) {
          initialQty = 194.0; // 188 good + 6 damaged
        }
        return {
          materialId: m.materialId,
          actualQty: initialQty,
        };
      })
    );
  };

  const handleActualMaterialChange = (materialId: string, qty: number) => {
    setActualMaterials((prev) =>
      prev.map((item) => (item.materialId === materialId ? { ...item, actualQty: qty } : item))
    );
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingRun) return;

    try {
      setPostingLoading(true);
      const payload: CompleteProductionRunRequest = {
        actualGoodOutput: Number(actualGoodOutput),
        damagedOutput: Number(damagedOutput),
        damagedPackagingQty: Number(damagedPackagingQty),
        materials: actualMaterials,
        overheads: {
          labourCost: Number(labourCost),
          gasCost: Number(gasCost),
          electricityCost: Number(electricityCost),
        },
      };

      await productionService.completeAndPostRun(completingRun.id, payload);
      setCompletingRun(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to complete production run');
    } finally {
      setPostingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANNED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'COMPLETED':
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
            <Factory className="w-7 h-7 text-brand-500" />
            Production Floor & Work Orders
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Shop-floor execution, automated BOM issuance, yield variance tracking, and finished goods receipts
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/production/bom"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            BOM Master Recipes
          </Link>
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Schedule Production Run
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Variance Alert Banner if any alert exists */}
      {summary?.activeAlerts && summary.activeAlerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Active Production Variance Alerts (Exceeding ±3% Threshold)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {summary.activeAlerts.map((alert, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 p-2.5 rounded-lg border border-amber-500/20 flex items-start gap-2"
              >
                <div
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    alert.variancePct > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {alert.variancePct > 0 ? `+${alert.variancePct}%` : `${alert.variancePct}%`}
                </div>
                <div>
                  <div className="font-semibold text-white">{alert.message}</div>
                  <div className="text-[10px] text-slate-400">
                    Planned: {alert.planned} {alert.unitCode} • Actual: {alert.actual} {alert.unitCode}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Production Output
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {summary?.totalActualOutput ?? 0}{' '}
              <span className="text-xs font-normal text-slate-400">PKT</span>
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Planned: {summary?.totalPlannedOutput ?? 0} PKT
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Average Yield Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl font-bold tracking-tight ${
                (summary?.averageYieldPct ?? 100) < 97 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {summary?.averageYieldPct ?? 100}%
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Benchmark yield target: 97.0% - 100%
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Shift Work Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {summary?.completedRuns ?? 0}{' '}
              <span className="text-xs font-normal text-slate-400">Completed</span>
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary?.plannedRuns ?? 0} Planned / In Queue
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              FG Murukku 200g Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">
              {summary?.finishedGoodsStock.find((f) => f.productCode === 'PRD-MUR-200G')?.currentStock ??
                238}{' '}
              <span className="text-xs font-normal text-slate-400">PKT</span>
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Ready for customer dispatch
            </p>
          </div>
        </div>
      </div>

      {/* Production Runs Filter & Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Run#, Batch#, Product, Supervisor..."
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
              <option value="PLANNED">Planned</option>
              <option value="COMPLETED">Completed & Posted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button
              onClick={loadData}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Runs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Run # / Batch</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">BOM Ver</th>
                <th className="py-2.5 px-3 text-right">Planned Output</th>
                <th className="py-2.5 px-3 text-right font-bold text-white">Actual Good</th>
                <th className="py-2.5 px-3 text-right">Yield %</th>
                <th className="py-2.5 px-3 text-right">Direct Cost</th>
                <th className="py-2.5 px-3 text-right">Overheads</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Supervisor</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    Loading production runs...
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    No production runs found.
                  </td>
                </tr>
              ) : (
                runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-2.5 px-3 font-mono">
                      <div className="font-semibold text-white">{r.runNumber}</div>
                      <div className="text-[10px] text-slate-500">{r.batchNumber}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-200">{r.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{r.productCode}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {r.bomVersion}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {r.output.plannedOutput} {r.output.unitCode}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {r.status === 'COMPLETED' ? `${r.output.actualGoodOutput} ${r.output.unitCode}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {r.status === 'COMPLETED' ? (
                        <span
                          className={`font-semibold ${
                            r.output.isYieldAlert ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {r.output.yieldVariancePct > 0 ? `+${r.output.yieldVariancePct}%` : `${r.output.yieldVariancePct}%`}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      ₹{r.totalDirectMaterialCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      ₹{r.overheads.totalOverheadCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(
                          r.status
                        )}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {r.supervisorName}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {r.status === 'PLANNED' ? (
                        <button
                          onClick={() => openCompleteModal(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition"
                          title="Execute & Post Production Output"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Execute & Post
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">Posted</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCHEDULE PRODUCTION RUN MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Factory className="w-5 h-5 text-brand-500" />
                Schedule Production Work Order
              </h2>
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Select BOM Recipe *
                  </label>
                  <select
                    value={selectedBOMId}
                    onChange={(e) => setSelectedBOMId(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    {boms.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.productName} ({b.bomNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Planned Batch Output (Packets) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={plannedOutput}
                    onChange={(e) => setPlannedOutput(Number(e.target.value))}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              {/* Dynamic BOM Requirements Preview */}
              <div className="space-y-2 pt-1">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Auto-Calculated Material Requirements</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Scaled from {plannedOutput} packets
                  </span>
                </h3>

                <div className="divide-y divide-slate-800 bg-slate-800/40 p-3 rounded-lg border border-slate-800 text-xs">
                  {plannedRequirements.map((req, idx) => (
                    <div key={idx} className="py-1.5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white">{req.materialName}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {req.materialCode} ({req.itemType})
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-brand-400">
                          {req.plannedQty} {req.unitCode}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Est: ₹{req.estimatedCost?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Schedule Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETE & POST PRODUCTION RUN MODAL */}
      {completingRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-emerald-400" />
                  Execute & Post Production Run {completingRun.runNumber}
                </h2>
                <p className="text-xs text-slate-400">
                  Batch #{completingRun.batchNumber} • Planned: {completingRun.output.plannedOutput} PKT
                </p>
              </div>
              <button
                onClick={() => setCompletingRun(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              {/* Output Quantities */}
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                  Production Yield & Output Inspection
                </span>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Good Packets Produced *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={actualGoodOutput}
                      onChange={(e) => setActualGoodOutput(Number(e.target.value))}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono font-bold text-sm focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Damaged Packets
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={damagedOutput}
                      onChange={(e) => setDamagedOutput(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Damaged Pouch Scrap (Pieces)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={damagedPackagingQty}
                      onChange={(e) => setDamagedPackagingQty(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* Live Yield Variance Calculation */}
                <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Computed Yield Variance:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(((actualGoodOutput - completingRun.output.plannedOutput) / completingRun.output.plannedOutput) * 100) > 3
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {(((actualGoodOutput - completingRun.output.plannedOutput) / completingRun.output.plannedOutput) * 100).toFixed(1)}%
                    {Math.abs(((actualGoodOutput - completingRun.output.plannedOutput) / completingRun.output.plannedOutput) * 100) > 3 &&
                      ' (Alert Flagged)'}
                  </span>
                </div>
              </div>

              {/* Material Actual Issued */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                  Actual Raw Material & Packaging Issued
                </span>
                <div className="space-y-1.5">
                  {completingRun.materials.map((mat) => {
                    const actualObj = actualMaterials.find((a) => a.materialId === mat.materialId);
                    const currentActual = actualObj ? actualObj.actualQty : mat.plannedQty;
                    const matVarPct = Number(
                      mat.plannedQty > 0 ? (((currentActual - mat.plannedQty) / mat.plannedQty) * 100).toFixed(1) : 0
                    );

                    return (
                      <div
                        key={mat.materialId}
                        className="bg-slate-800/30 p-2 rounded-lg border border-slate-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-white">{mat.materialName}</div>
                          <div className="text-[10px] text-slate-400">
                            Planned: {mat.plannedQty} {mat.unitCode} • Prevailing: ₹{mat.unitCost}
                          </div>
                        </div>

                        <div className="w-32">
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            value={currentActual}
                            onChange={(e) =>
                              handleActualMaterialChange(mat.materialId, Number(e.target.value))
                            }
                            required
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs text-right focus:border-brand-500 font-bold"
                          />
                        </div>

                        <div className="w-20 text-right font-mono text-[11px]">
                          <span
                            className={
                              Math.abs(matVarPct) > 3 ? 'text-amber-400 font-bold' : 'text-slate-400'
                            }
                          >
                            {matVarPct > 0 ? `+${matVarPct}%` : `${matVarPct}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shift Overhead Costs */}
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                  Direct Production Overheads (Shift)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Labour Cost (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={labourCost}
                      onChange={(e) => setLabourCost(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Gas Cost (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={gasCost}
                      onChange={(e) => setGasCost(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Electricity (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={electricityCost}
                      onChange={(e) => setElectricityCost(Number(e.target.value))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompletingRun(null)}
                  disabled={postingLoading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postingLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  {postingLoading ? 'Deducting Stock & Posting...' : 'Post Run & Update Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
