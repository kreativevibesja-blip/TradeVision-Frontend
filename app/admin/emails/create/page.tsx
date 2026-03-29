'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api, EmailTemplateMeta, SearchedUser } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import {
  Mail,
  ArrowLeft,
  Save,
  Send,
  FlaskConical,
  Eye,
  Loader2,
  Search,
  X,
  ChevronDown,
  Users,
  User,
  Crown,
  Globe,
} from 'lucide-react';

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users', icon: Globe, desc: 'Every registered user' },
  { value: 'free', label: 'Free Users', icon: Users, desc: 'Users on Free plan' },
  { value: 'pro', label: 'Paid Users', icon: Crown, desc: 'Users on Pro or Top Tier plans' },
  { value: 'single', label: 'Single User', icon: User, desc: 'One specific user' },
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const { token } = useAuth();

  // Form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [audience, setAudience] = useState('all');
  const [singleEmail, setSingleEmail] = useState('');
  const [templateKey, setTemplateKey] = useState('');

  // Templates
  const [templates, setTemplates] = useState<EmailTemplateMeta[]>([]);

  // User search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Action states
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load templates
  useEffect(() => {
    if (!token) return;
    api.admin.getEmailTemplates(token).then((r) => setTemplates(r.templates)).catch(() => {});
  }, [token]);

  // Template selection handler
  const handleTemplateSelect = async (key: string) => {
    setTemplateKey(key);
    if (!key || !token) {
      return;
    }
    try {
      const preview = await api.admin.previewEmailTemplate(key, token);
      setSubject(preview.subject);
      setHtmlContent(preview.html);
    } catch {
      showToast('error', 'Failed to load template.');
    }
  };

  // User search with debounce
  const doSearch = useCallback(
    async (q: string) => {
      if (!token || q.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const res = await api.admin.searchUsers(q, token);
        setSearchResults(res.users);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    searchTimer.current = setTimeout(() => doSearch(searchQuery), 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery, doSearch]);

  // Click outside to close search results
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectUser = (user: SearchedUser) => {
    setSingleEmail(user.email);
    setSearchQuery(user.email);
    setShowResults(false);
  };

  // Validate form
  const isValid = name.trim() && subject.trim() && htmlContent.trim() && (audience !== 'single' || singleEmail.trim());

  // Save draft
  const handleSaveDraft = async () => {
    if (!token || !isValid) return;
    setSaving(true);
    try {
      const res = await api.admin.createEmailCampaign(
        { name, subject, htmlContent, audience, singleEmail: audience === 'single' ? singleEmail : undefined, templateKey: templateKey || undefined },
        token
      );
      showToast('success', 'Campaign saved as draft!');
      router.push(`/admin/emails/${res.campaign.id}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save campaign.');
    } finally {
      setSaving(false);
    }
  };

  // Send now
  const handleSendNow = async () => {
    if (!token || !isValid) return;
    setSending(true);
    try {
      // Create then send
      const res = await api.admin.createEmailCampaign(
        { name, subject, htmlContent, audience, singleEmail: audience === 'single' ? singleEmail : undefined, templateKey: templateKey || undefined },
        token
      );
      const sendRes = await api.admin.sendEmailCampaign(res.campaign.id, token);
      showToast('success', `Campaign sent! ${sendRes.sentCount} delivered, ${sendRes.failedCount} failed.`);
      router.push(`/admin/emails/${res.campaign.id}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send campaign.');
    } finally {
      setSending(false);
    }
  };

  // Send test
  const handleSendTest = async () => {
    if (!token || !subject.trim() || !htmlContent.trim()) return;
    setTestSending(true);
    try {
      const res = await api.admin.sendTestCampaignEmail({ subject, htmlContent }, token);
      showToast('success', `Test email sent to ${res.sentTo}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to send test email.');
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all ${
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
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin/emails')} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Create Campaign
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Compose and send an email to your users</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid gap-6">
        {/* Campaign Name */}
        <Card className="border-white/10">
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. March Product Update"
                className="w-full rounded-lg border border-white/10 bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. What's New on MyTradeVision"
                className="w-full rounded-lg border border-white/10 bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all"
              />
            </div>
          </CardContent>
        </Card>

        {/* Audience */}
        <Card className="border-white/10">
          <CardContent className="p-5 space-y-4">
            <label className="text-sm font-medium text-foreground block">Audience</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAudience(opt.value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-all ${
                    audience === opt.value
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-white/10 text-muted-foreground hover:border-white/20 hover:bg-white/[0.02]'
                  }`}
                >
                  <opt.icon className="h-4 w-4" />
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Single user search */}
            {audience === 'single' && (
              <div ref={searchRef} className="relative">
                <label className="text-sm font-medium text-foreground mb-1.5 block">Search User</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by email or name..."
                    className="w-full rounded-lg border border-white/10 bg-background/50 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all"
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-background shadow-xl max-h-48 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => selectUser(u)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-white/5 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{u.email}</p>
                          {u.name && <p className="text-xs text-muted-foreground truncate">{u.name}</p>}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            u.subscription === 'PRO'
                              ? 'bg-cyan-500/10 text-cyan-400'
                              : 'bg-white/5 text-muted-foreground'
                          }`}
                        >
                          {u.subscription}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {singleEmail && (
                  <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                    <User className="h-3 w-3" /> Sending to: {singleEmail}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template + Content */}
        <Card className="border-white/10">
          <CardContent className="p-5 space-y-4">
            {/* Template selector */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Template (Optional)</label>
              <div className="relative">
                <select
                  value={templateKey}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-white/10 bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all pr-8"
                >
                  <option value="">Custom (write your own)</option>
                  {templates.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label} — {t.subject}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* HTML content editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Email Content (HTML)</label>
                {htmlContent.trim() && (
                  <button
                    onClick={() => setPreviewHtml(htmlContent)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Eye className="h-3 w-3" /> Preview
                  </button>
                )}
              </div>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<div>Your email HTML here...</div>&#10;&#10;Use {{name}} for recipient's name."
                rows={16}
                className="w-full rounded-lg border border-white/10 bg-background/50 px-3 py-2.5 text-sm font-mono outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all resize-y min-h-[200px]"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Supports full HTML. Use <code className="text-primary/80">{'{{name}}'}</code> to personalize with recipient name.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={!isValid || saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium transition-all hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </button>
          <button
            onClick={handleSendNow}
            disabled={!isValid || sending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Now
          </button>
          <button
            onClick={handleSendTest}
            disabled={!subject.trim() || !htmlContent.trim() || testSending}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-500/20 text-cyan-400 px-5 py-2.5 text-sm font-medium transition-all hover:bg-cyan-500/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
            Send Test Email
          </button>
        </div>
      </div>

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
