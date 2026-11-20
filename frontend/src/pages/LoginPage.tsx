import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  AlertCircle,
  Crown,
  Shield,
  Smartphone,
  Factory,
  Calculator,
  FileCheck2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  LogIn,
} from 'lucide-react';

const TEST_PERSONAS = [
  {
    role: 'Executive Owner',
    email: 'owner@enterprise.com',
    icon: Crown,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Executive overview, company P&L, stock health, and gross margins',
    targetDashboard: '/dashboard/owner',
  },
  {
    role: 'System Administrator',
    email: 'admin@enterprise.com',
    icon: Shield,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Operational queues, sales order approvals, user & system governance',
    targetDashboard: '/dashboard/admin',
  },
  {
    role: 'Field Salesman A',
    email: 'salesman.a@enterprise.com',
    icon: Smartphone,
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Mobile order capture, customer catalog lookup & order tracking (Tamil Nadu)',
    targetDashboard: '/sales/mobile',
  },
  {
    role: 'Production Supervisor',
    email: 'supervisor@enterprise.com',
    icon: Factory,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'BOM recipe execution, actual ingredient issues, scrap & line yield',
    targetDashboard: '/dashboard/production',
  },
  {
    role: 'Financial Accountant',
    email: 'accountant@enterprise.com',
    icon: Calculator,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Payment receipts, invoice allocation, debtor ageing & Ind AS 2 costing',
    targetDashboard: '/finance/payments',
  },
  {
    role: 'Statutory Auditor',
    email: 'auditor@enterprise.com',
    icon: FileCheck2,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'Read-only inspection of 17 statutory reports and security audit logs',
    targetDashboard: '/reports',
  },
];

export const LoginPage: React.FC = () => {
  const [activePersonaEmail, setActivePersonaEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualEmail, setManualEmail] = useState('admin@enterprise.com');
  const [manualPassword, setManualPassword] = useState('Admin@Secure2026!');
  const [manualLoading, setManualLoading] = useState(false);

  const { switchRole, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleQuickLogin = async (email: string, targetPath: string) => {
    setActivePersonaEmail(email);
    setError(null);
    try {
      const { redirectUrl } = await switchRole(email);
      const destination = (location.state as any)?.from?.pathname || redirectUrl || targetPath;
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Quick login failed. Server connection error.');
      setActivePersonaEmail(null);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualLoading(true);
    setError(null);
    try {
      const { redirectUrl } = await login(manualEmail, manualPassword);
      const destination = (location.state as any)?.from?.pathname || redirectUrl || '/';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your corporate credentials.');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-600 text-white px-3.5 py-1.5 rounded-xl shadow-sm mb-3">
            <span className="font-bold text-sm tracking-wide">ORDER-TO-AUDIT ERP</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
            Select Your Role to Access Workspace
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
            Single-click persona launcher. Choose any enterprise role below to immediately enter its dedicated workspace with pre-configured role permissions.
          </p>
        </div>

        {error && (
          <div className="mb-6 max-w-2xl mx-auto p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-sm text-rose-800 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Persona Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEST_PERSONAS.map((persona) => {
            const Icon = persona.icon;
            const isSelected = activePersonaEmail === persona.email;

            return (
              <div
                key={persona.email}
                className="bg-white border border-slate-200 hover:border-brand-500 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${persona.badgeColor}`}>
                      {persona.role}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">{persona.role}</h2>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                    {persona.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                    {persona.email}
                  </span>
                  <button
                    type="button"
                    disabled={activePersonaEmail !== null}
                    onClick={() => handleQuickLogin(persona.email, persona.targetDashboard)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                  >
                    <span>{isSelected ? 'Entering...' : 'Enter'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expandable Manual Login Option */}
        <div className="mt-8 max-w-md mx-auto text-center">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 transition-colors"
          >
            <span>{showManualForm ? 'Hide manual email/password input' : 'Enter custom credentials manually'}</span>
            {showManualForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showManualForm && (
            <div className="mt-4 bg-white border border-slate-200 rounded-xl p-6 text-left shadow-sm">
              <form onSubmit={handleManualLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{manualLoading ? 'Signing in...' : 'Sign In Manually'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Security & Audit Footer */}
        <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Statutory RBAC & Audit Trail Active (Ind AS 2 / GST Compliant)</span>
        </div>
      </div>
    </div>
  );
};
