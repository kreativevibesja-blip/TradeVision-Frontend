import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-lg border border-[#c7d7ef] bg-white px-4 py-2.5 text-sm text-[#132238] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#7b8798] focus-visible:border-[#176dff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#176dff]/15 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
