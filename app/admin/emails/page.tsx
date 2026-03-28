'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api, EmailCampaign } from '@/lib/api';
import { formatJamaicaDate } from '@/lib/jamaica-time';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Plus,
  Send,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const audienceLabel: Record<string, string> = {
  all: 'All Users',
  free: 'Free Users',
  pro: 'Pro Users',
  single: 'Single User',
};

const statusStyle: Record<string, string> = {
  draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  sending: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  sent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const statusIcon: Record<string, typeof Clock> = {
  draft: FileText,
  sending: Loader2,
  sent: CheckCircle2,
};

export default function EmailCampaignsPage() {
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.admin.getEmailCampaigns(token, page);
      setCampaigns(res.campaigns);
      setPages(res.pages);
      setTotal(res.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Email Campaigns
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, send and track email campaigns to your users
          </p>
        </div>
        <Link href="/admin/emails/create">
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Create Campaign
          </button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Drafts</p>
              <p className="text-lg font-bold">{campaigns.filter((c) => c.status === 'draft').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Send className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sent</p>
              <p className="text-lg font-bold">{campaigns.filter((c) => c.status === 'sent').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Failed Emails</p>
              <p className="text-lg font-bold">{campaigns.reduce((s, c) => s + c.failedCount, 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Audience</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Sent</th>
                <th className="px-4 py-3 font-medium text-right hidden md:table-cell">Failed</th>
                <th className="px-4 py-3 font-medium text-right hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 mx-auto animate-spin mb-2" />
                    Loading campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No campaigns yet. Create your first one!
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const Icon = statusIcon[c.status] || FileText;
                  return (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/emails/${c.id}`} className="hover:text-primary transition-colors">
                          <p className="font-medium truncate max-w-[220px]">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[220px]">{c.subject}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3" />
                          {audienceLabel[c.audience] || c.audience}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[11px] ${statusStyle[c.status] || ''}`}>
                          <Icon className={`h-3 w-3 mr-1 ${c.status === 'sending' ? 'animate-spin' : ''}`} />
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{c.sentCount}</td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        {c.failedCount > 0 ? (
                          <span className="text-red-400">{c.failedCount}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground text-xs hidden lg:table-cell">
                        {formatJamaicaDate(c.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <p className="text-xs text-muted-foreground">
              Page {page} of {pages} &middot; {total} campaigns
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
