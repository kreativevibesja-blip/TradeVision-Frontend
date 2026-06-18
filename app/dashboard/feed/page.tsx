'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Loader2, Send, Sparkles, UploadCloud, X } from 'lucide-react';
import { CleanButton, CleanCard, CleanBadge, FeedPostCard, PageHeader } from '@/components/CleanBlue';
import { api, type AiCompareRecord, type AiCompareUsage } from '@/lib/api';
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

const loadingSteps = [
  'Reading chart structure',
  'Detecting key levels',
  'Reviewing market bias',
  'Comparing idea',
  'Generating mentor feedback',
];

const agreementLabel = {
  agrees: 'Agrees',
  partially_agrees: 'Partially agrees',
  disagrees: 'Disagrees',
  unclear: 'Unclear',
};

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('For You');
  const [draft, setDraft] = useState('');
  const [marketTag, setMarketTag] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfilePreview>>({});
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [comparePost, setComparePost] = useState<FeedPost | null>(null);
  const [compareResult, setCompareResult] = useState<AiCompareRecord | null>(null);
  const [compareUsage, setCompareUsage] = useState<AiCompareUsage | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareStep, setCompareStep] = useState(loadingSteps[0]);
  const [compareError, setCompareError] = useState('');
  const [compareSavedMessage, setCompareSavedMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const profileName = useCallback((userId: string) => {
    const profile = profiles[userId];
    if (userId === user?.id) return profile?.display_name || user.name || user.email.split('@')[0] || 'You';
    return profile?.display_name || profile?.name || profile?.email?.split('@')[0] || 'Trader';
  }, [profiles, user]);

  const loadProfiles = useCallback(async (rows: FeedPost[]) => {
    if (!supabase || rows.length === 0) return;
    const ids = Array.from(new Set(rows.map((row) => row.user_id))).filter((id) => !profiles[id]);
    if (ids.length === 0) return;

    const { data } = await supabase
      .from('User')
      .select('id, name, email, subscription')
      .in('id', ids);
    const { data: profileRows } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', ids);
    const profileByUserId = new Map((profileRows || []).map((profile) => [profile.user_id, profile]));

    const nextProfiles = (data || []).reduce<Record<string, ProfilePreview>>((acc, profile) => {
      const profileMeta = profileByUserId.get(profile.id);
      acc[profile.id] = {
        ...profile,
        display_name: profileMeta?.display_name ?? null,
        avatar_url: profileMeta?.avatar_url ?? null,
      };
      return acc;
    }, {});

    setProfiles((current) => ({ ...current, ...nextProfiles }));
  }, [profiles]);

  const loadPosts = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError('The feed is not available right now.');
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

  const canPost = useMemo(() => Boolean(user && (draft.trim() || attachment) && !posting), [attachment, draft, posting, user]);

  const createPost = async () => {
    if (!supabase || !user || (!draft.trim() && !attachment)) return;

    setPosting(true);
    setError('');

    let imageUrl: string | null = null;
    if (attachment) {
      try {
        const uploaded = await api.uploadAttachment(attachment, 'feed');
        imageUrl = uploaded.imageUrl;
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : 'Attachment upload failed.');
        setPosting(false);
        return;
      }
    }

    const { error: postError } = await supabase.from('feed_posts').insert({
      user_id: user.id,
      body: draft.trim() || 'Shared a chart screenshot.',
      market_tag: marketTag.trim() || null,
      image_url: imageUrl,
      post_type: 'text',
      visibility: 'public',
    });

    if (postError) {
      setError(postError.message);
    } else {
      setDraft('');
      setMarketTag('');
      setAttachment(null);
      await loadPosts();
    }

    setPosting(false);
  };

  const openAiCompare = (post: FeedPost) => {
    setComparePost(post);
    setCompareResult(null);
    setCompareUsage(null);
    setCompareError('');
    setCompareSavedMessage('');
    setCompareStep(loadingSteps[0]);
  };

  const runAiCompare = async () => {
    if (!comparePost) return;
    setCompareLoading(true);
    setCompareError('');
    setCompareSavedMessage('');

    let index = 0;
    const timer = window.setInterval(() => {
      index = (index + 1) % loadingSteps.length;
      setCompareStep(loadingSteps[index]);
    }, 900);

    try {
      const response = await api.runAiCompare(comparePost.id);
      setCompareResult(response.compare);
      setCompareUsage(response.usage);
      setCompareStep('Orion’s independent view is ready');
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : 'AI Compare failed');
    } finally {
      window.clearInterval(timer);
      setCompareLoading(false);
    }
  };

  const publishCompare = async () => {
    if (!compareResult) return;
    const response = await api.publishAiCompare(compareResult.id);
    setCompareResult(response.compare);
    setCompareSavedMessage('Posted as Orion AI Compare.');
  };

  const saveCompareToJournal = async () => {
    if (!compareResult) return;
    await api.saveAiCompareToJournal(compareResult.id);
    setCompareSavedMessage('Saved to Journal.');
  };

  const sendCompareToRadar = async () => {
    if (!compareResult) return;
    await api.sendAiCompareToRadar(compareResult.id);
    setCompareSavedMessage('Sent to Trade Radar.');
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
    <div className="mx-auto h-[calc(100svh-8rem)] min-h-[42rem] max-w-5xl overflow-hidden">
      <div className="min-h-0 overflow-y-auto pr-1">
        <PageHeader title="Feed" subtitle="Share chart ideas, AI analysis, radar setups, and journal recaps with traders." />
        <CleanCard className="mb-5">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Share a trading idea..."
            className="min-h-24 w-full resize-none rounded-xl border border-[#E5E7EB] bg-[#F7F9FC] p-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#2563EB] focus:bg-white"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
          />
          {attachment ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-2 text-sm text-[#1D4ED8]">
              <span className="min-w-0 truncate">{attachment.name}</span>
              <button type="button" onClick={() => setAttachment(null)} className="font-extrabold text-[#2563EB]">Remove</button>
            </div>
          ) : null}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={marketTag}
              onChange={(event) => setMarketTag(event.target.value)}
              placeholder="Market tag, e.g. EUR/USD 4H"
              className="h-11 min-w-0 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#2563EB]"
            />
            <div className="flex flex-wrap gap-2">
              <CleanButton variant="secondary" onClick={() => fileInputRef.current?.click()}><ImagePlus className="h-4 w-4" />Screenshot</CleanButton>
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

        <div className="space-y-5 pb-6">
          {loading ? (
            <CleanCard><p className="text-sm text-[#6B7280]">Loading posts...</p></CleanCard>
          ) : posts.length === 0 ? (
            <CleanCard><p className="text-sm text-[#6B7280]">No posts yet. Share the first trading idea.</p></CleanCard>
          ) : (
            posts.map((post) => (
              <FeedPostCard
                key={post.id}
                authorId={post.user_id}
                author={profileName(post.user_id)}
                authorAvatar={profiles[post.user_id]?.avatar_url}
                authorSubscription={post.user_id === user?.id ? user.subscription : profiles[post.user_id]?.subscription}
                market={post.market_tag || post.post_type}
                summary={post.ai_summary || post.body}
                image={post.image_url || undefined}
                timeLabel={relativeTime(post.created_at)}
                canAiCompare={Boolean(post.image_url)}
                onAiCompare={() => openAiCompare(post)}
              />
            ))
          )}
        </div>
      </div>

      {comparePost ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] p-5">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-[#111827]">
                  <Sparkles className="h-5 w-5 text-[#2563EB]" />
                  Run Orion AI Compare?
                </h2>
                <p className="mt-1 text-sm text-[#6B7280]">Orion’s independent view helps compare the posted idea without attacking the trader.</p>
              </div>
              <button onClick={() => setComparePost(null)} className="rounded-xl p-2 text-[#6B7280] hover:bg-[#F3F4F6]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="space-y-5">
                <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#0B1220]">
                  {comparePost.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={comparePost.image_url} alt="Posted chart" className="max-h-80 w-full object-contain" />
                  ) : (
                    <div className="flex h-56 items-center justify-center text-[#60A5FA]">No chart image</div>
                  )}
                </div>

                <CleanCard>
                  <h3 className="font-extrabold text-[#111827]">Original Post Summary</h3>
                  <p className="mt-2 text-sm leading-6 text-[#4B5563]">{comparePost.ai_summary || comparePost.body}</p>
                  <p className="mt-3 text-xs font-bold text-[#2563EB]">{comparePost.market_tag || 'Community chart'}</p>
                </CleanCard>

                {compareResult ? (
                  <CleanCard>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-extrabold text-[#111827]">Orion’s independent view</h3>
                      <CleanBadge tone={compareResult.agreement === 'disagrees' ? 'red' : compareResult.agreement === 'unclear' ? 'gray' : 'blue'}>
                        {agreementLabel[compareResult.agreement]}
                      </CleanBadge>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
                      <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${compareResult.confidence}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-bold text-[#6B7280]">Confidence {compareResult.confidence}%</p>
                    <div className="mt-5 grid gap-4 text-sm text-[#4B5563] md:grid-cols-2">
                      <p><strong className="text-[#111827]">Bias:</strong> {compareResult.result_json.bias}</p>
                      <p><strong className="text-[#111827]">Recommended action:</strong> {compareResult.result_json.recommendedAction.replaceAll('_', ' ')}</p>
                      <p><strong className="text-[#111827]">Structure:</strong> {compareResult.result_json.marketStructure}</p>
                      <p><strong className="text-[#111827]">Liquidity:</strong> {compareResult.result_json.liquidity}</p>
                    </div>
                    <p className="mt-4 rounded-2xl bg-[#EFF6FF] p-4 text-sm leading-6 text-[#1D4ED8]">{compareResult.result_json.mentorFeedback}</p>
                    <div className="mt-4">
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#6B7280]">Key Levels</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {compareResult.result_json.keyLevels.map((level) => <CleanBadge key={level} tone="gray">{level}</CleanBadge>)}
                      </div>
                    </div>
                  </CleanCard>
                ) : null}
              </div>

              <aside className="space-y-4">
                <CleanCard>
                  <h3 className="font-extrabold text-[#111827]">Quota</h3>
                  <p className="mt-2 text-sm text-[#6B7280]">
                    {compareUsage ? `${compareUsage.used_count} of ${compareUsage.limit_count} used this period.` : 'Quota is checked before Orion runs AI Compare.'}
                  </p>
                </CleanCard>

                {compareLoading ? (
                  <CleanCard>
                    <Loader2 className="mb-3 h-5 w-5 animate-spin text-[#2563EB]" />
                    <p className="text-sm font-bold text-[#111827]">{compareStep}</p>
                  </CleanCard>
                ) : null}

                {compareError ? <p className="rounded-xl bg-[#FEF2F2] p-3 text-sm font-semibold text-[#EF4444]">{compareError}</p> : null}
                {compareSavedMessage ? <p className="rounded-xl bg-[#ECFDF5] p-3 text-sm font-semibold text-[#16A34A]">{compareSavedMessage}</p> : null}

                {!compareResult ? (
                  <CleanButton onClick={runAiCompare} className={compareLoading || !comparePost.image_url ? 'pointer-events-none w-full opacity-60' : 'w-full'}>
                    {compareLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Run AI Compare
                  </CleanButton>
                ) : (
                  <div className="space-y-2">
                    <CleanButton onClick={() => setComparePost(null)} variant="secondary" className="w-full">Keep Private</CleanButton>
                    <CleanButton onClick={publishCompare} className="w-full">Post as Comment</CleanButton>
                    <CleanButton onClick={saveCompareToJournal} variant="secondary" className="w-full">Save to Journal</CleanButton>
                    <CleanButton onClick={sendCompareToRadar} variant="secondary" className="w-full">Send to Trade Radar</CleanButton>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
