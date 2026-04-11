'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import { FeedbackModal } from '@/components/FeedbackModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { CandlestickChart, CreditCard, LayoutDashboard, RadioTower, Users, Bot, Radar } from 'lucide-react';

const dashboardNav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/tradingview', label: 'Live Chart', icon: CandlestickChart },
  { href: '/dashboard/deriv', label: 'Deriv Live', icon: RadioTower },
  { href: '/dashboard/scanner', label: 'Scanner', icon: Radar },
  { href: '/dashboard/autotrader', label: 'One-Tap Trade', icon: Bot },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/referrals', label: 'Referrals', icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, token } = useAuth();
  const isLiveWorkspace = pathname === '/dashboard/tradingview' || pathname === '/dashboard/deriv';
  const showPushPrompt = user?.subscription === 'TOP_TIER' && Boolean(token);

  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackChecked = useRef(false);

  useEffect(() => {
    if (!user || !supabase || feedbackChecked.current) return;
    feedbackChecked.current = true;

    let cancelled = false;
    const sb = supabase;
    const check = async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await sb
        .from('feedback')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo)
        .limit(1);

      if (cancelled || (data && data.length > 0)) return;

      const timer = setTimeout(() => {
        if (!cancelled) setShowFeedback(true);
      }, 60_000);
      return () => clearTimeout(timer);
    };

    let cleanup: (() => void) | undefined;
    check().then((c) => { cleanup = c; });
    return () => { cancelled = true; cleanup?.(); };
  }, [user]);

  if (isLiveWorkspace) {
    return <div className="h-[calc(100svh-5rem)] overflow-hidden md:h-[calc(100svh-4rem)]">{children}</div>;
  }

  return (
    <div className="page-stack min-h-screen">
      <div className="page-shell max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[max-content_1fr] lg:items-start">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="mobile-card overflow-hidden lg:w-fit">
              <CardContent className="p-2 sm:p-3">
                <nav className="-mx-0.5 flex gap-1 overflow-x-auto scrollbar-none sm:gap-1.5 lg:flex-col lg:items-start">
                  {dashboardNav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs whitespace-nowrap transition-colors sm:gap-2 sm:px-4 sm:py-3 sm:text-sm lg:min-h-0 lg:w-auto lg:px-3.5 lg:py-2.5 ${
                          isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
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
          <div className="min-w-0 space-y-6">
            {showPushPrompt && token ? <PushNotificationPrompt token={token} /> : null}
            {children}
          </div>
        </div>
      </div>
      {user && <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} userId={user.id} />}
    </div>
  );
}