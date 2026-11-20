import React from 'react';
import { cn } from '../utils/cn';

interface StatusBadgeProps {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'active' | 'in_progress' | 'completed' | 'draft';
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className }) => {
  const displayLabel = label || status.replace('_', ' ').toUpperCase();

  const colorStyles: Record<string, string> = {
    healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    degraded: 'bg-amber-50 text-amber-700 border-amber-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    unhealthy: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const dotStyles: Record<string, string> = {
    healthy: 'bg-emerald-500',
    active: 'bg-emerald-500',
    completed: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    in_progress: 'bg-blue-500',
    draft: 'bg-slate-400',
    unhealthy: 'bg-rose-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        colorStyles[status] || colorStyles.draft,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[status] || dotStyles.draft)} />
      {displayLabel}
    </span>
  );
};
