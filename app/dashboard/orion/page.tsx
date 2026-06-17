'use client';

import { Suspense } from 'react';
import { Headphones } from 'lucide-react';
import { CleanButton, PageHeader } from '@/components/CleanBlue';
import { OrionMentorChatExperience } from '@/components/OrionMentorAssistant';

export default function OrionPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col">
      <PageHeader
        title="Orion AI"
        subtitle="Page-aware TradeVision mentor for navigation, chart analysis, trading concepts, support, and workflow guidance."
        action={<CleanButton href="/dashboard/support"><Headphones className="h-4 w-4" />Open Support</CleanButton>}
      />
      <div className="h-[calc(100svh-15rem)] min-h-[28rem] overflow-hidden max-sm:h-[calc(100svh-12rem)] max-sm:min-h-[26rem]">
        <Suspense fallback={<div className="h-full rounded-[18px] border border-[#E5E7EB] bg-white p-5 text-sm text-[#6B7280]">Loading Orion...</div>}>
          <OrionMentorChatExperience surface="embedded" />
        </Suspense>
      </div>
    </div>
  );
}
