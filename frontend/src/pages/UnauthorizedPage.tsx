import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { roles } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-sm">
        <ShieldAlert className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 tracking-tight">403 - Access Forbidden</h2>
      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
        Your current system persona <span className="font-mono font-semibold text-slate-800">[{roles.join(', ')}]</span> does not possess authorized clearance for this operational partition.
      </p>

      <div className="mt-4 p-3 bg-slate-100 rounded-lg text-left text-[11px] text-slate-500 space-y-1 w-full font-mono">
        <div>Policy Invariant: Granular RBAC Enforced</div>
        <div>Security Audit Log: Action Recorded</div>
      </div>

      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Authorized Workspace</span>
      </Link>
    </div>
  );
};
