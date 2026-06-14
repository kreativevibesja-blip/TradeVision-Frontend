'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImagePlus, Loader2, Send, UploadCloud } from 'lucide-react';
import { CleanButton, CleanCard, CleanBadge, FeedPostCard, PageHeader } from '@/components/CleanBlue';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const tabs = ['For You', 'Following', 'Top Ideas', 'Events'];

type FeedPost = {
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
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

const relativeTime = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('For You');
  const [draft, setDraft] = useState('');
  const [marketTag, setMarketTag] = useState('');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfilePreview>>({});
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const profileName = useCallback((userId: string) => {
    if (userId === user?.id) return user.name || user.email.split('@')[0] || 'You';
    return profiles[userId]?.display_name || `Trader ${userId.slice(0, 6)}`;
  }, [profiles, user]);

  const loadProfiles = useCallback(async (rows: FeedPost[]) => {
    if (!supabase || rows.length === 0) return;
    const ids = Array.from(new Set(rows.map((row) => row.user_id))).filter((id) => !profiles[id]);
    if (ids.length === 0) return;

    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', ids);

    const nextProfiles = (data || []).reduce<Record<string, ProfilePreview>>((acc, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {});

    setProfiles((current) => ({ ...current, ...nextProfiles }));
  }, [profiles]);

  const loadPosts = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError('Supabase is not configured for the feed.');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: feedError } = await supabase
      .from('feed_posts')
      .select('id, user_id, body, market_tag, image_url, ai_summary, post_type, created_at')
      .eq('visibility', 'public')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (feedError) {
      setError(feedError.message);
      setPosts([]);
    } else {
      const rows = data || [];
      setPosts(rows);
      await loadProfiles(rows);
    }

    setLoading(false);
  }, [loadProfiles]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const canPost = useMemo(() => Boolean(user && draft.trim() && !posting), [draft, posting, user]);

  const createPost = async () => {
    if (!supabase || !user || !draft.trim()) return;

    setPosting(true);
    setError('');

    const { error: postError } = await supabase.from('feed_posts').insert({
      user_id: user.id,
      body: draft.trim(),
      market_tag: marketTag.trim() || null,
      post_type: 'text',
      visibility: 'public',
    });

    if (postError) {
      setError(postError.message);
    } else {
      setDraft('');
      setMarketTag('');
      await loadPosts();
    }

    setPosting(false);
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Feed" subtitle="Sign in to read and share trading ideas with the community." />
        <CleanCard>
          <p className="text-sm text-[#6B7280]">Your session is required before posts can be loaded or created.</p>
        </CleanCard>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <PageHeader title="Feed" subtitle="Share chart ideas, AI analysis, radar setups, and journal recaps with traders." />
        <CleanCard className="mb-5">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Share a trading idea..."
            className="min-h-24 w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#F7F9FC] p-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#2563EB] focus:bg-white"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={marketTag}
              onChange={(event) => setMarketTag(event.target.value)}
              placeholder="Market tag, e.g. EUR/USD 4H"
              className="h-11 min-w-0 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#2563EB]"
            />
            <div className="flex flex-wrap gap-2">
              <CleanButton variant="secondary"><ImagePlus className="h-4 w-4" />Screenshot</CleanButton>
              <CleanButton variant="secondary" href="/analyze"><UploadCloud className="h-4 w-4" />AI Analysis</CleanButton>
              <CleanButton onClick={createPost} className={!canPost ? 'pointer-events-none opacity-60' : ''}>
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Post
              </CleanButton>
            </div>
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-[#EF4444]">{error}</p> : null}
        </CleanCard>

        <div className="mb-5 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-xl px-4 py-2 text-sm font-bold ${activeTab === tab ? 'bg-[#2563EB] text-white' : 'bg-white text-[#6B7280]'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {loading ? (
            <CleanCard><p className="text-sm text-[#6B7280]">Loading posts...</p></CleanCard>
          ) : posts.length === 0 ? (
            <CleanCard><p className="text-sm text-[#6B7280]">No posts yet. Share the first trading idea.</p></CleanCard>
          ) : (
            posts.map((post) => (
              <FeedPostCard
                key={post.id}
                author={profileName(post.user_id)}
                market={post.market_tag || post.post_type}
                summary={post.ai_summary || post.body}
                image={post.image_url || undefined}
                timeLabel={relativeTime(post.created_at)}
              />
            ))
          )}
        </div>
      </div>

      <aside className="space-y-5">
        <CleanCard>
          <h2 className="font-extrabold text-[#111827]">Feed Status</h2>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">Posts are loaded from Supabase in batches of 10. Comments and large media stay lazy-loaded to avoid heavy dashboard queries.</p>
        </CleanCard>
        <CleanCard>
          <h2 className="font-extrabold text-[#111827]">Current View</h2>
          <div className="mt-3"><CleanBadge tone="blue">{activeTab}</CleanBadge></div>
        </CleanCard>
      </aside>
    </div>
  );
}
