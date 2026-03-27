'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Crown, Info, Loader2, PanelRightOpen, RefreshCcw, Wifi, WifiOff, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TradingViewAdvancedChart } from '@/components/TradingViewAdvancedChart';
import { useAuth } from '@/hooks/useAuth';
import { api, type AnalysisResult } from '@/lib/api';
import { LIVE_CHART_SYMBOLS, LIVE_CHART_TIMEFRAMES, getLiveChartSymbol, getLiveChartTimeframe } from '@/lib/live-chart';

const STORAGE_KEY = 'dashboard_live_chart_state';
const CACHE_KEY = 'dashboard_live_chart_analysis_cache';
const RECENT_SYMBOLS_KEY = 'dashboard_live_chart_recent_pairs';
const CACHE_TTL_MS = 5 * 60 * 1000;
const ANALYZE_DEBOUNCE_MS = 1200;
const MAX_RECENT_SYMBOLS = 8;

interface StoredState {
  symbol: string;
  timeframe: string;
}

interface CachedAnalysis {
  symbol: string;
  timeframe: string;
  analysisId: string;
  createdAt: string;
  pair: string;
  confidence: number;
  signalType: string;
  marketCondition?: AnalysisResult['marketCondition'];
  primaryStrategy?: AnalysisResult['primaryStrategy'];
}

const readStoredState = (): StoredState | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredState) : null;
  } catch {
    return null;
  }
};

