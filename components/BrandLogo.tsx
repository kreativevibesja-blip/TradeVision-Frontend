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
      <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] border border-[rgba(255,223,112,0.24)] bg-[linear-gradient(155deg,rgba(255,255,255,0.12),rgba(255,223,112,0.16),rgba(212,175,55,0.06))] shadow-luxe transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-luxe-strong">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_45%)]" />
        <span className="relative font-display text-[15px] font-bold tracking-[-0.12em] text-gradient">TV</span>
      </div>
      {!compact ? (
        <div className="min-w-0">
          <div className="truncate font-display text-[15px] font-bold uppercase tracking-[0.16em] text-white sm:text-base">TradeVision AI</div>
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