import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShieldCheck, User, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PERSONA_OPTIONS = [
  { label: '👑 Owner (Executive)', email: 'owner@enterprise.com', path: '/dashboard/owner' },
  { label: '🛡️ Admin (Operations)', email: 'admin@enterprise.com', path: '/dashboard/admin' },
  { label: '📱 Salesman A (Mobile)', email: 'salesman.a@enterprise.com', path: '/sales/mobile' },
  { label: '🏭 Production Supervisor', email: 'supervisor@enterprise.com', path: '/dashboard/production' },
  { label: '💰 Accountant (Finance)', email: 'accountant@enterprise.com', path: '/finance/payments' },
  { label: '🔍 Auditor (Inspection)', email: 'auditor@enterprise.com', path: '/reports' },
];

export const Navbar: React.FC = () => {
  const { user, roles, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const userName = user
    ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || user.email
    : 'Guest';
  const roleDisplay = roles.length > 0 ? roles.join(', ') : 'OPERATOR';

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEmail = e.target.value;
    if (!selectedEmail || selectedEmail === user?.email) return;

    try {
      const option = PERSONA_OPTIONS.find((p) => p.email === selectedEmail);
      const { redirectUrl } = await switchRole(selectedEmail);
      navigate(option?.path || redirectUrl || '/');
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left Plant Info */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
          Pune Plant 01
        </span>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">Period: 2026-11 (Active)</span>
      </div>

      {/* Middle Role Switcher Pill */}
      <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 px-3 py-1 rounded-full shadow-sm">
        <RefreshCw className="w-3.5 h-3.5 text-brand-600 shrink-0" />
        <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider hidden sm:inline">
          Switch Persona:
        </span>
        <select
          value={user?.email || 'admin@enterprise.com'}
          onChange={handleRoleChange}
          className="text-xs font-semibold bg-transparent text-brand-900 border-none outline-none cursor-pointer focus:ring-0 pr-1"
        >
          {PERSONA_OPTIONS.map((persona) => (
            <option key={persona.email} value={persona.email} className="text-slate-900 bg-white">
              {persona.label}
            </option>
          ))}
        </select>
      </div>

      {/* Right User & Actions */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Audit Seal Valid</span>
        </div>

        <button className="text-slate-400 hover:text-slate-600 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-medium">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-900 leading-tight">{userName}</span>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{roleDisplay}</span>
          </div>

          <button
            onClick={() => logout()}
            title="Sign Out"
            className="ml-2 text-slate-400 hover:text-rose-600 transition-colors p-1 rounded hover:bg-slate-100"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
