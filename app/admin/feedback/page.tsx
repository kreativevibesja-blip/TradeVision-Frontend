'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Trash2, Download, Loader2, Star, RefreshCw } from 'lucide-react';

interface FeedbackRow {
  id: string;
  user_id: string;
  rating: number;
  reason: string;
  message: string | null;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ratingBadge(rating: number) {
  const colors: Record<number, string> = {
    1: 'bg-red-500/15 text-red-400 border-red-500/30',
    2: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    3: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    4: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    5: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  };
  return colors[rating] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
}

function exportToCSV(data: FeedbackRow[]) {
  const escape = (v: string | null) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };

  const header = 'Rating,Reason,Message,Date';
  const rows = data.map(
    (f) => [f.rating, escape(f.reason), escape(f.message), f.created_at].join(','),
  );
  const csv = [header, ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `feedback_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminFeedbackPage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (queryError) {
        console.error('Feedback fetch error:', queryError);
        setError(queryError.message);
        setFeedback([]);
      } else {
        setFeedback((data as FeedbackRow[]) ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!supabase) return;
    setDeleting(id);
    try {
      await supabase.from('feedback').delete().eq('id', id);
      setFeedback((prev) => prev.filter((f) => f.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  const avgRating = feedback.length > 0
    ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-4 lg:p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <MessageSquare className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">User Feedback</h1>
            <p className="text-sm text-muted-foreground">
              {feedback.length} response{feedback.length !== 1 ? 's' : ''} · avg {avgRating} ⭐
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(feedback)}
            disabled={feedback.length === 0}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = feedback.filter((f) => f.rating === star).length;
          return (
            <Card key={star} className="mobile-card">
              <CardContent className="flex items-center gap-2 p-3">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {star}
                  <Star className="h-3.5 w-3.5" fill="currentColor" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {count}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <Card className="mobile-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Feedback</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-red-400">
              Failed to load feedback: {error}
            </div>
          ) : feedback.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No feedback yet.</div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card/95 backdrop-blur-sm">
                  <tr className="border-b border-white/10 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Rating</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Message</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Date</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {feedback.map((f) => (
                    <tr key={f.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={ratingBadge(f.rating)}>
                          {f.rating} <Star className="ml-0.5 h-3 w-3" fill="currentColor" />
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground">{f.reason}</td>
                      <td className="hidden max-w-[200px] truncate px-4 py-3 text-muted-foreground sm:table-cell">
                        {f.message || '—'}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground md:table-cell">
                        {formatDate(f.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(f.id)}
                          disabled={deleting === f.id}
                          className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          {deleting === f.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
