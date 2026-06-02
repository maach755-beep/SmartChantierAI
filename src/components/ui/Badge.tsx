interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'orange' | 'red' | 'blue' | 'gray';
}

const colors = {
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  orange: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  blue: 'bg-btp-500/20 text-btp-300 border-btp-500/30',
  gray: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export function Badge({ children, variant = 'blue' }: BadgeProps) {
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full border ${colors[variant]}`}>
      {children}
    </span>
  );
}
