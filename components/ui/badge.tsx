import * as React from 'react';
import { cn } from '@/lib/utils';

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants: Record<string, string> = {
    default: 'border-[rgba(255,223,112,0.24)] bg-[rgba(255,223,112,0.12)] text-[var(--gold-light)]',
    secondary: 'border-white/10 bg-white/[0.05] text-secondary-foreground',
    destructive: 'border-red-500/30 bg-red-500/12 text-red-300',
    outline: 'border-white/16 text-foreground',
    success: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-300',
    warning: 'border-amber-500/30 bg-amber-500/12 text-amber-200',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';

export { Badge };
