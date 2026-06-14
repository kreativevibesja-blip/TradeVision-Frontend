'use client';

import { LifeBuoy, Send } from 'lucide-react';
import { CleanBadge, CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';

export default function SupportPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <PageHeader title="Support" subtitle="Create tickets, attach chart screenshots, and continue support conversations." />
        <CleanCard>
          <h2 className="mb-4 flex items-center gap-2 font-extrabold text-[#111827]"><LifeBuoy className="h-5 w-5 text-[#2563EB]" />New support ticket</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" placeholder="Subject" />
            <select className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]">
              {['Account', 'Billing', 'Analysis', 'Bug', 'Feature', 'General'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <textarea className="min-h-36 rounded-xl border border-[#E5E7EB] p-4 text-sm outline-none focus:border-[#2563EB] sm:col-span-2" placeholder="How can we help?" />
          </div>
          <CleanButton className="mt-4"><Send className="h-4 w-4" />Submit ticket</CleanButton>
        </CleanCard>
      </div>
      <aside>
        <CleanCard>
          <h2 className="font-extrabold text-[#111827]">Recent tickets</h2>
          <div className="mt-4 space-y-3">
            {['Billing plan question', 'Chart upload issue', 'Orion knowledge request'].map((ticket, index) => (
              <div key={ticket} className="rounded-xl border border-[#E5E7EB] p-3">
                <p className="text-sm font-bold text-[#111827]">{ticket}</p>
                <CleanBadge tone={index === 0 ? 'amber' : 'blue'}>{index === 0 ? 'In Progress' : 'Open'}</CleanBadge>
              </div>
            ))}
          </div>
        </CleanCard>
      </aside>
    </div>
  );
}
