'use client';

import { useEffect, useState } from 'react';
import { FeedPostCard, CleanButton, CleanCard, CleanStatCard } from '@/components/CleanBlue';
import { supabase } from '@/lib/supabase/client';
import { VerifiedBadge, isVerifiedTrader } from '@/components/VerifiedBadge';

type ProfileUser = {
  id: string;
  name: string | null;
  email: string;
  subscription: string | null;
};

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const fallbackName = decodeURIComponent(params.id).replace(/[-_]/g, ' ') || 'Trader';
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);

  useEffect(() => {
    if (!supabase || !params.id) return;

    let active = true;
    supabase
      .from('User')
      .select('id, name, email, subscription')
      .eq('id', params.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfileUser(data as ProfileUser | null);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  const displayName = profileUser?.name || profileUser?.email?.split('@')[0] || fallbackName;
  const subscription = profileUser?.subscription;

  return (
    <div className="min-h-screen bg-[#F7F9FC] px-4 py-8 text-[#111827]">
      <div className="mx-auto max-w-5xl">
        <CleanCard className="mb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#DBEAFE] text-3xl font-extrabold text-[#2563EB]">{displayName[0]?.toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-2xl font-extrabold tracking-[-0.04em] text-[#111827] sm:text-3xl">{displayName}</h1>
                    <VerifiedBadge subscription={subscription} size="md" />
                  </div>
                  {isVerifiedTrader(subscription) ? <p className="mt-1 text-sm font-bold text-[#2563EB]">Verified trader</p> : null}
                  <p className="mt-2 text-sm leading-6 text-[#6B7280]">Forex, Gold, Crypto · Shared setups, AI analyses, and market ideas.</p>
                </div>
                <CleanButton>Follow</CleanButton>
              </div>
            </div>
          </div>
        </CleanCard>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <CleanStatCard label="Followers" value="1,284" />
          <CleanStatCard label="Following" value="318" />
          <CleanStatCard label="Shared Setups" value="92" />
        </div>
        <FeedPostCard author={displayName} authorSubscription={subscription} image="/landing/platform-dashboard.png" />
      </div>
    </div>
  );
}
