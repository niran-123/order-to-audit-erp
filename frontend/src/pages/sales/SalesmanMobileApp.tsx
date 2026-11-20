import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Package,
  Plus,
  Minus,
  AlertCircle,
  Building2,
  Calendar,
  Send,
  Truck,
  FileText,
  Search,
} from 'lucide-react';
import { salesService, SalesOrder, CustomerSalesSummary } from '../../services/salesService';
import { useAuth } from '../../context/AuthContext';

interface CustomerOption {
  id: string;
  code: string;
  name: string;
  type: 'RETAILER' | 'DISTRIBUTOR';
  state: string;
  stateCode: string;
  gstin: string;
  defaultPrice: number;
}

const BENCHMARK_CUSTOMERS_LIST: CustomerOption[] = [
  {
    id: 'cust-retailer-a',
    code: 'CUST-RETAILER-A',
    name: 'Annapoorna Retail Stores (Retailer A)',
    type: 'RETAILER',
    state: 'Tamil Nadu',
    stateCode: '33',
    gstin: '33AABCA4432P1ZQ',
    defaultPrice: 50.0,
  },
  {
    id: 'cust-distributor-b',
    code: 'CUST-DISTRIBUTOR-B',
    name: 'Kaveri Fresh Supermarkets LLP (Distributor B)',
    type: 'DISTRIBUTOR',
    state: 'Karnataka',
    stateCode: '29',
    gstin: '29AABCK5678Q1Z2',
    defaultPrice: 46.5,
  },
];

