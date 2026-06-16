'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, MessageSquarePlus, Search, Send, ShieldAlert } from 'lucide-react';
import { CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { VerifiedBadge } from '@/components/VerifiedBadge';

type Conversation = {
  id: string;
  participant_key: string;
  created_by: string;
  updated_at: string;
  last_read_at?: string | null;
  unread_count?: number;
};

type DirectMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type UserSuggestion = {
  id: string;
  name: string | null;
  email: string;
  subscription?: string | null;
};

type UserPreview = {
  id: string;
  name: string | null;
  email: string;
  subscription?: string | null;
};

const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const otherParticipant = (participantKey: string, currentUserId: string) => {
  const ids = participantKey.split(':');
  return ids.find((id) => id !== currentUserId) || currentUserId;
};

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [draft, setDraft] = useState('');
  const [userPreviews, setUserPreviews] = useState<Record<string, UserPreview>>({});
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId);

  const displayName = useCallback((userId: string) => {
    if (userId === user?.id) return user.name || user.email.split('@')[0] || 'You';
    const preview = userPreviews[userId];
    return preview?.name || preview?.email?.split('@')[0] || 'Trader';
  }, [user, userPreviews]);

  const selectedName = useMemo(() => {
    if (!user || !selectedConversation) return 'Select a conversation';
    const id = otherParticipant(selectedConversation.participant_key, user.id);
    return id === user.id ? 'Saved notes' : displayName(id);
  }, [displayName, selectedConversation, user]);

  const selectedSubscription = useMemo(() => {
    if (!user || !selectedConversation) return null;
    const id = otherParticipant(selectedConversation.participant_key, user.id);
    return id === user.id ? user.subscription : userPreviews[id]?.subscription;
  }, [selectedConversation, user, userPreviews]);

  const loadUserPreviews = useCallback(async (ids: string[]) => {
    if (!supabase || ids.length === 0) return;
    const missing = Array.from(new Set(ids)).filter((id) => id && id !== user?.id);
    if (missing.length === 0) return;

    const { data } = await supabase
      .from('User')
      .select('id, name, email, subscription')
      .in('id', missing);

    setUserPreviews((current) => ({
      ...current,
      ...(data || []).reduce<Record<string, UserPreview>>((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {}),
    }));
  }, [user?.id]);

  const loadConversations = useCallback(async () => {
    if (!supabase || !user) return;
    const supabaseClient = supabase;
    setLoadingConversations(true);
    setError('');

    const { data, error: conversationsError } = await supabase
      .from('direct_conversation_participants')
      .select('conversation_id, last_read_at, direct_conversations(id, participant_key, created_by, updated_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (conversationsError) {
      setError(conversationsError.message);
      setConversations([]);
    } else {
      const rows = ((data || [])
        .map((row) => {
          const conversation = row.direct_conversations as unknown as Conversation | null;
          return conversation ? { ...conversation, last_read_at: row.last_read_at ?? null } : null;
        })
        .filter(Boolean) as Conversation[]);

      await loadUserPreviews(rows.map((conversation) => otherParticipant(conversation.participant_key, user.id)));

      const rowsWithUnread = await Promise.all(rows.map(async (conversation) => {
        let query = supabaseClient
          .from('direct_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .neq('sender_id', user.id)
          .eq('is_deleted', false);

        if (conversation.last_read_at) {
          query = query.gt('created_at', conversation.last_read_at);
        }

        const { count } = await query;
        return { ...conversation, unread_count: count || 0 };
      }));

      rowsWithUnread.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setConversations(rowsWithUnread);
    }

    setLoadingConversations(false);
  }, [loadUserPreviews, user]);

  const loadMessages = useCallback(async (conversationId: string, options: { showLoader?: boolean; markRead?: boolean } = {}) => {
    if (!supabase || !conversationId) return;
    const showLoader = options.showLoader ?? false;
    if (showLoader) setLoadingMessages(true);
    setError('');

    const { data, error: messagesError } = await supabase
      .from('direct_messages')
      .select('id, conversation_id, sender_id, body, created_at')
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(50);

    if (messagesError) {
      setError(messagesError.message);
      setMessages([]);
    } else {
      setMessages(data || []);
      if (options.markRead && user) {
        const readAt = new Date().toISOString();
        await supabase
          .from('direct_conversation_participants')
          .update({ last_read_at: readAt })
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id);
        setConversations((current) => current.map((conversation) => (
          conversation.id === conversationId ? { ...conversation, last_read_at: readAt, unread_count: 0 } : conversation
        )));
      }
    }

    if (showLoader) setLoadingMessages(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadConversations();
  }, [loadConversations, user]);

  useEffect(() => {
    if (!selectedConversationId) return;
    void loadMessages(selectedConversationId, { showLoader: true, markRead: true });
    const poll = window.setInterval(() => {
      void loadMessages(selectedConversationId);
    }, 15000);
    return () => window.clearInterval(poll);
  }, [loadMessages, selectedConversationId]);

  useEffect(() => {
    if (!supabase || !user) return;
    const supabaseClient = supabase;

    const query = userSearch.trim();
    if (query.length < 2 || targetUserId) {
      setUserSuggestions([]);
      setSearchingUsers(false);
      return;
    }

    let active = true;
    setSearchingUsers(true);

    const timer = window.setTimeout(async () => {
      const safeQuery = query.replace(/[%_,]/g, '');
      const { data, error: searchError } = await supabaseClient
        .from('User')
        .select('id, name, email, subscription')
        .or(`name.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%`)
        .neq('id', user.id)
        .limit(6);

      if (!active) return;
      if (searchError) {
        setError(searchError.message);
        setUserSuggestions([]);
      } else {
        setUserSuggestions(data || []);
      }
      setSearchingUsers(false);
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [targetUserId, user, userSearch]);

  const startConversation = async (selectedUserId = targetUserId) => {
    if (!supabase || !user || !selectedUserId.trim()) return;
    const otherUserId = selectedUserId.trim();
    if (otherUserId === user.id) return;
    const participantKey = [user.id, otherUserId].sort().join(':');
    setError('');

    const { data: existingConversation, error: lookupError } = await supabase
      .from('direct_conversations')
      .select('id, participant_key, created_by, updated_at')
      .eq('participant_key', participantKey)
      .maybeSingle();

    if (lookupError) {
      setError(lookupError.message);
      return;
    }

    let conversation = existingConversation as Conversation | null;

    if (!conversation) {
      const { data: insertedConversation, error: conversationError } = await supabase
        .from('direct_conversations')
        .insert({ participant_key: participantKey, created_by: user.id })
        .select('id, participant_key, created_by, updated_at')
        .single();

      if (conversationError || !insertedConversation) {
        setError(conversationError?.message || 'Could not start conversation.');
        return;
      }

      conversation = insertedConversation;
    }

    const { error: participantsError } = await supabase.from('direct_conversation_participants').upsert([
      { conversation_id: conversation.id, user_id: user.id },
      { conversation_id: conversation.id, user_id: otherUserId },
    ]);

    if (participantsError) {
      setError(participantsError.message);
      return;
    }

    setTargetUserId('');
    setUserSearch('');
    setUserSuggestions([]);
    setSelectedConversationId(conversation.id);
    setMobileChatOpen(true);
    await loadConversations();
  };

  const sendMessage = async () => {
    if (!supabase || !user || !selectedConversationId || !draft.trim()) return;
    setSending(true);
    setError('');

    const { error: sendError } = await supabase.from('direct_messages').insert({
      conversation_id: selectedConversationId,
      sender_id: user.id,
      body: draft.trim(),
    });

    if (sendError) {
      setError(sendError.message);
    } else {
      await supabase.from('direct_conversations').update({ updated_at: new Date().toISOString() }).eq('id', selectedConversationId);
      setDraft('');
      await loadMessages(selectedConversationId);
      await loadConversations();
    }

    setSending(false);
  };

  if (!authLoading && !user) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Messages" subtitle="Sign in to send direct messages and share analysis privately." />
        <CleanCard><p className="text-sm text-[#6B7280]">Messages are private to conversation participants.</p></CleanCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Messages" subtitle="Direct messages, shared analyses, setup discussion, block, and report controls." />
      <div className="grid h-[calc(100svh-13rem)] min-h-[34rem] gap-5 overflow-hidden lg:grid-cols-[18rem_minmax(0,1fr)]">
        <CleanCard className={`${mobileChatOpen ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col p-3`}>
          <div className="mb-3 space-y-2 rounded-xl bg-[#F7F9FC] p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                value={userSearch}
                onChange={(event) => {
                  setUserSearch(event.target.value);
                  setTargetUserId('');
                }}
                placeholder="Search users by name or email"
                className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#2563EB]"
              />
            </div>
            {userSuggestions.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                {userSuggestions.map((suggestion) => {
                  const label = suggestion.name || suggestion.email.split('@')[0] || 'Trader';
                  return (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => {
                        setUserSearch(label);
                        setTargetUserId(suggestion.id);
                        void startConversation(suggestion.id);
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#F7F9FC]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-xs font-extrabold text-[#2563EB]">{label[0]}</div>
                      <div className="min-w-0">
                        <p className="flex min-w-0 items-center gap-1 truncate text-sm font-bold text-[#111827]">
                          <span className="truncate">{label}</span>
                          <VerifiedBadge subscription={suggestion.subscription} size="xs" />
                        </p>
                        <p className="truncate text-xs text-[#6B7280]">{suggestion.email}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : userSearch.trim().length >= 2 && !targetUserId && !searchingUsers ? (
              <p className="px-1 text-xs text-[#6B7280]">No matching users found.</p>
            ) : null}
            <CleanButton onClick={() => startConversation()} className={!targetUserId.trim() ? 'pointer-events-none w-full opacity-60' : 'w-full'}>
              {searchingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
              {targetUserId ? 'Open chat' : 'Select a user'}
            </CleanButton>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {loadingConversations ? <p className="p-3 text-sm text-[#6B7280]">Loading conversations...</p> : null}
            {conversations.length === 0 && !loadingConversations ? <p className="p-3 text-sm text-[#6B7280]">No conversations yet.</p> : null}
            {conversations.map((conversation) => {
              const otherId = user ? otherParticipant(conversation.participant_key, user.id) : '';
              const active = conversation.id === selectedConversationId;
              const label = otherId === user?.id ? 'Saved notes' : displayName(otherId);
              return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversationId(conversation.id);
                    setMobileChatOpen(true);
                  }}
                  className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left ${active ? 'bg-[#EFF6FF]' : 'hover:bg-[#F7F9FC]'}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] font-extrabold text-[#2563EB]">{label.slice(0, 1).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <p className="flex min-w-0 items-center gap-1 truncate text-sm font-extrabold text-[#111827]">
                      <span className="truncate">{label}</span>
                      <VerifiedBadge subscription={otherId === user?.id ? user?.subscription : userPreviews[otherId]?.subscription} size="xs" />
                    </p>
                    <p className="text-xs text-[#6B7280]">{new Date(conversation.updated_at).toLocaleDateString()}</p>
                  </div>
                  {(conversation.unread_count || 0) > 0 ? (
                    <span className="rounded-full bg-[#2563EB] px-2 py-0.5 text-xs font-extrabold text-white">{conversation.unread_count}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </CleanCard>
        <CleanCard className={`${mobileChatOpen ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col p-0`}>
          <div className="flex items-center gap-3 border-b border-[#E5E7EB] p-5">
            <button
              type="button"
              onClick={() => setMobileChatOpen(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] text-[#111827] lg:hidden"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h2 className="flex min-w-0 items-center gap-2 font-extrabold text-[#111827]">
                <span className="truncate">{selectedName}</span>
                <VerifiedBadge subscription={selectedSubscription} />
              </h2>
              <p className="text-sm text-[#6B7280]">Private conversation history.</p>
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
            {!selectedConversationId ? (
              <p className="text-sm text-[#6B7280]">Select or start a conversation.</p>
            ) : loadingMessages ? (
              <p className="text-sm text-[#6B7280]">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-[#6B7280]">No messages yet. Send the first one.</p>
            ) : messages.map((message) => {
              const own = message.sender_id === user?.id;
              return (
                <div key={message.id} className={`${own ? 'ml-auto bg-[#2563EB] text-white' : 'bg-[#F7F9FC] text-[#4B5563]'} max-w-[75%] rounded-2xl p-4 text-sm`}>
                  <p className="whitespace-pre-wrap break-words leading-6">{message.body}</p>
                  <p className={`mt-2 text-xs ${own ? 'text-white/70' : 'text-[#9CA3AF]'}`}>{formatTime(message.created_at)}</p>
                </div>
              );
            })}
          </div>
          <div className="border-t border-[#E5E7EB] p-4">
            <div className="flex gap-2">
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
                placeholder="Write a message..."
              />
              <CleanButton onClick={sendMessage} className={!selectedConversationId || !draft.trim() || sending ? 'pointer-events-none opacity-60' : ''}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </CleanButton>
              <CleanButton variant="secondary"><ShieldAlert className="h-4 w-4" />Report</CleanButton>
            </div>
            {error ? <p className="mt-3 text-sm font-semibold text-[#EF4444]">{error}</p> : null}
          </div>
        </CleanCard>
      </div>
    </div>
  );
}
