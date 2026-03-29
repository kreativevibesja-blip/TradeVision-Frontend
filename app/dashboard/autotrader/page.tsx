'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { api, type AnalysisResult, type TradeSignal } from '@/lib/api';
import { buildAutoTraderSignalFromAnalysis } from '@/lib/autotrader-signal';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Crown,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

const CONFIDENCE_COLORS: Record<string, string> = {
  'A+': 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  A: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
  B: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
  avoid: 'border-rose-400/40 bg-rose-400/10 text-rose-100',
};

const STATUS_COPY: Record<string, string> = {
  pending: 'Ready to send',
  ready: 'Trade sent',
  executed: 'Executed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

const formatTradePrice = (value: number, symbol: string) => {
  const digits = Math.abs(value) >= 100 ? 2 : symbol.includes('JPY') || Math.abs(value) >= 1 ? 3 : 5;
  return value.toFixed(digits);
};

const formatCountdown = (createdAt: string, now: number) => {
  const expiresAt = new Date(createdAt).getTime() + 15 * 60 * 1000;
  const remaining = Math.max(0, expiresAt - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

function OneTapTradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const incomingSignalId = searchParams.get('signalId');
  const { user, token, loading: authLoading } = useAuth();
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executeSuccess, setExecuteSuccess] = useState(false);
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(Date.now());
  const [rippleKey, setRippleKey] = useState(0);
  const [focusedSignalId, setFocusedSignalId] = useState<string | null>(incomingSignalId);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const [signalsResult, analysesResult] = await Promise.all([
        api.autotrader.getSignals(token),
        api.getAnalyses(token, 1),
      ]);
      setSignals(signalsResult.signals);
      setLatestAnalysis(analysesResult.analyses[0] ?? null);
    } catch {
      setNotice('Unable to refresh One-Tap Trade right now.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (incomingSignalId) {
      setFocusedSignalId(incomingSignalId);
    }
  }, [incomingSignalId]);

  useEffect(() => {
    if (token) {
      void load();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, load, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const refreshInterval = window.setInterval(() => {
      void load();
    }, 15000);

    return () => window.clearInterval(refreshInterval);
  }, [load, token]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const pendingSignals = useMemo(
    () => signals.filter((signal) => signal.status === 'pending' || signal.status === 'ready'),
    [signals],
  );
  const historicalSignals = useMemo(
    () => signals.filter((signal) => signal.status === 'executed' || signal.status === 'cancelled' || signal.status === 'expired'),
    [signals],
  );

  useEffect(() => {
    if (focusedSignalId && signals.some((signal) => signal.id === focusedSignalId)) {
      return;
    }

    const nextSignal = pendingSignals[0] ?? historicalSignals[0] ?? null;
    setFocusedSignalId(nextSignal?.id ?? null);
  }, [focusedSignalId, historicalSignals, pendingSignals, signals]);

  const activeSignal = useMemo(
    () => signals.find((signal) => signal.id === focusedSignalId) ?? pendingSignals[0] ?? historicalSignals[0] ?? null,
    [focusedSignalId, historicalSignals, pendingSignals, signals],
  );

  useEffect(() => {
    setExecuteSuccess(false);
  }, [activeSignal?.id]);

  const createSignalFromAnalysis = async (analysis: AnalysisResult) => {
    if (!token) {
      return null;
    }

    const draft = buildAutoTraderSignalFromAnalysis(analysis);
    if (!draft) {
      throw new Error('No usable One-Tap setup could be generated from the current market state.');
    }

    const { signal } = await api.autotrader.createSignal(draft, token);
    setSignals((current) => [signal, ...current.filter((item) => item.id !== signal.id)]);
    setFocusedSignalId(signal.id);
    router.replace(`/dashboard/autotrader?signalId=${encodeURIComponent(signal.id)}`);
    setNotice(
      draft.isOpportunistic
        ? 'Opportunistic setup generated based on current market conditions.'
        : 'Fresh One-Tap setup generated and ready to send.',
    );
    return signal;
  };

  const handleGenerateTrade = async () => {
    if (!latestAnalysis) {
      router.push('/analyze?returnTo=%2Fdashboard%2Fautotrader');
      return;
    }

    try {
      setGenerating(true);
      setNotice('');
      await createSignalFromAnalysis(latestAnalysis);
    } catch (error: any) {
      setNotice(error?.message || 'Unable to generate a new One-Tap setup right now.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateTrade = async () => {
    if (latestAnalysis) {
      await handleGenerateTrade();
      return;
    }

    if (!token || !activeSignal) {
      return;
    }

    try {
      setGenerating(true);
      setNotice('');
      const { signal } = await api.autotrader.createSignal({
        symbol: activeSignal.symbol,
        direction: activeSignal.direction,
        entryPrice: activeSignal.entryPrice,
        stopLoss: activeSignal.stopLoss,
        takeProfit: activeSignal.takeProfit,
        confidence: activeSignal.confidence,
        analysisId: activeSignal.analysisId || undefined,
      }, token);
      setSignals((current) => [signal, ...current.filter((item) => item.id !== signal.id)]);
      setFocusedSignalId(signal.id);
      setNotice('Trade regenerated from your latest live setup.');
    } catch (error: any) {
      setNotice(error?.message || 'Unable to regenerate this One-Tap setup right now.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExecuteTrade = async () => {
    if (!token || !activeSignal) {
      return;
    }

    try {
      setExecuting(true);
      setNotice('');
      setRippleKey((current) => current + 1);

      if (activeSignal.status === 'pending') {
        const { signal } = await api.autotrader.approveSignal(activeSignal.id, token);
        setSignals((current) => current.map((item) => (item.id === signal.id ? signal : item)));
      }

      setExecuteSuccess(true);
      setNotice('Trade moved into your ready queue for execution.');
    } catch (error: any) {
      setNotice(error?.message || 'Unable to send this trade right now.');
    } finally {
      setExecuting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md w-full overflow-hidden border-white/10 bg-slate-950/70">
          <CardContent className="p-8 text-center text-sm text-slate-300">Loading One-Tap Trade...</CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md w-full overflow-hidden border-white/10 bg-slate-950/70">
          <CardContent className="p-8 text-center text-sm text-slate-300">Please sign in to access One-Tap Trade.</CardContent>
        </Card>
      </div>
    );
  }

  if (user.subscription !== 'TOP_TIER') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-3xl w-full overflow-hidden border-fuchsia-500/20 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.18),_transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,1))]">
          <CardContent className="p-8 text-center sm:p-10">
            <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-fuchsia-500/10 text-fuchsia-300 shadow-[0_0_45px_rgba(217,70,239,0.18)]">
              <Zap className="h-7 w-7" />
            </div>
            <Badge className="border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-100">One-Tap Pro+</Badge>
            <h1 className="mt-4 text-3xl font-semibold text-white">One-Tap Trade is part of One-Tap Pro+</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Instant trade setups, advanced entry precision, and one-click execution flow. No clutter, no hesitation, no missed moves.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/checkout?plan=TOP_TIER">
                <Button variant="gradient" size="xl" className="gap-2 rounded-2xl px-10 shadow-[0_0_35px_rgba(59,130,246,0.25)]">
                  <Crown className="h-5 w-5" />
                  Upgrade to One-Tap Pro+
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(217,70,239,0.18),_transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.98))] p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.03),transparent)] opacity-70" />

      <div className="relative space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]"
        >
          <Card className="overflow-hidden border-white/10 bg-slate-950/50 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            <CardContent className="relative p-6 sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-100">One-Tap Trade</Badge>
                <Badge className="border-white/10 bg-white/5 text-slate-300">Instant clarity</Badge>
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">One-Tap Trade</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Instant high-quality trade setups. No guessing.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="gradient"
                  size="xl"
                  onClick={() => void handleGenerateTrade()}
                  disabled={generating}
                  className="gap-2 rounded-2xl px-8 shadow-[0_0_40px_rgba(99,102,241,0.3)]"
                >
                  {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  Generate Trade
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  onClick={() => void handleRegenerateTrade()}
                  disabled={generating || (!activeSignal && !latestAnalysis)}
                  className="rounded-2xl border-white/10 bg-white/5 px-8 text-slate-100 hover:bg-white/10"
                >
                  <RefreshCw className={`mr-2 h-5 w-5 ${generating ? 'animate-spin' : ''}`} />
                  Regenerate Trade
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Signal queue</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{pendingSignals.length}</p>
                  <p className="mt-1 text-xs text-slate-400">Fresh setups waiting for execution</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Execution queue</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{activeSignal ? STATUS_COPY[activeSignal.status] || activeSignal.status : 'Standby'}</p>
                  <p className="mt-1 text-xs text-slate-400">Built-in One-Tap workflow with no external bridge required</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Analysis source</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{latestAnalysis ? latestAnalysis.pair : 'None'}</p>
                  <p className="mt-1 text-xs text-slate-400">{latestAnalysis ? 'Latest market context ready to convert' : 'Run an analysis to seed One-Tap'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-white/10 bg-slate-950/55 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Execution flow</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">One-Tap Pipeline</h2>
                </div>
                <Badge className="border-cyan-400/30 bg-cyan-400/10 text-cyan-100">
                  Internal queue
                </Badge>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                  <p className="text-sm font-semibold text-white">One-Tap now runs as a fully in-app workflow.</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Generate a setup, review the levels, then move it into your ready queue when you want to act. The workflow stays inside the app and no external bridge is required.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Step 1</p>
                    <p className="mt-2 text-sm font-semibold text-white">Generate</p>
                    <p className="mt-2 text-xs leading-6 text-slate-400">Build a fresh setup from your latest chart analysis.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Step 2</p>
                    <p className="mt-2 text-sm font-semibold text-white">Review</p>
                    <p className="mt-2 text-xs leading-6 text-slate-400">Check entry, stop, target, confidence, and timing window.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Step 3</p>
                    <p className="mt-2 text-sm font-semibold text-white">Queue</p>
                    <p className="mt-2 text-xs leading-6 text-slate-400">Mark the setup ready and manage execution from your workflow.</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  {pendingSignals.length > 0
                    ? `${pendingSignals.length} setup${pendingSignals.length === 1 ? '' : 's'} currently waiting in the queue.`
                    : 'No setups are waiting in the queue right now.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {notice ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-white/10 bg-white/5">
              <CardContent className="flex items-center gap-3 p-4 text-sm text-slate-200">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                {notice}
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {activeSignal ? (
                <motion.div
                  key={activeSignal.id}
                  initial={{ opacity: 0, y: 24, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1, boxShadow: ['0 0 0 rgba(59,130,246,0)', '0 0 40px rgba(59,130,246,0.22)', '0 0 0 rgba(59,130,246,0)'] }}
                  exit={{ opacity: 0, y: -18, scale: 0.98 }}
                  transition={{ duration: 0.35, boxShadow: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } }}
                  className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-xl"
                >
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-[-35%] w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['0%', '230%'] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                  />

                  <div className="relative flex flex-col gap-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-fuchsia-400/30 bg-fuchsia-400/12 text-fuchsia-100">Opportunistic Setup</Badge>
                          <Badge className={CONFIDENCE_COLORS[activeSignal.confidence] || 'border-white/10 bg-white/5 text-slate-200'}>{activeSignal.confidence}</Badge>
                          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200" title="This is an aggressive opportunity setup">
                            <motion.span className="h-2.5 w-2.5 rounded-full bg-emerald-400" animate={{ opacity: [1, 0.35, 1] }} transition={{ duration: 1.1, repeat: Infinity }} />
                            Live signal
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{activeSignal.symbol} {activeSignal.direction.toUpperCase()}</h2>
                          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${activeSignal.direction === 'buy' ? 'bg-emerald-400/12 text-emerald-200 shadow-[0_0_25px_rgba(74,222,128,0.18)]' : 'bg-rose-400/12 text-rose-200 shadow-[0_0_25px_rgba(251,113,133,0.18)]'}`}>
                            {activeSignal.direction === 'buy' ? 'BUY' : 'SELL'}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                          <span>Generated based on current market conditions</span>
                          <span className="inline-flex items-center gap-1 text-slate-400" title="This is an aggressive opportunity setup">
                            <Info className="h-3.5 w-3.5" />
                            Aggressive opportunity
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Entry window</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{formatCountdown(activeSignal.createdAt, now)}</p>
                        <p className="mt-1 text-xs text-slate-400">Counted from signal creation</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Entry</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{formatTradePrice(activeSignal.entryPrice, activeSignal.symbol)}</p>
                      </div>
                      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-rose-200/80">SL</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-rose-100">{formatTradePrice(activeSignal.stopLoss, activeSignal.symbol)}</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-200/80">TP</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-100">{formatTradePrice(activeSignal.takeProfit, activeSignal.symbol)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-slate-300">
                        Status: <span className="font-medium text-white">{STATUS_COPY[activeSignal.status] || activeSignal.status}</span>
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="relative">
                        <Button
                          size="xl"
                          onClick={() => void handleExecuteTrade()}
                          disabled={executing || activeSignal.status === 'cancelled' || activeSignal.status === 'expired'}
                          className="relative min-w-[220px] overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-[0_18px_45px_rgba(59,130,246,0.28)] transition-transform hover:scale-[1.01] hover:from-blue-400 hover:to-fuchsia-500"
                        >
                          <AnimatePresence>
                            {rippleKey > 0 ? (
                              <motion.span
                                key={rippleKey}
                                initial={{ scale: 0, opacity: 0.5 }}
                                animate={{ scale: 2.4, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.55, ease: 'easeOut' }}
                                className="pointer-events-none absolute inset-0 mx-auto my-auto h-20 w-20 rounded-full bg-white/20"
                              />
                            ) : null}
                          </AnimatePresence>
                          {executing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : executeSuccess || activeSignal.status === 'ready' ? <CheckCircle2 className="mr-2 h-5 w-5" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                          {executing ? 'Executing...' : executeSuccess || activeSignal.status === 'ready' ? 'Trade Sent ✅' : 'Execute Trade'}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <Card className="overflow-hidden border-dashed border-white/10 bg-white/[0.03]">
                    <CardContent className="flex min-h-[340px] flex-col items-center justify-center p-8 text-center">
                      <div className="rounded-3xl bg-cyan-400/10 p-4 text-cyan-200"><Bot className="h-7 w-7" /></div>
                      <h2 className="mt-5 text-2xl font-semibold text-white">No active One-Tap setup yet</h2>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                        Generate a new trade from your latest analysis, or send a setup from the analysis workspace to see it animate here instantly.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <Card className="overflow-hidden border-white/10 bg-slate-950/55 backdrop-blur-xl">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Trade queue</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Recent One-Tap setups</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => void load()} className="text-slate-300 hover:bg-white/5 hover:text-white">
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                  </Button>
                </div>

                <div className="mt-5 space-y-3">
                  {pendingSignals.length > 0 ? pendingSignals.slice(0, 4).map((signal) => (
                    <button
                      key={signal.id}
                      type="button"
                      onClick={() => setFocusedSignalId(signal.id)}
                      className={`w-full rounded-2xl border p-4 text-left transition-all ${signal.id === activeSignal?.id ? 'border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_25px_rgba(34,211,238,0.08)]' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-2xl p-3 ${signal.direction === 'buy' ? 'bg-emerald-400/10 text-emerald-200' : 'bg-rose-400/10 text-rose-200'}`}>
                            {signal.direction === 'buy' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{signal.symbol} {signal.direction.toUpperCase()}</p>
                            <p className="mt-1 text-xs text-slate-400">Entry {formatTradePrice(signal.entryPrice, signal.symbol)} · TP {formatTradePrice(signal.takeProfit, signal.symbol)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={CONFIDENCE_COLORS[signal.confidence] || 'border-white/10 bg-white/5 text-slate-200'}>{signal.confidence}</Badge>
                          <Badge className="border-white/10 bg-white/5 text-slate-200">{STATUS_COPY[signal.status] || signal.status}</Badge>
                        </div>
                      </div>
                    </button>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
                      No queued setups yet. Send a chart analysis to One-Tap to populate this rail.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="overflow-hidden border-white/10 bg-slate-950/55 backdrop-blur-xl">
              <CardContent className="p-5 sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Strategy note</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Why this feels instant</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  One-Tap Trade always extracts the best available setup from your latest market context. If the main call is conservative, it still surfaces an opportunistic version so you can decide quickly instead of staring at a wait signal.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-white/10 bg-slate-950/55 backdrop-blur-xl">
              <CardContent className="p-5 sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Trade history</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Recent outcomes</h3>
                <div className="mt-4 space-y-3">
                  {historicalSignals.length > 0 ? historicalSignals.slice(0, 5).map((signal) => (
                    <div key={signal.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{signal.symbol} {signal.direction.toUpperCase()}</p>
                          <p className="mt-1 text-xs text-slate-400">{new Date(signal.createdAt).toLocaleString()}</p>
                        </div>
                        <Badge className="border-white/10 bg-white/5 text-slate-200">{STATUS_COPY[signal.status] || signal.status}</Badge>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-400">
                      Executed and archived trades will appear here.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function OneTapTradeFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md w-full overflow-hidden border-white/10 bg-slate-950/70">
        <CardContent className="p-8 text-center text-sm text-slate-300">Loading One-Tap Trade...</CardContent>
      </Card>
    </div>
  );
}

export default function AutoTraderPage() {
  return (
    <Suspense fallback={<OneTapTradeFallback />}>
      <OneTapTradeContent />
    </Suspense>
  );
}
