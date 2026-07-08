'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  href?: string;
  compact?: boolean;
  showTagline?: boolean;
  className?: string;
}

export function BrandLogo({ href = '/', compact = false, showTagline = true, className }: BrandLogoProps) {
  const content = (
    <div className={cn('group inline-flex items-center gap-2.5 text-foreground', className)}>
      <svg
        viewBox="0 0 44 36"
        aria-hidden="true"
        className="h-9 w-11 shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5"
      >
        <path d="M2 4h40L22 33 2 4Z" fill="none" stroke="#2563EB" strokeWidth="3.6" strokeLinejoin="round" />
        <path d="M9 10h26L22 28 9 10Z" fill="none" stroke="#38BDF8" strokeWidth="2.8" strokeLinejoin="round" opacity="0.95" />
        <path d="M13 10h18L22 22 13 10Z" fill="currentColor" opacity="0.92" />
        <path d="M18 14h8l-4 6-4-6Z" fill="#60A5FA" />
      </svg>
      {!compact ? (
        <div className="min-w-0">
          <div className="truncate font-display text-[15px] font-black uppercase tracking-[0.10em] sm:text-base">
            <span>Trade</span><span className="text-[#2563EB]">Vision</span><span className="text-[#60A5FA]"> AI</span>
          </div>
          {showTagline ? (
            <div className="truncate text-[9px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[10px]">
              Institutional Trading Intelligence
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
