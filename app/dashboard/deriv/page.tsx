'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Crown, Info, Loader2, PanelRightOpen, RefreshCcw, Wifi, WifiOff, X, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LiveChart, type LiveChartStatus } from '@/components/LiveChart';
import { OneTapWorkflowPanel } from '@/components/OneTapWorkflowPanel';
import { useAuth } from '@/hooks/useAuth';
import { api, type AnalysisResult } from '@/lib/api';
import { buildAutoTraderSignalFromAnalysis, buildAutoTraderSignalFromDerivAnalysis } from '@/lib/autotrader-signal';
import { DERIV_ANALYSIS_CANDLE_COUNT, DERIV_SYMBOLS, DERIV_TIMEFRAMES, mapPersistedAnalysisToDerivResult, type DerivAnalysisResult, type DerivCandle, getDerivSymbol, getDerivTimeframe } from '@/lib/deriv-live';
import { mapAnalysisResultToChartOverlay, mapDerivAnalysisToChartOverlay, toChartCandles } from '@/lib/live-chart-drawings';

const STORAGE_KEY = 'dashboard_deriv_chart_state';
const ANALYSIS_CACHE_KEY = 'dashboard_deriv_chart_analysis_cache';
const ANALYZE_DEBOUNCE_MS = 1200;
const ANALYSIS_CACHE_TTL_MS = 5 * 60 * 1000;
const ONE_TAP_WORKFLOW_STEPS = [
  'Reading the live candle flow...',
  'Checking support, resistance, and confirmations...',
  'Building your One-Tap trade plan...',
  'Opening One-Tap Trade...',
];

interface StoredState {
  symbol: string;
  timeframe: string;
}

interface CachedAnalysis {
  symbol: string;
  timeframe: string;
  savedAt: string;
  analysisId: string;
  result: DerivAnalysisResult;
}

const DERIV_SYMBOL_GROUPS = [
  { label: 'Volatility', value: 'volatility' },
  { label: 'Volatility (1s)', value: 'volatility-1s' },
  { label: 'Jump', value: 'jump' },
  { label: 'Step', value: 'step' },
  { label: 'Boom & Crash', value: 'boom-crash' },
] as const;

const formatTradingPrice = (value: number | null) => {
  if (value == null || !Number.isFinite(value)) {
    return '-';
  }

  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
};

const deriveKeyLevels = (zones: DerivAnalysisResult['zones']) => {
  const supportCandidates = zones.filter((zone) => zone.type === 'demand').map((zone) => Math.max(zone.start, zone.end));
  const resistanceCandidates = zones.filter((zone) => zone.type === 'supply').map((zone) => Math.min(zone.start, zone.end));

  return {
    support: supportCandidates.length > 0 ? supportCandidates[0] : null,
    resistance: resistanceCandidates.length > 0 ? resistanceCandidates[0] : null,
  };
};

const readStoredState = (): StoredState | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredState) : null;
  } catch {
    return null;
  }
};

