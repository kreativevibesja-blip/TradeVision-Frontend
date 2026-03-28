'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { api, type SearchedUser, type SupportTicket, type TicketCategory, type TicketPriority, type TicketStatus } from '@/lib/api';
import { Loader2, MessageCircle, RefreshCw, Save, Search, Ticket, TimerReset, Send, CheckCircle2, AlertTriangle, X, Plus, UserRound } from 'lucide-react';

type StatusFilter = TicketStatus | 'ALL';
type PriorityFilter = TicketPriority | 'ALL';
type DateRangeFilter = '7d' | '30d' | '90d' | 'all';

const ticketStatuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_USER', 'RESOLVED', 'CLOSED'];
const ticketCategories: TicketCategory[] = ['ACCOUNT', 'BILLING', 'ANALYSIS', 'BUG', 'FEATURE', 'GENERAL'];

const statusVariant = (status: TicketStatus) => {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'success';
  if (status === 'WAITING_ON_USER') return 'warning';
  if (status === 'IN_PROGRESS') return 'secondary';
  return 'outline';
};

const buildWhatsAppUrl = (ticket: SupportTicket) => {
  if (!ticket.whatsappNumber) {
    return null;
  }

  const number = ticket.whatsappNumber.replace(/[^\d]/g, '');
  const message = encodeURIComponent(`Hi ${ticket.userName || 'there'}, this is ChartMind AI support replying to ticket ${ticket.ticketNumber}: `);
  return `https://wa.me/${number}?text=${message}`;
};

