'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, MessageSquarePlus, Send, ShieldAlert } from 'lucide-react';
import { CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type Conversation = {
  id: string;
  participant_key: string;
  created_by: string;
  updated_at: string;
};

type DirectMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
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
  const [targetUserId, setTargetUserId] = useState('');
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId);

  const selectedName = useMemo(() => {
    if (!user || !selectedConversation) return 'Select a conversation';
    const id = otherParticipant(selectedConversation.participant_key, user.id);
    return id === user.id ? 'Saved notes' : `Trader ${id.slice(0, 8)}`;
  }, [selectedConversation, user]);

  const loadConversations = useCallback(async () => {
    if (!supabase || !user) return;
    setLoadingConversations(true);
    setError('');

    const { data, error: conversationsError } = await supabase
      .from('direct_conversation_participants')
      .select('conversation_id, direct_conversations(id, participant_key, created_by, updated_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (conversationsError) {
      setError(conversationsError.message);
      setConversations([]);
    } else {
      const rows = (data || [])
        .map((row) => row.direct_conversations as unknown as Conversation | null)
        .filter(Boolean) as Conversation[];
      rows.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setConversations(rows);
      setSelectedConversationId((current) => current || rows[0]?.id || '');
    }

    setLoadingConversations(false);
  }, [user]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!supabase || !conversationId) return;
    setLoadingMessages(true);
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
    }

    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    void loadConversations();
  }, [loadConversations, user]);

  useEffect(() => {
    if (!selectedConversationId) return;
    void loadMessages(selectedConversationId);
    const poll = window.setInterval(() => {
      void loadMessages(selectedConversationId);
    }, 15000);
    return () => window.clearInterval(poll);
  }, [loadMessages, selectedConversationId]);

  const startConversation = async () => {
    if (!supabase || !user || !targetUserId.trim()) return;
    const otherUserId = targetUserId.trim();
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
    setSelectedConversationId(conversation.id);
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
      <div className="grid min-h-[68vh] gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <CleanCard className="p-3">
          <div className="mb-3 space-y-2 rounded-xl bg-[#F7F9FC] p-3">
            <input
              value={targetUserId}
              onChange={(event) => setTargetUserId(event.target.value)}
              placeholder="Start by user ID"
              className="h-10 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#2563EB]"
            />
            <CleanButton onClick={startConversation} className={!targetUserId.trim() ? 'pointer-events-none w-full opacity-60' : 'w-full'}>
              <MessageSquarePlus className="h-4 w-4" />New chat
            </CleanButton>
          </div>
          {loadingConversations ? <p className="p-3 text-sm text-[#6B7280]">Loading conversations...</p> : null}
          {conversations.length === 0 && !loadingConversations ? <p className="p-3 text-sm text-[#6B7280]">No conversations yet.</p> : null}
          {conversations.map((conversation) => {
            const otherId = user ? otherParticipant(conversation.participant_key, user.id) : '';
            const active = conversation.id === selectedConversationId;
            return (
              <button key={conversation.id} onClick={() => setSelectedConversationId(conversation.id)} className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left ${active ? 'bg-[#EFF6FF]' : 'hover:bg-[#F7F9FC]'}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] font-extrabold text-[#2563EB]">{otherId.slice(0, 1).toUpperCase()}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[#111827]">{otherId === user?.id ? 'Saved notes' : `Trader ${otherId.slice(0, 8)}`}</p>
                  <p className="text-xs text-[#6B7280]">{new Date(conversation.updated_at).toLocaleDateString()}</p>
                </div>
              </button>
            );
          })}
        </CleanCard>
        <CleanCard className="flex flex-col p-0">
          <div className="border-b border-[#E5E7EB] p-5">
            <h2 className="font-extrabold text-[#111827]">{selectedName}</h2>
            <p className="text-sm text-[#6B7280]">Private conversation records from Supabase.</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
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
