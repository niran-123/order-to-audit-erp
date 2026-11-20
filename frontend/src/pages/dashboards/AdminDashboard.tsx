import React, { useState, useEffect } from 'react';
import { MetricCard } from '../../components/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  ShoppingCart,
  FileText,
  Truck,
  DollarSign,
  PackageCheck,
} from 'lucide-react';
import api from '../../services/api';
import { ReportService, AdminDashboardData } from '../../services/reportService';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: 'DemoPass@2026',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'SALESMAN',
  });
  const [msg, setMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, adminRes] = await Promise.all([
        api.get('/users'),
        ReportService.getAdminDashboard(),
      ]);
      setUsers(usersRes.data.data || []);
      setAdminData(adminRes);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      setMsg(`User ${formData.email} provisioned successfully!`);
      setShowCreateModal(false);
      setFormData({ email: '', password: 'DemoPass@2026', firstName: '', lastName: '', phone: '', role: 'SALESMAN' });
      fetchData();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const toggleStatus = async (user: any) => {
    try {
      const newStatus = !user.isActive;
      await api.patch(`/users/${user.id}/status`, {
        isActive: newStatus,
        reason: `Admin requested ${newStatus ? 'reactivation' : 'suspension'} via control console`,
      });
      fetchData();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Operations Console (Admin)</h2>
            <StatusBadge status="healthy" label="Admin Clearance" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline: Incoming orders, invoice status, fulfillment dispatches, customer collections, and user provisioning.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Provision User</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-brand-50 border border-brand-200 text-brand-900 rounded-lg text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-brand-700 hover:text-brand-900 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Row 1: Operational Flow KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pending Orders"
          value={adminData ? `${adminData.orders.pendingCount}` : '...'}
          subtitle={adminData ? `Approved: ${adminData.orders.approvedCount} | Total: ${adminData.orders.totalCount}` : '...'}
          icon={<ShoppingCart className="w-5 h-5 text-amber-600" />}
        />
        <MetricCard
          title="Invoices Generated"
          value={adminData ? `${adminData.invoicesGeneratedCount}` : '...'}
          subtitle={adminData ? `Total: ₹ ${adminData.totalInvoicedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '...'}
          icon={<FileText className="w-5 h-5 text-brand-600" />}
        />
        <MetricCard
          title="Dispatch Status"
          value={adminData ? `${adminData.dispatchStatusCounts.dispatched} Dispatched` : '...'}
          subtitle={adminData ? `Pending: ${adminData.dispatchStatusCounts.pending} | Partial: ${adminData.dispatchStatusCounts.partiallyDispatched}` : '...'}
          icon={<Truck className="w-5 h-5 text-indigo-600" />}
        />
        <MetricCard
          title="Customer Collections"
          value={adminData ? `₹ ${adminData.customerCollectionsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '...'}
          subtitle="Total payments realized"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Row 2: Live Stock Availability */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-brand-600" />
            <span>Live Stock Availability (All Materials & Finished Goods)</span>
          </h3>
          <span className="text-xs text-slate-500">Decrements only on confirmed dispatch DC</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Item Code</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Current Stock</th>
                <th className="py-2.5 px-3 text-right">Available Stock</th>
                <th className="py-2.5 px-3 text-right">Reorder Level</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-400">Loading stock balances...</td>
                </tr>
              ) : adminData?.stockAvailability && adminData.stockAvailability.length > 0 ? (
                adminData.stockAvailability.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-mono font-medium text-slate-900">{item.code}</td>
                    <td className="py-2 px-3 text-slate-700">{item.name}</td>
                    <td className="py-2 px-3 text-slate-500">{item.category}</td>
                    <td className="py-2 px-3 text-right font-medium text-slate-900">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600">
                      {item.availableStock} {item.unit}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      {item.reorderLevel} {item.unit}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'LOW_STOCK'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-slate-400">No inventory records available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: User Provisioning & RBAC Management */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-600" />
            <span>User Management & Security Administration</span>
          </h3>
          <span className="text-xs text-slate-500">Authorized Admin Persona</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Roles</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">Loading directory...</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{u.firstName} {u.lastName}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles?.map((r: any) => (
                          <span key={r.role?.code || r} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                            {r.role?.code || r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 font-medium ${u.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {u.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{u.isActive ? 'Active' : 'Deactivated'}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => toggleStatus(u)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${
                          u.isActive
                            ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for User Provisioning */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Provision New Enterprise Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. j.doe@company.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98400 12345"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Assigned System Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="SALESMAN">SALESMAN</option>
                  <option value="PRODUCTION_SUPERVISOR">PRODUCTION_SUPERVISOR</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="AUDITOR">AUDITOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold shadow-sm"
                >
                  Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
