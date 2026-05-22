'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Bell,
  BookmarkPlus,
  BrainCircuit,
  CandlestickChart,
  Compass,
  Crosshair,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  api,
  type FindTradeInsight,
  type FindTradeJournalEntry,
  type FindTradeOpportunity,
  type FindTradeStatusPayload,
  type FindTradeTrackingStatus,
} from '@/lib/api';

const SCAN_MESSAGES = [
  'Scanning liquidity conditions...',
  'Analyzing market structure...',
  'Evaluating institutional flows...',
  'Filtering low-quality setups...',
  'Ranking sniper-grade opportunities...',
];

const GRADE_STYLES: Record<string, string> = {
  'A+': 'border-amber-300/30 bg-amber-400/12 text-amber-100',
  A: 'border-yellow-200/20 bg-yellow-200/10 text-yellow-50',
  'B+': 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100',
  B: 'border-white/15 bg-white/8 text-white/70',
  C: 'border-white/10 bg-white/5 text-white/50',
};

const STATUS_STYLES: Record<FindTradeTrackingStatus['status'], string> = {
  monitoring: 'border-white/15 bg-white/8 text-white/75',
  running_profit: 'border-emerald-300/25 bg-emerald-400/12 text-emerald-100',
  tp_hit: 'border-amber-300/30 bg-amber-400/10 text-amber-100',
  sl_hit: 'border-rose-300/25 bg-rose-400/10 text-rose-100',
  expired: 'border-white/15 bg-white/8 text-white/65',
  manual_close: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
  cancelled: 'border-white/15 bg-white/8 text-white/55',
};

const formatPrice = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) {
    return '--';
  }

  if (Math.abs(value) >= 100) {
    return value.toFixed(2);
  }

  if (Math.abs(value) >= 1) {
    return value.toFixed(4);
  }

  return value.toFixed(5);
};

