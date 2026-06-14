'use client';

import { Bell, CalendarDays, Video } from 'lucide-react';
import { CleanBadge, CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';

const events = [
  ['FOMC Meeting', 'May 24, 2026 · 2:00 PM EST', 'USD pairs, gold, indices', 'High'],
  ['GDP Data Release', 'May 28, 2026 · 8:30 AM EST', 'USD, indices', 'Medium'],
  ['Live Training: Reading Liquidity', 'May 29, 2026 · 7:00 PM EST', 'Platform webinar', 'Platform'],
  ['Monthly Market Outlook', 'May 31, 2026 · 7:00 PM EST', 'Forex, gold, crypto', 'Platform'],
];

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Events" subtitle="Market events, webinars, live training, economic releases, and platform sessions." />
      <div className="grid gap-5 md:grid-cols-2">
        {events.map(([title, time, market, impact]) => (
          <CleanCard key={title}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                {impact === 'Platform' ? <Video className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-extrabold text-[#111827]">{title}</h2>
                  <CleanBadge tone={impact === 'High' ? 'red' : impact === 'Medium' ? 'amber' : 'blue'}>{impact}</CleanBadge>
                </div>
                <p className="mt-2 text-sm text-[#6B7280]">{time}</p>
                <p className="mt-1 text-sm font-semibold text-[#111827]">{market}</p>
                <CleanButton variant="secondary" className="mt-4"><Bell className="h-4 w-4" />Set reminder</CleanButton>
              </div>
            </div>
          </CleanCard>
        ))}
      </div>
    </div>
  );
}
