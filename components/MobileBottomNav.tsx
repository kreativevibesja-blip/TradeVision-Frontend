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
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2 rounded-xl border border-[#1b3358] bg-[#071426] p-2 shadow-[0_18px_42px_rgba(0,0,0,0.34)]">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors',
                isActive ? 'bg-[#176dff] text-white' : 'text-[#8ea4c2] hover:bg-white/[0.06] hover:text-white'
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
