'use client';

import { useState } from 'react';
import { ImagePlus, Send, UploadCloud } from 'lucide-react';
import { CleanButton, CleanCard, CommentBox, FeedPostCard, PageHeader } from '@/components/CleanBlue';

const tabs = ['For You', 'Following', 'Top Ideas', 'Events'];

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState('For You');
  const [draft, setDraft] = useState('');

  return (
    <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <PageHeader title="Feed" subtitle="Share chart ideas, AI analysis, radar setups, and journal recaps with traders." />
        <CleanCard className="mb-5">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Share a trading idea..."
            className="min-h-24 w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#F7F9FC] p-4 text-sm outline-none focus:border-[#2563EB] focus:bg-white"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <CleanButton variant="secondary"><ImagePlus className="h-4 w-4" />Screenshot</CleanButton>
              <CleanButton variant="secondary" href="/analyze"><UploadCloud className="h-4 w-4" />AI Analysis</CleanButton>
            </div>
            <CleanButton onClick={() => setDraft('')}><Send className="h-4 w-4" />Post</CleanButton>
          </div>
        </CleanCard>

        <div className="mb-5 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-xl px-4 py-2 text-sm font-bold ${activeTab === tab ? 'bg-[#2563EB] text-white' : 'bg-white text-[#6B7280]'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          <FeedPostCard image="/landing/hero-devices.png" />
          <FeedPostCard author="Market_Mindset" market="XAU/USD 1H" summary="Bearish reaction from supply. Waiting for confirmation before sending this to Trade Radar." image="/landing/platform-dashboard.png" />
          <CommentBox />
        </div>
      </div>

      <aside className="space-y-5">
        <CleanCard>
          <h2 className="font-extrabold text-[#111827]">Moderation</h2>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">Users can report posts, delete their own posts, save ideas, and follow traders.</p>
        </CleanCard>
        <CleanCard>
          <h2 className="font-extrabold text-[#111827]">Trending Markets</h2>
          <div className="mt-4 space-y-2 text-sm font-semibold text-[#6B7280]">
            <p>#EURUSD breakout</p>
            <p>#Gold supply</p>
            <p>#NASDAQ continuation</p>
          </div>
        </CleanCard>
      </aside>
    </div>
  );
}
