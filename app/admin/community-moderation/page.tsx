'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { CleanBadge, CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';
import { supabase } from '@/lib/supabase/client';

type ReportRow = {
  id: string;
  message_id: string;
  reporter_id: string;
  reason: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
};

type MessageRow = {
  id: string;
  channel_id: string;
  user_id: string;
  body: string;
  is_deleted: boolean;
  created_at: string;
};

type ChannelRow = { id: string; name: string; slug: string };
type UserRow = { id: string; name: string | null; email: string };

const statusTone = (status: ReportRow['status']) => status === 'open' ? 'red' : status === 'reviewing' ? 'amber' : status === 'resolved' ? 'green' : 'gray';
const relativeTime = (value: string) => {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function AdminCommunityModerationPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [messages, setMessages] = useState<Record<string, MessageRow>>({});
  const [channels, setChannels] = useState<Record<string, ChannelRow>>({});
  const [users, setUsers] = useState<Record<string, UserRow>>({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState('');
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const loadReports = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    let query = supabase
      .from('community_reports')
      .select('id, message_id, reporter_id, reason, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter === 'active') query = query.in('status', ['open', 'reviewing']);

    const { data } = await query;
    const rows = (data || []) as ReportRow[];
    setReports(rows);

    const messageIds = Array.from(new Set(rows.map((row) => row.message_id)));
    if (!messageIds.length) {
      setMessages({});
      setChannels({});
      setUsers({});
      setLoading(false);
      return;
    }

    const { data: messageRows } = await supabase
      .from('community_messages')
      .select('id, channel_id, user_id, body, is_deleted, created_at')
      .in('id', messageIds);
    const messageMap = ((messageRows || []) as MessageRow[]).reduce<Record<string, MessageRow>>((acc, message) => {
      acc[message.id] = message;
      return acc;
    }, {});
    setMessages(messageMap);

    const channelIds = Array.from(new Set(Object.values(messageMap).map((message) => message.channel_id)));
    if (channelIds.length) {
      const { data: channelRows } = await supabase.from('community_channels').select('id, name, slug').in('id', channelIds);
      setChannels(((channelRows || []) as ChannelRow[]).reduce<Record<string, ChannelRow>>((acc, channel) => {
        acc[channel.id] = channel;
        return acc;
      }, {}));
    }

    const userIds = Array.from(new Set([...rows.map((row) => row.reporter_id), ...Object.values(messageMap).map((message) => message.user_id)]));
    if (userIds.length) {
      const { data: userRows } = await supabase.from('User').select('id, name, email').in('id', userIds);
      setUsers(((userRows || []) as UserRow[]).reduce<Record<string, UserRow>>((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {}));
    }

    setLoading(false);
  }, [filter]);

  useEffect(() => {
    void loadReports();
    const interval = window.setInterval(() => void loadReports(), 30000);
    return () => window.clearInterval(interval);
  }, [loadReports]);

  const activeCount = useMemo(() => reports.filter((report) => report.status === 'open' || report.status === 'reviewing').length, [reports]);

  const updateReport = async (id: string, status: ReportRow['status']) => {
    if (!supabase) return;
    setWorkingId(id);
    await supabase.from('community_reports').update({ status }).eq('id', id);
    await loadReports();
    setWorkingId('');
  };

  const setMessageDeleted = async (messageId: string, deleted: boolean) => {
    if (!supabase) return;
    setWorkingId(messageId);
    await supabase.from('community_messages').update({ is_deleted: deleted }).eq('id', messageId);
    await loadReports();
    setWorkingId('');
  };

  const userLabel = (id: string) => users[id]?.name || users[id]?.email?.split('@')[0] || 'Unknown user';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Community Moderation"
        subtitle="Live reported and auto-flagged community messages. Open reports generate the sidebar counter badge."
        action={<CleanButton onClick={() => void loadReports()}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Refresh</CleanButton>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <CleanCard><p className="text-sm text-[#6B7280]">Active reports</p><p className="mt-2 text-3xl font-extrabold text-[#111827]">{activeCount}</p></CleanCard>
        <CleanCard><p className="text-sm text-[#6B7280]">Loaded reports</p><p className="mt-2 text-3xl font-extrabold text-[#111827]">{reports.length}</p></CleanCard>
        <CleanCard>
          <p className="text-sm text-[#6B7280]">View</p>
          <div className="mt-3 flex gap-2">
            {(['active', 'all'] as const).map((mode) => (
              <button key={mode} onClick={() => setFilter(mode)} className={`rounded-xl px-3 py-2 text-sm font-bold ${filter === mode ? 'bg-[#2563EB] text-white' : 'bg-[#F7F9FC] text-[#6B7280]'}`}>{mode}</button>
            ))}
          </div>
        </CleanCard>
      </div>

      <CleanCard>
        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading community reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No community reports in this view.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const message = messages[report.message_id];
              const channel = message ? channels[message.channel_id] : null;
              const busy = workingId === report.id || workingId === report.message_id;
              return (
                <article key={report.id} className="rounded-2xl border border-[#E5E7EB] bg-[#F7F9FC] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
                        <CleanBadge tone={statusTone(report.status)}>{report.status}</CleanBadge>
                        {message?.is_deleted ? <CleanBadge tone="gray">deleted</CleanBadge> : null}
                        <span className="text-xs font-semibold text-[#6B7280]">{relativeTime(report.created_at)}</span>
                      </div>
                      <p className="mt-3 text-sm font-extrabold text-[#111827]">{report.reason}</p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#4B5563]">{message?.body || 'Message was deleted or is unavailable.'}</p>
                      <p className="mt-2 text-xs text-[#6B7280]">Channel: #{channel?.name || 'Unknown'} · Author: {message ? userLabel(message.user_id) : 'Unknown'} · Reporter: {userLabel(report.reporter_id)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <CleanButton variant="secondary" onClick={() => updateReport(report.id, 'reviewing')} className={busy ? 'pointer-events-none opacity-60' : ''}>Review</CleanButton>
                      <CleanButton variant="secondary" onClick={() => updateReport(report.id, 'dismissed')} className={busy ? 'pointer-events-none opacity-60' : ''}>Dismiss</CleanButton>
                      <CleanButton onClick={() => updateReport(report.id, 'resolved')} className={busy ? 'pointer-events-none opacity-60' : ''}>Resolve</CleanButton>
                      {message ? <CleanButton variant="secondary" onClick={() => setMessageDeleted(message.id, !message.is_deleted)} className={busy ? 'pointer-events-none opacity-60' : ''}>{message.is_deleted ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}{message.is_deleted ? 'Restore' : 'Delete'}</CleanButton> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CleanCard>
    </div>
  );
}
