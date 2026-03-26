'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api, EmailCampaign, EmailLog } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  ArrowLeft,
  Send,
  RotateCcw,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
  Clock,
  FileText,
  X,
  Crown,
  Globe,
  User,
  FlaskConical,
  AlertTriangle,
} from 'lucide-react';

const audienceLabel: Record<string, string> = {
  all: 'All Users',
  free: 'Free Users',
  pro: 'Pro Users',
  single: 'Single User',
};

const audienceIcon: Record<string, typeof Globe> = {
  all: Globe,
  free: Users,
  pro: Crown,
  single: User,
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();

  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const res = await api.admin.getEmailCampaignById(id, token);
      setCampaign(res.campaign);
      setLogs(res.logs);
    } catch {
      showToast('error', 'Failed to load campaign.');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSend = async () => {
    if (!token || !campaign) return;
    setSending(true);
    try {
      const res = await api.admin.sendEmailCampaign(campaign.id, token);
      showToast('success', `Campaign sent! ${res.sentCount} delivered, ${res.failedCount} failed.`);
      load();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send campaign.');
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async () => {
    if (!token || !campaign) return;
    setRetrying(true);
    try {
      const res = await api.admin.retryFailedEmails(campaign.id, token);
      showToast('success', `Retried: ${res.retriedOk} succeeded, ${res.retriedFail} still failed.`);
      load();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to retry emails.');
    } finally {
      setRetrying(false);
    }
  };

  const handleSendTest = async () => {
    if (!token || !campaign) return;
    setTestSending(true);
    try {
      const res = await api.admin.sendTestCampaignEmail(
        { subject: campaign.subject, htmlContent: campaign.htmlContent },
        token
      );
      showToast('success', `Test email sent to ${res.sentTo}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send test email.');
    } finally {
      setTestSending(false);
    }
  };

  const failedCount = logs.filter((l) => l.status === 'failed').length;
  const sentCount = logs.filter((l) => l.status === 'sent').length;
  const AudIcon = campaign ? audienceIcon[campaign.audience] || Globe : Globe;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>Campaign not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.push('/admin/emails')} className="p-2 rounded-lg hover:bg-white/5 transition-colors mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{campaign.subject}</p>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 text-xs ${
            campaign.status === 'sent'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : campaign.status === 'sending'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
          }`}
        >
          {campaign.status}
        </Badge>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <AudIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Audience</p>
              <p className="text-sm font-semibold">{audienceLabel[campaign.audience]}</p>
              {campaign.singleEmail && <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{campaign.singleEmail}</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Sent</p>
              <p className="text-sm font-semibold">{campaign.sentCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Failed</p>
              <p className="text-sm font-semibold">{campaign.failedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Created</p>
              <p className="text-sm font-semibold">{new Date(campaign.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {campaign.status === 'draft' && (
          <button
            onClick={handleSend}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Campaign
          </button>
        )}

        {failedCount > 0 && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-500/20 text-orange-400 px-4 py-2.5 text-sm font-medium transition-all hover:bg-orange-500/5 disabled:opacity-40"
          >
            {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Retry Failed ({failedCount})
          </button>
        )}

        <button
          onClick={handleSendTest}
          disabled={testSending}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 text-cyan-400 px-4 py-2.5 text-sm font-medium transition-all hover:bg-cyan-500/5 disabled:opacity-40"
        >
          {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          Send Test
        </button>

        <button
          onClick={() => setPreviewHtml(campaign.htmlContent)}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium transition-all hover:bg-white/5"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
      </div>

      {/* Email Logs */}
      <Card className="border-white/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Delivery Log
          </h2>
          <span className="text-xs text-muted-foreground">{logs.length} entries</span>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-white/10 text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Error</th>
                <th className="px-4 py-2.5 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    {campaign.status === 'draft' ? (
                      <>
                        <FileText className="h-6 w-6 mx-auto mb-2 opacity-40" />
                        Campaign hasn&apos;t been sent yet.
                      </>
                    ) : (
                      <>
                        <Mail className="h-6 w-6 mx-auto mb-2 opacity-40" />
                        No delivery logs found.
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-2.5 font-medium truncate max-w-[200px]">{log.userEmail}</td>
                    <td className="px-4 py-2.5">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                          <CheckCircle2 className="h-3 w-3" /> Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                          <XCircle className="h-3 w-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      {log.errorMessage ? (
                        <span className="text-xs text-red-400/70 flex items-center gap-1 max-w-[250px] truncate">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {log.errorMessage}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Preview Modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl max-h-[85vh] rounded-xl border border-white/10 bg-background shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Email Preview
              </h3>
              <button onClick={() => setPreviewHtml(null)} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-0">
              <iframe
                srcDoc={previewHtml}
                title="Email Preview"
                className="w-full h-full min-h-[500px] border-0 bg-white"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
