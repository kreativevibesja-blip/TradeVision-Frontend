'use client';

import { useState } from 'react';
import { ImagePlus, Pin, Send, Shield } from 'lucide-react';
import { CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';

const channels = ['General', 'Forex', 'Gold', 'Crypto', 'Indices', 'Synthetic Indices', 'Beginners', 'Trade Reviews', 'Platform Help'];
const messages = [
  ['Javy', 'Anyone watching EUR/USD around London open?'],
  ['AlphaTrader', 'Yes, I posted a radar setup. Waiting for confirmation.'],
  ['Market_Mindset', 'Gold is cleaner today. Supply reaction is obvious.'],
];

export default function CommunityPage() {
  const [channel, setChannel] = useState('General');

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Community" subtitle="Trading rooms for discussion, analysis sharing, mentoring, and platform support." />
      <div className="grid min-h-[70vh] gap-5 lg:grid-cols-[15rem_minmax(0,1fr)_18rem]">
        <CleanCard className="p-3">
          <p className="px-2 pb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6B7280]">Channels</p>
          <div className="space-y-1">
            {channels.map((item) => (
              <button key={item} onClick={() => setChannel(item)} className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-bold ${channel === item ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#4B5563] hover:bg-[#F7F9FC]'}`}>
                # {item}
              </button>
            ))}
          </div>
        </CleanCard>

        <CleanCard className="flex flex-col p-0">
          <div className="border-b border-[#E5E7EB] p-5">
            <h2 className="font-extrabold text-[#111827]"># {channel}</h2>
            <p className="text-sm text-[#6B7280]">Latest 30 messages with controlled polling and older-message pagination.</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map(([author, body]) => (
              <div key={`${author}-${body}`} className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-extrabold text-[#2563EB]">{author[0]}</div>
                <div className="rounded-2xl bg-[#F7F9FC] px-4 py-3">
                  <p className="text-sm font-extrabold text-[#111827]">{author}</p>
                  <p className="text-sm leading-6 text-[#4B5563]">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#E5E7EB] p-4">
            <div className="flex gap-2">
              <button className="rounded-xl border border-[#E5E7EB] px-3 text-[#6B7280]"><ImagePlus className="h-4 w-4" /></button>
              <input className="h-11 flex-1 rounded-xl border border-[#E5E7EB] px-4 text-sm outline-none focus:border-[#2563EB]" placeholder={`Message #${channel}`} />
              <CleanButton><Send className="h-4 w-4" />Send</CleanButton>
            </div>
          </div>
        </CleanCard>

        <aside className="space-y-5">
          <CleanCard>
            <h2 className="font-extrabold text-[#111827]">Members</h2>
            <div className="mt-4 space-y-3 text-sm text-[#4B5563]">
              <p>Javy · Pro Trader</p>
              <p>AlphaTrader · Mentor</p>
              <p>Market_Mindset · Member</p>
            </div>
          </CleanCard>
          <CleanCard>
            <h2 className="flex items-center gap-2 font-extrabold text-[#111827]"><Shield className="h-4 w-4 text-[#2563EB]" />Moderation</h2>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">Admins can delete, mute, ban, pin announcements, and review reports.</p>
            <CleanButton variant="secondary" className="mt-4"><Pin className="h-4 w-4" />Pin rules</CleanButton>
          </CleanCard>
        </aside>
      </div>
    </div>
  );
}
