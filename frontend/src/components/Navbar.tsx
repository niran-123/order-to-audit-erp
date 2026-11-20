import React from 'react';
import { Bell, ShieldCheck, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, roles, logout } = useAuth();
  const userName = user ? `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || user.email : 'Guest';
  const roleDisplay = roles.length > 0 ? roles.join(', ') : 'OPERATOR';

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
          Pune Plant 01
        </span>
        <span className="text-xs text-slate-400 font-mono">Period: 2026-11 (Active)</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
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
