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
    <div className={cn('group inline-flex items-center gap-3', className)}>
      <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[rgba(255,223,112,0.24)] bg-[linear-gradient(135deg,rgba(255,227,138,0.18),rgba(212,175,55,0.08))] shadow-neon transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-gold">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,223,112,0.35),transparent_60%)]" />
        <span className="relative font-display text-lg font-bold tracking-[-0.1em] text-gradient">TV</span>
      </div>
      {!compact ? (
        <div className="min-w-0">
          <div className="truncate font-display text-base font-bold uppercase tracking-[0.22em] text-white sm:text-lg">TradeVision AI</div>
          {showTagline ? (
            <div className="truncate text-[10px] uppercase tracking-[0.32em] text-muted-foreground sm:text-[11px]">
              AI-Powered Trading Intelligence
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}