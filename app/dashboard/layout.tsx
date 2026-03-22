'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, LayoutDashboard, Users } from 'lucide-react';

const dashboardNav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/referrals', label: 'Referrals', icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="page-stack min-h-screen">
      <div className="page-shell max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
          <aside className="lg:sticky lg:top-24">
            <Card className="mobile-card overflow-hidden">
              <CardContent className="p-3">
                <nav className="flex gap-2 overflow-x-auto lg:flex-col">
                  {dashboardNav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`inline-flex min-h-12 items-center gap-2 rounded-xl px-4 py-3 text-sm whitespace-nowrap transition-colors ${
                          isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}