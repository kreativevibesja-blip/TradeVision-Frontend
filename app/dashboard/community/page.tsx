'use client';

import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Loader2, Pin, Send, Shield } from 'lucide-react';
import { CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  created_at: string;
};

type ProfilePreview = {
  user_id: string;
  display_name: string | null;
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
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const selectedChannel = channels.find((item) => item.id === selectedChannelId);

  const authorName = useCallback((userId: string) => {
    if (userId === user?.id) return user.name || user.email.split('@')[0] || 'You';
    return profiles[userId]?.display_name || `Trader ${userId.slice(0, 6)}`;
  }, [profiles, user]);

  const loadProfiles = useCallback(async (rows: Message[]) => {
    if (!supabase || rows.length === 0) return;
    const ids = Array.from(new Set(rows.map((row) => row.user_id))).filter((id) => !profiles[id]);
    if (ids.length === 0) return;

    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', ids);

    setProfiles((current) => ({
      ...current,
      ...(data || []).reduce<Record<string, ProfilePreview>>((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {}),
    }));
  }, [profiles]);

  const loadChannels = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured for community channels.');
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
    setSelectedChannelId((current) => current || rows[0]?.id || '');
  }, []);

  const loadMessages = useCallback(async (channelId: string) => {
    if (!supabase || !channelId) return;
    setLoadingMessages(true);
    setError('');

    const { data, error: messageError } = await supabase
      .from('community_messages')
      .select('id, channel_id, user_id, body, created_at')
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
    }

    setLoadingMessages(false);
  }, [loadProfiles]);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    if (!selectedChannelId) return;
    void loadMessages(selectedChannelId);
    const poll = window.setInterval(() => {
      void loadMessages(selectedChannelId);
    }, 15000);
    return () => window.clearInterval(poll);
  }, [loadMessages, selectedChannelId]);

  const sendMessage = async () => {
    if (!supabase || !user || !selectedChannelId || !draft.trim()) return;
    setSending(true);
    setError('');

    const { error: sendError } = await supabase.from('community_messages').insert({
      channel_id: selectedChannelId,
      user_id: user.id,
      body: draft.trim(),
    });

    if (sendError) {
      setError(sendError.message);
    } else {
      setDraft('');
      await loadMessages(selectedChannelId);
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
      <div className="grid min-h-[70vh] gap-5 lg:grid-cols-[15rem_minmax(0,1fr)_18rem]">
        <CleanCard className="p-3">
          <p className="px-2 pb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[#6B7280]">Channels</p>
          <div className="space-y-1">
            {channels.length > 0 ? channels.map((item) => (
              <button key={item.id} onClick={() => setSelectedChannelId(item.id)} className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-bold ${selectedChannelId === item.id ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#4B5563] hover:bg-[#F7F9FC]'}`}>
                # {item.name}
              </button>
            )) : fallbackChannels.map((item) => (
              <div key={item} className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-bold text-[#9CA3AF]"># {item}</div>
            ))}
          </div>
        </CleanCard>

        <CleanCard className="flex flex-col p-0">
          <div className="border-b border-[#E5E7EB] p-5">
            <h2 className="font-extrabold text-[#111827]"># {selectedChannel?.name || 'Community'}</h2>
            <p className="text-sm text-[#6B7280]">{selectedChannel?.description || 'Latest 30 messages with controlled polling.'}</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {loadingMessages ? (
              <p className="text-sm text-[#6B7280]">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-[#6B7280]">No messages yet. Start the room conversation.</p>
            ) : messages.map((message) => {
              const name = authorName(message.user_id);
              return (
                <div key={message.id} className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-sm font-extrabold text-[#2563EB]">{name[0]}</div>
                  <div className="max-w-[min(42rem,100%)] rounded-2xl bg-[#F7F9FC] px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-[#111827]">{name}</p>
                      <span className="text-xs text-[#9CA3AF]">{timeLabel(message.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[#4B5563]">{message.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-[#E5E7EB] p-4">
            <div className="flex gap-2">
              <button type="button" className="rounded-xl border border-[#E5E7EB] px-3 text-[#6B7280]"><ImagePlus className="h-4 w-4" /></button>
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
              <CleanButton onClick={sendMessage} className={!draft.trim() || sending ? 'pointer-events-none opacity-60' : ''}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </CleanButton>
            </div>
            {error ? <p className="mt-3 text-sm font-semibold text-[#EF4444]">{error}</p> : null}
          </div>
        </CleanCard>

        <aside className="space-y-5">
          <CleanCard>
            <h2 className="font-extrabold text-[#111827]">Members</h2>
            <div className="mt-4 space-y-3 text-sm text-[#4B5563]">
              {Object.values(profiles).slice(0, 6).map((profile) => (
                <p key={profile.user_id}>{profile.display_name || `Trader ${profile.user_id.slice(0, 6)}`}</p>
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