const readCachedAnalysis = (): CachedAnalysis | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ANALYSIS_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CachedAnalysis;
    if (Date.now() - new Date(parsed.savedAt).getTime() > ANALYSIS_CACHE_TTL_MS) {
      window.localStorage.removeItem(ANALYSIS_CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export default function DerivDashboardPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [symbol, setSymbol] = useState('R_75');
  const [timeframe, setTimeframe] = useState('15m');
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [candles, setCandles] = useState<DerivCandle[]>([]);
  const [analysis, setAnalysis] = useState<DerivAnalysisResult | null>(null);
  const [persistedAnalysis, setPersistedAnalysis] = useState<AnalysisResult | null>(null);
  const [chartError, setChartError] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveChartStatus>({ connectionState: 'connecting', loadingHistory: true, candleCount: 0 });
  const [autotraderMessage, setAutotraderMessage] = useState('');
  const [sendingToAutotrader, setSendingToAutotrader] = useState(false);
  const lastAnalyzeAtRef = useRef(0);

  useEffect(() => {
    const stored = readStoredState();
    if (stored?.symbol) {
      setSymbol(stored.symbol);
    }
    if (stored?.timeframe) {
      setTimeframe(stored.timeframe);
    }
    setWorkspaceReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ symbol, timeframe }));
  }, [symbol, timeframe]);

  useEffect(() => {
    const cached = readCachedAnalysis();
    if (cached && cached.symbol === symbol && cached.timeframe === timeframe) {
      setAnalysis(cached.result);
    } else {
      setAnalysis(null);
    }
  }, [symbol, timeframe]);

  const selectedTimeframe = useMemo(() => getDerivTimeframe(timeframe), [timeframe]);
  const selectedSymbol = useMemo(() => getDerivSymbol(symbol), [symbol]);
  const chartOverlay = useMemo(
    () =>
      persistedAnalysis
        ? mapAnalysisResultToChartOverlay(persistedAnalysis, toChartCandles(candles), { useZoneBoxes: true })
        : mapDerivAnalysisToChartOverlay(analysis, toChartCandles(candles)),
    [analysis, candles, persistedAnalysis]
  );
  const keyLevels = useMemo(() => deriveKeyLevels(analysis?.zones ?? []), [analysis?.zones]);

  useEffect(() => {
    if (!token || !analysis?.analysisId) {
      setPersistedAnalysis(null);
      return;
    }

    let active = true;

    void api
      .getAnalysis(analysis.analysisId, token)
      .then(({ analysis: persisted }) => {
        if (active) {
          setPersistedAnalysis(persisted);
        }
      })
      .catch(() => {
        if (active) {
          setPersistedAnalysis(null);
        }
      });

    return () => {
      active = false;
    };
  }, [analysis?.analysisId, token]);

  const analyzeChart = async (forceFresh = false) => {
    if (analyzing || candles.length < 50) {
      return;
    }

    const now = Date.now();
    if (now - lastAnalyzeAtRef.current < ANALYZE_DEBOUNCE_MS) {
      return;
    }
    lastAnalyzeAtRef.current = now;

    try {
      setAnalyzing(true);
      setAnalysisError('');

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol,
          timeframe,
          candles: candles.slice(-DERIV_ANALYSIS_CANDLE_COUNT),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed.');
      }

      if (data.queued && data.jobId) {
        const queuedCache: CachedAnalysis = {
          symbol,
          timeframe,
          savedAt: new Date().toISOString(),
          analysisId: data.analysisId || data.jobId,
          result: {
            analysisId: data.analysisId || data.jobId,
            bias: 'none',
            entry: null,
            stopLoss: null,
            takeProfit: null,
            confidence: 0,
            setupRating: 'avoid',
            marketCondition: 'loading',
            verdict: 'wait',
            reasoning: 'Queued live analysis is in progress.',
            zones: [],
          },
        };

        window.localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(queuedCache));
        setAnalysis(queuedCache.result);
        router.push(`/analyze/queue?jobId=${encodeURIComponent(data.jobId)}&analysisId=${encodeURIComponent(data.analysisId || '')}&returnTo=${encodeURIComponent('/dashboard/deriv')}`);
        return;
      }

      if (!data.analysis?.id) {
        throw new Error('Persisted analysis was not returned by the server.');
      }

      const mappedResult = mapPersistedAnalysisToDerivResult(data.analysis, candles.slice(-DERIV_ANALYSIS_CANDLE_COUNT));

      const nextCache: CachedAnalysis = {
        symbol,
        timeframe,
        savedAt: new Date().toISOString(),
        analysisId: data.analysis.id,
        result: mappedResult,
      };

      window.localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(nextCache));
      setAnalysis(mappedResult);
    } catch (error: any) {
      setAnalysisError(error?.message || 'Unable to analyze this Deriv chart right now.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (authLoading || !workspaceReady) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="mobile-card max-w-md">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">Loading Deriv workspace...</CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="mobile-card max-w-md">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">Sign in to open the Deriv live chart workspace.</CardContent>
        </Card>
      </div>
    );
  }

  if (user.subscription === 'FREE') {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="mobile-card max-w-2xl overflow-hidden border-cyan-500/20 bg-cyan-500/5">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
              <Crown className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold">Deriv live charts are available on paid plans</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Upgrade to Pro or One-Tap Pro+ to open live Deriv synthetic charts, stream candles in real time, and overlay AI zones directly on the chart.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/pricing">
                <Button className="gap-2 bg-cyan-600 text-white hover:bg-cyan-500">
                  <Crown className="h-4 w-4" />
                  Upgrade Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasError = Boolean(chartError || analysisError);
  const statusTone = hasError
    ? { label: 'Disconnected', icon: WifiOff, className: 'border-red-500/30 bg-red-500/10 text-red-100', dot: 'bg-red-400' }
    : liveStatus.loadingHistory
      ? { label: 'Fetching data', icon: Loader2, className: 'border-amber-500/30 bg-amber-500/10 text-amber-100', dot: 'bg-amber-300' }
      : liveStatus.connectionState === 'connected'
        ? { label: 'Live', icon: Wifi, className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100', dot: 'bg-emerald-400' }
        : { label: 'Connecting', icon: Loader2, className: 'border-sky-500/30 bg-sky-500/10 text-sky-100', dot: 'bg-sky-300' };
  const StatusIcon = statusTone.icon;

  const handleSendToAutotrader = async () => {
    if (!token || sendingToAutotrader) {
      return;
    }

    if (candles.length < 50) {
      setAutotraderMessage('Not enough live candle data is loaded yet for One-Tap analysis.');
      return;
    }

    try {
      setSendingToAutotrader(true);
      setAutotraderMessage('');

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          symbol,
          timeframe,
          candles: candles.slice(-DERIV_ANALYSIS_CANDLE_COUNT),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'One-Tap analysis failed.');
      }

      if (data.queued && data.jobId) {
        router.push(`/analyze/queue?jobId=${encodeURIComponent(data.jobId)}&analysisId=${encodeURIComponent(data.analysisId || '')}&returnTo=${encodeURIComponent('/dashboard/deriv')}`);
        return;
      }

      if (!data.analysis?.id) {
        throw new Error('One-Tap analysis did not return a persisted result.');
      }

      const mappedResult = mapPersistedAnalysisToDerivResult(data.analysis, candles.slice(-DERIV_ANALYSIS_CANDLE_COUNT));
      const nextCache: CachedAnalysis = {
        symbol,
        timeframe,
        savedAt: new Date().toISOString(),
        analysisId: data.analysis.id,
        result: mappedResult,
      };

      window.localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(nextCache));
      setAnalysis(mappedResult);
      setPersistedAnalysis(data.analysis);

      const draft = buildAutoTraderSignalFromAnalysis(data.analysis);

      if (!draft) {
        throw new Error('NO TRADE: One-Tap only issues an opportunistic setup when the market state is valid, price is reacting at support or resistance, at least 2 confirmations are present, and the setup score is 5 or higher.');
      }

      const { signal } = await api.autotrader.createSignal(draft, token);
      router.push(`/dashboard/autotrader?signalId=${encodeURIComponent(signal.id)}&workflow=one-tap&source=deriv`);
    } catch (sendError: any) {
      setAutotraderMessage(sendError?.message || 'Unable to analyze this Deriv chart with One-Tap Trade.');
    } finally {
      setSendingToAutotrader(false);
    }
  };

  const panelContent = (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Desk</p>
          <h2 className="mt-1 text-sm font-semibold text-slate-100">AI Output</h2>
        </div>
        <Badge variant="outline" className={statusTone.className}>
          <span className={`mr-2 h-2 w-2 rounded-full ${statusTone.dot}`} />
          <StatusIcon className={`mr-1 h-3.5 w-3.5 ${liveStatus.loadingHistory ? 'animate-spin' : ''}`} />
          {statusTone.label}
        </Badge>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Status</p>
          <div className="mt-3 space-y-2 text-slate-300">
            <div className="flex items-center justify-between gap-3">
              <span>Symbol</span>
              <span className="font-medium text-slate-100">{selectedSymbol.label}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Timeframe</span>
              <span className="font-medium text-slate-100">{selectedTimeframe.label}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Loaded candles</span>
              <span className="font-medium text-slate-100">{liveStatus.candleCount}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Analysis state</span>
              <span className="font-medium text-slate-100">{analyzing ? 'Running' : analysis ? 'Ready' : 'Idle'}</span>
            </div>
          </div>
        </div>

        {analysis ? (
          <>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">{analysis.bias}</Badge>
                <Badge variant="outline">{analysis.setupRating}</Badge>
                <Badge variant="outline">{analysis.confidence}/100</Badge>
                <Badge variant="outline" className="capitalize">{analysis.verdict}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Entry</p>
                  <p className="mt-2 break-words text-base font-semibold tabular-nums text-slate-100">{formatTradingPrice(analysis.entry)}</p>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-red-200/70">Stop</p>
                  <p className="mt-2 break-words text-base font-semibold tabular-nums text-red-100">{formatTradingPrice(analysis.stopLoss)}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/70">Target</p>
                  <p className="mt-2 break-words text-base font-semibold tabular-nums text-emerald-100">{formatTradingPrice(analysis.takeProfit)}</p>
                </div>
              </div>

              {analysis.analysisId ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/analyze?analysisId=${encodeURIComponent(analysis.analysisId)}`}>
                    <Button variant="outline" className="h-10 border-slate-700 bg-slate-900/70 px-4">Open Full Result</Button>
                  </Link>
                  {user?.subscription === 'TOP_TIER' ? (
                    <Button onClick={() => void handleSendToAutotrader()} disabled={sendingToAutotrader} className="h-10 bg-emerald-600 px-4 text-white hover:bg-emerald-500">
                      {sendingToAutotrader ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      Analyze with One-Tap
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {autotraderMessage ? <p className="mt-3 text-xs text-slate-400">{autotraderMessage}</p> : null}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Reasoning</p>
              <p className="mt-3 leading-6 text-slate-300">{analysis.reasoning}</p>
            </div>

            {analysis.counterTrendPlan && analysis.counterTrendPlan.bias !== 'none' ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-300" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200/80">Counter-trend idea</p>
                  <Badge variant="outline" className="border-rose-400/30 bg-rose-500/10 text-rose-100">Aggressive</Badge>
                </div>
                <p className="mt-3 text-xs leading-5 text-rose-100/90">{analysis.counterTrendPlan.warning}</p>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Bias / Action</p>
                    <p className="mt-2 text-sm font-semibold capitalize text-slate-100">{analysis.counterTrendPlan.bias} · {analysis.counterTrendPlan.action}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Entry</p>
                    <p className="mt-2 text-sm font-semibold tabular-nums text-slate-100">{formatTradingPrice(analysis.counterTrendPlan.entry)}</p>
                  </div>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-red-200/70">Stop</p>
                    <p className="mt-2 text-sm font-semibold tabular-nums text-red-100">{formatTradingPrice(analysis.counterTrendPlan.stopLoss)}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-200/70">Target</p>
                    <p className="mt-2 text-sm font-semibold tabular-nums text-emerald-100">{formatTradingPrice(analysis.counterTrendPlan.takeProfit)}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{analysis.counterTrendPlan.reason}</p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Key levels</p>
              <div className="mt-3 space-y-2">
                {keyLevels.support != null || keyLevels.resistance != null ? (
                  <>
                    {keyLevels.support != null ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                        <Badge className="bg-emerald-500/10 text-emerald-200">Support</Badge>
                        <span className="text-xs tabular-nums text-slate-300">{formatTradingPrice(keyLevels.support)}</span>
                      </div>
                    ) : null}
                    {keyLevels.resistance != null ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                        <Badge className="bg-amber-500/10 text-amber-200">Resistance</Badge>
                        <span className="text-xs tabular-nums text-slate-300">{formatTradingPrice(keyLevels.resistance)}</span>
                      </div>
                    ) : null}
                  </>
                ) : <p className="text-slate-400">No valid support or resistance levels were returned.</p>}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-slate-400">
            Run Analyze to generate support and resistance levels, entry levels, and a persisted Deriv result.
          </div>
        )}

        {hasError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
              <p>{analysisError || chartError}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex h-full min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(8,145,178,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(2,6,23,1))] p-2 sm:p-3 lg:p-4">
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="rounded-2xl border border-slate-800/90 bg-slate-900/85 p-3 shadow-[0_20px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <span>Deriv Live Charts</span>
                  <button type="button" title="Deriv synthetic workspace with websocket candles, quick switching, and persisted AI overlays." className="rounded-full border border-slate-700/80 p-1 text-slate-400 transition hover:border-slate-600 hover:text-slate-200">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 sm:w-[15rem]">
                      <select
                        value={symbol}
                        onChange={(event) => setSymbol(event.target.value)}
                        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-400"
                      >
                        {DERIV_SYMBOL_GROUPS.map((group) => (
                          <optgroup key={group.value} label={group.label}>
                            {DERIV_SYMBOLS.filter((option) => option.category === group.value).map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
                      {DERIV_TIMEFRAMES.map((option) => {
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
                    <Button variant="outline" onClick={() => void analyzeChart(true)} disabled={analyzing || candles.length < 50} className="h-11 border-slate-700 bg-slate-900/70 px-4 text-slate-100 hover:bg-slate-800">
                      <RefreshCcw className={`mr-2 h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
                      Re-analyze
                    </Button>
                    <Button onClick={() => void analyzeChart(false)} disabled={analyzing || candles.length < 50} className="h-11 bg-blue-500 px-4 text-white hover:bg-blue-600">
                      {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                      {analyzing ? 'Analyzing...' : 'Analyze'}
                    </Button>
                    {user?.subscription === 'TOP_TIER' ? (
                      <Button onClick={() => void handleSendToAutotrader()} disabled={sendingToAutotrader || candles.length < 50} className="h-11 bg-emerald-600 px-4 text-white hover:bg-emerald-500">
                        {sendingToAutotrader ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                        Analyze with One-Tap
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

          </div>

          <motion.div layout className="relative flex min-h-[56svh] flex-1 overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-950 shadow-[0_30px_100px_rgba(2,6,23,0.45)] lg:min-h-0">
            {analyzing ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/55 backdrop-blur-[2px]">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/90 px-5 py-4 text-sm text-slate-100 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                    <span>Analyzing chart...</span>
                  </div>
                </div>
              </div>
            ) : null}

            {workspaceReady ? (
              <LiveChart
                symbol={symbol}
                granularity={selectedTimeframe.granularity}
                overlay={chartOverlay}
                onCandlesChange={setCandles}
                onError={setChartError}
                onStatusChange={setLiveStatus}
                className="rounded-none"
              />
            ) : null}
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
      <OneTapWorkflowPanel
        open={sendingToAutotrader}
        title="Analyzing this Deriv chart"
        subtitle="One-Tap is reviewing the live candles, validating the setup, and loading the finished trade plan page."
        steps={ONE_TAP_WORKFLOW_STEPS}
        fullscreen
      />
    </motion.section>
  );
}