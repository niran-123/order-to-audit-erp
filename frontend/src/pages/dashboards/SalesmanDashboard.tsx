import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ShoppingCart, Target, ShieldAlert, Smartphone } from 'lucide-react';
import api from '../../services/api';

export const SalesmanDashboard: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [crossSalesmanError, setCrossSalesmanError] = useState<string | null>(null);

  useEffect(() => {
    // Scoped order query
    api.get('/sales/orders').then((res) => {
      setOrders(res.data.data || []);
    }).catch(console.error);
  }, []);

  const testAccessOtherSalesmanOrder = async () => {
    try {
      setCrossSalesmanError(null);
      // Attempting to access order SO-002 which belongs to another salesman
      await api.get('/sales/orders/so-002');
      alert('Cross-salesman access allowed (Unexpected)!');
    } catch (err: any) {
      setCrossSalesmanError(err.message || 'Forbidden: Salesmen cannot access other salesmen records');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sales Representative Portal</h2>
            <StatusBadge status="active" label="Salesman Scoped" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Field order capture, monthly quota tracker, and personal account book.</p>
        </div>
        <Link
          to="/sales/mobile"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Launch Mobile Order App</span>
        </Link>
      </div>

      {crossSalesmanError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span><strong>Security Invariant Enforced:</strong> {crossSalesmanError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Monthly Sales Target" value="₹ 18,00,000" subtitle="Achievement: 74%" icon={<Target className="w-5 h-5" />} />
        <MetricCard title="My Booked Orders" value={orders.length} subtitle="Scoped strictly to your ID" icon={<ShoppingCart className="w-5 h-5" />} />
        <MetricCard title="Committed Value" value="₹ 2,45,000" subtitle="Pending factory dispatch" icon={<ShoppingCart className="w-5 h-5 text-emerald-600" />} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">My Assigned Orders</h3>
          <button
            onClick={testAccessOtherSalesmanOrder}
            className="text-[11px] text-brand-600 hover:text-brand-800 font-medium underline"
          >
            Test Cross-Salesman Security Guard
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-2.5 px-3">SO Number</th>
                <th className="py-2.5 px-3">Total Value</th>
                <th className="py-2.5 px-3">Representative</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-900">{o.soNumber}</td>
                  <td className="py-2.5 px-3 font-mono">₹ {o.totalAmount}</td>
                  <td className="py-2.5 px-3 text-slate-600">{o.salesmanEmail}</td>
                  <td className="py-2.5 px-3"><StatusBadge status="completed" label={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
