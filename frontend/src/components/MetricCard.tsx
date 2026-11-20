import React from 'react';
import { cn } from '../utils/cn';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  delta?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  delta,
  icon,
  className,
}) => {
  return (
    <div className={cn('bg-white border border-slate-200 rounded-xl p-5 shadow-sm', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
      <div className="text-2xl font-semibold tracking-tight text-slate-900 font-mono">{value}</div>
      {(subtitle || delta) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta && (
            <span
              className={cn(
                'font-medium',
                delta.isPositive ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              {delta.isPositive ? '↑' : '↓'} {delta.value}
            </span>
          )}
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
