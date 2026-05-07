'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/analyze', label: 'Analyze', icon: BarChart3 },
  { href: '/dashboard', label: 'History', icon: History },
  { href: '/pricing', label: 'Profile', icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2 md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2 rounded-[28px] border border-[rgba(255,223,112,0.14)] bg-[rgba(5,5,5,0.88)] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
                isActive ? 'bg-[linear-gradient(180deg,rgba(255,223,112,0.18),rgba(212,175,55,0.12))] text-[var(--gold-light)]' : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}