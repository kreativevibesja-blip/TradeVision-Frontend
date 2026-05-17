'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
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
  const pathname = usePathname();
  const [openTicketCount, setOpenTicketCount] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [pendingBankTransferCount, setPendingBankTransferCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const loadFeedbackCount = async () => {
      if (!supabase) return 0;

      try {
        const result = await supabase
          .from('feedback')
          .select('id', { count: 'exact', head: true })
          .eq('admin_seen', false);
        return result.count ?? 0;
      } catch {
        return 0;
      }
    };

    const loadPendingBankTransferCount = async () => {
      if (!supabase) return 0;

      try {
        const result = await supabase
          .from('Payment')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'PENDING')
          .eq('paymentMethod', 'BANK_TRANSFER');
        return result.count ?? 0;
      } catch {
        return 0;
      }
    };

    const load = async () => {
      const [ticketResult, feedbackResult, paymentResult] = await Promise.all([
        api.admin.getOpenTicketCount(token).catch(() => null),
        loadFeedbackCount(),
        loadPendingBankTransferCount(),
      ]);

      if (!active) return;
      setOpenTicketCount(ticketResult?.count ?? 0);
      setFeedbackCount(feedbackResult ?? 0);
      setPendingBankTransferCount(paymentResult ?? 0);
    };

    load();
    const handleFeedbackSeen = () => { void load(); };
    window.addEventListener('admin-feedback-seen', handleFeedbackSeen);
    const interval = setInterval(load, 60_000);
    return () => {
      active = false;
      window.removeEventListener('admin-feedback-seen', handleFeedbackSeen);
      clearInterval(interval);
    };
  }, [token]);

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
        <aside className="sticky top-20 hidden min-h-[calc(100vh-5rem)] w-80 shrink-0 border-r border-[rgba(255,223,112,0.1)] bg-[rgba(5,5,5,0.42)] p-5 lg:flex lg:flex-col">
          <div className="mb-6 premium-panel-muted p-5">
            <BrandLogo compact showTagline={false} />
            <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" />
              Admin Control Room
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Manage pricing, analytics, support, and live appearance changes from one command surface.</p>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="mobile-card rounded-[22px] p-4">
              <div className="metric-label">Scope</div>
              <div className="mt-2 text-sm font-semibold text-white">Platform-wide</div>
            </div>
            <div className="mobile-card rounded-[22px] p-4">
              <div className="metric-label">Mode</div>
              <div className="mt-2 text-sm font-semibold text-[var(--gold-light)]">Realtime</div>
            </div>
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
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all ${
                      isActive
                        ? 'bg-[linear-gradient(135deg,rgba(255,223,112,0.18),rgba(212,175,55,0.08))] text-[var(--gold-light)] font-medium shadow-luxe'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
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
        <div className="w-full overflow-x-auto border-b border-[rgba(255,223,112,0.08)] bg-[rgba(5,5,5,0.72)] px-4 py-3 lg:hidden">
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
                    className={`relative flex items-center gap-1.5 rounded-full px-3 py-2 text-xs whitespace-nowrap transition-all ${
                      isActive ? 'bg-[rgba(255,223,112,0.12)] text-[var(--gold-light)]' : 'text-muted-foreground'
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
          <div className="mb-6 rounded-[28px] border border-[rgba(255,223,112,0.1)] bg-[linear-gradient(145deg,rgba(255,223,112,0.06),rgba(255,255,255,0.02),rgba(0,0,0,0.2))] p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="premium-kicker mb-3">Admin Workspace</div>
                <h1 className="font-display text-2xl font-bold uppercase tracking-[-0.05em] text-white sm:text-3xl">Premium Command Center</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-white/64">Every admin route now sits inside the same black-gold control language: denser metrics, stronger hierarchy, and better mobile navigation continuity.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:w-auto sm:grid-cols-2">
                <div className="mobile-card rounded-[20px] p-4">
                  <div className="metric-label">Live badges</div>
                  <div className="mt-2 text-sm font-semibold text-white">Tickets, feedback, payments</div>
                </div>
                <div className="mobile-card rounded-[20px] p-4">
                  <div className="metric-label">Theme control</div>
                  <div className="mt-2 text-sm font-semibold text-[var(--gold-light)]">Global + user override</div>
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
