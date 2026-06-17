'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase/client';
import { usePageActivity } from '@/hooks/usePageActivity';
import { trackPollingMetric } from '@/lib/egressMetrics';
import { Card, CardContent } from '@/components/ui/card';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  Shield,
  ChevronRight,
  LifeBuoy,
  MessageSquare,
  Bot,
  CalendarDays,
  Database,
  Flag,
  Newspaper,
  Receipt,
} from 'lucide-react';

const adminNav = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard, children: [
    { label: 'Analytics', href: '/admin/analytics' },
  ] },
  { label: 'Users', href: '/admin/users', icon: Users, children: [
    { label: 'Referrals', href: '/admin/referrals' },
  ] },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: Receipt, children: [
    { label: 'Pricing Plans', href: '/admin/pricing' },
    { label: 'Coupons', href: '/admin/coupons' },
  ] },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard, badgeKey: 'payments' as const },
  { label: 'Feed Moderation', href: '/admin/feed-moderation', icon: Flag, badgeKey: 'feedReports' as const, children: [
    { label: 'Feedback', href: '/admin/feedback' },
  ] },
  { label: 'Community Moderation', href: '/admin/community-moderation', icon: MessageSquare, badgeKey: 'communityReports' as const },
  { label: 'Events', href: '/admin/events', icon: CalendarDays },
  { label: 'Content', href: '/admin/content', icon: Newspaper, children: [
    { label: 'Email Campaigns', href: '/admin/emails' },
    { label: 'Platform Updates', href: '/admin/updates' },
  ] },
  { label: 'Orion Knowledge', href: '/admin/orion-knowledge', icon: Bot },
  { label: 'AI & Data', href: '/admin/ai-data', icon: Database, children: [
    { label: 'Analyses', href: '/admin/analyses' },
    { label: 'Trade Log', href: '/admin/trade-log' },
    { label: 'GoldX', href: '/admin/goldx' },
  ] },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings, children: [
    { label: 'Policies', href: '/admin/policies' },
  ] },
  { label: 'Support Tickets', href: '/admin/support-tickets', icon: LifeBuoy, badgeKey: 'tickets' as const, children: [
    { label: 'Ticket Queue', href: '/admin/tickets' },
  ] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuth();
  const { isActive } = usePageActivity();
  const pathname = usePathname();
  const [openTicketCount, setOpenTicketCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [feedReportCount, setFeedReportCount] = useState(0);
  const [communityReportCount, setCommunityReportCount] = useState(0);
  const [pendingBankTransferCount, setPendingBankTransferCount] = useState(0);

  useEffect(() => {
    if (!token || !isActive) return;

    let active = true;
    const stopMetric = trackPollingMetric('admin-layout-badges');

    const load = async () => {
      const [ticketResult, workspaceBadges] = await Promise.all([
        api.admin.getOpenTicketCount(token).catch(() => null),
        api.admin.getWorkspaceBadges(token).catch(() => null),
      ]);
      const [feedReports, communityReports] = await Promise.all([
        supabase
          ? supabase.from('post_reports').select('id', { count: 'exact', head: true }).in('status', ['open', 'reviewing'])
          : Promise.resolve({ count: 0 }),
        supabase
          ? supabase.from('community_reports').select('id', { count: 'exact', head: true }).in('status', ['open', 'reviewing'])
          : Promise.resolve({ count: 0 }),
      ]);

      if (!active) return;

      setOpenTicketCount(ticketResult?.count ?? 0);
      setFeedbackCount(workspaceBadges?.feedbackUnreadCount ?? 0);
      setFeedReportCount(feedReports.count ?? 0);
      setCommunityReportCount(communityReports.count ?? 0);
      setPendingBankTransferCount(workspaceBadges?.pendingBankTransferCount ?? 0);
    };

    void load();

    const handleFeedbackSeen = () => {
      void load();
    };

    window.addEventListener('admin-feedback-seen', handleFeedbackSeen);
    const interval = setInterval(() => {
      void load();
    }, 60_000);

    return () => {
      active = false;
      stopMetric();
      window.removeEventListener('admin-feedback-seen', handleFeedbackSeen);
      clearInterval(interval);
    };
  }, [isActive, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Checking your access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground">You do not have permission to access this area.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getBadgeCount = (badgeKey?: string) => {
    if (badgeKey === 'tickets') return openTicketCount;
    if (badgeKey === 'payments') return pendingBankTransferCount;
    if (badgeKey === 'feedback') return feedbackCount;
    if (badgeKey === 'feedReports') return feedReportCount;
    if (badgeKey === 'communityReports') return communityReportCount;
    return 0;
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="sticky top-20 hidden min-h-[calc(100vh-5rem)] w-72 shrink-0 border-r border-[#1b3358] bg-[#071426] p-5 lg:flex lg:flex-col">
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const isActive = pathname === item.href || Boolean(item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`)));
              const badgeCount = getBadgeCount(item.badgeKey);
              return (
                <div key={item.href}>
                  <Link href={item.href}>
                    <div
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-[#176dff] text-white shadow-[0_10px_22px_rgba(23,109,255,0.22)]'
                          : 'text-[#8ea4c2] hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      {badgeCount > 0 && (
                        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1.5 text-[10px] font-bold text-white">{badgeCount > 99 ? '99+' : badgeCount}</span>
                      )}
                      {isActive && !badgeCount && <ChevronRight className="h-3 w-3 ml-auto" />}
                    </div>
                  </Link>
                  {item.children?.length ? (
                    <div className="ml-7 mt-1 space-y-1 border-l border-[#1b3358] pl-3">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`block rounded-lg px-3 py-2 text-xs font-semibold transition ${
                              childActive ? 'bg-white/[0.08] text-white' : 'text-[#8ea4c2] hover:bg-white/[0.06] hover:text-white'
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Nav */}
        <div className="w-full overflow-x-auto border-b border-[#1b3358] bg-[#071426] px-4 py-3 lg:hidden">
          <div className="flex gap-1 min-w-max">
            {adminNav.map((item) => {
              const isActive = pathname === item.href || Boolean(item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`)));
              const badgeCount = getBadgeCount(item.badgeKey);
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive ? 'bg-[#176dff] text-white' : 'text-[#8ea4c2]'
                    }`}
                  >
                    <item.icon className="h-3 w-3" />
                    {item.label}
                    {badgeCount > 0 && (
                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-white">{badgeCount > 99 ? '99+' : badgeCount}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          {adminNav.map((item) => {
            const groupActive = pathname === item.href || Boolean(item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`)));
            if (!groupActive || !item.children?.length) return null;
            return (
              <div key={`${item.href}-children`} className="mt-2 flex gap-1 overflow-x-auto">
                {item.children.map((child) => {
                  const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
                        childActive ? 'bg-white/[0.12] text-white' : 'text-[#8ea4c2]'
                      }`}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:min-h-[calc(100vh-5rem)] lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