export default function AdminTicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [priority, setPriority] = useState<PriorityFilter>('ALL');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');
  const [draftStatus, setDraftStatus] = useState<TicketStatus>('OPEN');
  const [adminNotes, setAdminNotes] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSearchQuery, setCreateSearchQuery] = useState('');
  const [createSearchResults, setCreateSearchResults] = useState<SearchedUser[]>([]);
  const [createSearchLoading, setCreateSearchLoading] = useState(false);
  const [showCreateResults, setShowCreateResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [createWhatsappNumber, setCreateWhatsappNumber] = useState('');
  const [createCategory, setCreateCategory] = useState<TicketCategory>('GENERAL');
  const [createPriority, setCreatePriority] = useState<TicketPriority>('MEDIUM');
  const [createSubject, setCreateSubject] = useState('');
  const [createMessage, setCreateMessage] = useState('');
  const [createAdminNotes, setCreateAdminNotes] = useState('');

  const createSearchRef = useRef<HTMLDivElement | null>(null);
  const createSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deferredSearch = useDeferredValue(search);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) || tickets[0] || null,
    [selectedId, tickets]
  );

  const stats = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        acc.total += 1;
        if (ticket.status === 'OPEN') acc.open += 1;
        if (ticket.status === 'IN_PROGRESS') acc.inProgress += 1;
        if (ticket.status === 'WAITING_ON_USER') acc.waiting += 1;
        if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') acc.resolved += 1;
        return acc;
      },
      { total: 0, open: 0, inProgress: 0, waiting: 0, resolved: 0 }
    );
  }, [tickets]);

  const resetCreateForm = useCallback(() => {
    setCreateError('');
    setCreateSearchQuery('');
    setCreateSearchResults([]);
    setCreateSearchLoading(false);
    setShowCreateResults(false);
    setSelectedUser(null);
    setCreateWhatsappNumber('');
    setCreateCategory('GENERAL');
    setCreatePriority('MEDIUM');
    setCreateSubject('');
    setCreateMessage('');
    setCreateAdminNotes('');
  }, []);

  const loadTickets = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const data = await api.admin.getTickets(token, {
        page,
        search: deferredSearch.trim() || undefined,
        status,
        priority,
        dateRange,
      });
      setTickets(data.tickets);
      setPages(data.pages);
      setSelectedId((current) => (data.tickets.some((ticket) => ticket.id === current) ? current : data.tickets[0]?.id || null));
    } catch {
      setTickets([]);
      setPages(1);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      void loadTickets();
    }
  }, [token, page, deferredSearch, status, priority, dateRange]);

  useEffect(() => {
    if (!selectedTicket) {
      return;
    }

    setDraftStatus(selectedTicket.status);
    setAdminNotes(selectedTicket.adminNotes || '');
    setAdminResponse(selectedTicket.adminResponse || '');
  }, [selectedTicket?.id]);

  const searchUsers = useCallback(
    async (query: string) => {
      if (!token || query.trim().length < 2) {
        setCreateSearchResults([]);
        setShowCreateResults(false);
        return;
      }

      try {
        setCreateSearchLoading(true);
        const data = await api.admin.searchUsers(query.trim(), token);
        setCreateSearchResults(data.users);
        setShowCreateResults(true);
      } catch {
        setCreateSearchResults([]);
      } finally {
        setCreateSearchLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (createSearchTimer.current) {
      clearTimeout(createSearchTimer.current);
    }

    if (selectedUser && createSearchQuery === (selectedUser.name || selectedUser.email)) {
      return;
    }

    if (createSearchQuery.trim().length < 2) {
      setCreateSearchResults([]);
      setShowCreateResults(false);
      return;
    }

    createSearchTimer.current = setTimeout(() => {
      void searchUsers(createSearchQuery);
    }, 300);

    return () => {
      if (createSearchTimer.current) {
        clearTimeout(createSearchTimer.current);
      }
    };
  }, [createSearchQuery, searchUsers, selectedUser]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (createSearchRef.current && !createSearchRef.current.contains(event.target as Node)) {
        setShowCreateResults(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const saveTicket = async () => {
    if (!token || !selectedTicket) {
      return;
    }

    try {
      setSaving(true);
      await api.admin.updateTicket(
        selectedTicket.id,
        {
          status: draftStatus,
          adminNotes,
          adminResponse,
        },
        token
      );
      await loadTickets();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const openReplyModal = () => {
    setReplyMessage(adminResponse || '');
    setReplyFeedback(null);
    setReplyOpen(true);
  };

  const sendEmailReply = async () => {
    if (!token || !selectedTicket || !replyMessage.trim()) return;

    try {
      setReplySending(true);
      setReplyFeedback(null);
      await api.admin.replyToTicket(selectedTicket.id, replyMessage.trim(), token);
      setReplyFeedback({ type: 'success', text: 'Email sent successfully' });
      setAdminResponse(replyMessage.trim());
      await loadTickets();
      setTimeout(() => setReplyOpen(false), 1500);
    } catch (err: any) {
      setReplyFeedback({ type: 'error', text: err?.message || 'Failed to send email' });
    } finally {
      setReplySending(false);
    }
  };

  const selectCreateUser = (user: SearchedUser) => {
    setSelectedUser(user);
    setCreateSearchQuery(user.name || user.email);
    setShowCreateResults(false);
    setCreateError('');
  };

  const openCreateModal = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const createTicket = async () => {
    if (!token) {
      return;
    }

    if (!selectedUser) {
      setCreateError('Select the customer account first.');
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError('');
      const data = await api.admin.createTicket(
        {
          userId: selectedUser.id,
          whatsappNumber: createWhatsappNumber.trim() || undefined,
          subject: createSubject.trim(),
          category: createCategory,
          priority: createPriority,
          message: createMessage.trim(),
          adminNotes: createAdminNotes.trim() || undefined,
        },
        token
      );

      await loadTickets();
      setSelectedId(data.ticket.id);
      setCreateOpen(false);
      resetCreateForm();
    } catch (error: any) {
      setCreateError(error?.message || 'Failed to create admin ticket');
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex h-[calc(100vh-4rem)] flex-col gap-4 overflow-hidden">
      <div className="flex flex-shrink-0 flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-bold">Support Tickets</h1>
          <p className="text-xs text-muted-foreground">Review issues, create follow-up tickets from WhatsApp support, and reply via email or WhatsApp.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreateModal} className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Add Ticket
          </Button>
          <Button variant="outline" size="sm" onClick={() => void loadTickets()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid flex-shrink-0 gap-2 grid-cols-4">
        <Card className="border-white/10 bg-white/5"><CardContent className="p-3"><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Total</p><p className="mt-1 text-xl font-semibold">{stats.total}</p></CardContent></Card>
        <Card className="border-white/10 bg-white/5"><CardContent className="p-3"><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Open</p><p className="mt-1 text-xl font-semibold text-cyan-200">{stats.open}</p></CardContent></Card>
        <Card className="border-white/10 bg-white/5"><CardContent className="p-3"><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">In Progress</p><p className="mt-1 text-xl font-semibold text-amber-200">{stats.inProgress}</p></CardContent></Card>
        <Card className="border-white/10 bg-white/5"><CardContent className="p-3"><p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Resolved</p><p className="mt-1 text-xl font-semibold text-emerald-200">{stats.resolved}</p></CardContent></Card>
      </div>

      <Card className="flex-shrink-0 border-white/10 bg-white/5">
        <CardContent className="grid gap-2 p-3 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tickets..." className="h-8 pl-9 text-sm" />
          </div>
          <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as StatusFilter); }} className="h-8 rounded-lg border border-input bg-background/50 px-2 text-xs outline-none focus:ring-2 focus:ring-ring">
            <option value="ALL">All statuses</option>
            {ticketStatuses.map((ticketStatus) => <option key={ticketStatus} value={ticketStatus}>{ticketStatus.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={priority} onChange={(event) => { setPage(1); setPriority(event.target.value as PriorityFilter); }} className="h-8 rounded-lg border border-input bg-background/50 px-2 text-xs outline-none focus:ring-2 focus:ring-ring">
            <option value="ALL">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <select value={dateRange} onChange={(event) => { setPage(1); setDateRange(event.target.value as DateRangeFilter); }} className="h-8 rounded-lg border border-input bg-background/50 px-2 text-xs outline-none focus:ring-2 focus:ring-ring">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </CardContent>
      </Card>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="flex flex-col overflow-hidden border-white/10 bg-white/5">
          <CardHeader className="flex-shrink-0 pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold">Queue</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-2 overflow-y-auto px-3 pb-3 pt-0">
            {loading ? (
              <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-8 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-xs text-muted-foreground">
                No tickets match the current filters.
              </div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedTicket?.id === ticket.id ? 'border-cyan-400/30 bg-cyan-500/10' : 'border-white/10 bg-slate-950/60 hover:bg-white/5'}`}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">{ticket.ticketNumber}</span>
                    <Badge variant={statusVariant(ticket.status) as any} className="text-[10px] px-1.5 py-0">{ticket.status.replace(/_/g, ' ')}</Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{ticket.priority}</Badge>
                  </div>
                  <p className="text-xs font-medium text-foreground">{ticket.subject}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{ticket.message}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                    <span className="truncate">{ticket.userName || ticket.userEmail}</span>
                    <span className="flex-shrink-0">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}

            {pages > 1 ? (
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Prev</Button>
                <span className="text-xs text-muted-foreground">{page}/{pages}</span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages}>Next</Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <CardHeader className="flex-shrink-0 pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-semibold">Ticket Detail</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-0">
            {!selectedTicket ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-xs text-muted-foreground">
                Select a ticket to inspect and reply.
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{selectedTicket.ticketNumber}</Badge>
                      <Badge variant={statusVariant(selectedTicket.status) as any} className="text-[10px] px-1.5 py-0">{selectedTicket.status.replace(/_/g, ' ')}</Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{selectedTicket.category}</Badge>
                    </div>
                    <h2 className="text-base font-semibold">{selectedTicket.subject}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Opened by {selectedTicket.userName || 'Unknown user'} on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={openReplyModal}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-400/20 bg-blue-500/10 px-2.5 py-1.5 text-xs text-blue-100 transition-colors hover:bg-blue-500/20"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Reply via Email
                    </button>
                    {buildWhatsAppUrl(selectedTicket) ? (
                      <a href={buildWhatsAppUrl(selectedTicket)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-100 transition-colors hover:bg-emerald-500/15">
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Customer</p>
                    <p className="mt-1 text-xs font-medium">{selectedTicket.userName || 'Not provided'}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{selectedTicket.userEmail}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Priority</p>
                    <p className="mt-1 text-xs font-medium">{selectedTicket.priority}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{selectedTicket.whatsappNumber || 'No WhatsApp'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Activity</p>
                    <p className="mt-1 text-xs font-medium">{selectedTicket.updatedAt ? new Date(selectedTicket.updatedAt).toLocaleString() : 'N/A'}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{selectedTicket.respondedAt ? `Responded` : 'No response yet'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Ticket className="h-3.5 w-3.5 text-cyan-200" />
                    User message
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-6 text-slate-200">{selectedTicket.message}</p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Status</label>
                    <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as TicketStatus)} className="h-8 w-full rounded-lg border border-input bg-background/50 px-2 text-xs outline-none focus:ring-2 focus:ring-ring">
                      {ticketStatuses.map((ticketStatus) => <option key={ticketStatus} value={ticketStatus}>{ticketStatus.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
                    <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                      <TimerReset className="h-3.5 w-3.5 text-cyan-200" />
                      Response actions
                    </div>
                    <p className="text-[11px]">Write an admin reply before changing status.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Internal notes</label>
                  <textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} rows={3} className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" placeholder="Internal context for admins only" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Admin response</label>
                  <textarea value={adminResponse} onChange={(event) => setAdminResponse(event.target.value)} rows={3} className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring" placeholder="Response sent or planned to send" />
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveTicket} disabled={saving} size="sm" className="min-w-32">
                    {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                    Save Changes
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {replyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !replySending && setReplyOpen(false)}>
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold">Reply via Email</h3>
              </div>
              <button type="button" onClick={() => !replySending && setReplyOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {selectedTicket && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">Sending to</p>
                  <p className="text-xs font-medium">{selectedTicket.userName || 'User'} &lt;{selectedTicket.userEmail}&gt;</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Re: {selectedTicket.ticketNumber} — {selectedTicket.subject}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Message</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Type your reply..."
                  disabled={replySending}
                />
              </div>

              {replyFeedback && (
                <div className={`flex items-center gap-2 rounded-lg border p-3 text-xs ${
                  replyFeedback.type === 'success'
                    ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
                    : 'border-red-400/20 bg-red-500/10 text-red-200'
                }`}>
                  {replyFeedback.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />}
                  {replyFeedback.text}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
              <Button variant="outline" size="sm" onClick={() => setReplyOpen(false)} disabled={replySending}>
                Cancel
              </Button>
              <Button size="sm" onClick={sendEmailReply} disabled={replySending || !replyMessage.trim()} className="min-w-28">
                {replySending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />}
                Send Email
              </Button>
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !createSubmitting && setCreateOpen(false)}>
          <div className="mx-4 w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-900 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-cyan-300" />
                  <h3 className="text-sm font-semibold">Create Admin Ticket</h3>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Capture a WhatsApp support issue so it stays in the ticket queue for follow-up.</p>
              </div>
              <button type="button" onClick={() => !createSubmitting && setCreateOpen(false)} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-5 px-5 py-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <div ref={createSearchRef} className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Customer account</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={createSearchQuery}
                      onChange={(event) => {
                        setCreateSearchQuery(event.target.value);
                        setSelectedUser(null);
                      }}
                      onFocus={() => {
                        if (createSearchResults.length > 0) {
                          setShowCreateResults(true);
                        }
                      }}
                      placeholder="Search by name or email"
                      className="h-10 pl-9 text-sm"
                    />
                    {createSearchLoading ? <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" /> : null}
                  </div>

                  {showCreateResults ? (
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-slate-950/95 shadow-2xl">
                      {createSearchResults.length > 0 ? createSearchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectCreateUser(user)}
                          className="flex w-full items-start justify-between gap-3 border-b border-white/5 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-white/5"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.name || 'Unnamed user'}</p>
                            <p className="text-[11px] text-muted-foreground">{user.email}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{user.subscription}</Badge>
                        </button>
                      )) : <div className="px-3 py-3 text-xs text-muted-foreground">No users match that search.</div>}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Category</label>
                    <select value={createCategory} onChange={(event) => setCreateCategory(event.target.value as TicketCategory)} className="h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                      {ticketCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Priority</label>
                    <select value={createPriority} onChange={(event) => setCreatePriority(event.target.value as TicketPriority)} className="h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">WhatsApp number</label>
                  <Input value={createWhatsappNumber} onChange={(event) => setCreateWhatsappNumber(event.target.value)} placeholder="Optional WhatsApp number used in support chat" className="h-10 text-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Subject</label>
                  <Input value={createSubject} onChange={(event) => setCreateSubject(event.target.value)} placeholder="Short issue headline" className="h-10 text-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Issue summary</label>
                  <textarea
                    value={createMessage}
                    onChange={(event) => setCreateMessage(event.target.value)}
                    rows={6}
                    className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Summarize what the customer reported on WhatsApp, what they need, and any useful reproduction details."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-cyan-300" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Selected customer</p>
                  </div>
                  {selectedUser ? (
                    <div className="mt-3 space-y-1">
                      <p className="text-sm font-semibold text-foreground">{selectedUser.name || 'Unnamed user'}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                      <Badge variant="outline" className="mt-2 text-[10px] px-1.5 py-0">{selectedUser.subscription}</Badge>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">Search and select the user account this WhatsApp issue belongs to.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Internal follow-up notes</label>
                  <textarea
                    value={createAdminNotes}
                    onChange={(event) => setCreateAdminNotes(event.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Optional notes for the admin team: promised actions, files to request, escalation context, or next-step reminders."
                  />
                </div>

                <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/5 p-4 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Recommended capture</p>
                  <p className="mt-2">Include the exact user problem, what was already tried on WhatsApp, and what someone should check next when they pick this up later.</p>
                </div>

                {createError ? (
                  <div className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    {createError}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} disabled={createSubmitting}>Cancel</Button>
              <Button size="sm" onClick={createTicket} disabled={createSubmitting} className="min-w-32">
                {createSubmitting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
                Create Ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}