const formatRelative = (value: string | null | undefined) => {
  if (!value) {
    return 'Awaiting next refresh';
  }

  const deltaMinutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
  if (deltaMinutes >= 0) {
    return `in ${deltaMinutes}m`;
  }
  return `${Math.abs(deltaMinutes)}m ago`;
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '--';
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

function OpportunityCard({
  opportunity,
  onAction,
  primary,
}: {
  opportunity: FindTradeOpportunity;
  onAction: (action: 'entered' | 'watchlist' | 'ignore' | 'not_yet') => void;
  primary?: boolean;
}) {
  const snapshot = opportunity.snapshot as {
    candles?: Array<{ time: number; open: number; high: number; low: number; close: number }>;
  };
  const candles = snapshot.candles ?? [];
  const first = candles[0];
  const last = candles[candles.length - 1];
  const directionTone = opportunity.direction === 'buy' ? 'text-emerald-300' : 'text-rose-300';

  return (
    <div className={`overflow-hidden rounded-[30px] border ${primary ? 'border-[rgba(255,223,112,0.24)] bg-[radial-gradient(circle_at_top_left,rgba(255,223,112,0.14),transparent_28%),linear-gradient(160deg,rgba(9,13,20,0.96),rgba(14,19,27,0.84))]' : 'border-white/10 bg-[linear-gradient(160deg,rgba(13,17,23,0.92),rgba(10,14,20,0.82))]'} p-5 shadow-[0_28px_80px_rgba(0,0,0,0.36)]`}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${GRADE_STYLES[opportunity.qualityGrade ?? 'C'] ?? GRADE_STYLES.C} border`}>{opportunity.qualityGrade ?? 'C'}</Badge>
            <Badge variant="outline" className="border-white/15 bg-white/6 text-white/70">{opportunity.sessionType ?? 'watch'}</Badge>
            <Badge variant="outline" className="border-white/15 bg-white/6 text-white/70">{opportunity.source ?? 'scan'}</Badge>
          </div>

          <div>
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/40">{primary ? 'Best active setup' : 'Developing setup'}</div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h3 className="font-display text-3xl font-bold tracking-[-0.05em] text-white">{opportunity.symbolLabel ?? opportunity.symbol ?? 'No market'}</h3>
              <span className={`text-sm font-semibold uppercase tracking-[0.22em] ${directionTone}`}>{opportunity.direction ?? 'wait'}</span>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/72">{opportunity.reasoning ?? opportunity.emptyStateMessage}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Confidence', `${opportunity.confidenceScore ?? '--'}%`],
              ['Weighted score', opportunity.weightedScore != null ? `${opportunity.weightedScore}` : '--'],
              ['RR', opportunity.rrRatio != null ? `${opportunity.rrRatio}R` : '--'],
              ['Published', formatDateTime(opportunity.publishedAt)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <div className="text-[0.68rem] uppercase tracking-[0.24em] text-white/35">{label}</div>
                <div className="mt-2 text-sm font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Entry', formatPrice(opportunity.entryPrice)],
              ['Stop loss', formatPrice(opportunity.stopLoss)],
              ['Take profit', formatPrice(opportunity.takeProfit)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <div className="text-[0.68rem] uppercase tracking-[0.24em] text-white/35">{label}</div>
                <div className="mt-2 text-lg font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>

          {opportunity.developingNote ? (
            <div className="rounded-[22px] border border-cyan-400/15 bg-cyan-500/8 p-4 text-sm leading-7 text-cyan-50">
              {opportunity.developingNote}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {opportunity.confluences.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white/72">
                {item}
              </span>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/35">Did you enter this trade?</div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => onAction('entered')} className="bg-[linear-gradient(135deg,rgba(255,223,112,0.94),rgba(180,130,34,0.92))] text-[#140f04] hover:brightness-105">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Yes, I Entered
              </Button>
              <Button variant="outline" className="border-white/15 bg-white/4 text-white hover:bg-white/10" onClick={() => onAction('watchlist')}>
                <BookmarkPlus className="mr-2 h-4 w-4" />
                Save Setup
              </Button>
              <Button variant="outline" className="border-white/15 bg-white/4 text-white hover:bg-white/10" onClick={() => onAction('not_yet')}>
                <Activity className="mr-2 h-4 w-4" />
                Not Yet
              </Button>
              <Button variant="outline" className="border-white/10 bg-transparent text-white/68 hover:bg-white/8" onClick={() => onAction('ignore')}>
                <X className="mr-2 h-4 w-4" />
                Ignore Setup
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[420px] shrink-0 rounded-[26px] border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[0.68rem] uppercase tracking-[0.24em] text-white/35">Chart snapshot</div>
              <div className="mt-1 text-sm font-semibold text-white">{opportunity.setupLabel ?? 'Market structure map'}</div>
            </div>
            <CandlestickChart className="h-4 w-4 text-white/45" />
          </div>

          <div className="h-44 rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,223,112,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0))] p-3">
            {first && last ? (
              <div className="flex h-full items-end gap-1">
                {candles.slice(-28).map((candle) => {
                  const range = Math.max(candle.high - candle.low, 0.1);
                  const body = Math.max(Math.abs(candle.close - candle.open), range * 0.2);
                  const bullish = candle.close >= candle.open;
                  return (
                    <div key={candle.time} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                      <div
                        className={`w-full rounded-full ${bullish ? 'bg-emerald-400/85' : 'bg-rose-400/85'}`}
                        style={{ height: `${Math.max(12, Math.min(100, body * 4))}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-white/45">Snapshot stored on the backend for this setup.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackingCard({ tracking }: { tracking: FindTradeTrackingStatus }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(14,18,24,0.96),rgba(10,14,20,0.84))] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[0.68rem] uppercase tracking-[0.24em] text-white/35">Trade tracking</div>
          <div className="mt-2 flex items-center gap-3">
            <h4 className="text-xl font-semibold text-white">{tracking.symbolLabel}</h4>
            <Badge className={`${STATUS_STYLES[tracking.status]} border`}>{tracking.status.replace('_', ' ')}</Badge>
          </div>
        </div>
        <div className="text-right text-sm text-white/62">
          <div>Next monitor {formatRelative(tracking.nextCheckAt)}</div>
          <div className="mt-1">Entered {formatDateTime(tracking.enteredAt)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {[
          ['Entry', formatPrice(tracking.entryPrice)],
          ['Current', formatPrice(tracking.currentPrice)],
          ['Target', formatPrice(tracking.takeProfit)],
          ['Progress', `${tracking.progressPercent.toFixed(0)}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[0.68rem] uppercase tracking-[0.24em] text-white/35">{label}</div>
            <div className="mt-2 text-sm font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,223,112,0.95),rgba(34,197,94,0.9))]" style={{ width: `${Math.max(6, Math.min(100, tracking.progressPercent))}%` }} />
      </div>

      {tracking.latestUpdate ? (
        <div className="mt-4 rounded-[22px] border border-cyan-400/15 bg-cyan-500/8 p-4 text-sm leading-7 text-cyan-50">
          <div className="font-semibold text-white">{tracking.latestUpdate.title}</div>
          <p className="mt-1">{tracking.latestUpdate.message}</p>
        </div>
      ) : null}
    </div>
  );
}

function JournalCard({
  entry,
  onSaveNote,
}: {
  entry: FindTradeJournalEntry;
  onSaveNote: (trackingId: string, note: string) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(160deg,rgba(13,17,23,0.94),rgba(10,14,20,0.82))] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[0.68rem] uppercase tracking-[0.24em] text-white/35">AI journal</div>
          <div className="mt-2 flex items-center gap-3">
            <h4 className="text-lg font-semibold text-white">{entry.symbolLabel}</h4>
            <Badge className={`${GRADE_STYLES[entry.qualityGrade] ?? GRADE_STYLES.C} border`}>{entry.qualityGrade}</Badge>
          </div>
        </div>
        <div className="text-sm text-white/60">{entry.outcome}</div>
      </div>

      <p className="mt-4 text-sm leading-7 text-white/70">{entry.aiReflection ?? entry.setupReasoning}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ['Session', entry.sessionType],
          ['RR', `${entry.rrRatio}R`],
          ['Opened', formatDateTime(entry.createdAt)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[0.68rem] uppercase tracking-[0.24em] text-white/35">{label}</div>
            <div className="mt-2 text-sm font-semibold capitalize text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <label className="text-[0.72rem] uppercase tracking-[0.24em] text-white/35">Emotional note</label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={entry.emotionalNotes ?? 'Capture discipline, hesitation, or execution context.'}
          className="min-h-24 w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
        />
        <Button
          variant="outline"
          className="border-white/15 bg-white/4 text-white hover:bg-white/10"
          disabled={saving || !note.trim()}
          onClick={async () => {
            setSaving(true);
            try {
              await onSaveNote(entry.trackingId, note.trim());
              setNote('');
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
          Save Note
        </Button>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: FindTradeInsight }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(160deg,rgba(13,17,23,0.94),rgba(10,14,20,0.82))] p-5">
      <div className="text-[0.68rem] uppercase tracking-[0.24em] text-white/35">{insight.insightType.replace(/_/g, ' ')}</div>
      <div className="mt-3 text-lg font-semibold text-white">{insight.headline}</div>
      <p className="mt-3 text-sm leading-7 text-white/70">{insight.detail}</p>
      {insight.metricValue != null ? <div className="mt-4 text-sm font-semibold text-[var(--gold-light)]">Metric: {insight.metricValue}</div> : null}
    </div>
  );
}

export function FindMyTradeWorkspace() {
  const { token, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<FindTradeStatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [scanMessageIndex, setScanMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }

    let mounted = true;
    setLoading(true);
    api.findTrade.getStatus('latest', token)
      .then((payload) => {
        if (mounted) {
          setStatus(payload);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err?.message ?? 'Unable to load Find My Trade.');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [token, authLoading]);

  useEffect(() => {
    if (!busyAction || !busyAction.startsWith('scan')) {
      return;
    }

    const timer = window.setInterval(() => {
      setScanMessageIndex((current) => (current + 1) % SCAN_MESSAGES.length);
    }, 1500);

    return () => {
      window.clearInterval(timer);
    };
  }, [busyAction]);

  const isScanning = busyAction === 'scan' || busyAction === 'refresh';
  const scanHeadline = useMemo(() => SCAN_MESSAGES[scanMessageIndex], [scanMessageIndex]);

  const refreshStatus = async () => {
    if (!token) return;
    const payload = await api.findTrade.getStatus('latest', token);
    setStatus(payload);
  };

  const runScan = async (mode: 'on_demand' | 'manual_refresh') => {
    if (!token) return;
    setBusyAction(mode === 'manual_refresh' ? 'refresh' : 'scan');
    setError(null);
    try {
      const payload = await api.findTrade.scan(token, mode);
      setStatus(payload);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to scan right now.');
    } finally {
      setBusyAction(null);
      setScanMessageIndex(0);
    }
  };

  const handleOpportunityAction = async (
    opportunity: FindTradeOpportunity,
    action: 'entered' | 'watchlist' | 'ignore' | 'not_yet',
  ) => {
    if (!token) return;
    setBusyAction(`${action}:${opportunity.id}`);
    setError(null);
    try {
      const payload = await api.findTrade.decide({ opportunityId: opportunity.id, action }, token);
      setStatus(payload);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to update this setup.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleReset = async () => {
    if (!token) return;
    setBusyAction('reset');
    setError(null);
    try {
      const payload = await api.findTrade.reset(token);
      setStatus(payload);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to reset scans.');
    } finally {
      setBusyAction(null);
    }
  };

  const saveJournalNote = async (trackingId: string, note: string) => {
    if (!token) return;
    await api.journal.addNote({ trackingId, note }, token);
    await refreshStatus();
  };

  if (loading) {
    return (
      <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(160deg,rgba(12,16,22,0.96),rgba(8,11,16,0.88))] p-8 text-white">
        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.24em] text-white/45">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Find My Trade
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <section className="relative overflow-hidden rounded-[34px] border border-[rgba(255,223,112,0.18)] bg-[radial-gradient(circle_at_top_left,rgba(255,223,112,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.12),transparent_28%),linear-gradient(160deg,rgba(10,14,20,0.98),rgba(7,10,15,0.9))] p-6 sm:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)] blur-3xl md:block" />
        <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,223,112,0.18)] bg-[rgba(255,223,112,0.08)] px-3 py-1 text-[0.68rem] uppercase tracking-[0.26em] text-[var(--gold-light)]">
              <Sparkles className="h-3.5 w-3.5" />
              Pro+ AI Trading Workflow Assistant
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-[-0.06em] text-white sm:text-5xl">Find My Trade</h1>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-white/72 sm:text-base">
              Trigger a premium market scan only when you want it. The backend ranks current opportunities, surfaces developing setups, and starts monitoring only after you confirm entry.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-[linear-gradient(135deg,rgba(255,223,112,0.96),rgba(171,124,29,0.92))] text-[#160f04] hover:brightness-105"
                onClick={() => runScan('on_demand')}
                disabled={Boolean(busyAction)}
              >
                {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crosshair className="mr-2 h-4 w-4" />}
                Find My Trade
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/15 bg-white/[0.04] text-white hover:bg-white/10"
                onClick={() => runScan('manual_refresh')}
                disabled={Boolean(busyAction)}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh Scan
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/15 bg-transparent text-white/72 hover:bg-white/8"
                onClick={handleReset}
                disabled={Boolean(busyAction)}
              >
                <X className="mr-2 h-4 w-4" />
                Reset Daily Scan
              </Button>
            </div>

            <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/72">
              {isScanning ? scanHeadline : status?.scan ? `Latest scan generated ${formatDateTime(status.scan.generatedAt)} across ${status.scan.enabledCategories.length} enabled market groups.` : 'No scan has been run yet today. Trigger the workflow when you want fresh trade intelligence.'}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[0.68rem] uppercase tracking-[0.24em] text-white/35">Scanner mode</div>
              <div className="mt-3 text-xl font-semibold text-white">On-demand only</div>
              <p className="mt-2 text-sm leading-7 text-white/66">No continuous background scanning. Market analysis only runs when you manually trigger it.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[0.68rem] uppercase tracking-[0.24em] text-white/35">Tracking scope</div>
              <div className="mt-3 text-xl font-semibold text-white">Entered trades only</div>
              <p className="mt-2 text-sm leading-7 text-white/66">The monitor sends updates only for positions you explicitly confirm, keeping load and noise under control.</p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[24px] border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-100">{error}</div>
      ) : null}

      {status?.bestOpportunity ? (
        <OpportunityCard
          opportunity={status.bestOpportunity}
          primary
          onAction={(action) => handleOpportunityAction(status.bestOpportunity!, action)}
        />
      ) : status?.noTradeState ? (
        <section className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,223,112,0.08),transparent_28%),linear-gradient(160deg,rgba(13,17,23,0.94),rgba(10,14,20,0.84))] p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/35">No trade state</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">Patience remains the highest-quality decision.</h2>
              <p className="mt-4 text-sm leading-8 text-white/70">{status.noTradeState.emptyStateMessage ?? 'No high-quality setups detected right now.'}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm text-white/68">
              <div className="font-semibold text-white">Workflow preserved</div>
              <p className="mt-2 leading-7">The engine did not force a trade. Refresh later or keep watchlists saved for developing structure.</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/35">Developing opportunities</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Upcoming structure worth monitoring</h2>
            </div>
            <Compass className="h-5 w-5 text-white/35" />
          </div>

          {status?.developingOpportunities.length ? status.developingOpportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              onAction={(action) => handleOpportunityAction(opportunity, action)}
            />
          )) : (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-white/66">
              No developing setups are currently strong enough to keep on the desk.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(13,17,23,0.94),rgba(10,14,20,0.82))] p-5">
            <div className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.28em] text-white/35">
              <Bell className="h-4 w-4" />
              Notification settings
            </div>
            <div className="mt-4 space-y-3 text-sm text-white/68">
              <p>Active monitored trades: {status?.notificationSummary.activeTrades ?? 0}</p>
              <p>Recent updates sent in the last 24h: {status?.notificationSummary.recentNotifications ?? 0}</p>
              <p>Monitoring cadence: every {status?.notificationSummary.pollingIntervalMinutes ?? 15} minutes.</p>
            </div>
            <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/66">
              Browser and push delivery only apply to trades you entered. Realtime remains disabled for history, settings, and analytics.
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(13,17,23,0.94),rgba(10,14,20,0.82))] p-5">
            <div className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.28em] text-white/35">
              <Target className="h-4 w-4" />
              Saved watchlist
            </div>
            <div className="mt-4 space-y-3">
              {status?.watchlist.length ? status.watchlist.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{item.symbolLabel}</div>
                      <div className="mt-1 text-sm text-white/62">{item.timeframe} · {item.assetClass}</div>
                    </div>
                    <Badge variant="outline" className="border-white/15 bg-white/6 text-white/70">{item.direction ?? 'watch'}</Badge>
                  </div>
                </div>
              )) : (
                <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/62">Saved setups appear here after you bookmark them.</div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(13,17,23,0.94),rgba(10,14,20,0.82))] p-5">
            <div className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.28em] text-white/35">
              <TrendingUp className="h-4 w-4" />
              Setup help
            </div>
            <p className="mt-4 text-sm leading-7 text-white/68">
              Need onboarding, account binding guidance, or an assisted installation flow? Use the existing setup guide instead of treating this workspace like a signal chat feed.
            </p>
            <Link href={status?.onboarding.setupGuideUrl ?? '/goldx/setup'} className="mt-4 inline-flex">
              <Button variant="outline" className="border-white/15 bg-white/[0.04] text-white hover:bg-white/10">
                <Sparkles className="mr-2 h-4 w-4" />
                Open Setup Guide
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/35">Trade tracking status</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Only entered trades remain under monitoring</h2>
          </div>
          <Activity className="h-5 w-5 text-white/35" />
        </div>

        {status?.activeTracking.length ? status.activeTracking.map((tracking) => (
          <TrackingCard key={tracking.id} tracking={tracking} />
        )) : (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-white/66">
            No trades are being monitored. Click <strong className="text-white">Yes, I Entered</strong> on a setup to activate monitoring, notifications, and journal automation for that trade only.
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/35">AI journal preview</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Structured trade memory, not signal clutter</h2>
            </div>
            <BrainCircuit className="h-5 w-5 text-white/35" />
          </div>

          {status?.journalPreview.length ? status.journalPreview.map((entry: FindTradeJournalEntry) => (
            <JournalCard key={entry.id} entry={entry} onSaveNote={saveJournalNote} />
          )) : (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-white/66">
              Journal entries are created automatically after you confirm trade entry. Notes, outcomes, and AI reflections accumulate from there.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/35">Performance insights</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Journal-derived review signals</h2>
            </div>
            <BookmarkPlus className="h-5 w-5 text-white/35" />
          </div>

          {status?.insights.length ? status.insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          )) : (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-white/66">
              Insights appear after the journal has enough entered-trade history to summarize patterns with signal quality and session context.
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}