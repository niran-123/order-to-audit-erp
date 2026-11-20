import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogIn, AlertCircle } from 'lucide-react';

const DEMO_PRESETS = [
  { role: 'Owner', email: 'owner@enterprise.com', expectedPath: '/dashboard/owner' },
  { role: 'Admin', email: 'admin@enterprise.com', expectedPath: '/dashboard/admin' },
  { role: 'Salesman', email: 'sales@enterprise.com', expectedPath: '/dashboard/salesman' },
  { role: 'Production Supervisor', email: 'production@enterprise.com', expectedPath: '/dashboard/production' },
  { role: 'Accountant', email: 'accounts@enterprise.com', expectedPath: '/dashboard/accountant' },
  { role: 'Auditor', email: 'auditor@enterprise.com', expectedPath: '/dashboard/auditor' },
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('owner@enterprise.com');
  const [password, setPassword] = useState('DemoPass@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { redirectUrl } = await login(email, password);
      const destination = (location.state as any)?.from?.pathname || redirectUrl || '/';
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your corporate credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
            O
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">Order-to-Audit ERP</h1>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider">Authentication Gateway</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Corporate Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider block mb-2">
            Switch Test Persona (Automated Credentials)
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.email}
                type="button"
                onClick={() => {
                  setEmail(preset.email);
                  setPassword('DemoPass@2026');
                }}
                className="text-left px-2.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] text-slate-700 transition-colors"
              >
                <span className="font-semibold block">{preset.role}</span>
                <span className="text-[10px] text-slate-400 truncate block">{preset.email}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bcrypt Hash | JWT Short-Lived Access Tokens</span>
        </div>
      </div>
    </div>
  );
};
