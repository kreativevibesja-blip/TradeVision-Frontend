'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Clock3, Eye, Target, UploadCloud } from 'lucide-react';
import { ActiveOpportunitiesWidget, CleanBadge, CleanButton, CleanCard, EventsWidget, MarketOverviewWidget, OrionWidget, PageHeader } from '@/components/CleanBlue';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { UserAvatar } from '@/components/UserAvatar';
import Link from 'next/link';
import { api, resolveAssetUrl, type AnalysisResult } from '@/lib/api';

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
  display_name?: string | null;
  avatar_url?: string | null;
};

const relativeTime = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const getAnalysisBias = (analysis: AnalysisResult) =>
  analysis.tradingAnalysis?.marketBias ?? analysis.trend ?? analysis.bias ?? 'unclear';

const getAnalysisReadiness = (analysis: AnalysisResult) =>
  analysis.tradingAnalysis?.entryReadiness ?? analysis.signalType ?? analysis.recommendation ?? 'waiting';

const getBadgeTone = (value: string): 'blue' | 'green' | 'amber' | 'red' | 'gray' => {
  const normalized = value.toLowerCase();
  if (normalized.includes('ready') || normalized.includes('bullish') || normalized.includes('buy')) return 'green';
  if (normalized.includes('bearish') || normalized.includes('sell')) return 'red';
  if (normalized.includes('wait') || normalized.includes('neutral') || normalized.includes('range')) return 'amber';
  return 'gray';
};

const formatAnalysisLabel = (value: string | null | undefined, fallback: string) => {
  if (!value) return fallback;
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

export default function DashboardPage() {
  const { user, token } = useAuth();
  const firstName = (user?.name || user?.email?.split('@')[0] || 'Trader').split(' ')[0];
  const [feedPosts, setFeedPosts] = useState<DashboardFeedPost[]>([]);
  const [feedProfiles, setFeedProfiles] = useState<Record<string, ProfilePreview>>({});
  const [feedMode, setFeedMode] = useState<'Following' | 'Suggested'>('Suggested');
  const [feedLoading, setFeedLoading] = useState(true);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);

  const loadProfiles = useCallback(async (rows: DashboardFeedPost[]) => {
    if (!supabase || rows.length === 0) return;
    const ids = Array.from(new Set(rows.map((post) => post.user_id)));
    const { data } = await supabase
      .from('User')
      .select('id, name, email, subscription')
      .in('id', ids);
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', ids);
    const profileByUserId = new Map((profileRows || []).map((profile) => [profile.user_id, profile]));

    setFeedProfiles((data || []).reduce<Record<string, ProfilePreview>>((acc, profile) => {
      const profileMeta = profileByUserId.get(profile.id);
      acc[profile.id] = {
        ...profile,
        display_name: profileMeta?.display_name ?? null,
        avatar_url: profileMeta?.avatar_url ?? null,
      };
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

  const loadRecentAnalyses = useCallback(async () => {
    if (!token) {
      setAnalysesLoading(false);
      return;
    }

    setAnalysesLoading(true);
    try {
      const result = await api.getAnalyses(token, 1);
      setRecentAnalyses(result.analyses.slice(0, 4));
    } catch {
      setRecentAnalyses([]);
    } finally {
      setAnalysesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadRecentAnalyses();
  }, [loadRecentAnalyses]);

  const profileName = (userId: string) => {
    const profile = feedProfiles[userId];
    if (userId === user?.id) return profile?.display_name || user.name || user.email.split('@')[0] || 'You';
    return profile?.display_name || profile?.name || profile?.email?.split('@')[0] || 'Trader';
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
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-5">
              <CleanCard>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold text-[#111827]">Recent Analyses</h2>
                      <CleanBadge tone="blue">{recentAnalyses.length}</CleanBadge>
                    </div>
                    <p className="text-sm text-[#6B7280]">Your latest Orion chart reads from uploads and live charts.</p>
                  </div>
                  <CleanButton href="/analyze" variant="secondary">View Workspace</CleanButton>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {analysesLoading ? (
                    <div className="rounded-xl bg-[#F7F9FC] p-4 text-sm text-[#6B7280] md:col-span-2">Loading recent analyses...</div>
                  ) : recentAnalyses.length === 0 ? (
                    <div className="rounded-xl bg-[#F7F9FC] p-4 text-sm text-[#6B7280] md:col-span-2">
                      No saved analyses yet. Upload a chart to start building your workspace history.
                    </div>
                  ) : recentAnalyses.map((analysis) => {
                    const imageUrl = resolveAssetUrl(analysis.markedImageUrl || analysis.originalImageUrl || analysis.imageUrl || null);
                    const bias = getAnalysisBias(analysis);
                    const readiness = getAnalysisReadiness(analysis);
                    const setupQuality = analysis.tradingAnalysis?.setupQuality ?? analysis.quality?.setupRating ?? analysis.setupQuality ?? 'N/A';

                    return (
                      <Link
                        key={analysis.id}
                        href={`/analyze?analysisId=${encodeURIComponent(analysis.id)}`}
                        className="group overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F7F9FC] transition hover:border-[#2563EB] hover:bg-white hover:shadow-[0_14px_34px_rgba(37,99,235,0.10)]"
                      >
                        <div className="flex gap-3 p-3">
                          <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-[#0B1220]">
                            {imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={imageUrl} alt={`${analysis.pair} chart analysis`} className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[#60A5FA]">
                                <BarChart3 className="h-7 w-7" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-extrabold text-[#111827]">{analysis.pair}</p>
                              <Eye className="h-4 w-4 shrink-0 text-[#9CA3AF] transition group-hover:text-[#2563EB]" />
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <CleanBadge tone={getBadgeTone(String(bias))}>{formatAnalysisLabel(String(bias), 'Unclear')}</CleanBadge>
                              <CleanBadge tone={getBadgeTone(String(readiness))}>{formatAnalysisLabel(String(readiness), 'Waiting')}</CleanBadge>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#6B7280]">
                              <span className="inline-flex items-center gap-1">
                                <Target className="h-3.5 w-3.5" />
                                {setupQuality}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" />
                                {analysis.createdAt ? relativeTime(analysis.createdAt) : analysis.timeframe}
                              </span>
                            </div>
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#6B7280]">
                              {analysis.tradingAnalysis?.summary || analysis.message || analysis.reasoning || 'Open the analysis to review Orion notes.'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CleanCard>

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
                          <Link href={`/profile/${encodeURIComponent(post.user_id)}`}>
                            <UserAvatar name={author} avatarUrl={feedProfiles[post.user_id]?.avatar_url} className="h-10 w-10 text-sm font-extrabold" />
                          </Link>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link href={`/profile/${encodeURIComponent(post.user_id)}`} className="font-extrabold text-[#111827] hover:text-[#2563EB]">{author}</Link>
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
        </aside>
      </div>
    </div>
  );
}
