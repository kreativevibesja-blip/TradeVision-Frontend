'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Loader2, Pin, Send, Shield } from 'lucide-react';
import { CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { UserAvatar } from '@/components/UserAvatar';
import Link from 'next/link';

type Channel = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

type Message = {
  id: string;
  channel_id: string;
  user_id: string;
  body: string;
  image_url: string | null;
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

const fallbackChannels = ['General', 'Forex', 'Gold', 'Crypto', 'Indices', 'Synthetic Indices', 'Beginners', 'Trade Reviews', 'Platform Help'];

const timeLabel = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function CommunityPage() {
  const { user, loading: authLoading } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfilePreview>>({});
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [mobileRoomOpen, setMobileRoomOpen] = useState(false);
  const [readTimestamps, setReadTimestamps] = useState<Record<string, string>>({});
  const [latestActivity, setLatestActivity] = useState<Record<string, string>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedChannel = channels.find((item) => item.id === selectedChannelId);
  const readStorageKey = user?.id ? `tradevision:community:last_read:${user.id}` : '';

  const markChannelRead = useCallback((channelId: string) => {
    const readAt = new Date().toISOString();
    setReadTimestamps((current) => {
      return { ...current, [channelId]: readAt };
    });
    if (typeof window !== 'undefined' && readStorageKey) {
      const current = JSON.parse(window.localStorage.getItem(readStorageKey) || '{}');
      const next = { ...(current && typeof current === 'object' ? current : {}), [channelId]: readAt };
      window.localStorage.setItem(readStorageKey, JSON.stringify(next));
    }
    setUnreadCounts((current) => ({ ...current, [channelId]: 0 }));
  }, [readStorageKey]);

  const authorName = useCallback((userId: string) => {
    const profile = profiles[userId];
    if (userId === user?.id) return profile?.display_name || user.name || user.email.split('@')[0] || 'You';
    return profile?.display_name || profile?.name || profile?.email?.split('@')[0] || 'Trader';
  }, [profiles, user]);

  const loadProfiles = useCallback(async (rows: Message[]) => {
    if (!supabase || rows.length === 0) return;
    const ids = Array.from(new Set(rows.map((row) => row.user_id)));
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

    setProfiles((current) => ({
      ...current,
      ...(data || []).reduce<Record<string, ProfilePreview>>((acc, profile) => {
        const profileMeta = profileByUserId.get(profile.id);
        acc[profile.id] = {
          ...profile,
          display_name: profileMeta?.display_name ?? null,
          avatar_url: profileMeta?.avatar_url ?? null,
        };
        return acc;
      }, {}),
    }));
  }, []);

  const loadChannels = useCallback(async () => {
    if (!supabase) {
      setError('Community channels are not available right now.');
      return;
    }

    const { data, error: channelError } = await supabase
      .from('community_channels')
      .select('id, slug, name, description')
      .order('sort_order', { ascending: true });

    if (channelError) {
      setError(channelError.message);
      return;
    }

    const rows = data || [];
    setChannels(rows);
  }, []);

  const loadChannelBadges = useCallback(async (channelRows = channels, readRows = readTimestamps) => {
    if (!supabase || channelRows.length === 0) return;
    const supabaseClient = supabase;

    const nextActivity: Record<string, string> = {};
    const nextUnread: Record<string, number> = {};

    await Promise.all(channelRows.map(async (channel) => {
      const latestQuery = supabaseClient
        .from('community_messages')
        .select('id, created_at')
        .eq('channel_id', channel.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: latestRows } = await latestQuery;
      const latest = latestRows?.[0]?.created_at as string | undefined;
      if (latest) nextActivity[channel.id] = latest;

      let countQuery = supabaseClient
        .from('community_messages')
        .select('id', { count: 'exact', head: true })
        .eq('channel_id', channel.id)
        .eq('is_deleted', false);

      if (readRows[channel.id]) {
        countQuery = countQuery.gt('created_at', readRows[channel.id]);
      }

      const { count } = await countQuery;
      nextUnread[channel.id] = count || 0;
    }));

    setLatestActivity(nextActivity);
    setUnreadCounts(nextUnread);
  }, [channels, readTimestamps]);

  const loadMessages = useCallback(async (channelId: string, options: { showLoader?: boolean } = {}) => {
    if (!supabase || !channelId) return;
    const showLoader = options.showLoader ?? false;
    if (showLoader) {
      setLoadingMessages(true);
    }
    setError('');

    const { data, error: messageError } = await supabase
      .from('community_messages')
      .select('id, channel_id, user_id, body, image_url, created_at')
      .eq('channel_id', channelId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(30);

    if (messageError) {
      setError(messageError.message);
      setMessages([]);
    } else {
      const rows = (data || []).reverse();
      setMessages(rows);
      await loadProfiles(rows);
      markChannelRead(channelId);
    }

    if (showLoader) {
      setLoadingMessages(false);
    }
  }, [loadProfiles, markChannelRead]);

  useEffect(() => {
    if (!readStorageKey || typeof window === 'undefined') return;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(readStorageKey) || '{}');
      setReadTimestamps(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setReadTimestamps({});
    }
  }, [readStorageKey]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    if (channels.length === 0) return;
    void loadChannelBadges(channels, readTimestamps);
    const poll = window.setInterval(() => {
      void loadChannelBadges(channels, readTimestamps);
    }, 15000);
    return () => window.clearInterval(poll);
  }, [channels, loadChannelBadges, readTimestamps]);

  useEffect(() => {
    if (!selectedChannelId) return;
    void loadMessages(selectedChannelId, { showLoader: true });
    const poll = window.setInterval(() => {
      void loadMessages(selectedChannelId);
    }, 15000);
    return () => window.clearInterval(poll);
  }, [loadMessages, selectedChannelId]);

  const sendMessage = async () => {
    if (!supabase || !user || !selectedChannelId || (!draft.trim() && !attachment)) return;
    setSending(true);
    setError('');

    let imageUrl: string | null = null;
    if (attachment) {
      try {
        const uploaded = await api.uploadAttachment(attachment, 'community');
        imageUrl = uploaded.imageUrl;
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : 'Attachment upload failed.');
        setSending(false);
        return;
      }
    }

    const { error: sendError } = await supabase.from('community_messages').insert({
      channel_id: selectedChannelId,
      user_id: user.id,
      body: draft.trim() || 'Shared an image.',
      image_url: imageUrl,
    });

    if (sendError) {
      setError(sendError.message);
    } else {
      setDraft('');
      setAttachment(null);
      await loadMessages(selectedChannelId);
      await loadChannelBadges();
    }

    setSending(false);
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Community" subtitle="Sign in to join TradeVision trading rooms." />
        <CleanCard><p className="text-sm text-[#6B7280]">Community messages are available to authenticated users.</p></CleanCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Community" subtitle="Trading rooms for discussion, analysis sharing, mentoring, and platform support." />
      <div className="grid h-[calc(100svh-13rem)] min-h-[34rem] gap-5 overflow-hidden lg:grid-cols-[15rem_minmax(0,1fr)_18rem]">
        <CleanCard className={`${mobileRoomOpen ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col p-3`}>
          <p className="px-2 pb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6B7280]">Channels</p>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {channels.length > 0 ? channels.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedChannelId(item.id);
                  setMobileRoomOpen(true);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold ${selectedChannelId === item.id ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#4B5563] hover:bg-[#F7F9FC]'}`}
              >
                <span className="min-w-0 flex-1 truncate"># {item.name}</span>
                {(unreadCounts[item.id] || 0) > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[10px] font-extrabold text-white">
                    {unreadCounts[item.id] > 99 ? '99+' : unreadCounts[item.id]}
                  </span>
                ) : latestActivity[item.id] ? (
                  <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                ) : null}
              </button>
            )) : fallbackChannels.map((item) => (
              <div key={item} className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-bold text-[#9CA3AF]"># {item}</div>
            ))}
          </div>
        </CleanCard>

        <CleanCard className={`${mobileRoomOpen ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col p-0`}>
          <div className="flex items-center gap-3 border-b border-[#E5E7EB] p-5">
            <button
              type="button"
              onClick={() => setMobileRoomOpen(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] text-[#111827] lg:hidden"
              aria-label="Back to channels"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h2 className="truncate font-extrabold text-[#111827]"># {selectedChannel?.name || 'Community'}</h2>
              <p className="text-sm text-[#6B7280]">{selectedChannel?.description || 'Latest 30 messages with controlled polling.'}</p>
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {!selectedChannelId ? (
              <p className="text-sm text-[#6B7280]">Select a channel to start reading.</p>
            ) : loadingMessages ? (
              <p className="text-sm text-[#6B7280]">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-[#6B7280]">No messages yet. Start the room conversation.</p>
            ) : messages.map((message) => {
              const name = authorName(message.user_id);
              return (
                <div key={message.id} className="flex gap-3">
                  <Link href={`/profile/${encodeURIComponent(message.user_id)}`}>
                    <UserAvatar name={name} avatarUrl={profiles[message.user_id]?.avatar_url} className="h-10 w-10 text-sm font-extrabold" />
                  </Link>
                  <div className="max-w-[min(42rem,100%)] rounded-2xl bg-[#F7F9FC] px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/profile/${encodeURIComponent(message.user_id)}`} className="flex items-center gap-1 text-sm font-extrabold text-[#111827] hover:text-[#2563EB]">
                        {name}
                        <VerifiedBadge subscription={message.user_id === user?.id ? user.subscription : profiles[message.user_id]?.subscription} size="xs" />
                      </Link>
                      <span className="text-xs text-[#9CA3AF]">{timeLabel(message.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#4B5563]">{message.body}</p>
                    {message.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={message.image_url} alt="Community attachment" className="mt-3 max-h-72 rounded-xl border border-[#E5E7EB] object-contain" loading="lazy" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-[#E5E7EB] p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
            />
            {attachment ? (
              <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-2 text-sm text-[#1D4ED8]">
                <span className="min-w-0 truncate">{attachment.name}</span>
                <button type="button" onClick={() => setAttachment(null)} className="font-extrabold text-[#2563EB]">Remove</button>
              </div>
            ) : null}
            <div className="flex gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-[#E5E7EB] px-3 text-[#6B7280]" aria-label="Attach image"><ImagePlus className="h-4 w-4" /></button>
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                className="h-11 min-w-0 flex-1 rounded-xl border border-[#E5E7EB] px-4 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#2563EB]"
                placeholder={`Message #${selectedChannel?.name || 'community'}`}
              />
              <CleanButton onClick={sendMessage} className={(!draft.trim() && !attachment) || sending ? 'pointer-events-none opacity-60' : ''}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </CleanButton>
            </div>
            {error ? <p className="mt-3 text-sm font-semibold text-[#EF4444]">{error}</p> : null}
          </div>
        </CleanCard>

        <aside className={`${mobileRoomOpen ? 'hidden lg:block' : 'hidden lg:block'} min-h-0 space-y-5 overflow-y-auto pr-1`}>
          <CleanCard>
            <h2 className="font-extrabold text-[#111827]">Members</h2>
            <div className="mt-4 space-y-3 text-sm text-[#4B5563]">
              {Object.values(profiles).slice(0, 6).map((profile) => (
                <p key={profile.id} className="flex items-center gap-1">
                  <Link href={`/profile/${encodeURIComponent(profile.id)}`} className="hover:text-[#2563EB]">{profile.display_name || profile.name || profile.email.split('@')[0]}</Link>
                  <VerifiedBadge subscription={profile.subscription} size="xs" />
                </p>
              ))}
              {Object.keys(profiles).length === 0 ? <p>Members appear as messages load.</p> : null}
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
