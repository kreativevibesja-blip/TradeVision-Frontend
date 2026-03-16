'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
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
} from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Analyses', href: '/admin/analyses', icon: FileText },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Pricing Plans', href: '/admin/pricing', icon: Tag },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
  { label: 'Updates', href: '/admin/updates', icon: Megaphone },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

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
    <div className="min-h-screen">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen border-r border-white/10 bg-background/50 p-4 sticky top-16">
          <div className="flex items-center gap-2 px-3 py-2 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
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
                    {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Nav */}
        <div className="lg:hidden w-full border-b border-white/10 bg-background/50 p-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {adminNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <item.icon className="h-3 w-3" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-6 lg:p-8 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
