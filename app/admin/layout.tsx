'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { usePageActivity } from '@/hooks/usePageActivity';
import { trackPollingMetric } from '@/lib/egressMetrics';
import { Card, CardContent } from '@/components/ui/card';
import { BrandLogo } from '@/components/BrandLogo';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Tag,
  Settings,
  Megaphone,
  BarChart3,
  Shield,
  ChevronRight,
  LifeBuoy,
  Percent,
  Gift,
  Mail,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Analyses', href: '/admin/analyses', icon: FileText },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard, badgeKey: 'payments' as const },
  { label: 'Policies', href: '/admin/policies', icon: FileText },
  { label: 'Referrals', href: '/admin/referrals', icon: Gift },
  { label: 'Pricing Plans', href: '/admin/pricing', icon: Tag },
  { label: 'Coupons', href: '/admin/coupons', icon: Percent },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Updates', href: '/admin/updates', icon: Megaphone },
  { label: 'Tickets', href: '/admin/tickets', icon: LifeBuoy, badgeKey: 'tickets' as const },
  { label: 'Email Campaigns', href: '/admin/emails', icon: Mail },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Feedback', href: '/admin/feedback', icon: MessageSquare, badgeKey: 'feedback' as const },
  { label: 'GoldX', href: '/admin/goldx', icon: TrendingUp },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuth();
  const { isActive } = usePageActivity();
  const pathname = usePathname();
  const [openTicketCount, setOpenTicketCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
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

      if (!active) return;

      setOpenTicketCount(ticketResult?.count ?? 0);
      setFeedbackCount(workspaceBadges?.feedbackUnreadCount ?? 0);
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

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="sticky top-20 hidden min-h-[calc(100vh-5rem)] w-72 shrink-0 border-r border-[#1b3358] bg-[#071426] p-5 lg:flex lg:flex-col">
          <div className="mb-5 rounded-xl border border-[#1b3358] bg-[#0b1b33] p-5">
            <BrandLogo compact showTagline={false} />
            <div className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8ea4c2]">
              <Shield className="h-4 w-4 text-primary" />
              Admin Workspace
            </div>
            <p className="mt-3 text-sm leading-6 text-[#8ea4c2]">Manage pricing, analytics, support, and platform settings.</p>
          </div>
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
              const badgeCount = item.badgeKey === 'tickets'
                ? openTicketCount
                : item.badgeKey === 'payments'
                  ? pendingBankTransferCount
                : item.badgeKey === 'feedback'
                  ? feedbackCount
                  : 0;
              return (
                <Link key={item.href} href={item.href}>
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
              );
            })}
          </nav>
        </aside>

        {/* Mobile Nav */}
        <div className="w-full overflow-x-auto border-b border-[#1b3358] bg-[#071426] px-4 py-3 lg:hidden">
          <div className="flex gap-1 min-w-max">
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
              const badgeCount = item.badgeKey === 'tickets'
                ? openTicketCount
                : item.badgeKey === 'payments'
                  ? pendingBankTransferCount
                : item.badgeKey === 'feedback'
                  ? feedbackCount
                  : 0;
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
        </div>

        {/* Content */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:min-h-[calc(100vh-5rem)] lg:px-8 lg:py-10">
          <div className="mb-6 rounded-xl border border-[#1b3358] bg-[#071426] p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-[#60a5ff]">Admin Workspace</div>
                <h1 className="text-2xl font-extrabold tracking-[-0.04em] text-white sm:text-3xl">Platform Control Center</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#8ea4c2]">Manage the operational pages with the same blue TradeVision interface used on the new landing page.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:w-auto sm:grid-cols-2">
                <div className="rounded-lg border border-[#1b3358] bg-[#0b1b33] p-4">
                  <div className="metric-label">Live badges</div>
                  <div className="mt-2 text-sm font-semibold text-white">Tickets, feedback, payments</div>
                </div>
                <div className="rounded-lg border border-[#1b3358] bg-[#0b1b33] p-4">
                  <div className="metric-label">Theme control</div>
                  <div className="mt-2 text-sm font-semibold text-[#60a5ff]">Global + user override</div>
                </div>
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
