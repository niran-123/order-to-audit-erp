import React from 'react';
import { Link } from 'react-router-dom';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FileText, CreditCard, DollarSign, Scale } from 'lucide-react';

export const AccountantDashboard: React.FC = () => {

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Controller Workspace</h2>
            <StatusBadge status="completed" label="Accountant Clearance" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">3-Way purchase matching, statutory GST invoice issuance, and payment reconciliations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/payments"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </Link>
          <Link
            to="/finance/receivables"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>AR Ageing</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Accounts Receivable (AR)" value="₹ 25,90,000" subtitle="Overdue > 30 days: ₹ 3.2L" icon={<DollarSign className="w-5 h-5" />} />
        <MetricCard title="GST Payable (CGST+SGST)" value="₹ 14,82,400" subtitle="GSTR-3B Due: Nov 20" icon={<FileText className="w-5 h-5 text-brand-600" />} />
        <MetricCard title="Unallocated Receipts" value="₹ 1,15,000" subtitle="Bank NEFT pending clearance" icon={<CreditCard className="w-5 h-5 text-amber-600" />} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Invoices & Payment Vouchers</h3>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <span className="font-mono font-bold text-slate-900">INV-2026-1104</span>
              <span className="text-slate-500 block text-[11px]">Apex Industrial Tools Ltd | ₹ 1,47,500.00 (Taxable: ₹ 1.25L)</span>
            </div>
            <StatusBadge status="healthy" label="POSTED / IRN GENERATED" />
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <div>
              <span className="font-mono font-bold text-slate-900">PAY-REC-1082</span>
              <span className="text-slate-500 block text-[11px]">Customer: Apex Ind Tools | Amount: ₹ 1,00,000.00 | Mode: NEFT</span>
            </div>
            <StatusBadge status="completed" label="RECONCILED" />
          </div>
        </div>
      </div>
    </div>
  );
};
