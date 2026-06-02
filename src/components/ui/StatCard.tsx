import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variants = {
  default: 'from-btp-600/30 to-btp-800/50 border-btp-500/30',
  success: 'from-green-600/20 to-btp-800/50 border-green-500/30',
  warning: 'from-amber-600/20 to-btp-800/50 border-amber-500/30',
  danger: 'from-red-600/20 to-btp-800/50 border-red-500/30',
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className={`glass-card rounded-xl p-4 border bg-gradient-to-br ${variants[variant]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-slate-400 truncate">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
        </div>
        <div className="p-2 rounded-lg bg-btp-600/30 shrink-0">
          <Icon className="w-5 h-5 text-btp-300" />
        </div>
      </div>
    </div>
  );
}
