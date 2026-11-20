import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Filter,
  Search,
  RefreshCw,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { ReportService, ReportFilterParams } from '../../services/reportService';

interface ReportOption {
  id: string;
  name: string;
  category: 'SALES' | 'PURCHASE' | 'INVENTORY' | 'PRODUCTION' | 'FINANCE' | 'AUDIT';
  description: string;
}

const REPORT_CATALOG: ReportOption[] = [
  // Sales & GST
  { id: 'sales-register', name: '1. Sales Register', category: 'SALES', description: 'Itemized sales invoices with intra-state and inter-state GST breakdown' },
  { id: 'customer-sales', name: '2. Customer-wise Sales', category: 'SALES', description: 'Customer sales performance, order counts, and average order value' },
  { id: 'product-sales', name: '3. Product-wise Sales', category: 'SALES', description: 'Volume and revenue breakdown across products' },
  { id: 'gst-outward', name: '4. GST Outward Supplies (GSTR-1)', category: 'SALES', description: 'Intra-state (CGST+SGST) vs Inter-state (IGST) statutory summary' },
  // Purchasing
  { id: 'purchase-register', name: '5. Purchase Register', category: 'PURCHASE', description: 'Purchase orders, supplier invoices, and GRN receipts' },
  // Inventory
  { id: 'raw-material-stock', name: '6. Raw Material Stock Summary', category: 'INVENTORY', description: 'Raw material balances, weighted-average costs, and reorder levels' },
  { id: 'packaging-stock', name: '7. Packaging Stock Summary', category: 'INVENTORY', description: 'Pouches, cartons, and packaging supplies capitalization' },
  { id: 'finished-goods-stock', name: '8. Finished Goods Stock Summary', category: 'INVENTORY', description: 'Finished goods packets at production cost basis vs retail value' },
  { id: 'stock-ledger', name: '9. Complete Stock Ledger', category: 'INVENTORY', description: 'Perpetual transaction journal with running balances' },
  // Production
  { id: 'production-report', name: '10. Production Report', category: 'PRODUCTION', description: 'Batch output, good packets, damaged packets, and total costs' },
  { id: 'consumption-variance', name: '11. Planned vs Actual Consumption', category: 'PRODUCTION', description: 'Recipe BOM planned vs actual consumption with tolerance alerts' },
  { id: 'yield-report', name: '12. Production Yield Report', category: 'PRODUCTION', description: 'Yield percentage vs expected output with variance alerts' },
  { id: 'wastage-report', name: '13. Wastage Report', category: 'PRODUCTION', description: 'Finished product damage and packaging scrap analysis' },
  { id: 'cost-per-packet', name: '14. Cost Per Packet Report', category: 'PRODUCTION', description: 'Absorption costing under Ind AS 2 (Direct materials + Overheads)' },
  // Finance & AR
  { id: 'payments-collections', name: '15. Payments & Collections Report', category: 'FINANCE', description: 'Customer receipts, payment modes, and invoice allocations' },
  { id: 'customer-outstanding', name: '16. Customer Outstanding Report', category: 'FINANCE', description: 'Net accounts receivable balances customer-by-customer' },
  { id: 'receivables-ageing', name: '17. Receivables Ageing Report', category: 'FINANCE', description: '0-30, 31-60, 61-90, and >90 days overdue buckets' },
  // Audit
  { id: 'audit-trail', name: '18. Immutable Audit Trail', category: 'AUDIT', description: 'System-wide audit journal recording user, action, and state diffs' },
];

