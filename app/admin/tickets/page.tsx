'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { api, type SupportTicket, type TicketPriority, type TicketStatus } from '@/lib/api';
import { Loader2, Mail, MessageCircle, RefreshCw, Save, Search, Ticket, TimerReset } from 'lucide-react';

type StatusFilter = TicketStatus | 'ALL';
type PriorityFilter = TicketPriority | 'ALL';
type DateRangeFilter = '7d' | '30d' | '90d' | 'all';

const ticketStatuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_USER', 'RESOLVED', 'CLOSED'];

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

const buildMailtoUrl = (ticket: SupportTicket) => {
  const subject = encodeURIComponent(`Re: ${ticket.ticketNumber} - ${ticket.subject}`);
  const body = encodeURIComponent(`Hi ${ticket.userName || 'there'},\n\nThis is ChartMind AI support regarding ${ticket.ticketNumber}.\n\n`);
  return `mailto:${ticket.userEmail}?subject=${subject}&body=${body}`;
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">Review user issues, update status, and reply through email or WhatsApp.</p>
        </div>
        <Button variant="outline" onClick={() => void loadTickets()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="border-white/10 bg-white/5"><CardContent className="p-5"><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Total</p><p className="mt-2 text-3xl font-semibold">{stats.total}</p></CardContent></Card>
        <Card className="border-white/10 bg-white/5"><CardContent className="p-5"><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Open</p><p className="mt-2 text-3xl font-semibold text-cyan-200">{stats.open}</p></CardContent></Card>
        <Card className="border-white/10 bg-white/5"><CardContent className="p-5"><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">In Progress</p><p className="mt-2 text-3xl font-semibold text-amber-200">{stats.inProgress}</p></CardContent></Card>
        <Card className="border-white/10 bg-white/5"><CardContent className="p-5"><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Resolved</p><p className="mt-2 text-3xl font-semibold text-emerald-200">{stats.resolved}</p></CardContent></Card>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1.6fr_1fr_1fr_1fr] md:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by ticket, subject, name, or email" className="pl-9" />
          </div>
          <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as StatusFilter); }} className="h-10 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="ALL">All statuses</option>
            {ticketStatuses.map((ticketStatus) => <option key={ticketStatus} value={ticketStatus}>{ticketStatus.replace(/_/g, ' ')}</option>)}
          </select>
          <select value={priority} onChange={(event) => { setPage(1); setPriority(event.target.value as PriorityFilter); }} className="h-10 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="ALL">All priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
          <select value={dateRange} onChange={(event) => { setPage(1); setDateRange(event.target.value as DateRangeFilter); }} className="h-10 rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.35fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {loading ? (
              <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-sm text-muted-foreground">
                No tickets match the current filters.
              </div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${selectedTicket?.id === ticket.id ? 'border-cyan-400/30 bg-cyan-500/10' : 'border-white/10 bg-slate-950/60 hover:bg-white/5'}`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{ticket.ticketNumber}</span>
                    <Badge variant={statusVariant(ticket.status) as any}>{ticket.status.replace(/_/g, ' ')}</Badge>
                    <Badge variant="outline">{ticket.priority}</Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ticket.message}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{ticket.userName || ticket.userEmail}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}

            {pages > 1 ? (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages}>Next</Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ticket Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            {!selectedTicket ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-sm text-muted-foreground">
                Select a ticket to inspect and reply.
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{selectedTicket.ticketNumber}</Badge>
                      <Badge variant={statusVariant(selectedTicket.status) as any}>{selectedTicket.status.replace(/_/g, ' ')}</Badge>
                      <Badge variant="outline">{selectedTicket.category}</Badge>
                    </div>
                    <h2 className="text-xl font-semibold">{selectedTicket.subject}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Opened by {selectedTicket.userName || 'Unknown user'} on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={buildMailtoUrl(selectedTicket)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground transition-colors hover:bg-white/10">
                      <Mail className="h-4 w-4" />
                      Email
                    </a>
                    {buildWhatsAppUrl(selectedTicket) ? (
                      <a href={buildWhatsAppUrl(selectedTicket)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 transition-colors hover:bg-emerald-500/15">
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Customer</p>
                    <p className="mt-2 text-sm font-medium">{selectedTicket.userName || 'Not provided'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedTicket.userEmail}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Priority</p>
                    <p className="mt-2 text-sm font-medium">{selectedTicket.priority}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedTicket.whatsappNumber || 'No WhatsApp number'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Latest activity</p>
                    <p className="mt-2 text-sm font-medium">{selectedTicket.updatedAt ? new Date(selectedTicket.updatedAt).toLocaleString() : 'N/A'}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedTicket.respondedAt ? `Responded ${new Date(selectedTicket.respondedAt).toLocaleString()}` : 'No admin response yet'}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <Ticket className="h-4 w-4 text-cyan-200" />
                    User message
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{selectedTicket.message}</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Status</label>
                    <select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as TicketStatus)} className="h-10 w-full rounded-lg border border-input bg-background/50 px-3 text-sm outline-none focus:ring-2 focus:ring-ring">
                      {ticketStatuses.map((ticketStatus) => <option key={ticketStatus} value={ticketStatus}>{ticketStatus.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                    <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                      <TimerReset className="h-4 w-4 text-cyan-200" />
                      Response actions
                    </div>
                    <p>Use the response field below to keep a written admin reply attached to the ticket before changing the status.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Internal notes</label>
                  <textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} rows={5} className="w-full rounded-2xl border border-input bg-background/50 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Internal context for admins only" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Admin response</label>
                  <textarea value={adminResponse} onChange={(event) => setAdminResponse(event.target.value)} rows={6} className="w-full rounded-2xl border border-input bg-background/50 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Write the response you sent or plan to send" />
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveTicket} disabled={saving} className="min-w-40">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}