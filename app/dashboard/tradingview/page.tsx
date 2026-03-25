'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CandlestickChart, Crown, Loader2, RefreshCcw, ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TradingViewAdvancedChart } from '@/components/TradingViewAdvancedChart';
import { useAuth } from '@/hooks/useAuth';
import { api, type AnalysisResult } from '@/lib/api';
import { LIVE_CHART_SYMBOLS, LIVE_CHART_TIMEFRAMES, getLiveChartSymbol, getLiveChartTimeframe } from '@/lib/live-chart';

const STORAGE_KEY = 'dashboard_live_chart_state';
const CACHE_KEY = 'dashboard_live_chart_analysis_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;
const ANALYZE_DEBOUNCE_MS = 1200;

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
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredState;
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

export default function TradingViewDashboardPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('M15');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [cachedAnalysis, setCachedAnalysis] = useState<CachedAnalysis | null>(null);
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
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ symbol, timeframe }));
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

    if (!forceFresh && cacheMatchesSelection && cachedAnalysis) {
      router.push(`/analyze?analysisId=${encodeURIComponent(cachedAnalysis.analysisId)}`);
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const result = await api.analyzeLiveChart({ source: 'tradingview-live', symbol, timeframe }, token);
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
      <Card className="mobile-card">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">Loading live chart workspace...</CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="mobile-card">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Sign in to use the live TradingView analysis workspace.</p>
        </CardContent>
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
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="space-y-6 pb-28 md:pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Live Chart Analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            TradingView charting with server-side market data and Pro AI analysis.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Button variant="outline" onClick={() => void startAnalysis(true)} disabled={analyzing} className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
            Re-analyze
          </Button>
          <Button onClick={() => void startAnalysis(false)} disabled={analyzing} className="gap-2 bg-cyan-600 text-white hover:bg-cyan-500">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Analyze Chart
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <Card className="mobile-card overflow-hidden xl:self-start">
          <CardHeader className="space-y-4 border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CandlestickChart className="h-5 w-5 text-cyan-300" />
              TradingView Chart
            </CardTitle>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Symbol</label>
                <select
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-background/60 px-3 text-sm outline-none transition focus:border-cyan-400/50"
                >
                  {LIVE_CHART_SYMBOLS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Timeframe</label>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {LIVE_CHART_TIMEFRAMES.map((option) => {
                    const isActive = timeframe === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTimeframe(option.value)}
                        className={`h-10 rounded-xl border px-2 text-sm font-medium transition ${
                          isActive
                            ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200'
                            : 'border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="h-[62vh] min-h-[460px] w-full md:h-[68vh] md:min-h-[620px] xl:max-h-[820px]">
              <TradingViewAdvancedChart symbol={selectedSymbol.tvSymbol} interval={selectedTimeframe.tvInterval} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="text-lg">Analysis Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p>Fresh OHLC candles are fetched on the server at analysis time. The AI uses real market data instead of relying on the chart image alone.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                <p>The selected symbol and timeframe are injected into the analysis prompt automatically, and the result is saved in your analysis history.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardHeader>
              <CardTitle className="text-lg">Last Analyzed Result</CardTitle>
            </CardHeader>
            <CardContent>
              {cachedAnalysis ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">{cachedAnalysis.pair}</Badge>
                    <Badge variant="outline">{cachedAnalysis.timeframe}</Badge>
                    <Badge variant="outline" className="capitalize">{cachedAnalysis.signalType}</Badge>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Confidence: <span className="font-medium text-foreground">{cachedAnalysis.confidence}/100</span></p>
                    <p>Market Condition: <span className="font-medium capitalize text-foreground">{cachedAnalysis.marketCondition || 'Not identified'}</span></p>
                    <p>Primary Strategy: <span className="font-medium text-foreground">{cachedAnalysis.primaryStrategy || 'Not selected'}</span></p>
                    <p>Updated: <span className="font-medium text-foreground">{new Date(cachedAnalysis.createdAt).toLocaleString()}</span></p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/analyze?analysisId=${encodeURIComponent(cachedAnalysis.analysisId)}`}>
                      <Button variant="outline">Open Result</Button>
                    </Link>
                    <Button onClick={() => void startAnalysis(true)} disabled={analyzing} className="gap-2 bg-cyan-600 text-white hover:bg-cyan-500">
                      <RefreshCcw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
                      Re-analyze
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No cached live chart analysis yet. Run your first analysis from the chart on the left.</p>
              )}
            </CardContent>
          </Card>

          {error ? (
            <Card className="mobile-card border-red-500/30 bg-red-500/5">
              <CardContent className="flex items-start gap-3 p-4 text-sm text-red-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                <p>{error}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-background/95 p-4 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-6xl gap-3">
          <Button variant="outline" onClick={() => void startAnalysis(true)} disabled={analyzing} className="flex-1">
            Re-analyze
          </Button>
          <Button onClick={() => void startAnalysis(false)} disabled={analyzing} className="flex-1 gap-2 bg-cyan-600 text-white hover:bg-cyan-500">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {analyzing ? 'Analyzing...' : 'Analyze Chart'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}