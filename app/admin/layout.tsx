'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
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
} from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Analyses', href: '/admin/analyses', icon: FileText },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Referrals', href: '/admin/referrals', icon: Gift },
  { label: 'Pricing Plans', href: '/admin/pricing', icon: Tag },
  { label: 'Coupons', href: '/admin/coupons', icon: Percent },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Updates', href: '/admin/updates', icon: Megaphone },
  { label: 'Tickets', href: '/admin/tickets', icon: LifeBuoy, badgeKey: 'tickets' as const },
  { label: 'Email Campaigns', href: '/admin/emails', icon: Mail },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuth();
  const pathname = usePathname();
  const [openTicketCount, setOpenTicketCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const load = () =>
      api.admin.getOpenTicketCount(token).then((res) => { if (active) setOpenTicketCount(res.count); }).catch(() => {});
    load();
    const interval = setInterval(load, 60_000);
    return () => { active = false; clearInterval(interval); };
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
        <aside className="sticky top-16 hidden min-h-[calc(100vh-4rem)] w-72 shrink-0 border-r border-white/10 bg-background/50 p-4 lg:flex lg:flex-col">
          <div className="flex items-center gap-2 px-3 py-2 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
              const badgeCount = item.badgeKey === 'tickets' ? openTicketCount : 0;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
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
        <div className="w-full overflow-x-auto border-b border-white/10 bg-background/50 px-4 py-2 lg:hidden">
          <div className="flex gap-1 min-w-max">
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
              const badgeCount = item.badgeKey === 'tickets' ? openTicketCount : 0;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
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
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:min-h-[calc(100vh-4rem)] lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
