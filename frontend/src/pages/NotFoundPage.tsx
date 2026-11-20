import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
      <h2 className="text-xl font-bold text-slate-900">404 - Page Not Found</h2>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">
        The requested ERP route does not exist or has not yet been provisioned in this release.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Executive Cockpit</span>
      </Link>
    </div>
  );
};
