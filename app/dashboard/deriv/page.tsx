'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, CandlestickChart, Crown, Loader2, RefreshCcw, Sparkles, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LiveChart } from '@/components/LiveChart';
import { useAuth } from '@/hooks/useAuth';
import { DERIV_ANALYSIS_CANDLE_COUNT, mapPersistedAnalysisToDerivResult, DERIV_SYMBOLS, DERIV_TIMEFRAMES, type DerivAnalysisResult, type DerivCandle, getDerivSymbol, getDerivTimeframe } from '@/lib/deriv-live';

const STORAGE_KEY = 'dashboard_deriv_chart_state';
const ANALYSIS_CACHE_KEY = 'dashboard_deriv_chart_analysis_cache';
const ANALYZE_DEBOUNCE_MS = 1200;
const ANALYSIS_CACHE_TTL_MS = 5 * 60 * 1000;

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

const DERIV_SYMBOL_GROUPS = [
  { label: 'Volatility', value: 'volatility' },
  { label: 'Volatility (1s)', value: 'volatility-1s' },
  { label: 'Jump', value: 'jump' },
  { label: 'Step', value: 'step' },
  { label: 'Boom & Crash', value: 'boom-crash' },
] as const;

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
  const { user, token, loading: authLoading } = useAuth();
  const [symbol, setSymbol] = useState('R_75');
  const [timeframe, setTimeframe] = useState('15m');
  const [candles, setCandles] = useState<DerivCandle[]>([]);
  const [analysis, setAnalysis] = useState<DerivAnalysisResult | null>(null);
  const [chartError, setChartError] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const lastAnalyzeAtRef = useRef(0);

  useEffect(() => {
    const stored = readStoredState();
    if (stored?.symbol) {
      setSymbol(stored.symbol);
    }
    if (stored?.timeframe) {
      setTimeframe(stored.timeframe);
    }
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

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3600);
  };

  const analyzeChart = async (forceFresh = false) => {
    if (analyzing || candles.length < 50) {
      return;
    }

    const now = Date.now();
    if (now - lastAnalyzeAtRef.current < ANALYZE_DEBOUNCE_MS) {
      return;
    }
    lastAnalyzeAtRef.current = now;

    if (!forceFresh) {
      const cached = readCachedAnalysis();
      if (cached && cached.symbol === symbol && cached.timeframe === timeframe) {
        setAnalysis(cached.result);
        showToast('success', 'Loaded cached Deriv analysis.');
        return;
      }
    }

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
      showToast('success', 'Deriv chart analyzed successfully.');
    } catch (error: any) {
      const message = error?.message || 'Unable to analyze this Deriv chart right now.';
      setAnalysisError(message);
      showToast('error', message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (authLoading) {
    return (
      <Card className="mobile-card">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">Loading Deriv workspace...</CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="mobile-card">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">Sign in to open the Deriv live chart workspace.</CardContent>
      </Card>
    );
  }

  if (user.subscription !== 'PRO') {
    return (
      <Card className="mobile-card overflow-hidden border-cyan-500/20 bg-cyan-500/5">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
            <Crown className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Deriv live charts are Pro only</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Upgrade to Pro to open live Deriv synthetic charts, stream candles in real time, and overlay AI zones directly on the chart.
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
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="space-y-6 pb-28 md:pb-6">
      {toast ? (
        <div className={`fixed right-4 top-4 z-50 rounded-xl border px-4 py-3 text-sm shadow-2xl ${toast.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-red-500/30 bg-red-500/10 text-red-100'}`}>
          {toast.message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Deriv Live Charts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time Deriv synthetic charts with lightweight rendering and AI overlays.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Button variant="outline" onClick={() => void analyzeChart(true)} disabled={analyzing || candles.length < 50} className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
            Re-analyze
          </Button>
          <Button onClick={() => void analyzeChart(false)} disabled={analyzing || candles.length < 50} className="gap-2 bg-cyan-600 text-white hover:bg-cyan-500">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {analyzing ? 'Analyzing...' : 'Analyze Chart'}
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card className="mobile-card overflow-hidden xl:self-start">
          <CardHeader className="space-y-4 border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CandlestickChart className="h-5 w-5 text-cyan-300" />
              Deriv Synthetic Chart
            </CardTitle>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Symbol</label>
                <select
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-background/60 px-3 text-sm outline-none transition focus:border-cyan-400/50"
                >
                  {DERIV_SYMBOL_GROUPS.map((group) => (
                    <optgroup key={group.value} label={group.label}>
                      {DERIV_SYMBOLS.filter((option) => option.category === group.value).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{selectedSymbol.description}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Timeframe</label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
                  {DERIV_TIMEFRAMES.map((option) => {
                    const isActive = timeframe === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTimeframe(option.value)}
                        className={`h-10 rounded-xl border px-2 text-sm font-medium transition ${isActive ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200' : 'border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground'}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative p-0">
            <LiveChart
              symbol={symbol}
              granularity={selectedTimeframe.granularity}
              analysis={analysis}
              onCandlesChange={setCandles}
              onError={setChartError}
              height={560}
            />

            <div className="absolute bottom-4 right-4 z-20 hidden md:block">
              <Button onClick={() => void analyzeChart(false)} disabled={analyzing || candles.length < 50} className="gap-2 rounded-full bg-cyan-600 px-5 text-white shadow-lg hover:bg-cyan-500">
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {analyzing ? 'Analyzing...' : 'Analyze Chart'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="text-lg">AI Output</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis ? (
                <div className="space-y-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">{analysis.bias}</Badge>
                    <Badge variant="outline">{analysis.setupRating}</Badge>
                    <Badge variant="outline">{analysis.confidence}/100</Badge>
                    <Badge variant="outline" className="capitalize">{analysis.verdict}</Badge>
                  </div>

                  {analysis.analysisId ? (
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/analyze?analysisId=${encodeURIComponent(analysis.analysisId)}`}>
                        <Button variant="outline">Open Full Result</Button>
                      </Link>
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Entry</p>
                      <p className="mt-2 text-lg font-semibold">{analysis.entry ?? '-'}</p>
                    </div>
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                      <p className="text-xs uppercase tracking-wide text-red-200/70">Stop Loss</p>
                      <p className="mt-2 text-lg font-semibold text-red-100">{analysis.stopLoss ?? '-'}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <p className="text-xs uppercase tracking-wide text-emerald-200/70">Take Profit</p>
                      <p className="mt-2 text-lg font-semibold text-emerald-100">{analysis.takeProfit ?? '-'}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Market Condition</p>
                    <p className="mt-2 text-sm text-foreground">{analysis.marketCondition}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Reasoning</p>
                    <p className="mt-2 leading-6 text-muted-foreground">{analysis.reasoning}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Detected Zones</p>
                    {analysis.zones.length > 0 ? analysis.zones.map((zone, index) => (
                      <div key={`${zone.type}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <Badge className={zone.type === 'demand' ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'}>{zone.type}</Badge>
                          <span className="text-xs text-muted-foreground">{Math.min(zone.start, zone.end)} - {Math.max(zone.start, zone.end)}</span>
                        </div>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No valid supply or demand zones returned.</p>}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Click Analyze Chart to generate AI zones, entry, stop loss, and take profit.</p>
                  <p>The overlay will be drawn directly on the Deriv chart once a valid setup is returned.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {chartError || analysisError ? (
            <Card className="mobile-card border-red-500/30 bg-red-500/5">
              <CardContent className="flex items-start gap-3 p-4 text-sm text-red-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                <p>{analysisError || chartError}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/95 p-4 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl gap-3">
          <Button variant="outline" onClick={() => void analyzeChart(true)} disabled={analyzing || candles.length < 50} className="flex-1">
            Re-analyze
          </Button>
          <Button onClick={() => void analyzeChart(false)} disabled={analyzing || candles.length < 50} className="flex-1 gap-2 bg-cyan-600 text-white hover:bg-cyan-500">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {analyzing ? 'Analyzing...' : 'Analyze Chart'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}