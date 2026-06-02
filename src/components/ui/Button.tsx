import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md';
}

const variants = {
  primary: 'bg-gradient-to-r from-btp-600 to-cyan-600 hover:from-btp-500 hover:to-cyan-500 text-white',
  secondary: 'bg-btp-800/80 border border-btp-500/30 text-slate-200 hover:bg-btp-700/80',
  ghost: 'text-slate-300 hover:bg-btp-800/50',
  danger: 'bg-red-600/80 hover:bg-red-500 text-white',
  success: 'bg-green-600/80 hover:bg-green-500 text-white',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 ${sizeClass} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
