'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Crown, Loader2, RefreshCcw, Signal, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api, type InstantSignal } from '@/lib/api';

const isProPlus = (subscription?: string | null) => subscription === 'TOP_TIER' || subscription === 'VIP_AUTO_TRADER';
const activeStatuses = new Set(['entry_now', 'active']);

const formatPrice = (value: number | null) => value == null ? '-' : value.toLocaleString(undefined, { maximumFractionDigits: 5 });
const formatDate = (value: string | null) => value ? new Date(value).toLocaleString() : '-';

function SignalCard({ signal, token, onChanged }: { signal: InstantSignal; token: string; onChanged: () => void }) {
  const directionClass = signal.direction === 'buy' ? 'bg-emerald-50 text-emerald-700' : signal.direction === 'sell' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600';
  const distanceToTp = signal.takeProfit != null && signal.resultPrice != null ? Math.abs(signal.takeProfit - signal.resultPrice) : null;
  const distanceToSl = signal.stopLoss != null && signal.resultPrice != null ? Math.abs(signal.stopLoss - signal.resultPrice) : null;
  const canClose = signal.result == null && !['tp_hit', 'sl_hit', 'expired', 'cancelled', 'no_signal'].includes(signal.status);

  const closeSignal = async () => {
    await api.instantSignals.close(signal.id, token);
    onChanged();
  };

  return (
    <Card className="border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-extrabold text-slate-950">{signal.market}</h3>
              <Badge className={directionClass}>{signal.direction.toUpperCase()}</Badge>
              <Badge variant="outline" className="border-slate-200 text-slate-600">{signal.status.replace(/_/g, ' ')}</Badge>
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{signal.assetClass} · {signal.timeframe}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-blue-600">{signal.confidence}%</div>
            <div className="text-xs font-semibold text-slate-400">confidence</div>
          </div>
        </div>

        {signal.confirmationText ? <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">{signal.confirmationText}</p> : null}

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Entry</p><p className="font-bold">{formatPrice(signal.entry)}</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">SL</p><p className="font-bold">{formatPrice(signal.stopLoss)}</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">TP</p><p className="font-bold">{formatPrice(signal.takeProfit)}</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">RR</p><p className="font-bold">{signal.riskReward ?? '-'}</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Created</p><p className="font-bold">{formatDate(signal.createdAt)}</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Expires</p><p className="font-bold">{formatDate(signal.expiresAt)}</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Distance TP</p><p className="font-bold">{formatPrice(distanceToTp)}</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-400">Distance SL</p><p className="font-bold">{formatPrice(distanceToSl)}</p></div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-500">Result: <span className="text-slate-900">{signal.result ?? '-'}</span></p>
          {canClose ? (
            <Button variant="outline" size="sm" onClick={() => void closeSignal()} className="gap-2 border-slate-200">
              <XCircle className="h-4 w-4" />
              Close
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, signals, token, onChanged }: { title: string; signals: InstantSignal[]; token: string; onChanged: () => void }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-950">{title}</h2>
        <Badge variant="outline" className="border-slate-200">{signals.length}</Badge>
      </div>
      {signals.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {signals.map((signal) => <SignalCard key={signal.id} signal={signal} token={token} onChanged={onChanged} />)}
        </div>
      ) : (
        <Card className="border-dashed border-slate-200 bg-white">
          <CardContent className="p-6 text-sm font-medium text-slate-500">No signals in this section.</CardContent>
        </Card>
      )}
    </section>
  );
}

export default function SignalsPage() {
  const { user, token, loading } = useAuth();
  const [signals, setSignals] = useState<InstantSignal[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const allowed = isProPlus(user?.subscription);

  const loadSignals = async () => {
    if (!token || !allowed) return;
    try {
      setFetching(true);
      setError('');
      await api.instantSignals.refresh({}, token);
      const response = await api.instantSignals.list(token);
      setSignals(response.signals);
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load signals.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    void loadSignals();
    if (!token || !allowed) return;
    const id = window.setInterval(() => void loadSignals(), 12_000);
    return () => window.clearInterval(id);
  }, [token, allowed]);

  const grouped = useMemo(() => ({
    active: signals.filter((signal) => activeStatuses.has(signal.status)),
    completed: signals.filter((signal) => signal.result || ['tp_hit', 'sl_hit', 'expired', 'cancelled', 'no_signal', 'wait_confirmation'].includes(signal.status)),
  }), [signals]);

  const stats = useMemo(() => {
    const completed = grouped.completed.filter((signal) => signal.result);
    const wins = completed.filter((signal) => signal.result === 'win').length;
    return {
      total: signals.length,
      active: grouped.active.length,
      winRate: completed.length ? Math.round((wins / completed.length) * 100) : 0,
    };
  }, [grouped, signals.length]);

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading Signals...</div>;
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Crown className="h-7 w-7" /></div>
            <h1 className="mt-5 text-2xl font-extrabold text-slate-950">Signals is Pro+ only</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Upgrade to access Instant Signal history, live tracking, and completed signal stats.</p>
            <Link href="/dashboard/billing" className="mt-6 inline-flex">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">Upgrade to Pro+</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Instant Signal</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Signals</h1>
        </div>
        <Button variant="outline" onClick={() => void loadSignals()} disabled={fetching} className="gap-2 border-slate-200 bg-white">
          {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {error ? <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total', stats.total],
          ['Active Signals', stats.active],
          ['Win Rate', `${stats.winRate}%`],
        ].map(([label, value]) => (
          <Card key={label} className="border-slate-200 bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                <Signal className="h-4 w-4 text-blue-600" />
              </div>
              <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {token ? (
        <>
          <Section title="Active Signals" signals={grouped.active} token={token} onChanged={() => void loadSignals()} />
          <Section title="Completed Signals" signals={grouped.completed} token={token} onChanged={() => void loadSignals()} />
        </>
      ) : null}
    </div>
  );
}
