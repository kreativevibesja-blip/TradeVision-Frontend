'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, UserPlus, UserCheck } from 'lucide-react';
import { FeedPostCard, CleanButton, CleanCard, CleanStatCard } from '@/components/CleanBlue';
import { supabase } from '@/lib/supabase/client';
import { VerifiedBadge, isVerifiedTrader } from '@/components/VerifiedBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuth } from '@/hooks/useAuth';

type ProfileUser = {
  id: string;
  name: string | null;
  email: string;
  subscription: string | null;
};

type ProfileRow = {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  markets_traded: string[] | null;
  hide_performance_stats: boolean | null;
};

type FeedPost = {
  id: string;
  body: string;
  market_tag: string | null;
  image_url: string | null;
  ai_summary: string | null;
  post_type: string;
  created_at: string;
};

const relativeTime = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const fallbackName = decodeURIComponent(params.id).replace(/[-_]/g, ' ') || 'Trader';
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const loadProfile = async () => {
    if (!supabase || !params.id) return;

    const [{ data: userData }, { data: profileData }, postResult, followerResult, followingResult, ownFollowResult] = await Promise.all([
      supabase.from('User').select('id, name, email, subscription').eq('id', params.id).maybeSingle(),
      supabase.from('profiles').select('display_name, avatar_url, bio, markets_traded, hide_performance_stats').eq('user_id', params.id).maybeSingle(),
      supabase.from('feed_posts').select('id, body, market_tag, image_url, ai_summary, post_type, created_at').eq('user_id', params.id).eq('visibility', 'public').eq('is_hidden', false).order('created_at', { ascending: false }).limit(10),
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', params.id),
      supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', params.id),
      user ? supabase.from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', params.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    setProfileUser(userData as ProfileUser | null);
    setProfile(profileData as ProfileRow | null);
    setPosts(postResult.data || []);
    setFollowers(followerResult.count || 0);
    setFollowing(followingResult.count || 0);
    setIsFollowing(Boolean(ownFollowResult.data));
  };

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user?.id]);

  const toggleFollow = async () => {
    if (!supabase || !user || user.id === params.id) return;

    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', params.id);
    } else {
      await supabase.from('follows').upsert({ follower_id: user.id, following_id: params.id });
    }

    await loadProfile();
  };

  const displayName = profile?.display_name || profileUser?.name || profileUser?.email?.split('@')[0] || fallbackName;
  const subscription = profileUser?.subscription;
  const markets = profile?.markets_traded?.length ? profile.markets_traded.join(', ') : 'Markets not listed yet';
  const ownProfile = user?.id === params.id;

  return (
    <div className="min-h-screen bg-[#F7F9FC] px-4 py-8 text-[#111827]">
      <div className="mx-auto max-w-5xl">
        <CleanCard className="mb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <UserAvatar name={displayName} avatarUrl={profile?.avatar_url} className="h-24 w-24 text-3xl font-extrabold" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-2xl font-extrabold tracking-[-0.04em] text-[#111827] sm:text-3xl">{displayName}</h1>
                    <VerifiedBadge subscription={subscription} size="md" />
                  </div>
                  {isVerifiedTrader(subscription) ? <p className="mt-1 text-sm font-bold text-[#2563EB]">Verified trader</p> : null}
                  <p className="mt-2 text-sm leading-6 text-[#6B7280]">{markets}</p>
                  {profile?.bio ? <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4B5563]">{profile.bio}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!ownProfile && user ? (
                    <CleanButton onClick={toggleFollow} variant={isFollowing ? 'secondary' : 'primary'}>
                      {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      {isFollowing ? 'Following' : 'Follow'}
                    </CleanButton>
                  ) : null}
                  {!ownProfile ? (
                    <CleanButton href={`/dashboard/messages?userId=${encodeURIComponent(params.id)}`} variant="secondary">
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </CleanButton>
                  ) : (
                    <CleanButton href="/dashboard/settings" variant="secondary">Edit profile</CleanButton>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CleanCard>
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <CleanStatCard label="Followers" value={followers.toLocaleString()} />
          <CleanStatCard label="Following" value={following.toLocaleString()} />
          <CleanStatCard label="Shared Posts" value={posts.length.toLocaleString()} />
        </div>
        <div className="space-y-5">
          {posts.length === 0 ? (
            <CleanCard><p className="text-sm text-[#6B7280]">No public posts yet.</p></CleanCard>
          ) : posts.map((post) => (
            <FeedPostCard
              key={post.id}
              authorId={params.id}
              author={displayName}
              authorAvatar={profile?.avatar_url}
              authorSubscription={subscription}
              market={post.market_tag || post.post_type}
              summary={post.ai_summary || post.body}
              image={post.image_url || undefined}
              timeLabel={relativeTime(post.created_at)}
            />
          ))}
        </div>
        <div className="mt-6">
          <Link href="/dashboard/feed" className="text-sm font-bold text-[#2563EB]">Back to Feed</Link>
        </div>
      </div>
    </div>
  );
}
