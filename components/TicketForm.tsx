'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { api, type SupportTicket, type TicketCategory, type TicketPriority } from '@/lib/api';
import { formatJamaicaDateTime } from '@/lib/jamaica-time';
import { AlertCircle, CheckCircle2, Loader2, Mail, MessageCircle, ShieldCheck, Ticket } from 'lucide-react';

const categories: Array<{ value: TicketCategory; label: string }> = [
  { value: 'ACCOUNT', label: 'Account' },
  { value: 'BILLING', label: 'Billing' },
  { value: 'ANALYSIS', label: 'Analysis' },
  { value: 'BUG', label: 'Bug' },
  { value: 'FEATURE', label: 'Feature' },
  { value: 'GENERAL', label: 'General' },
];

const priorities: Array<{ value: TicketPriority; label: string }> = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

const statusVariant = (status: SupportTicket['status']) => {
  if (status === 'RESOLVED' || status === 'CLOSED') return 'success';
  if (status === 'WAITING_ON_USER') return 'warning';
  if (status === 'IN_PROGRESS') return 'secondary';
  return 'outline';
};

interface TicketFormProps {
  open: boolean;
  whatsappUrl: string;
}

export function TicketForm({ open, whatsappUrl }: TicketFormProps) {
  const { user, token, loading } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<TicketCategory>('GENERAL');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [message, setMessage] = useState('');

  const userInitials = useMemo(() => {
    const source = user?.name || user?.email || 'TV';
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((value) => value[0]?.toUpperCase() || '')
      .join('');
  }, [user?.email, user?.name]);

  const loadTickets = async () => {
    if (!token) {
      setTickets([]);
      return;
    }

    try {
      setTicketsLoading(true);
      const data = await api.getMyTickets(token, 1);
      setTickets(data.tickets);
    } catch {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (open && token) {
      void loadTickets();
    }
  }, [open, token]);

  const handleSubmit = async () => {
    if (!token) {
      setError('Sign in to create a tracked support ticket.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await api.createTicket(
        {
          subject,
          category,
          priority,
          whatsappNumber,
          message,
        },
        token
      );

      setSuccess(`Ticket ${data.ticket.ticketNumber} has been created.`);
      setSubject('');
      setCategory('GENERAL');
      setPriority('MEDIUM');
      setWhatsappNumber('');
      setMessage('');
      await loadTickets();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-10 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading support workspace...
      </div>
    );
  }

  if (!user) {
    return (
      <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-200">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Tracked support requires sign-in</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in so your ticket is attached to your Supabase account and your replies stay in one thread.
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100 transition-colors hover:bg-emerald-500/15"
            >
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <MessageCircle className="h-4 w-4" />
                WhatsApp support
              </div>
              <p className="text-emerald-50/80">Use WhatsApp right now if you need immediate help before signing in.</p>
            </a>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <Mail className="h-4 w-4 text-cyan-200" />
                Ticket history unlocks after login
              </div>
              <p>Your last tickets, status changes, and admin responses appear here once you are signed in.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 2xl:grid-cols-[1.3fr_0.78fr]">
      <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-400" />
        <CardContent className="space-y-3 p-4 pt-4 sm:p-5 sm:pt-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-sm font-semibold text-cyan-100">
              {userInitials}
            </div>
            <div>
              <h3 className="text-base font-semibold sm:text-lg">Create a support ticket</h3>
              <p className="text-xs text-muted-foreground sm:text-sm">Tickets are linked to {user.email} and visible in your support queue.</p>
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {success ? (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Subject</label>
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Describe the issue clearly" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">WhatsApp number</label>
              <Input value={whatsappNumber} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="Optional for faster replies" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Category</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as TicketCategory)}
                className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {categories.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Priority</label>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TicketPriority)}
                className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {priorities.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Message</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-input bg-background/50 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Include what happened, where it happened, and what you expected instead."
            />
          </div>

          <div className="sticky bottom-0 -mx-4 border-t border-white/10 bg-slate-950/95 px-4 pb-1 pt-3 backdrop-blur-xl sm:-mx-5 sm:px-5">
            <div className="grid gap-2 sm:grid-cols-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-500/15"
              >
                <MessageCircle className="h-4 w-4" />
                Open WhatsApp
              </a>
              <Button
                onClick={handleSubmit}
                disabled={submitting || subject.trim().length < 5 || message.trim().length < 20}
                className="min-h-11"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ticket className="mr-2 h-4 w-4" />}
                Submit Ticket
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hidden self-start border-white/10 bg-white/5 2xl:block 2xl:max-h-[540px] 2xl:overflow-hidden">
        <CardContent className="space-y-3 p-4 pt-4 sm:p-5 sm:pt-5 2xl:max-h-[540px] 2xl:overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold sm:text-lg">Recent tickets</h3>
              <p className="text-sm text-muted-foreground">Track what support has already seen.</p>
            </div>
            {tickets.length > 0 ? <Badge variant="outline">{tickets.length} recent</Badge> : null}
          </div>

          {ticketsLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading tickets...
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
              Your ticket history will appear here after your first submission.
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3.5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{ticket.ticketNumber}</span>
                    <Badge variant={statusVariant(ticket.status) as any}>{ticket.status.replace(/_/g, ' ')}</Badge>
                    <Badge variant="outline">{ticket.priority}</Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground">{ticket.subject}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{ticket.message}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{formatJamaicaDateTime(ticket.createdAt)}</span>
                    <span>{ticket.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}