'use client';

import { CalendarDays, Radar, Sparkles, UploadCloud } from 'lucide-react';
import { ActiveOpportunitiesWidget, CleanButton, CleanCard, EventsWidget, FeedPostCard, MarketOverviewWidget, OrionWidget, PageHeader, SimpleChartCard } from '@/components/CleanBlue';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = (user?.name || user?.email?.split('@')[0] || 'Trader').split(' ')[0];

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`Welcome back, ${firstName} 👋`}
        subtitle="Here’s what’s happening in your trading today."
        action={<CleanButton href="/analyze"><UploadCloud className="h-4 w-4" />Upload Analysis</CleanButton>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: 'Orion AI', body: 'Ask your trading mentor for guidance.', href: '/dashboard/orion', icon: Sparkles },
              { title: 'Trade Radar', body: 'Monitor your active setups.', href: '/dashboard/radar', icon: Radar },
              { title: 'Upload New Analysis', body: 'Run AI structure analysis.', href: '/analyze', icon: UploadCloud },
              { title: 'Market Overview', body: 'Review today’s market pulse.', href: '/dashboard/events', icon: CalendarDays },
            ].map((item) => (
              <CleanCard key={item.title} className="transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(37,99,235,0.12)]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="font-extrabold text-[#111827]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">{item.body}</p>
                <CleanButton href={item.href} variant="ghost" className="mt-4 px-0">Open</CleanButton>
              </CleanCard>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-5">
              <CleanCard>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#111827]">Feed</h2>
                    <p className="text-sm text-[#6B7280]">Ideas from traders you follow and top market discussions.</p>
                  </div>
                  <CleanButton href="/dashboard/feed" variant="secondary">View Feed</CleanButton>
                </div>
                <FeedPostCard image="/landing/platform-dashboard.png" />
              </CleanCard>
            </div>

            <div className="space-y-5">
              <MarketOverviewWidget />
              <ActiveOpportunitiesWidget />
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <EventsWidget />
          <OrionWidget />
          <CleanCard>
            <h2 className="mb-4 font-extrabold text-[#111827]">Latest AI Chart</h2>
            <SimpleChartCard />
          </CleanCard>
        </aside>
      </div>
    </div>
  );
}
