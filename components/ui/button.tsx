import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-2xl border text-sm font-semibold uppercase tracking-[0.16em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] touch-manipulation',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow-gold hover:-translate-y-px hover:brightness-105',
        destructive: 'border-red-500/30 bg-destructive/85 text-destructive-foreground hover:bg-destructive',
        outline: 'border-[rgba(255,223,112,0.2)] bg-white/[0.03] text-foreground hover:border-[rgba(255,223,112,0.42)] hover:bg-white/[0.06]',
        secondary: 'border-white/10 bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'border-transparent bg-transparent text-muted-foreground hover:border-white/10 hover:bg-white/[0.04] hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient: 'border-transparent bg-[linear-gradient(135deg,#ffe38a_0%,#d4af37_48%,#9a7513_100%)] text-[#120f04] shadow-gold hover:-translate-y-px hover:brightness-105',
        glow: 'border-[rgba(255,223,112,0.28)] bg-[linear-gradient(135deg,rgba(255,223,112,0.2),rgba(212,175,55,0.18))] text-white shadow-neon hover:-translate-y-px hover:shadow-gold',
      },
      size: {
        default: 'h-12 px-5 py-3',
        sm: 'h-11 rounded-2xl px-4 text-xs',
        lg: 'h-13 rounded-[20px] px-8 text-sm',
        xl: 'h-14 rounded-[22px] px-9 text-base',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
