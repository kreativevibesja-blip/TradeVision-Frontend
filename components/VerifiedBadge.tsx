'use client';

import { cn } from '@/lib/utils';

export const isVerifiedTrader = (subscription?: string | null) => subscription === 'TOP_TIER';

export function VerifiedBadge({
  subscription,
  className = '',
  size = 'sm',
}: {
  subscription?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  if (!isVerifiedTrader(subscription)) return null;

  const sizes = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/verified-badge.png"
      alt="Verified trader"
      title="Verified trader"
      className={cn('inline-block shrink-0 object-contain align-[-3px]', sizes[size], className)}
      loading="lazy"
    />
  );
}
