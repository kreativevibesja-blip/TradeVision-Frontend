import * as React from 'react';
import { cn } from '@/lib/utils';

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants: Record<string, string> = {
    default: 'border-[rgba(255,223,112,0.26)] bg-[linear-gradient(180deg,rgba(255,223,112,0.18),rgba(255,223,112,0.08))] text-[var(--gold-light)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
    secondary: 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-secondary-foreground',
    destructive: 'border-red-500/30 bg-[linear-gradient(180deg,rgba(255,77,77,0.18),rgba(255,77,77,0.08))] text-red-300',
    outline: 'border-white/16 bg-white/[0.02] text-foreground',
    success: 'border-emerald-500/30 bg-[linear-gradient(180deg,rgba(0,255,149,0.16),rgba(0,255,149,0.06))] text-emerald-300',
    warning: 'border-amber-500/30 bg-[linear-gradient(180deg,rgba(245,217,123,0.18),rgba(245,217,123,0.07))] text-amber-200',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = 'Badge';

export { Badge };
