'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type StoredNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

type DirectConversationRow = {
  conversation_id: string;
  last_read_at: string | null;
  direct_conversations: {
    id: string;
    participant_key: string;
    updated_at: string;
  } | {
    id: string;
    participant_key: string;
    updated_at: string;
  }[] | null;
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
  source: 'notification' | 'message';
};

const relativeTime = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export function NotificationCenter({ userId }: { userId?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const initializedRef = useRef(false);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  const maybeShowBrowserNotification = useCallback((nextItems: NotificationItem[]) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

    const newestUnread = nextItems
      .filter((item) => !item.read)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    if (!newestUnread) return;

    const storageKey = `tradevision:last_browser_notification:${userId}`;
    const previous = window.localStorage.getItem(storageKey);
    const previousTime = previous ? new Date(previous).getTime() : 0;
    const nextTime = new Date(newestUnread.createdAt).getTime();

    if (!initializedRef.current) {
      initializedRef.current = true;
      window.localStorage.setItem(storageKey, newestUnread.createdAt);
      return;
    }

    if (nextTime <= previousTime) return;

    window.localStorage.setItem(storageKey, newestUnread.createdAt);
    const notification = new Notification(newestUnread.title, {
      body: newestUnread.body,
      tag: newestUnread.id,
    });
    notification.onclick = () => {
      window.focus();
      window.location.href = newestUnread.href;
    };
  }, [userId]);

  const loadNotifications = useCallback(async () => {
    if (!supabase || !userId) return;
    const supabaseClient = supabase;
    setLoading(true);

    const [{ data: notificationRows }, { data: conversationRows }] = await Promise.all([
      supabaseClient
        .from('notifications')
        .select('id, type, title, body, href, read_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabaseClient
        .from('direct_conversation_participants')
        .select('conversation_id, last_read_at, direct_conversations(id, participant_key, updated_at)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const messageItems = await Promise.all(((conversationRows || []) as unknown as DirectConversationRow[]).map(async (row) => {
      const conversation = Array.isArray(row.direct_conversations) ? row.direct_conversations[0] : row.direct_conversations;
      if (!conversation) return null;

      let query = supabaseClient
        .from('direct_messages')
        .select('id, body, created_at', { count: 'exact' })
        .eq('conversation_id', row.conversation_id)
        .neq('sender_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (row.last_read_at) query = query.gt('created_at', row.last_read_at);

      const { data, count } = await query;
      const latest = data?.[0];
      if (!latest || !count) return null;

      return {
        id: `message:${row.conversation_id}`,
        title: count === 1 ? 'New message' : `${count} new messages`,
        body: latest.body || 'Open your private messages.',
        href: '/dashboard/messages',
        read: false,
        createdAt: latest.created_at,
        source: 'message' as const,
      };
    }));

    const storedItems = ((notificationRows || []) as StoredNotification[]).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body || 'Open TradeVision to view the update.',
      href: row.href || '/dashboard',
      read: Boolean(row.read_at),
      createdAt: row.created_at,
      source: 'notification' as const,
    }));

    const nextItems = [...storedItems, ...messageItems.filter(Boolean) as NotificationItem[]]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    setItems(nextItems);
    maybeShowBrowserNotification(nextItems);
    setLoading(false);
  }, [maybeShowBrowserNotification, userId]);

  useEffect(() => {
    if (!userId) return;
    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 15000);
    return () => window.clearInterval(interval);
  }, [loadNotifications, userId]);

  const requestBrowserPermission = async () => {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    await Notification.requestPermission();
  };

  const markNotificationsRead = async () => {
    if (!supabase || !userId) return;
    const unreadNotificationIds = items
      .filter((item) => item.source === 'notification' && !item.read)
      .map((item) => item.id);

    if (unreadNotificationIds.length === 0) return;

    setMarkingRead(true);
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('id', unreadNotificationIds);
    await loadNotifications();
    setMarkingRead(false);
  };

  return (
    <div className="relative ml-auto">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          void requestBrowserPermission();
        }}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#2563EB]"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-extrabold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(17,24,39,0.16)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#111827]">Notifications</h2>
              <p className="text-xs text-[#6B7280]">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={markNotificationsRead}
              className={cn('flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[#2563EB] hover:bg-[#EFF6FF]', markingRead && 'pointer-events-none opacity-60')}
            >
              {markingRead ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
              Read
            </button>
          </div>
          <div className="max-h-[26rem] overflow-y-auto p-2">
            {loading && items.length === 0 ? (
              <div className="flex items-center gap-2 p-3 text-sm text-[#6B7280]"><Loader2 className="h-4 w-4 animate-spin" />Loading notifications...</div>
            ) : items.length === 0 ? (
              <p className="p-3 text-sm text-[#6B7280]">No notifications yet.</p>
            ) : items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn('mb-1 flex gap-3 rounded-xl p-3 text-left hover:bg-[#F7F9FC]', !item.read && 'bg-[#EFF6FF]')}
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#2563EB] shadow-sm">
                  {item.source === 'message' ? <MessageCircle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-[#111827]">{item.title}</p>
                  <p className="line-clamp-2 text-xs leading-5 text-[#6B7280]">{item.body}</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#9CA3AF]">{relativeTime(item.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
