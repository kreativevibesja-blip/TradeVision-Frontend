'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import { useAuth } from '@/hooks/useAuth';
import { BrandLogo } from '@/components/BrandLogo';
import { CandlestickChart, CreditCard, LayoutDashboard, RadioTower, Users, Radar, Crosshair, Target, TrendingUp, Sparkles } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, token } = useAuth();
  const isLiveWorkspace = pathname === '/dashboard/tradingview' || pathname === '/dashboard/deriv';
  const isGoldxPulseWorkspace = pathname === '/dashboard/goldx-pulse';
  const showPushPrompt = user?.subscription === 'TOP_TIER' && Boolean(token);
  const dashboardNav = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/tradingview', label: 'Live Chart', icon: CandlestickChart },
    { href: '/dashboard/deriv', label: 'Deriv Live', icon: RadioTower },
    { href: '/dashboard/goldx-pulse', label: 'GoldX Pulse', icon: Sparkles },
    { href: '/dashboard/command-center', label: 'Command Center', icon: Target },
    { href: '/dashboard/scanner', label: 'Scanner', icon: Radar },
    { href: '/dashboard/radar', label: 'Trade Radar', icon: Crosshair },
    { href: '/dashboard/goldx', label: 'GoldX', icon: TrendingUp },
    { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
    { href: '/dashboard/referrals', label: 'Referrals', icon: Users },
  ];

  if (isLiveWorkspace) {
    return <div className="h-[calc(100svh-5rem)] overflow-hidden md:h-[calc(100svh-4rem)]">{children}</div>;
  }

  return (
    <div className="page-stack min-h-screen">
      <div className={`page-shell ${isGoldxPulseWorkspace ? 'max-w-[1600px]' : 'max-w-6xl'}`}>
        <div className={`grid gap-6 lg:items-start ${isGoldxPulseWorkspace ? 'lg:grid-cols-[13rem_minmax(0,1fr)]' : 'lg:grid-cols-[max-content_1fr]'}`}>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="mobile-card overflow-hidden lg:w-fit">
              <CardContent className="p-3 sm:p-4">
                <div className="mb-4 hidden lg:block">
                  <BrandLogo compact showTagline={false} className="justify-center" />
                  <div className="mt-3 text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Trading Floor</div>
                </div>
                <nav className="-mx-0.5 flex gap-1 overflow-x-auto scrollbar-none sm:gap-1.5 lg:flex-col lg:items-start">
                  {dashboardNav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-2xl px-2.5 py-2 text-xs whitespace-nowrap transition-colors sm:gap-2 sm:px-4 sm:py-3 sm:text-sm lg:min-h-0 lg:w-full lg:px-3.5 lg:py-3 ${
                          isActive ? 'bg-[linear-gradient(135deg,rgba(255,223,112,0.18),rgba(212,175,55,0.08))] text-[var(--gold-light)]' : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground'
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>
          <div className={`min-w-0 ${isGoldxPulseWorkspace ? '' : 'space-y-6'}`}>
            {showPushPrompt && token ? <PushNotificationPrompt token={token} /> : null}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}