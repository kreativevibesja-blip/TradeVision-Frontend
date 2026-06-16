'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, Radar, Sparkles, UploadCloud } from 'lucide-react';
import { ActiveOpportunitiesWidget, CleanBadge, CleanButton, CleanCard, EventsWidget, MarketOverviewWidget, OrionWidget, PageHeader, SimpleChartCard } from '@/components/CleanBlue';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { VerifiedBadge } from '@/components/VerifiedBadge';

type DashboardFeedPost = {
  id: string;
  user_id: string;
  body: string;
  market_tag: string | null;
  image_url: string | null;
  ai_summary: string | null;
  post_type: string;
  created_at: string;
};

type ProfilePreview = {
  id: string;
  name: string | null;
  email: string;
  subscription?: string | null;
};

const relativeTime = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = (user?.name || user?.email?.split('@')[0] || 'Trader').split(' ')[0];
  const [feedPosts, setFeedPosts] = useState<DashboardFeedPost[]>([]);
  const [feedProfiles, setFeedProfiles] = useState<Record<string, ProfilePreview>>({});
  const [feedMode, setFeedMode] = useState<'Following' | 'Suggested'>('Suggested');
  const [feedLoading, setFeedLoading] = useState(true);

  const loadProfiles = useCallback(async (rows: DashboardFeedPost[]) => {
    if (!supabase || rows.length === 0) return;
    const ids = Array.from(new Set(rows.map((post) => post.user_id)));
    const { data } = await supabase
      .from('User')
      .select('id, name, email, subscription')
      .in('id', ids);

    setFeedProfiles((data || []).reduce<Record<string, ProfilePreview>>((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {}));
  }, []);

  const loadDashboardFeed = useCallback(async () => {
    if (!supabase || !user) {
      setFeedLoading(false);
      return;
    }

    setFeedLoading(true);

    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .limit(100);

    const followingIds = (follows || []).map((row) => row.following_id).filter(Boolean);
    let rows: DashboardFeedPost[] = [];
    let mode: 'Following' | 'Suggested' = 'Suggested';

    if (followingIds.length > 0) {
      const { data } = await supabase
        .from('feed_posts')
        .select('id, user_id, body, market_tag, image_url, ai_summary, post_type, created_at')
        .eq('visibility', 'public')
        .eq('is_hidden', false)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(4);

      rows = data || [];
      mode = rows.length > 0 ? 'Following' : 'Suggested';
    }

    if (rows.length === 0) {
      const { data } = await supabase
        .from('feed_posts')
        .select('id, user_id, body, market_tag, image_url, ai_summary, post_type, created_at')
        .eq('visibility', 'public')
        .eq('is_hidden', false)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(4);

      rows = data || [];
    }

    setFeedMode(mode);
    setFeedPosts(rows);
    await loadProfiles(rows);
    setFeedLoading(false);
  }, [loadProfiles, user]);

  useEffect(() => {
    void loadDashboardFeed();
  }, [loadDashboardFeed]);

  const profileName = (userId: string) => {
    if (userId === user?.id) return user.name || user.email.split('@')[0] || 'You';
    const profile = feedProfiles[userId];
    return profile?.name || profile?.email?.split('@')[0] || 'Trader';
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Here's what's happening in your trading today."
        action={<CleanButton href="/analyze"><UploadCloud className="h-4 w-4" />Upload Analysis</CleanButton>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: 'Orion AI', body: 'Ask your trading mentor for guidance.', href: '/dashboard/orion', icon: Sparkles },
              { title: 'Trade Radar', body: 'Monitor your active setups.', href: '/dashboard/radar', icon: Radar },
              { title: 'Upload New Analysis', body: 'Run AI structure analysis.', href: '/analyze', icon: UploadCloud },
              { title: 'Market Overview', body: "Review today's market pulse.", href: '/dashboard/events', icon: CalendarDays },
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
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold text-[#111827]">Feed</h2>
                      <CleanBadge tone="blue">{feedMode}</CleanBadge>
                    </div>
                    <p className="text-sm text-[#6B7280]">Ideas from traders you follow and top market discussions.</p>
                  </div>
                  <CleanButton href="/dashboard/feed" variant="secondary">View Feed</CleanButton>
                </div>
                <div className="space-y-3">
                  {feedLoading ? (
                    <div className="rounded-xl bg-[#F7F9FC] p-4 text-sm text-[#6B7280]">Loading feed posts...</div>
                  ) : feedPosts.length === 0 ? (
                    <div className="rounded-xl bg-[#F7F9FC] p-4 text-sm text-[#6B7280]">No feed posts yet. Open the Feed to share the first trading idea.</div>
                  ) : feedPosts.map((post) => {
                    const author = profileName(post.user_id);
                    return (
                      <article key={post.id} className="rounded-2xl border border-[#E5E7EB] bg-[#F7F9FC] p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-extrabold text-[#2563EB]">
                            {author.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-extrabold text-[#111827]">{author}</p>
                              <VerifiedBadge subscription={post.user_id === user?.id ? user.subscription : feedProfiles[post.user_id]?.subscription} />
                              <CleanBadge tone="gray">{post.market_tag || post.post_type}</CleanBadge>
                            </div>
                            <p className="text-xs font-semibold text-[#9CA3AF]">{relativeTime(post.created_at)}</p>
                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4B5563]">{post.ai_summary || post.body}</p>
                          </div>
                          {post.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.image_url} alt="" className="hidden h-20 w-28 shrink-0 rounded-xl object-cover sm:block" loading="lazy" />
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
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