export const ReportsHubPage: React.FC = () => {
  const [selectedReportId, setSelectedReportId] = useState<string>('sales-register');
  const [filters, setFilters] = useState<ReportFilterParams>({
    startDate: '',
    endDate: '',
    search: '',
  });
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ReportService.getReport(selectedReportId, filters);
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedReportId]);

  const handleExportCSV = async () => {
    try {
      await ReportService.downloadReportCSV(selectedReportId, filters);
    } catch (err: any) {
      alert(`CSV Export failed: ${err.message}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedReportInfo = REPORT_CATALOG.find((r) => r.id === selectedReportId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Business Intelligence & Audit Reports</h2>
            <span className="px-2 py-0.5 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold rounded-full">
              17 Statutory Reports + Audit Trail
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time dynamically generated financial, manufacturing, inventory, and audit compliance ledgers.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
            title="Download CSV for Excel analysis"
          >
            <Download className="w-3.5 h-3.5 text-brand-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Report Selection Dropdown / Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Statutory / Management Report
            </label>
            <select
              value={selectedReportId}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <optgroup label="Sales & GST Statutory Reports">
                <option value="sales-register">1. Sales Register (Itemized Invoices & GST)</option>
                <option value="customer-sales">2. Customer-wise Sales Report</option>
                <option value="product-sales">3. Product-wise Sales Report</option>
                <option value="gst-outward">4. GST Outward Supplies Summary (GSTR-1)</option>
              </optgroup>
              <optgroup label="Purchasing & Procurement">
                <option value="purchase-register">5. Purchase Register (PO & GRN Status)</option>
              </optgroup>
              <optgroup label="Inventory & Stock Ledgers">
                <option value="raw-material-stock">6. Raw Material Stock Summary (WAC Valuation)</option>
                <option value="packaging-stock">7. Packaging Stock Summary</option>
                <option value="finished-goods-stock">8. Finished Goods Stock Summary</option>
                <option value="stock-ledger">9. Complete Stock Ledger (Perpetual Journal)</option>
              </optgroup>
              <optgroup label="Production & Cost Accounting">
                <option value="production-report">10. Production Report</option>
                <option value="consumption-variance">11. Planned vs Actual Consumption Report</option>
                <option value="yield-report">12. Production Yield Report</option>
                <option value="wastage-report">13. Wastage Report</option>
                <option value="cost-per-packet">14. Cost Per Packet Report (Ind AS 2)</option>
              </optgroup>
              <optgroup label="Finance & Accounts Receivable">
                <option value="payments-collections">15. Payments & Collections Report</option>
                <option value="customer-outstanding">16. Customer Outstanding Report</option>
                <option value="receivables-ageing">17. Receivables Ageing Report (4 Buckets)</option>
              </optgroup>
              <optgroup label="Compliance & Governance">
                <option value="audit-trail">18. Immutable Audit Trail</option>
              </optgroup>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">{selectedReportInfo?.description}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Search Within Report
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && fetchReport()}
                placeholder="Search number, name, ID..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={fetchReport}
            className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded text-xs transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Apply Filters</span>
          </button>

          {(filters.startDate || filters.endDate || filters.search) && (
            <button
              onClick={() => {
                setFilters({ startDate: '', endDate: '', search: '' });
                fetchReport();
              }}
              className="text-slate-500 hover:text-slate-700 text-xs underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span><strong>Error:</strong> {error}</span>
        </div>
      )}

      {/* Report Content Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        {/* Report Header & KPI Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">{selectedReportInfo?.name}</h3>
            <span className="text-[11px] text-slate-400">
              Generated dynamically at {reportData?.generatedAt ? new Date(reportData.generatedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}
            </span>
          </div>

          {reportData?.summary && (
            <div className="flex items-center gap-4 flex-wrap">
              {Object.entries(reportData.summary).map(([key, val]: [string, any]) => {
                if (typeof val === 'number') {
                  const isCurrency = key.toLowerCase().includes('amount') || key.toLowerCase().includes('total') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('valuation') || key.toLowerCase().includes('revenue');
                  return (
                    <div key={key} className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {isCurrency ? `₹ ${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : val}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
              <span>Querying database and aggregating report ledgers...</span>
            </div>
          ) : reportData?.rows && reportData.rows.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  {Object.keys(reportData.rows[0]).map((col) => (
                    <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                      {col.replace(/([A-Z])/g, ' $1').toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.rows.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    {Object.entries(row).map(([colKey, val]: [string, any], cIdx: number) => {
                      const isMoney = typeof val === 'number' && (colKey.toLowerCase().includes('amount') || colKey.toLowerCase().includes('total') || colKey.toLowerCase().includes('cost') || colKey.toLowerCase().includes('valuation') || colKey.toLowerCase().includes('price') || colKey.toLowerCase().includes('revenue'));
                      const isAlert = colKey.toLowerCase().includes('alert') || colKey.toLowerCase().includes('status');

                      return (
                        <td key={cIdx} className={`py-2 px-3 whitespace-nowrap ${typeof val === 'number' ? 'text-right' : 'text-left'}`}>
                          {isMoney ? (
                            <span className="font-medium text-slate-900">
                              ₹ {val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          ) : typeof val === 'boolean' ? (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${val ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                              {val ? 'ALERT' : 'NO'}
                            </span>
                          ) : isAlert ? (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              val === 'CRITICAL' || val === 'OVERDUE' || val === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : val === 'LOW_STOCK' || val === 'PARTIAL' || val === 'PARTIALLY_PAID'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {String(val)}
                            </span>
                          ) : (
                            <span className="text-slate-800">{String(val ?? '-')}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : selectedReportId === 'gst-outward' && reportData?.breakdown ? (
            /* Special presentation for GSTR-1 format */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Intra-State Supplies (Within State)</h4>
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between"><span>Taxable Value:</span> <span className="font-semibold text-slate-900">₹ {reportData.intraState.taxableValue.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Central GST (CGST):</span> <span className="font-semibold text-slate-900">₹ {reportData.intraState.cgstAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>State GST (SGST):</span> <span className="font-semibold text-slate-900">₹ {reportData.intraState.sgstAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900"><span>Total Tax:</span> <span>₹ {reportData.intraState.totalTax.toFixed(2)}</span></div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <h4 className="text-xs font-bold text-slate-800 uppercase mb-2">Inter-State Supplies (Out of State)</h4>
                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between"><span>Taxable Value:</span> <span className="font-semibold text-slate-900">₹ {reportData.interState.taxableValue.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Integrated GST (IGST):</span> <span className="font-semibold text-slate-900">₹ {reportData.interState.igstAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900"><span>Total Tax:</span> <span>₹ {reportData.interState.totalTax.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    <th className="py-2 px-3">Supply Type</th>
                    <th className="py-2 px-3">HSN Code</th>
                    <th className="py-2 px-3 text-right">Rate %</th>
                    <th className="py-2 px-3 text-right">Taxable Value</th>
                    <th className="py-2 px-3 text-right">CGST</th>
                    <th className="py-2 px-3 text-right">SGST</th>
                    <th className="py-2 px-3 text-right">IGST</th>
                    <th className="py-2 px-3 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.breakdown.map((b: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-medium text-slate-900">{b.supplyType}</td>
                      <td className="py-2 px-3 font-mono">{b.hsnCode}</td>
                      <td className="py-2 px-3 text-right">{b.ratePct}%</td>
                      <td className="py-2 px-3 text-right font-medium">₹ {b.taxableValue.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">₹ {b.cgstAmount.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">₹ {b.sgstAmount.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">₹ {b.igstAmount.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-bold text-brand-600">₹ {b.totalTax.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              <FileText className="w-6 h-6 mx-auto mb-2 text-slate-300" />
              <span>No records matched the selected report filters.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
