import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'premium-button-shell inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-2xl border text-sm font-semibold uppercase tracking-[0.16em] ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] touch-manipulation will-change-transform',
  {
    variants: {
      variant: {
        default: 'border-[rgba(96,165,250,0.3)] bg-[linear-gradient(145deg,rgba(186,230,253,0.95),rgba(96,165,250,0.92)_42%,rgba(30,64,175,0.96))] text-[#031225] hover:-translate-y-px hover:brightness-105 hover:shadow-luxe-strong',
        destructive: 'border-red-500/30 bg-[linear-gradient(145deg,rgba(255,117,117,0.18),rgba(255,77,77,0.34))] text-destructive-foreground hover:bg-destructive/90',
        outline: 'border-[rgba(96,165,250,0.2)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] text-foreground hover:border-[rgba(147,197,253,0.46)] hover:bg-white/[0.08] hover:-translate-y-px',
        secondary: 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] text-secondary-foreground hover:bg-white/[0.08] hover:-translate-y-px',
        ghost: 'border-transparent bg-transparent text-muted-foreground shadow-none hover:border-white/10 hover:bg-white/[0.04] hover:text-foreground',
        link: 'border-transparent bg-transparent px-0 py-0 text-primary shadow-none underline-offset-4 hover:underline',
        gradient: 'border-[rgba(96,165,250,0.38)] bg-[linear-gradient(135deg,#e0f2fe_0%,#7dd3fc_18%,#60a5fa_52%,#1d4ed8_100%)] text-[#031225] hover:-translate-y-px hover:brightness-105 hover:shadow-luxe-strong',
        glow: 'border-[rgba(96,165,250,0.28)] bg-[linear-gradient(145deg,rgba(59,130,246,0.18),rgba(14,165,233,0.18)_45%,rgba(255,255,255,0.04))] text-white hover:-translate-y-px hover:shadow-luxe',
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
