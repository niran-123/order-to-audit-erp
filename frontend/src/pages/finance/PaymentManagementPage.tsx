import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import {
  financeService,
  Payment,
  PaymentMethod,
  ReceivablesSummary,
} from '../../services/financeService';
import { salesService, GSTInvoice } from '../../services/salesService';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'NEFT', label: 'NEFT (National Electronic Fund Transfer)' },
  { value: 'RTGS', label: 'RTGS (Real Time Gross Settlement)' },
  { value: 'BANK_TRANSFER', label: 'Direct Bank Transfer / IMPS' },
  { value: 'UPI', label: 'UPI / Corporate QR' },
  { value: 'CHEQUE', label: 'Account Payee Cheque / DD' },
  { value: 'CASH', label: 'Direct Cash Receipt' },
];

export const PaymentManagementPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<GSTInvoice[]>([]);
  const [arSummary, setArSummary] = useState<ReceivablesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Record Payment Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('cust-retailer-a');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState<number>(4000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('NEFT');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('HDFCR52026112001');
  const [bankName, setBankName] = useState('HDFC Bank Ltd');
  const [notes, setNotes] = useState('Part-payment against festival order');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drilldown Modal
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [paymentList, invoiceList, receivables] = await Promise.all([
        financeService.getPayments(),
        salesService.getInvoices(),
        financeService.getAccountsReceivable(),
      ]);
      setPayments(paymentList);
      setInvoices(invoiceList);
      setArSummary(receivables);

      // Pre-select first unpaid invoice if available
      const unpaid = invoiceList.find((i) => i.status !== 'PAID');
      if (unpaid && !selectedInvoiceId) {
        setSelectedInvoiceId(unpaid.id);
        setSelectedCustomerId(unpaid.customerId);
      }
    } catch (err: any) {
      console.error('Failed to load payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter invoices for currently selected customer in modal
  const customerInvoices = invoices.filter(
    (i) => i.customerId === selectedCustomerId && i.status !== 'PAID'
  );

  const activeInvoice = invoices.find((i) => i.id === selectedInvoiceId);
  const remainingInvoiceBalance = activeInvoice
    ? Math.max(0, activeInvoice.grandTotal - activeInvoice.paidAmount)
    : 0;

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setFeedback({ type: 'error', message: 'Payment amount must be greater than zero.' });
      return;
    }

    if (!referenceNumber.trim()) {
      setFeedback({ type: 'error', message: 'A valid transaction reference / UTR is required.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payment = await financeService.recordPayment({
        customerId: selectedCustomerId,
        invoiceId: selectedInvoiceId || undefined,
        amount,
        paymentMethod,
        paymentDate,
        referenceNumber,
        bankName,
        notes,
      });

      setFeedback({
        type: 'success',
        message: `Payment ${payment.paymentNumber} of ₹${payment.amount.toLocaleString('en-IN')} recorded successfully! Allocated: ₹${payment.allocatedAmount.toLocaleString('en-IN')}`,
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to record payment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.paymentNumber.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.referenceNumber.toLowerCase().includes(q) ||
      (p.bankName && p.bankName.toLowerCase().includes(q))
    );
  });

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalAllocated = payments.reduce((acc, p) => acc + p.allocatedAmount, 0);
  const totalUnallocated = payments.reduce((acc, p) => acc + p.unallocatedAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200">
              Treasury & Cash Flow
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-mono">
              Accounts Receivable Settlement
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Customer Payment Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Record customer collections, allocate remittances to GST invoices, track partial settlements, and monitor unallocated balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Record Customer Payment
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 border shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs leading-relaxed font-medium">{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Collected</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">All customer remittances</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-blue-200 bg-blue-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase">Allocated to Invoices</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">
            ₹{totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-blue-600">Settled invoice balances</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase">Unallocated On-Account</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">
            ₹{totalUnallocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-amber-600">Held for future invoices</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-purple-200 bg-purple-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase">Total Receivables</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">
            ₹{(arSummary?.totalReceivables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-purple-600">Pending customer balance</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search payment #, customer, UTR, bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Payments History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Method & UTR</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-right">Allocated (₹)</th>
                <th className="py-3 px-4 text-right">Unallocated (₹)</th>
                <th className="py-3 px-4">Allocated Invoices</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Loading payment records...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No payment transactions recorded yet.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                      {p.paymentNumber}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.customerName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{p.customerCode}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {p.paymentMethod}
                      </span>
                      <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                        {p.referenceNumber} ({p.bankName})
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                      ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                      ₹{p.allocatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-amber-700">
                      ₹{p.unallocatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.allocations.length === 0 ? (
                        <span className="text-slate-400 text-[10px]">On-Account</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {p.allocations.map((a) => (
                            <span
                              key={a.id}
                              className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[10px] font-semibold border border-purple-200"
                            >
                              {a.invoiceNumber} (₹{a.allocatedAmount})
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> {p.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedPayment(p)}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px]"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: RECORD CUSTOMER PAYMENT */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] font-bold uppercase">
                  Cash Inflow Receipt
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">Record Customer Payment</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Customer Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Customer Name
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setSelectedInvoiceId('');
                }}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="cust-retailer-a">Annapoorna Retail Stores (Retailer A)</option>
                <option value="cust-distributor-b">Kaveri Fresh Supermarkets (Distributor B)</option>
              </select>
            </div>

            {/* Invoice Allocation Picker */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Allocate to GST Invoice (Optional / Specific Invoice)
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => {
                  setSelectedInvoiceId(e.target.value);
                  const inv = invoices.find((i) => i.id === e.target.value);
                  if (inv) {
                    const bal = Math.max(0, inv.grandTotal - inv.paidAmount);
                    setAmount(bal);
                  }
                }}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
              >
                <option value="">-- General Payment (Auto-Allocate FIFO) --</option>
                {customerInvoices.map((inv) => {
                  const bal = Math.max(0, inv.grandTotal - inv.paidAmount);
                  return (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} | Total: ₹{inv.grandTotal.toFixed(2)} | Balance Due: ₹{bal.toFixed(2)}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Outstanding Balance Banner */}
            {activeInvoice && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
                <div className="flex justify-between">
                  <span>Invoice Amount:</span>
                  <span className="font-bold">₹{activeInvoice.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Currently Paid:</span>
                  <span className="font-bold">₹{activeInvoice.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-purple-200 pt-1 text-sm font-black text-purple-900">
                  <span>Outstanding Balance:</span>
                  <span>₹{remainingInvoiceBalance.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Amount and Method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reference Number & Bank */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  UTR / Reference #
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFCR52026112001"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Payment notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isSubmitting ? 'Recording...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: PAYMENT DRILLDOWN */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-brand-600">{selectedPayment.paymentNumber}</span>
                <h2 className="text-base font-bold text-slate-900">{selectedPayment.customerName}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Payment Amount:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{selectedPayment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Method:</span>
                <span className="font-bold text-slate-800">{selectedPayment.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Transaction Reference:</span>
                <span className="font-mono font-bold text-slate-800">{selectedPayment.referenceNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Bank Name:</span>
                <span className="font-medium text-slate-800">{selectedPayment.bankName || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Date Received:</span>
                <span className="font-medium text-slate-800">
                  {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Allocations breakdown */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase">Allocations Breakdown</h3>
              {selectedPayment.allocations.length === 0 ? (
                <p className="text-slate-400 text-xs">Payment is unallocated on-account.</p>
              ) : (
                selectedPayment.allocations.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between">
                    <div>
                      <strong className="block font-mono text-purple-700">{a.invoiceNumber}</strong>
                      <span className="text-[10px] text-slate-400">Allocated at: {new Date(a.allocatedAt).toLocaleDateString()}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">₹{a.allocatedAmount.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedPayment(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
