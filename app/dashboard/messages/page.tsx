'use client';

import { Send, ShieldAlert } from 'lucide-react';
import { CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';

const conversations = ['AlphaTrader', 'Market_Mindset', 'Support'];

export default function MessagesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Messages" subtitle="Direct messages, shared analyses, setup discussion, block, and report controls." />
      <div className="grid min-h-[68vh] gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <CleanCard className="p-3">
          {conversations.map((name, index) => (
            <button key={name} className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left ${index === 0 ? 'bg-[#EFF6FF]' : 'hover:bg-[#F7F9FC]'}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DBEAFE] font-extrabold text-[#2563EB]">{name[0]}</div>
              <div>
                <p className="text-sm font-extrabold text-[#111827]">{name}</p>
                <p className="text-xs text-[#6B7280]">Shared a chart idea</p>
              </div>
            </button>
          ))}
        </CleanCard>
        <CleanCard className="flex flex-col p-0">
          <div className="border-b border-[#E5E7EB] p-5">
            <h2 className="font-extrabold text-[#111827]">AlphaTrader</h2>
            <p className="text-sm text-[#6B7280]">Online · Pro trader</p>
          </div>
          <div className="flex-1 space-y-4 p-5">
            <div className="max-w-[75%] rounded-2xl bg-[#F7F9FC] p-4 text-sm text-[#4B5563]">Can you send me that EUR/USD analysis?</div>
            <div className="ml-auto max-w-[75%] rounded-2xl bg-[#2563EB] p-4 text-sm text-white">Sure. I’ll share the AI summary and chart screenshot.</div>
          </div>
          <div className="flex gap-2 border-t border-[#E5E7EB] p-4">
            <input className="h-11 flex-1 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" placeholder="Write a message..." />
            <CleanButton><Send className="h-4 w-4" />Send</CleanButton>
            <CleanButton variant="secondary"><ShieldAlert className="h-4 w-4" />Report</CleanButton>
          </div>
        </CleanCard>
      </div>
    </div>
  );
}
