import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  FileText,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Package,
  ShieldCheck,
} from 'lucide-react';
import {
  salesService,
  SalesOrder,
  StockAvailabilityCheck,
} from '../../services/salesService';

export const AdminOrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [stockChecks, setStockChecks] = useState<Record<string, StockAvailabilityCheck>>({});
  const [isCheckingStock, setIsCheckingStock] = useState(false);

  // Reject Modal State
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Dispatch Modal State
  const [dispatchOrder, setDispatchOrder] = useState<SalesOrder | null>(null);
  const [carrierName, setCarrierName] = useState('VRL Logistics Ltd');
  const [vehicleNumber, setVehicleNumber] = useState('TN-45-AZ-9988');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchQty, setDispatchQty] = useState<number>(0);
  const [isDispatching, setIsDispatching] = useState(false);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await salesService.getOrders();
      setOrders(data);
    } catch (err: any) {
      console.error('Failed to load sales orders:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to load sales orders.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !searchQuery ||
      o.soNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.salesmanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Metrics
  const totalOrdersCount = orders.length;
  const pendingReviewCount = orders.filter((o) => o.status === 'SUBMITTED').length;
  const approvedReadyCount = orders.filter((o) => o.status === 'APPROVED' || o.status === 'INVOICED').length;
  const dispatchedCount = orders.filter((o) => o.status === 'DISPATCHED' || o.status === 'PARTIALLY_DISPATCHED').length;
  const totalSalesVolume = orders
    .filter((o) => o.status !== 'REJECTED' && o.status !== 'CANCELLED')
    .reduce((acc, o) => acc + o.totalAmount, 0);

  // Handle Review & Check Stock Modal
  const handleOpenReview = async (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsCheckingStock(true);
    const checks: Record<string, StockAvailabilityCheck> = {};

    try {
      for (const item of order.items) {
        const remainingToDispatch = Math.max(0, item.orderedQty - item.dispatchedQty);
        const check = await salesService.checkStockAvailability(item.productId, remainingToDispatch);
        checks[item.productId] = check;
      }
      setStockChecks(checks);
    } catch (err: any) {
      console.error('Stock check error:', err);
    } finally {
      setIsCheckingStock(false);
    }
  };

  // Handle Approve Order
  const handleApprove = async (orderId: string) => {
    try {
      const updated = await salesService.approveOrder(orderId);
      setFeedback({
        type: 'success',
        message: `Sales Order ${updated.soNumber} successfully approved for fulfillment!`,
      });
      loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to approve order.',
      });
    }
  };

  // Handle Reject Order
  const handleReject = async () => {
    if (!rejectOrderId || !rejectReason.trim()) {
      setFeedback({ type: 'error', message: 'A rejection reason is required (min 3 characters).' });
      return;
    }

    setIsRejecting(true);
    try {
      const updated = await salesService.rejectOrder(rejectOrderId, rejectReason.trim());
      setFeedback({
        type: 'success',
        message: `Order ${updated.soNumber} rejected. Reason: ${rejectReason}`,
      });
      setRejectOrderId(null);
      setRejectReason('');
      loadOrders();
      if (selectedOrder?.id === rejectOrderId) {
        setSelectedOrder(null);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to reject order.',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  // Handle Generate Invoice
  const handleGenerateInvoice = async (orderId: string) => {
    try {
      const invoice = await salesService.generateInvoice(orderId);
      setFeedback({
        type: 'success',
        message: `GST Tax Invoice ${invoice.invoiceNumber} posted successfully! Place of Supply: ${invoice.placeOfSupply}`,
      });
      loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to generate GST invoice.',
      });
    }
  };

  // Open Dispatch Modal
  const handleOpenDispatch = (order: SalesOrder) => {
    setDispatchOrder(order);
    const item = order.items[0];
    const remaining = item ? Math.max(0, item.orderedQty - item.dispatchedQty) : 0;
    setDispatchQty(remaining);
    setTrackingNumber(`TRK-DC-${order.soNumber.replace('SO-', '')}`);
  };

  // Execute Dispatch
  const handleExecuteDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchOrder) return;

    if (dispatchQty <= 0) {
      setFeedback({ type: 'error', message: 'Dispatched quantity must be greater than zero.' });
      return;
    }

    setIsDispatching(true);
    try {
      const item = dispatchOrder.items[0];
      const result = await salesService.createDispatch(dispatchOrder.id, {
        carrierName,
        vehicleNumber,
        trackingNumber,
        items: [
          {
            salesOrderItemId: item.id,
            productId: item.productId,
            dispatchedQty: dispatchQty,
          },
        ],
      });

      setFeedback({
        type: 'success',
        message: `Delivery Challan ${result.deliveryChallanNo} generated! Finished goods stock decremented by ${result.totalDispatchedQty} units.`,
      });
      setDispatchOrder(null);
      loadOrders();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Dispatch execution failed.',
      });
    } finally {
      setIsDispatching(false);
    }
  };

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
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold uppercase tracking-wider border border-brand-200">
              Commercial Sales Operations
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-mono">
              Order-to-Dispatch
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Sales Order Management & Fulfillment
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review field orders, audit GST compliance, verify finished goods stock availability, and issue delivery challans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadOrders}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" /> Refresh Stream
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
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Orders</span>
            <ShoppingCart className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalOrdersCount}</p>
          <span className="text-[10px] text-slate-400">All registered orders</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{pendingReviewCount}</p>
          <span className="text-[10px] text-amber-600">Requires Admin approval</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-blue-200 bg-blue-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase">Approved / Invoiced</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">{approvedReadyCount}</p>
          <span className="text-[10px] text-blue-600">Ready for dispatch</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase">Dispatched</span>
            <Truck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{dispatchedCount}</p>
          <span className="text-[10px] text-emerald-600">Out for delivery</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-brand-200 bg-brand-50/20 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-brand-700 uppercase">Total Sales Value</span>
            <ShieldCheck className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-black text-brand-700 mt-2">
            ₹{totalSalesVolume.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-[10px] text-brand-600">Net confirmed orders</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search SO #, customer, salesman, invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {['ALL', 'SUBMITTED', 'APPROVED', 'INVOICED', 'PARTIALLY_DISPATCHED', 'DISPATCHED', 'REJECTED'].map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">SO Number</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Sales Rep</th>
                <th className="py-3 px-4">Ordered / Dispatched</th>
                <th className="py-3 px-4 text-right">Taxable (₹)</th>
                <th className="py-3 px-4 text-right">GST Tax (₹)</th>
                <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading commercial orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No orders matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const totalOrdered = ord.items.reduce((acc, i) => acc + i.orderedQty, 0);
                  const totalDispatched = ord.items.reduce((acc, i) => acc + i.dispatchedQty, 0);
                  const isIntraState = ord.customerStateCode === '33';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                        {ord.soNumber}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {new Date(ord.orderDate).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{ord.customerName}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          <span
                            className={`px-1.5 py-0.2 rounded font-semibold ${
                              ord.customerType === 'DISTRIBUTOR'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {ord.customerType}
                          </span>
                          <span>• {ord.customerState} ({ord.customerStateCode})</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800">{ord.salesmanName}</div>
                        <div className="text-[10px] text-slate-400">{ord.salesmanEmail}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {totalDispatched} / {totalOrdered} pkts
                        </div>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-brand-600 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(100, (totalDispatched / totalOrdered) * 100)}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-800">
                        ₹{ord.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        ₹{ord.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        <span className="block text-[10px] text-slate-400">
                          {isIntraState ? 'CGST+SGST 5%' : 'IGST 5%'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                        ₹{ord.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-center">{getStatusBadge(ord.status)}</td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Review & Check Stock Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenReview(ord)}
                            title="Review items and verify FG stock"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Actions based on status */}
                          {ord.status === 'SUBMITTED' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(ord.id)}
                                title="Approve Order"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectOrderId(ord.id)}
                                title="Reject Order"
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {ord.status === 'APPROVED' && !ord.invoiceNumber && (
                            <button
                              type="button"
                              onClick={() => handleGenerateInvoice(ord.id)}
                              title="Generate GST Tax Invoice"
                              className="px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-[10px] font-bold flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" /> Invoice
                            </button>
                          )}

                          {(ord.status === 'APPROVED' ||
                            ord.status === 'INVOICED' ||
                            ord.status === 'PARTIALLY_DISPATCHED') && (
                            <button
                              type="button"
                              onClick={() => handleOpenDispatch(ord)}
                              title="Dispatch Delivery Challan"
                              className="px-2 py-1 rounded bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 text-[10px] font-bold flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3" /> Dispatch
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ORDER REVIEW & REAL-TIME STOCK SHORTAGE CHECK */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-600">{selectedOrder.soNumber}</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">{selectedOrder.customerName}</h2>
                <p className="text-xs text-slate-500">
                  GSTIN: {selectedOrder.customerGstin} | State: {selectedOrder.customerState} ({selectedOrder.customerStateCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Real-time Finished Goods Stock Availability & Replenishment Alert */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-brand-600" />
                  Finished Goods Stock Availability Audit
                </h3>
                {isCheckingStock && (
                  <span className="text-[10px] text-slate-400">Verifying live inventory...</span>
                )}
              </div>

              {selectedOrder.items.map((item) => {
                const stockCheck = stockChecks[item.productId];
                const remaining = item.orderedQty - item.dispatchedQty;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border space-y-3 ${
                      stockCheck?.hasShortage
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{item.productName}</h4>
                        <p className="text-[10px] text-slate-500">
                          Code: {item.productCode} | HSN: {item.hsnCode} | Unit Price: ₹{item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">₹{item.lineTotal.toFixed(2)}</span>
                        <p className="text-[10px] text-slate-400">
                          Ordered: {item.orderedQty} | Dispatched: {item.dispatchedQty}
                        </p>
                      </div>
                    </div>

                    {/* Stock Status Bar */}
                    {stockCheck ? (
                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Requested</span>
                            <span className="font-bold text-slate-800">{remaining} pkts</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Available Stock</span>
                            <span
                              className={`font-bold ${
                                stockCheck.availableQty < remaining
                                  ? 'text-rose-600'
                                  : 'text-emerald-700'
                              }`}
                            >
                              {stockCheck.availableQty} pkts
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Shortage</span>
                            <span
                              className={`font-bold ${
                                stockCheck.shortageQty > 0 ? 'text-rose-600' : 'text-slate-400'
                              }`}
                            >
                              {stockCheck.shortageQty > 0 ? `${stockCheck.shortageQty} pkts` : 'Nil'}
                            </span>
                          </div>
                        </div>

                        {stockCheck.hasShortage && (
                          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block">Production Replenishment Alert:</strong>
                              Available finished goods stock is insufficient to fulfill this order. A production batch run must be executed to manufacture at least {stockCheck.shortageQty} additional packets before complete dispatch.
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400">Verifying stock balance...</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Statutory Tax Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Value:</span>
                <span className="font-semibold text-slate-900">₹{selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST (2.5%):</span>
                <span>₹{selectedOrder.cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST (2.5%):</span>
                <span>₹{selectedOrder.sgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IGST (5.0%):</span>
                <span>₹{selectedOrder.igstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                <span>Invoice Total:</span>
                <span className="text-brand-600">₹{selectedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {selectedOrder.status === 'SUBMITTED' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectOrderId(selectedOrder.id);
                      setSelectedOrder(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold"
                  >
                    Reject Order
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedOrder.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow"
                  >
                    Approve Order
                  </button>
                </>
              )}

              {selectedOrder.status === 'APPROVED' && !selectedOrder.invoiceNumber && (
                <button
                  type="button"
                  onClick={() => handleGenerateInvoice(selectedOrder.id)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Generate GST Invoice
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT ORDER MODAL */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <XCircle className="w-6 h-6" />
              <h2 className="text-base font-bold text-slate-900">Reject Sales Order</h2>
            </div>
            <p className="text-xs text-slate-500">
              Please provide a specific justification reason for rejecting this order. The sales representative will be notified.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Rejection Reason (Mandatory)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Credit limit exceeded / delivery address unserviceable"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 p-2.5 text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectOrderId(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isRejecting || rejectReason.trim().length < 3}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow disabled:opacity-50"
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DISPATCH & DELIVERY CHALLAN MODAL */}
      {dispatchOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteDispatch}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-brand-600">{dispatchOrder.soNumber}</span>
                <h2 className="text-base font-bold text-slate-900">Generate Delivery Challan & Dispatch</h2>
                <p className="text-xs text-slate-500">Consignee: {dispatchOrder.customerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setDispatchOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Logistics Carrier
                </label>
                <input
                  type="text"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Carrier Waybill / Tracking #
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono"
              />
            </div>

            {/* Line Item Dispatch Quantity Input */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-900">
                <span>{dispatchOrder.items[0]?.productName}</span>
                <span>Ordered: {dispatchOrder.items[0]?.orderedQty} pkts</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>Quantity to Dispatch Now:</span>
                <input
                  type="number"
                  min="1"
                  value={dispatchQty}
                  onChange={(e) => setDispatchQty(parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded border border-slate-300 text-center font-bold text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Executing dispatch will deduct this quantity from Finished Goods stock via a DISPATCH_OUT ledger entry.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDispatchOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDispatching}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow disabled:opacity-50 flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                {isDispatching ? 'Posting Dispatch...' : 'Issue Delivery Challan & Post'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
