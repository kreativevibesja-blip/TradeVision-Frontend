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
    <div className={cn('group inline-flex items-center gap-2.5', className)}>
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-[rgba(255,223,112,0.2)] bg-[linear-gradient(135deg,rgba(255,227,138,0.16),rgba(212,175,55,0.07))] shadow-neon transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-gold">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,223,112,0.35),transparent_60%)]" />
        <span className="relative font-display text-[15px] font-bold tracking-[-0.1em] text-gradient">TV</span>
      </div>
      {!compact ? (
        <div className="min-w-0">
          <div className="truncate font-display text-[15px] font-bold uppercase tracking-[0.18em] text-white sm:text-base">TradeVision AI</div>
          {showTagline ? (
            <div className="truncate text-[9px] uppercase tracking-[0.24em] text-muted-foreground sm:text-[10px]">
              AI-Powered Trading Intelligence
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}