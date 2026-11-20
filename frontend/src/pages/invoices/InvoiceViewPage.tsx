import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  ShieldCheck,
  Search,
  AlertCircle,
} from 'lucide-react';
import { salesService, GSTInvoice } from '../../services/salesService';

export const InvoiceViewPage: React.FC = () => {
  const [invoices, setInvoices] = useState<GSTInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<GSTInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await salesService.getInvoices();
      setInvoices(data);
      if (data.length > 0 && !selectedInvoice) {
        setSelectedInvoice(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.soNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteAttempt = () => {
    setFeedback({
      type: 'error',
      message:
        'Statutory Compliance Violation: Posted GST invoices are permanent audit records and cannot be deleted.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (hidden during print) */}
      <div className="print:hidden bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider border border-purple-200">
              Statutory GST Compliance
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-mono">
              Tax Invoices & E-Way Bills
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            GST Tax Invoices & Billing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official GST-compliant tax invoices under Section 31 of the CGST Act, 2017.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedInvoice && (
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {feedback && (
        <div
          className={`print:hidden p-4 rounded-xl flex items-start gap-3 border shadow-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
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

      {/* Main Grid: Left selector, Right Document View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Invoice List (hidden on print) */}
        <div className="print:hidden lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Tax Invoices ({invoices.length})</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
              Immutable
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search invoice #, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No posted invoices found. Generate an invoice from an approved sales order.
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredInvoices.map((inv) => {
                const isSelected = selectedInvoice?.id === inv.id;
                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-400 shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-purple-700">
                          {inv.invoiceNumber}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 mt-0.5">{inv.customerName}</h3>
                        <p className="text-[10px] text-slate-400">
                          {new Date(inv.invoiceDate).toLocaleDateString()} | SO: {inv.soNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-900">
                          ₹{inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="block text-[9px] font-bold text-emerald-600 uppercase">
                          {inv.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Compliant Printable GST Tax Invoice Document */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-300 shadow-lg p-8 print:p-0 print:border-none print:shadow-none space-y-6">
          {selectedInvoice ? (
            <div className="space-y-6">
              {/* Document Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                    ORIGINAL FOR RECIPIENT
                  </span>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">TAX INVOICE</h1>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    (Issued under Section 31 of the Central Goods and Services Tax Act, 2017)
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded bg-slate-900 text-white font-mono text-xs font-bold">
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Date: <strong className="text-slate-800">{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</strong>
                  </p>
                </div>
              </div>

              {/* Seller and Buyer Information Grid */}
              <div className="grid grid-cols-2 gap-6 text-xs border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                {/* Seller Details */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                    Seller (Supplier Details)
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedInvoice.sellerName}</h3>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{selectedInvoice.sellerAddress}</p>
                  <p className="pt-1">
                    <strong>GSTIN:</strong> <span className="font-mono font-bold text-slate-900">{selectedInvoice.sellerGstin}</span>
                  </p>
                  <p>
                    <strong>State:</strong> {selectedInvoice.sellerState} (Code: <span className="font-mono">{selectedInvoice.sellerStateCode}</span>)
                  </p>
                </div>

                {/* Buyer Details */}
                <div className="space-y-1 border-l border-slate-200 pl-6">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                    Buyer (Billed & Shipped Consignee)
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedInvoice.customerName}</h3>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{selectedInvoice.billingAddress}</p>
                  <p className="pt-1">
                    <strong>GSTIN:</strong>{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {selectedInvoice.customerGstin || 'URP (Unregistered Person)'}
                    </span>
                  </p>
                  <p>
                    <strong>Place of Supply:</strong> <span className="font-semibold">{selectedInvoice.placeOfSupply}</span>
                  </p>
                  <p>
                    <strong>Supply Type:</strong>{' '}
                    <span className="font-semibold text-purple-700">
                      {selectedInvoice.isInterState ? 'Inter-state Supply (IGST)' : 'Intra-state Supply (CGST + SGST)'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Order References */}
              <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sales Order Ref</span>
                  <span className="font-mono font-bold text-slate-800">{selectedInvoice.soNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Due Date</span>
                  <span className="font-bold text-slate-800">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Reverse Charge</span>
                  <span className="font-bold text-slate-800">No</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Description of Goods</th>
                      <th className="py-2.5 px-3">HSN/SAC</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                      <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                      {!selectedInvoice.isInterState ? (
                        <>
                          <th className="py-2.5 px-2 text-right">CGST</th>
                          <th className="py-2.5 px-2 text-right">SGST</th>
                        </>
                      ) : (
                        <th className="py-2.5 px-2 text-right">IGST</th>
                      )}
                      <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={item.id} className="text-slate-800">
                        <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <strong className="block font-bold">{item.productName}</strong>
                          <span className="text-[10px] text-slate-500 font-mono">{item.productCode}</span>
                        </td>
                        <td className="py-3 px-3 font-mono">{item.hsnCode}</td>
                        <td className="py-3 px-3 text-right font-bold">
                          {item.quantity} {item.unitCode}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">₹{item.unitPrice.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold">
                          ₹{item.taxableValue.toFixed(2)}
                        </td>

                        {!selectedInvoice.isInterState ? (
                          <>
                            <td className="py-3 px-2 text-right font-mono text-[11px]">
                              ₹{item.cgstAmount.toFixed(2)}
                              <span className="block text-[9px] text-slate-400">(2.5%)</span>
                            </td>
                            <td className="py-3 px-2 text-right font-mono text-[11px]">
                              ₹{item.sgstAmount.toFixed(2)}
                              <span className="block text-[9px] text-slate-400">(2.5%)</span>
                            </td>
                          </>
                        ) : (
                          <td className="py-3 px-2 text-right font-mono text-[11px]">
                            ₹{item.igstAmount.toFixed(2)}
                            <span className="block text-[9px] text-slate-400">(5.0%)</span>
                          </td>
                        )}

                        <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                          ₹{item.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation & Tax Breakdown */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="text-[11px] text-slate-500 space-y-2">
                  <div>
                    <strong className="text-slate-700 block">Statutory Declaration:</strong>
                    We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. Goods once sold will not be taken back without prior written authorization.
                  </div>
                  <div>
                    <strong className="text-slate-700 block">Bank Account for NEFT/RTGS:</strong>
                    A/C Name: Order-to-Audit Foods LLP | Bank: HDFC Bank | A/C: 50200088192831 | IFSC: HDFC0001245
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Taxable Amount</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ₹{selectedInvoice.taxableAmount.toFixed(2)}
                    </span>
                  </div>

                  {!selectedInvoice.isInterState ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Central Tax (CGST 2.5%)</span>
                        <span className="font-mono text-slate-800">₹{selectedInvoice.cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>State Tax (SGST 2.5%)</span>
                        <span className="font-mono text-slate-800">₹{selectedInvoice.sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>Integrated Tax (IGST 5.0%)</span>
                      <span className="font-mono text-slate-800">₹{selectedInvoice.igstAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                    <span>Total Tax Amount</span>
                    <span className="font-mono font-semibold text-slate-800">
                      ₹{selectedInvoice.totalTax.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-black text-slate-900 border-t-2 border-slate-900 pt-2">
                    <span>Grand Total (INR)</span>
                    <span className="font-mono text-brand-600">
                      ₹{selectedInvoice.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatory Footer */}
              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Audited & Certified by:</span>
                  <div className="mt-4 font-mono font-bold text-slate-700">SYSTEM GENERATED GST INVOICE</div>
                  <span className="text-[10px] text-slate-400">Electronic Authentication Signature</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">For {selectedInvoice.sellerName}:</span>
                  <div className="mt-8 font-bold text-slate-800">Authorized Signatory</div>
                </div>
              </div>

              {/* Immutability Banner (hidden on print) */}
              <div className="print:hidden p-3 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Statutory Record Status: Posted & Immutable
                </span>
                <button
                  type="button"
                  onClick={handleDeleteAttempt}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Delete Invoice (Forbidden)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">No Invoice Selected</p>
              <p className="text-xs text-slate-400">Select an invoice from the list on the left to preview.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