const readCachedAnalysis = (): CachedAnalysis | null => {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedAnalysis;
    if (Date.now() - new Date(parsed.createdAt).getTime() > CACHE_TTL_MS) {
      window.localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const readRecentSymbols = (): string[] => {
  try {
    const raw = window.localStorage.getItem(RECENT_SYMBOLS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const rememberRecentSymbol = (nextSymbol: string) => {
  const nextRecent = [nextSymbol, ...readRecentSymbols().filter((value) => value !== nextSymbol)].slice(0, MAX_RECENT_SYMBOLS);
  window.localStorage.setItem(RECENT_SYMBOLS_KEY, JSON.stringify(nextRecent));
  return nextRecent;
};

export default function TradingViewDashboardPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('M15');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [cachedAnalysis, setCachedAnalysis] = useState<CachedAnalysis | null>(null);
  const [recentSymbols, setRecentSymbols] = useState<string[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [chartLoading, setChartLoading] = useState(true);
  const lastAnalyzeAtRef = useRef(0);

  useEffect(() => {
    const stored = readStoredState();
    if (stored?.symbol) {
      setSymbol(stored.symbol);
    }
    if (stored?.timeframe) {
      setTimeframe(stored.timeframe);
    }

    setCachedAnalysis(readCachedAnalysis());
    setRecentSymbols(readRecentSymbols());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ symbol, timeframe }));
    setRecentSymbols(rememberRecentSymbol(symbol));
    setChartLoading(true);

    const timer = window.setTimeout(() => setChartLoading(false), 1100);
    return () => window.clearTimeout(timer);
  }, [symbol, timeframe]);

  const selectedSymbol = useMemo(() => getLiveChartSymbol(symbol), [symbol]);
  const selectedTimeframe = useMemo(() => getLiveChartTimeframe(timeframe), [timeframe]);
  const cacheMatchesSelection = cachedAnalysis?.symbol === symbol && cachedAnalysis?.timeframe === timeframe;

  const startAnalysis = async (forceFresh = false) => {
    if (!token || !user || user.subscription !== 'PRO' || analyzing) {
      return;
    }

    const now = Date.now();
    if (now - lastAnalyzeAtRef.current < ANALYZE_DEBOUNCE_MS) {
      return;
    }
    lastAnalyzeAtRef.current = now;

    setAnalyzing(true);
    setError('');

    try {
      const result = await api.analyzeLiveChart({ source: 'tradingview-live', symbol, timeframe }, token);
      if (result.queued && result.jobId) {
        router.push(`/analyze/queue?jobId=${encodeURIComponent(result.jobId)}&analysisId=${encodeURIComponent(result.analysisId || '')}&returnTo=${encodeURIComponent('/dashboard/tradingview')}`);
        return;
      }

      if (!result.analysis) {
        throw new Error('Analysis result was not returned by the server.');
      }

      const nextCache: CachedAnalysis = {
        symbol,
        timeframe,
        analysisId: result.analysis.id,
        createdAt: new Date().toISOString(),
        pair: result.analysis.pair,
        confidence: result.analysis.confidence,
        signalType: result.analysis.signalType,
        marketCondition: result.analysis.marketCondition,
        primaryStrategy: result.analysis.primaryStrategy,
      };

      window.localStorage.setItem(CACHE_KEY, JSON.stringify(nextCache));
      setCachedAnalysis(nextCache);
      router.push(`/analyze?analysisId=${encodeURIComponent(result.analysis.id)}`);
    } catch (submitError: any) {
      setError(submitError?.message || 'Unable to analyze the live chart right now.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="mobile-card max-w-md">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">Loading live chart workspace...</CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="mobile-card max-w-md">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">Sign in to use the live TradingView analysis workspace.</CardContent>
        </Card>
      </div>
    );
  }

  if (user.subscription !== 'PRO') {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="mobile-card max-w-2xl overflow-hidden border-cyan-500/20 bg-cyan-500/5">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
              <Crown className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold">Live TradingView analysis is Pro only</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Upgrade to Pro to open live TradingView charts in the dashboard, fetch real OHLC data, and analyze the selected symbol and timeframe instantly.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/pricing">
                <Button className="gap-2 bg-cyan-600 text-white hover:bg-cyan-500">
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusTone = error
    ? { label: 'Disconnected', icon: WifiOff, className: 'border-red-500/30 bg-red-500/10 text-red-100', dot: 'bg-red-400' }
    : chartLoading
      ? { label: 'Syncing chart', icon: Loader2, className: 'border-amber-500/30 bg-amber-500/10 text-amber-100', dot: 'bg-amber-300' }
      : { label: 'Live', icon: Wifi, className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100', dot: 'bg-emerald-400' };
  const StatusIcon = statusTone.icon;

  const panelContent = (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Desk</p>
          <h2 className="mt-1 text-sm font-semibold text-slate-100">AI Output</h2>
        </div>
        <Badge variant="outline" className={statusTone.className}>
          <span className={`mr-2 h-2 w-2 rounded-full ${statusTone.dot}`} />
          <StatusIcon className={`mr-1 h-3.5 w-3.5 ${chartLoading ? 'animate-spin' : ''}`} />
          {statusTone.label}
        </Badge>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
          <div className="mt-3 space-y-2 text-slate-300">
            <div className="flex items-center justify-between gap-3">
              <span>Pair</span>
              <span className="font-medium text-slate-100">{selectedSymbol.label}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Timeframe</span>
              <span className="font-medium text-slate-100">{selectedTimeframe.label}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Server analysis</span>
              <span className="font-medium text-slate-100">{analyzing ? 'Running' : cacheMatchesSelection ? 'Ready' : 'Idle'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Last analysis</p>
            {cachedAnalysis ? <Badge variant="outline">{cachedAnalysis.timeframe}</Badge> : null}
          </div>

          {cachedAnalysis ? (
            <div className="mt-3 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">{cachedAnalysis.pair}</Badge>
                <Badge variant="outline" className="capitalize">{cachedAnalysis.signalType}</Badge>
                <Badge variant="outline">{cachedAnalysis.confidence}/100</Badge>
              </div>
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span>Market condition</span>
                  <span className="font-medium capitalize text-slate-100">{cachedAnalysis.marketCondition || 'Not identified'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Primary strategy</span>
                  <span className="max-w-[10rem] truncate text-right font-medium text-slate-100">{cachedAnalysis.primaryStrategy || 'Not selected'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Updated</span>
                  <span className="text-right font-medium text-slate-100">{new Date(cachedAnalysis.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/analyze?analysisId=${encodeURIComponent(cachedAnalysis.analysisId)}`}>
                  <Button variant="outline" className="h-10 border-slate-700 bg-slate-900/70 px-4">Open Result</Button>
                </Link>
                <Button onClick={() => void startAnalysis(true)} disabled={analyzing} className="h-10 bg-blue-500 px-4 text-white hover:bg-blue-600">
                  <RefreshCcw className={`mr-2 h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
                  Re-analyze
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-slate-400">No cached result yet. Run the chart to save a fresh live analysis.</p>
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
              <p>{error}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_22%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(2,6,23,1))] p-2 sm:p-3 lg:p-4">
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/85 p-3 shadow-[0_20px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <span>Live Chart Analysis</span>
                  <button type="button" title="TradingView workspace with fast pair switching, server-side OHLC analysis, and saved live results." className="rounded-full border border-slate-700/80 p-1 text-slate-400 transition hover:border-slate-600 hover:text-slate-200">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 sm:w-[13rem]">
                      <select
                        value={symbol}
                        onChange={(event) => setSymbol(event.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400"
                      >
                        {LIVE_CHART_SYMBOLS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
                      {LIVE_CHART_TIMEFRAMES.map((option) => {
                        const isActive = timeframe === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setTimeframe(option.value)}
                            className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-blue-500 text-white shadow-[0_10px_25px_rgba(59,130,246,0.35)]' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <Button variant="outline" onClick={() => setPanelOpen(true)} className="h-11 border-slate-700 bg-slate-900/70 px-3 text-slate-100 lg:hidden">
                      <PanelRightOpen className="mr-2 h-4 w-4" />
                      Panel
                    </Button>
                    <Button variant="outline" onClick={() => void startAnalysis(true)} disabled={analyzing} className="h-11 border-slate-700 bg-slate-900/70 px-4 text-slate-100 hover:bg-slate-800">
                      <RefreshCcw className={`mr-2 h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
                      Re-analyze
                    </Button>
                    <Button onClick={() => void startAnalysis(false)} disabled={analyzing} className="h-11 bg-blue-500 px-4 text-white hover:bg-blue-600">
                      {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      {analyzing ? 'Analyzing...' : 'Analyze'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Recent</span>
              {recentSymbols.length > 0 ? recentSymbols.map((pair) => {
                const pairMeta = getLiveChartSymbol(pair);
                const isActive = pair === symbol;
                return (
                  <button
                    key={pair}
                    type="button"
                    onClick={() => setSymbol(pair)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${isActive ? 'border-blue-400/50 bg-blue-500/15 text-blue-100' : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:border-slate-600 hover:text-slate-100'}`}
                  >
                    {pairMeta.label}
                  </button>
                );
              }) : <span className="text-xs text-slate-500">Your recent pairs will appear here.</span>}
            </div>
          </div>

          <motion.div layout className="relative flex min-h-[56svh] flex-1 overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950 shadow-[0_30px_100px_rgba(2,6,23,0.45)] lg:min-h-0">
            <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/85 px-3 py-1.5 text-xs text-slate-100 backdrop-blur">
              <span className={`h-2 w-2 rounded-full ${statusTone.dot}`} />
              <StatusIcon className={`h-3.5 w-3.5 ${chartLoading ? 'animate-spin' : ''}`} />
              {statusTone.label}
            </div>

            {chartLoading || analyzing ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px]">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/90 px-5 py-4 text-sm text-slate-100 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                    <span>{analyzing ? 'Analyzing chart...' : 'Fetching data...'}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <TradingViewAdvancedChart symbol={selectedSymbol.tvSymbol} interval={selectedTimeframe.tvInterval} className="h-full w-full" />
          </motion.div>
        </div>

        <aside className="hidden h-full w-[320px] shrink-0 lg:block">{panelContent}</aside>
      </div>

      <div className={`fixed inset-0 z-40 bg-slate-950/55 transition lg:hidden ${panelOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setPanelOpen(false)} />
      <motion.div initial={false} animate={{ y: panelOpen ? 0 : '100%' }} transition={{ type: 'spring', stiffness: 340, damping: 34 }} className="fixed inset-x-0 bottom-0 z-50 h-[58svh] rounded-t-[1.75rem] border border-slate-800 bg-slate-950/98 p-3 shadow-[0_-24px_90px_rgba(2,6,23,0.6)] lg:hidden">
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-700" />
          <button type="button" onClick={() => setPanelOpen(false)} className="rounded-full border border-slate-700 p-2 text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[calc(58svh-3rem)]">{panelContent}</div>
      </motion.div>
    </motion.section>
  );
}