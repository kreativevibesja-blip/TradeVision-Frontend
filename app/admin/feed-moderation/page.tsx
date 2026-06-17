'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { CleanBadge, CleanButton, CleanCard, PageHeader } from '@/components/CleanBlue';
import { supabase } from '@/lib/supabase/client';

type ReportRow = {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
};

type PostRow = {
  id: string;
  user_id: string;
  body: string;
  market_tag: string | null;
  ai_summary: string | null;
  is_hidden: boolean;
  created_at: string;
};

type UserRow = {
  id: string;
  name: string | null;
  email: string;
};

const statusTone = (status: ReportRow['status']) => status === 'open' ? 'red' : status === 'reviewing' ? 'amber' : status === 'resolved' ? 'green' : 'gray';
const relativeTime = (value: string) => {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function AdminFeedModerationPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [posts, setPosts] = useState<Record<string, PostRow>>({});
  const [users, setUsers] = useState<Record<string, UserRow>>({});
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState('');
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const loadReports = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);

    let query = supabase
      .from('post_reports')
      .select('id, post_id, reporter_id, reason, status, created_at, resolved_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter === 'active') query = query.in('status', ['open', 'reviewing']);

    const { data } = await query;
    const rows = (data || []) as ReportRow[];
    setReports(rows);

    const postIds = Array.from(new Set(rows.map((row) => row.post_id)));
    if (postIds.length) {
      const { data: postRows } = await supabase
        .from('feed_posts')
        .select('id, user_id, body, market_tag, ai_summary, is_hidden, created_at')
        .in('id', postIds);
      const postMap = ((postRows || []) as PostRow[]).reduce<Record<string, PostRow>>((acc, post) => {
        acc[post.id] = post;
        return acc;
      }, {});
      setPosts(postMap);

      const userIds = Array.from(new Set([...rows.map((row) => row.reporter_id), ...Object.values(postMap).map((post) => post.user_id)]));
      if (userIds.length) {
        const { data: userRows } = await supabase.from('User').select('id, name, email').in('id', userIds);
        setUsers(((userRows || []) as UserRow[]).reduce<Record<string, UserRow>>((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {}));
      }
    } else {
      setPosts({});
      setUsers({});
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
    await supabase.from('post_reports').update({
      status,
      resolved_at: status === 'resolved' || status === 'dismissed' ? new Date().toISOString() : null,
    }).eq('id', id);
    await loadReports();
    setWorkingId('');
  };

  const hidePost = async (postId: string, hidden: boolean) => {
    if (!supabase) return;
    setWorkingId(postId);
    await supabase.from('feed_posts').update({ is_hidden: hidden }).eq('id', postId);
    await loadReports();
    setWorkingId('');
  };

  const deletePost = async (postId: string) => {
    if (!supabase) return;
    setWorkingId(postId);
    await supabase.from('feed_posts').delete().eq('id', postId);
    await loadReports();
    setWorkingId('');
  };

  const userLabel = (id: string) => users[id]?.name || users[id]?.email?.split('@')[0] || 'Unknown user';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feed Moderation"
        subtitle="Live reported and auto-flagged feed posts. Open reports generate the sidebar counter badge."
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
          <p className="text-sm text-[#6B7280]">Loading moderation reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No feed reports in this view.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const post = posts[report.post_id];
              const busy = workingId === report.id || workingId === report.post_id;
              return (
                <article key={report.id} className="rounded-2xl border border-[#E5E7EB] bg-[#F7F9FC] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
                        <CleanBadge tone={statusTone(report.status)}>{report.status}</CleanBadge>
                        {post?.is_hidden ? <CleanBadge tone="gray">hidden</CleanBadge> : null}
                        <span className="text-xs font-semibold text-[#6B7280]">{relativeTime(report.created_at)}</span>
                      </div>
                      <p className="mt-3 text-sm font-extrabold text-[#111827]">{report.reason}</p>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#4B5563]">{post?.ai_summary || post?.body || 'Post was deleted or is unavailable.'}</p>
                      <p className="mt-2 text-xs text-[#6B7280]">Author: {post ? userLabel(post.user_id) : 'Unknown'} · Reporter: {userLabel(report.reporter_id)} · {post?.market_tag || 'No market tag'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <CleanButton variant="secondary" onClick={() => updateReport(report.id, 'reviewing')} className={busy ? 'pointer-events-none opacity-60' : ''}>Review</CleanButton>
                      <CleanButton variant="secondary" onClick={() => updateReport(report.id, 'dismissed')} className={busy ? 'pointer-events-none opacity-60' : ''}>Dismiss</CleanButton>
                      <CleanButton onClick={() => updateReport(report.id, 'resolved')} className={busy ? 'pointer-events-none opacity-60' : ''}>Resolve</CleanButton>
                      {post ? <CleanButton variant="secondary" onClick={() => hidePost(post.id, !post.is_hidden)} className={busy ? 'pointer-events-none opacity-60' : ''}><EyeOff className="h-4 w-4" />{post.is_hidden ? 'Unhide' : 'Hide'}</CleanButton> : null}
                      {post ? <CleanButton variant="ghost" onClick={() => deletePost(post.id)} className={busy ? 'pointer-events-none opacity-60 text-[#EF4444]' : 'text-[#EF4444]'}><Trash2 className="h-4 w-4" />Delete</CleanButton> : null}
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
