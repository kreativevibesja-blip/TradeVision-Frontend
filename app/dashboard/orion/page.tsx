'use client';

import { Suspense } from 'react';
import { Headphones } from 'lucide-react';
import { CleanButton, PageHeader } from '@/components/CleanBlue';
import { OrionMentorChatExperience } from '@/components/OrionMentorAssistant';

export default function OrionPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Orion AI"
        subtitle="Page-aware TradeVision mentor for navigation, chart analysis, trading concepts, support, and workflow guidance."
        action={<CleanButton href="/dashboard/support"><Headphones className="h-4 w-4" />Open Support</CleanButton>}
      />
      <Suspense fallback={<div className="min-h-[34rem] rounded-[18px] border border-[#E5E7EB] bg-white p-5 text-sm text-[#6B7280]">Loading Orion...</div>}>
        <OrionMentorChatExperience surface="embedded" />
      </Suspense>
    </div>
  );
}
