import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg border text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] touch-manipulation',
  {
    variants: {
      variant: {
        default: 'border-[#176dff] bg-[#176dff] text-white shadow-[0_10px_24px_rgba(23,109,255,0.22)] hover:bg-[#0d5ee5]',
        destructive: 'border-red-500 bg-red-600 text-white hover:bg-red-500',
        outline: 'border-[#c7d7ef] bg-white text-[#132238] hover:border-[#176dff] hover:text-[#176dff]',
        secondary: 'border-[#dce6f5] bg-[#f3f7ff] text-[#132238] hover:bg-[#eaf2ff]',
        ghost: 'border-transparent bg-transparent text-[#526176] shadow-none hover:bg-[#eef5ff] hover:text-[#176dff]',
        link: 'border-transparent bg-transparent px-0 py-0 text-[#176dff] shadow-none underline-offset-4 hover:underline',
        gradient: 'border-[#176dff] bg-[#176dff] text-white shadow-[0_10px_24px_rgba(23,109,255,0.22)] hover:bg-[#0d5ee5]',
        glow: 'border-[#176dff]/30 bg-[#eef5ff] text-[#176dff] hover:bg-[#dcecff]',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-10 rounded-lg px-4 text-xs',
        lg: 'h-12 rounded-lg px-7 text-sm',
        xl: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-11 w-11',
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
