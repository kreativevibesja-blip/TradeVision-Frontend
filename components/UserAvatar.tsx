'use client';

import { UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserAvatar({
  name,
  avatarUrl,
  className = '',
  iconClassName = '',
}: {
  name?: string | null;
  avatarUrl?: string | null;
  className?: string;
  iconClassName?: string;
}) {
  const initial = (name || 'Trader').slice(0, 1).toUpperCase();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name ? `${name} avatar` : 'Trader avatar'}
        className={cn('shrink-0 rounded-full object-cover', className)}
        loading="lazy"
      />
    );
  }

  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-[#2563EB]', className)} title={initial}>
      <UserRound className={cn('h-1/2 w-1/2', iconClassName)} />
    </div>
  );
}
