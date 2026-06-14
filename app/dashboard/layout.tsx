'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CreditCard,
  Headphones,
  Home,
  LayoutDashboard,
  MessageCircle,
  Newspaper,
  Radar,
  Search,
  Settings,
  Sparkles,
  UploadCloud,
  Users,
  Activity,
  CandlestickChart,
} from 'lucide-react';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const userNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/feed', label: 'Feed', icon: Newspaper },
  { href: '/analyze', label: 'AI Analysis', icon: UploadCloud },
  { href: '/dashboard/radar', label: 'Trade Radar', icon: Radar },
  { href: '/dashboard/community', label: 'Community', icon: Users },
  { href: '/dashboard/events', label: 'Events', icon: CalendarDays },
  { href: '/dashboard/journal', label: 'Journal', icon: BookOpen },
  { href: '/dashboard/orion', label: 'Orion AI', icon: Sparkles },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageCircle, count: 3 },
  { href: '/dashboard/tradingview', label: 'Forex Live Chart', icon: CandlestickChart },
  { href: '/dashboard/deriv', label: 'Deriv Live Chart', icon: Activity },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/support', label: 'Support', icon: Headphones },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, token } = useAuth();
  const isLiveWorkspace = pathname === '/dashboard/tradingview' || pathname === '/dashboard/deriv';
  const showPushPrompt = user?.subscription !== 'FREE' && Boolean(token);

  if (isLiveWorkspace) {
    return <div className="h-[calc(100svh-5rem)] overflow-hidden bg-[#F7F9FC] md:h-[calc(100svh-4rem)]">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#111827]">
      <aside className="fixed left-0 top-20 z-30 hidden h-[calc(100vh-5rem)] w-64 border-r border-[#E5E7EB] bg-white px-4 py-5 lg:block">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <p className="font-extrabold text-[#111827]">TradeVision</p>
            <p className="text-xs text-[#6B7280]">Pro trading workspace</p>
          </div>
        </Link>

        <nav className="space-y-1 overflow-y-auto pb-6">
          {userNav.map((item) => {
            const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition',
                  active ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#4B5563] hover:bg-[#F7F9FC] hover:text-[#111827]',
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.count ? <span className="rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] text-white">{item.count}</span> : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-20 z-20 border-b border-[#E5E7EB] bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-4">
            <div className="relative hidden flex-1 sm:block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F7F9FC] pl-11 pr-4 text-sm outline-none transition focus:border-[#2563EB] focus:bg-white"
                placeholder="Search markets, traders, ideas..."
              />
            </div>
            <button className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#2563EB]">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-extrabold text-[#2563EB]">
                {(user?.name || user?.email || 'J').slice(0, 1).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-extrabold text-[#111827]">{user?.name || user?.email?.split('@')[0] || 'Trader'}</p>
                <p className="text-xs text-[#6B7280]">{user?.subscription || 'Free'} Trader</p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 pb-24 lg:px-8">
          {showPushPrompt && token ? <div className="mb-5"><PushNotificationPrompt token={token} /></div> : null}
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E7EB] bg-white px-2 py-2 lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {userNav.slice(0, 5).map((item) => {
            const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn('flex flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-bold', active ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#6B7280]')}>
                <item.icon className="mb-1 h-4 w-4" />
                <span className="max-w-full truncate">{item.label.replace('AI ', '')}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
