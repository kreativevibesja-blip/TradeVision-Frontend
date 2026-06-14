'use client';

import { useState } from 'react';
import { Brain, ImagePlus, Save } from 'lucide-react';
import { CleanButton, CleanCard, CleanStatCard, PageHeader } from '@/components/CleanBlue';

export default function JournalPage() {
  const [outcome, setOutcome] = useState('Win');

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Journal" subtitle="Log trades, emotions, screenshots, outcomes, RR, and Orion consistency insights." />
      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <CleanStatCard label="Consistency Score" value="78%" trend="+6% this week" icon={<Brain className="h-5 w-5" />} />
        <CleanStatCard label="Best Session" value="London" />
        <CleanStatCard label="Common Mistake" value="Early Entry" />
        <CleanStatCard label="Risk Quality" value="B+" trend="Improving" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <CleanCard>
          <h2 className="mb-4 font-extrabold text-[#111827]">New journal entry</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" placeholder="Market / Symbol" />
            <input className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" placeholder="Session" />
            <input className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" placeholder="RR, e.g. 1:2.5" />
            <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]">
              {['Win', 'Loss', 'Breakeven', 'Open'].map((item) => <option key={item}>{item}</option>)}
            </select>
            <input className="h-11 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB] sm:col-span-2" placeholder="Emotion tags: patient, anxious, confident..." />
            <textarea className="min-h-36 rounded-xl border border-[#E5E7EB] p-4 text-sm outline-none focus:border-[#2563EB] sm:col-span-2" placeholder="Notes and lessons..." />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <CleanButton variant="secondary"><ImagePlus className="h-4 w-4" />Attach chart</CleanButton>
            <CleanButton><Save className="h-4 w-4" />Save Entry</CleanButton>
          </div>
        </CleanCard>
        <CleanCard>
          <h2 className="font-extrabold text-[#111827]">Orion Insights</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[#4B5563]">
            <p>Best results are coming from London-session continuation trades.</p>
            <p>Overtrading warning: 3 trades were opened within 25 minutes last week.</p>
            <p>Risk quality improves when entries are taken after confirmation instead of first touch.</p>
          </div>
        </CleanCard>
      </div>
    </div>
  );
}