export const SalesmanMobileApp: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'analytics'>('create');

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(BENCHMARK_CUSTOMERS_LIST[0].id);
  const [orderedQty, setOrderedQty] = useState<number>(150);
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30 Days');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data State
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerSalesSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Selected customer details
  const selectedCustomer =
    BENCHMARK_CUSTOMERS_LIST.find((c) => c.id === selectedCustomerId) || BENCHMARK_CUSTOMERS_LIST[0];

  // Dynamic pricing calculation
  const unitPrice = selectedCustomer.defaultPrice;
  const taxableValue = Number((orderedQty * unitPrice).toFixed(2));
  const isInterState = selectedCustomer.stateCode !== '33'; // Seller is Tamil Nadu (33)
  const cgstAmount = isInterState ? 0 : Number(((taxableValue * 2.5) / 100).toFixed(2));
  const sgstAmount = isInterState ? 0 : Number(((taxableValue * 2.5) / 100).toFixed(2));
  const igstAmount = isInterState ? Number(((taxableValue * 5.0) / 100).toFixed(2)) : 0;
  const totalTax = Number((cgstAmount + sgstAmount + igstAmount).toFixed(2));
  const totalOrderValue = Number((taxableValue + totalTax).toFixed(2));

  const loadData = async () => {
    setIsLoadingOrders(true);
    try {
      const [orderList, stats] = await Promise.all([
        salesService.getOrders(),
        salesService.getCustomerSales(),
      ]);
      setOrders(orderList);
      setCustomerStats(stats);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderedQty <= 0) {
      setFeedback({ type: 'error', message: 'Quantity must be greater than zero.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const created = await salesService.createOrder({
        customerId: selectedCustomer.id,
        expectedDeliveryDate: deliveryDate,
        paymentTerms,
        notes,
        items: [
          {
            productId: 'inv-fg-mur-200g',
            orderedQty,
            unitPrice,
          },
        ],
      });

      setFeedback({
        type: 'success',
        message: `Order ${created.soNumber} submitted successfully for ₹${created.totalAmount.toLocaleString('en-IN')}!`,
      });
      setNotes('');
      loadData();
      setActiveTab('history');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to submit order.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.soNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: SalesOrder['status']) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Submitted
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case 'INVOICED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <FileText className="w-3 h-3" /> Invoiced
          </span>
        );
      case 'PARTIALLY_DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Truck className="w-3 h-3" /> Partial Dispatch
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Dispatched
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Mobile Top Header */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
          <Smartphone className="w-40 h-40 text-brand-400" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-brand-500/30 text-brand-300 text-[10px] font-bold uppercase tracking-wider border border-brand-400/30">
                Field Representative App
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight mt-1">Mobile Order Booking</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as: <span className="text-brand-300 font-medium">{user?.email}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-xl mt-5 border border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'create'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Book Order
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-brand-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> My Sales
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

      {/* TAB 1: BOOK ORDER */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmitOrder} className="space-y-5">
          {/* 1. Customer Selection Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-bold text-slate-900">Select Customer</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Step 1 of 3
              </span>
            </div>

            <div className="space-y-3">
              {BENCHMARK_CUSTOMERS_LIST.map((cust) => {
                const isSelected = cust.id === selectedCustomerId;
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(cust.id)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-slate-900">{cust.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              cust.type === 'DISTRIBUTOR'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {cust.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          GSTIN: <span className="font-mono">{cust.gstin}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          State: {cust.state} (Code: {cust.stateCode})
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">₹{cust.defaultPrice.toFixed(2)}</span>
                        <p className="text-[10px] text-slate-400">per pkt</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Tax Regime:</span>
                      <span className="font-semibold text-slate-700">
                        {cust.stateCode === '33'
                          ? 'Intra-state (CGST 2.5% + SGST 2.5%)'
                          : 'Inter-state (IGST 5.0%)'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Product Catalogue & Quantity Stepper */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-bold text-slate-900">Product Catalogue</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Step 2 of 3
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Murukku 200g Pack</h3>
                  <p className="text-[11px] text-slate-500">
                    Code: <span className="font-mono">FG-MUR-200G</span> | HSN: <span className="font-mono">19059040</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Available Stock: 238 pkts
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                      Pack: 200g
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-brand-600">
                    ₹{unitPrice.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {selectedCustomer.type === 'DISTRIBUTOR' ? 'Distributor Tier' : 'Retailer Tier'}
                  </p>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Order Quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderedQty((q) => Math.max(1, q - 10))}
                    className="w-9 h-9 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={orderedQty}
                    onChange={(e) => setOrderedQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-9 rounded-lg border border-slate-300 text-center font-bold text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setOrderedQty((q) => q + 10)}
                    className="w-9 h-9 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Pick Buttons */}
              <div className="flex gap-2 pt-1">
                {[50, 100, 120, 150, 200].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setOrderedQty(q)}
                    className={`flex-1 py-1 rounded text-[11px] font-semibold border transition-all ${
                      orderedQty === q
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery & Notes */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Expected Delivery
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 45 Days">Net 45 Days</option>
                  <option value="Advance COD">Advance / COD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Dispatch / Delivery Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Festival stock / deliver before 10 AM"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Real-Time Order & Tax Calculation Breakdown */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <h2 className="text-sm font-bold text-slate-900">Order Tax Summary</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Step 3 of 3
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Value ({orderedQty} pkts × ₹{unitPrice.toFixed(2)})</span>
                <span className="font-semibold text-slate-900">₹{taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {!isInterState ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Intra-state CGST (2.5%)</span>
                    <span className="font-medium text-slate-800">₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Intra-state SGST (2.5%)</span>
                    <span className="font-medium text-slate-800">₹{sgstAmount.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-600">
                  <span>Inter-state IGST (5.0%)</span>
                  <span className="font-medium text-slate-800">₹{igstAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-2">
                <span className="font-medium">Total Statutory Tax</span>
                <span className="font-semibold text-slate-800">₹{totalTax.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Invoice Value:</span>
                <span className="text-brand-600">
                  ₹{totalOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting Order...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Sales Order
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: ORDER HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by SO number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {isLoadingOrders ? (
            <div className="text-center py-12 text-slate-500 text-xs">Loading order stream...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
              <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No orders booked yet</p>
              <p className="text-[11px] text-slate-400 mt-1">Book your first order using the Book Order tab.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-brand-300 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-600">{ord.soNumber}</span>
                        {getStatusBadge(ord.status)}
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 mt-1">{ord.customerName}</h3>
                      <p className="text-[10px] text-slate-500">
                        Date: {new Date(ord.orderDate).toLocaleDateString()} | Delivery: {ord.expectedDeliveryDate || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{ord.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {ord.items.reduce((acc, i) => acc + i.orderedQty, 0)} pkts
                      </p>
                    </div>
                  </div>

                  {ord.status === 'REJECTED' && ord.rejectionReason && (
                    <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span><strong>Rejection Reason:</strong> {ord.rejectionReason}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                    <span>Representative: {ord.salesmanName}</span>
                    {ord.invoiceNumber && (
                      <span className="font-mono text-purple-700 font-semibold">{ord.invoiceNumber}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOMER PERFORMANCE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Total Orders Booked
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1">{orders.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Total Sales Revenue
              </span>
              <p className="text-2xl font-black text-brand-600 mt-1">
                ₹
                {orders
                  .filter((o) => o.status !== 'REJECTED' && o.status !== 'CANCELLED')
                  .reduce((acc, o) => acc + o.totalAmount, 0)
                  .toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Customer-wise Sales Breakdown
            </h2>

            {customerStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No customer sales data available.</p>
            ) : (
              <div className="space-y-3">
                {customerStats.map((stat) => (
                  <div key={stat.customerId} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-900">{stat.customerName}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                        {stat.customerType}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Orders</span>
                        <span className="font-bold text-slate-800">{stat.orderCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Total Revenue</span>
                        <span className="font-bold text-emerald-700">₹{stat.totalRevenue.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Avg Order</span>
                        <span className="font-bold text-slate-800">₹{stat.avgOrderValue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-brand-600">{selectedOrder.soNumber}</span>
                <h2 className="text-base font-bold text-slate-900">{selectedOrder.customerName}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Status:</span>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Order Date:</span>
                <span className="font-medium text-slate-800">
                  {new Date(selectedOrder.orderDate).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Place of Supply:</span>
                <span className="font-medium text-slate-800">
                  {selectedOrder.customerState} ({selectedOrder.customerStateCode})
                </span>
              </div>
              {selectedOrder.invoiceNumber && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">GST Invoice:</span>
                  <span className="font-mono font-bold text-purple-700">{selectedOrder.invoiceNumber}</span>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Ordered Products</h3>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{item.productName}</span>
                    <span>₹{item.lineTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>
                      {item.orderedQty} {item.unitCode} × ₹{item.unitPrice.toFixed(2)}
                    </span>
                    <span>Tax: ₹{(item.cgstAmount + item.sgstAmount + item.igstAmount).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className="pt-3 border-t border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount</span>
                <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Statutory GST</span>
                <span>₹{selectedOrder.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                <span>Grand Total</span>
                <span className="text-brand-600">₹{selectedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
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
