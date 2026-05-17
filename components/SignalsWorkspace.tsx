'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CandlestickChart,
  Clock3,
  Crown,
  History,
  Loader2,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Waves,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LiveChart, type LiveChartStatus } from '@/components/LiveChart';
import { TradingViewLiveChart } from '@/components/TradingViewLiveChart';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { calculateEmaSeries } from '@/lib/ema';
import {
  DERIV_SYMBOLS,
  DERIV_TIMEFRAMES,
  getDerivSymbol,
  getDerivTimeframe,
  type DerivCandle,
} from '@/lib/deriv-live';
import {
  LIVE_CHART_SYMBOLS,
  LIVE_CHART_TIMEFRAMES,
  getLiveChartSymbol,
  getLiveChartTimeframe,
} from '@/lib/live-chart';
import type { ChartOverlaySet } from '@/lib/live-chart-drawings';

type SignalSession = 'asian' | 'london' | 'newyork';
type SignalDirection = 'buy' | 'sell';
type SignalSource = 'deriv' | 'tradingview';

interface SignalsWorkspaceProps {
  source?: SignalSource;
}

interface SessionSignal {
  id: string;
  session: SignalSession;
  direction: SignalDirection;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  risk: number;
  confidence: number;
  candleTime: number;
  zoneLow: number;
  zoneHigh: number;
  zoneStartTime: number;
  zoneEndTime: number;
  ema50: number;
  ema200: number;
  reason: string;
  setupLabel: string;
  executionNote: string;
}

interface PersistedSignalRecord {
  key: string;
  source: SignalSource;
  assetClass: string;
  session: SignalSession;
  direction: SignalDirection;
  symbol: string;
  symbolLabel: string;
  timeframe: string;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  candleTime: number;
  savedAt: number;
}

const SESSION_ORDER: SignalSession[] = ['asian', 'london', 'newyork'];
const SIGNAL_HISTORY_LIMIT = 18;

const ASSET_CLASS_LABELS: Record<string, string> = {
  volatility: 'Volatility',
  'volatility-1s': 'Volatility 1s',
  jump: 'Jump',
  step: 'Step',
  'boom-crash': 'Boom / Crash',
  'forex-major': 'Forex Majors',
  'forex-minor': 'Forex Crosses',
  commodities: 'Commodities',
  indices: 'Indices',
  crypto: 'Crypto',
};

const SESSION_META: Record<SignalSession, {
  label: string;
  shortLabel: string;
  hours: string;
  description: string;
  accent: string;
  chip: string;
}> = {
  asian: {
    label: 'Asian Session',
    shortLabel: 'Asia',
    hours: '7:00 PM - 2:00 AM ET',
    description: 'Accumulation, compression, and quieter reclaim setups.',
    accent: 'from-cyan-400/35 via-sky-400/20 to-transparent',
    chip: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
  },
  london: {
    label: 'London Session',
    shortLabel: 'London',
    hours: '2:00 AM - 11:00 AM ET',
    description: 'Momentum handoff with cleaner continuation breaks.',
    accent: 'from-emerald-400/35 via-teal-300/20 to-transparent',
    chip: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
  },
  newyork: {
    label: 'New York Session',
    shortLabel: 'New York',
    hours: '8:00 AM - 5:00 PM ET',
    description: 'Expansion and follow-through once US liquidity arrives.',
    accent: 'from-amber-300/35 via-orange-300/20 to-transparent',
    chip: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatPrice = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) {
    return '-';
  }

  if (Math.abs(value) >= 100) {
    return value.toFixed(2);
  }

  if (Math.abs(value) >= 1) {
    return value.toFixed(4);
  }

  return value.toFixed(5);
};

const formatSignalTime = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const getNewYorkHour = (unixSeconds: number) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date(unixSeconds * 1000));

  return parseInt(parts.find((part) => part.type === 'hour')?.value ?? '0', 10) % 24;
};

const getSessionForTime = (unixSeconds: number): SignalSession => {
  const hour = getNewYorkHour(unixSeconds);

  if (hour >= 19 || hour < 2) {
    return 'asian';
  }

  if (hour >= 2 && hour < 11) {
    return 'london';
  }

  return 'newyork';
};

const isSessionActiveNow = (session: SignalSession) => session === getSessionForTime(Math.floor(Date.now() / 1000));

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const buildSignalsFromCandles = (candles: DerivCandle[]) => {
  if (candles.length < 220) {
    return [] as SessionSignal[];
  }

  const ema50ByTime = new Map(calculateEmaSeries(candles, 50).map((point) => [point.time, point.value]));
  const ema200ByTime = new Map(calculateEmaSeries(candles, 200).map((point) => [point.time, point.value]));
  const latestTime = candles[candles.length - 1]?.time ?? 0;
  const candidates: SessionSignal[] = [];

  for (let index = 200; index < candles.length; index += 1) {
    const candle = candles[index];
    const previous = candles[index - 1];
    const ema50 = ema50ByTime.get(candle.time);
    const ema200 = ema200ByTime.get(candle.time);
    const prevEma50 = ema50ByTime.get(previous.time);
    const prevEma200 = ema200ByTime.get(previous.time);

    if (ema50 == null || ema200 == null || prevEma50 == null || prevEma200 == null) {
      continue;
    }

    if (latestTime - candle.time > 36 * 60 * 60) {
      continue;
    }

    const rangeWindow = candles.slice(Math.max(0, index - 14), index + 1);
    const zoneWindow = candles.slice(Math.max(0, index - 8), index + 1);
    const avgRange = average(rangeWindow.map((item) => Math.max(item.high - item.low, Number.EPSILON)));
    const range = Math.max(candle.high - candle.low, Number.EPSILON);
    const bodySize = Math.abs(candle.close - candle.open);
    const bodyRatio = bodySize / range;
    const topEma = Math.max(ema50, ema200);
    const bottomEma = Math.min(ema50, ema200);
    const crossDistance = Math.abs(ema50 - ema200);
    const emaSlopeStrength = ((ema50 - prevEma50) + (ema200 - prevEma200)) / Math.max(avgRange, Number.EPSILON);
    const bearishSlopeStrength = ((prevEma50 - ema50) + (prevEma200 - ema200)) / Math.max(avgRange, Number.EPSILON);

    const bullishCross =
      ema50 > ema200 &&
      candle.close > topEma &&
      previous.close <= Math.max(prevEma50, prevEma200) &&
      candle.low <= topEma + avgRange * 0.18 &&
      candle.close > candle.open &&
      bodyRatio >= 0.48 &&
      candle.close - topEma <= avgRange * 1.3;

    const bearishCross =
      ema50 < ema200 &&
      candle.close < bottomEma &&
      previous.close >= Math.min(prevEma50, prevEma200) &&
      candle.high >= bottomEma - avgRange * 0.18 &&
      candle.close < candle.open &&
      bodyRatio >= 0.48 &&
      bottomEma - candle.close <= avgRange * 1.3;

    if (!bullishCross && !bearishCross) {
      continue;
    }

    const direction: SignalDirection = bullishCross ? 'buy' : 'sell';
    const stopBuffer = avgRange * 0.22;
    const entry = candle.close;
    const stopLoss = bullishCross
      ? Math.min(...zoneWindow.map((item) => item.low), bottomEma) - stopBuffer
      : Math.max(...zoneWindow.map((item) => item.high), topEma) + stopBuffer;
    const risk = bullishCross ? entry - stopLoss : stopLoss - entry;

    if (!Number.isFinite(risk) || risk <= avgRange * 0.35 || risk >= avgRange * 6) {
      continue;
    }

    const takeProfit = bullishCross ? entry + risk * 2 : entry - risk * 2;
    const session = getSessionForTime(candle.time);
    const confidence = Math.round(
      clamp(
        58 +
          bodyRatio * 18 +
          clamp((crossDistance / Math.max(avgRange, Number.EPSILON)) * 5, 0, 10) +
          clamp((bullishCross ? emaSlopeStrength : bearishSlopeStrength) * 9, 0, 10),
        55,
        96,
      ),
    );

    candidates.push({
      id: `${session}-${direction}-${candle.time}`,
      session,
      direction,
      entry,
      stopLoss,
      takeProfit,
      risk,
      confidence,
      candleTime: candle.time,
      zoneLow: bullishCross ? Math.min(...zoneWindow.map((item) => item.low), bottomEma) : Math.min(bottomEma, candle.close),
      zoneHigh: bullishCross ? Math.max(topEma, candle.close) : Math.max(...zoneWindow.map((item) => item.high), topEma),
      zoneStartTime: zoneWindow[0]?.time ?? candle.time,
      zoneEndTime: zoneWindow[zoneWindow.length - 1]?.time ?? candle.time,
      ema50,
      ema200,
      reason: bullishCross
        ? 'Price reclaimed both EMAs, closed strong above the stack, and left risk tucked under the demand pocket.'
        : 'Price reclaimed both EMAs to the downside, closed strong below the stack, and left risk tucked above the supply pocket.',
      setupLabel: bullishCross ? 'EMA reclaim continuation' : 'EMA rejection continuation',
      executionNote: bullishCross
        ? 'Buy the close or the first shallow retest into the EMA stack.'
        : 'Sell the close or the first shallow retest into the EMA stack.',
    });
  }

  const freshCandidates = candidates.filter((signal) => latestTime - signal.candleTime <= 24 * 60 * 60);

  return SESSION_ORDER.flatMap((session) => {
    const topSignal = freshCandidates
      .filter((signal) => signal.session === session)
      .sort((left, right) => {
        if (left.confidence !== right.confidence) {
          return right.confidence - left.confidence;
        }

        return right.candleTime - left.candleTime;
      })[0];

    return topSignal ? [topSignal] : [];
  });
};

const toOverlay = (signal: SessionSignal | null, candles: DerivCandle[]): ChartOverlaySet | null => {
  if (!signal || candles.length === 0) {
    return null;
  }

  return {
    zones: [
      {
        key: `${signal.id}-zone`,
        kind: signal.direction === 'buy' ? 'demand' : 'supply',
        start: signal.zoneLow,
        end: signal.zoneHigh,
        fromTime: signal.zoneStartTime,
        toTime: candles[candles.length - 1]?.time ?? signal.zoneEndTime,
        label: signal.direction === 'buy' ? 'Entry Zone' : 'Supply Zone',
        color: signal.direction === 'buy' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(248, 113, 113, 0.12)',
        borderColor: signal.direction === 'buy' ? '#34d399' : '#fb7185',
      },
    ],
    levels: [
      { key: `${signal.id}-entry`, label: 'Entry', price: signal.entry, color: '#60a5fa' },
      { key: `${signal.id}-stop`, label: 'Stop', price: signal.stopLoss, color: '#fb7185' },
      { key: `${signal.id}-target`, label: 'TP 2R', price: signal.takeProfit, color: '#4ade80' },
      { key: `${signal.id}-ema50`, label: 'EMA 50 anchor', price: signal.ema50, color: '#38bdf8', style: 'dashed' },
      { key: `${signal.id}-ema200`, label: 'EMA 200 anchor', price: signal.ema200, color: '#f59e0b', style: 'dashed' },
    ],
    legendItems: [
      { key: `${signal.id}-zone-legend`, label: 'Signal Zone', color: signal.direction === 'buy' ? '#34d399' : '#fb7185' },
      { key: `${signal.id}-entry-legend`, label: 'Entry', color: '#60a5fa' },
      { key: `${signal.id}-target-legend`, label: 'TP 2R', color: '#4ade80' },
    ],
  };
};

const readHistory = (source: SignalSource): PersistedSignalRecord[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(`signals_history:${source}`);
    return raw ? (JSON.parse(raw) as PersistedSignalRecord[]) : [];
  } catch {
    return [];
  }
};

const writeHistory = (source: SignalSource, history: PersistedSignalRecord[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(`signals_history:${source}`, JSON.stringify(history.slice(0, SIGNAL_HISTORY_LIMIT)));
};

const getSignalKey = (source: SignalSource, symbol: string, timeframe: string, signal: SessionSignal) =>
  `${source}:${symbol}:${timeframe}:${signal.session}:${signal.direction}:${signal.candleTime}`;

const formatAssetClass = (value: string | null | undefined) => {
  if (!value) {
    return 'Unclassified';
  }

  return ASSET_CLASS_LABELS[value] ?? value.replace(/-/g, ' ');
};

const getTimeframeSeconds = (source: SignalSource, timeframe: string) => {
  if (source === 'deriv') {
    return getDerivTimeframe(timeframe).granularity;
  }

  return {
    M1: 60,
    M5: 300,
    M15: 900,
    M30: 1800,
    H1: 3600,
    H4: 14400,
    D1: 86400,
  }[timeframe] ?? 900;
};

export function SignalsWorkspace({ source = 'deriv' }: SignalsWorkspaceProps) {
  const { user, token, loading: authLoading } = useAuth();
  const isDeriv = source === 'deriv';
  const [symbol, setSymbol] = useState(isDeriv ? 'R_10' : 'EURUSD');
  const [timeframe, setTimeframe] = useState(isDeriv ? '15m' : 'M15');
  const [candles, setCandles] = useState<DerivCandle[]>([]);
  const [chartError, setChartError] = useState('');
  const [liveStatus, setLiveStatus] = useState<LiveChartStatus>({ connectionState: 'connecting', loadingHistory: true, candleCount: 0 });
  const [selectedSession, setSelectedSession] = useState<SignalSession>('london');
  const [history, setHistory] = useState<PersistedSignalRecord[]>([]);
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [watchlistHydrated, setWatchlistHydrated] = useState(false);

  useEffect(() => {
    setSymbol(isDeriv ? 'R_10' : 'EURUSD');
    setTimeframe(isDeriv ? '15m' : 'M15');
    setHistory(readHistory(source));
    setAssetFilter('all');
    setWatchlistHydrated(false);
  }, [isDeriv, source]);

  const selectedSymbol = useMemo(
    () => (isDeriv ? getDerivSymbol(symbol) : getLiveChartSymbol(symbol)),
    [isDeriv, symbol],
  );
  const selectedDerivTimeframe = useMemo(
    () => (isDeriv ? getDerivTimeframe(timeframe) : null),
    [isDeriv, timeframe],
  );
  const selectedTradingViewTimeframe = useMemo(
    () => (!isDeriv ? getLiveChartTimeframe(timeframe) : null),
    [isDeriv, timeframe],
  );
  const selectedTimeframe = useMemo(
    () => selectedDerivTimeframe ?? selectedTradingViewTimeframe!,
    [selectedDerivTimeframe, selectedTradingViewTimeframe],
  );
  const selectedAssetClass = useMemo(() => formatAssetClass(selectedSymbol.category), [selectedSymbol.category]);
  const signals = useMemo(() => buildSignalsFromCandles(candles), [candles]);
  const signalMap = useMemo(() => new Map(signals.map((signal) => [signal.session, signal])), [signals]);
  const activeSession = getSessionForTime(Math.floor(Date.now() / 1000));
  const timeframeSeconds = getTimeframeSeconds(source, timeframe);
  const assetFilterOptions = useMemo(
    () => ['all', ...Array.from(new Set(history.map((item) => item.assetClass))).filter(Boolean)],
    [history],
  );
  const filteredHistory = useMemo(
    () => history.filter((item) => assetFilter === 'all' || item.assetClass === assetFilter),
    [assetFilter, history],
  );
  const sessionStats = useMemo(
    () => SESSION_ORDER.map((session) => {
      const sessionHistory = filteredHistory.filter((item) => item.session === session);
      const buyCount = sessionHistory.filter((item) => item.direction === 'buy').length;

      return {
        session,
        total: sessionHistory.length,
        buyCount,
        sellCount: sessionHistory.length - buyCount,
        avgConfidence: sessionHistory.length > 0 ? Math.round(sessionHistory.reduce((sum, item) => sum + item.confidence, 0) / sessionHistory.length) : 0,
      };
    }),
    [filteredHistory],
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    setWatchlistHydrated(false);

    void api.notifications.getSignalWatchlist(source, token)
      .then(({ watchlist }) => {
        if (cancelled) {
          return;
        }

        if (watchlist?.symbol) {
          setSymbol(watchlist.symbol);
        }

        if (watchlist?.timeframe) {
          setTimeframe(watchlist.timeframe);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setWatchlistHydrated(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source, token]);

  useEffect(() => {
    if (signalMap.has(activeSession)) {
      setSelectedSession(activeSession);
      return;
    }

    const nextAvailable = SESSION_ORDER.find((session) => signalMap.has(session));
    if (nextAvailable) {
      setSelectedSession(nextAvailable);
    }
  }, [activeSession, signalMap]);

  useEffect(() => {
    if (typeof window === 'undefined' || signals.length === 0) {
      return;
    }

    const existing = readHistory(source);
    const existingKeys = new Set(existing.map((item) => item.key));
    const additions = signals
      .map((signal) => ({
        key: getSignalKey(source, symbol, timeframe, signal),
        source,
        assetClass: selectedAssetClass,
        session: signal.session,
        direction: signal.direction,
        symbol,
        symbolLabel: selectedSymbol.label,
        timeframe: selectedTimeframe.label,
        entry: signal.entry,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        confidence: signal.confidence,
        candleTime: signal.candleTime,
        savedAt: Date.now(),
      }))
      .filter((item) => !existingKeys.has(item.key));

    if (additions.length === 0) {
      return;
    }

    const nextHistory = [...additions, ...existing].slice(0, SIGNAL_HISTORY_LIMIT);
    writeHistory(source, nextHistory);
    setHistory(nextHistory);
  }, [selectedAssetClass, selectedSymbol.label, selectedTimeframe.label, signals, source, symbol, timeframe]);

  useEffect(() => {
    if (!token || !watchlistHydrated) {
      return;
    }

    void api.notifications.saveSignalWatchlist({
      source,
      symbol,
      timeframe,
      symbolLabel: selectedSymbol.label,
      assetClass: selectedAssetClass,
      enabled: true,
    }, token).catch(() => undefined);
  }, [selectedAssetClass, selectedSymbol.label, source, symbol, timeframe, token, watchlistHydrated]);

  const activeSignal = signalMap.get(selectedSession) ?? signals[0] ?? null;
  const chartOverlay = useMemo(() => toOverlay(activeSignal, candles), [activeSignal, candles]);
  const currentPrice = candles[candles.length - 1]?.close ?? null;
  const statusTone = chartError
    ? { label: 'Feed issue', icon: WifiOff, className: 'border-red-500/30 bg-red-500/10 text-red-100' }
    : liveStatus.loadingHistory
      ? { label: 'Hydrating', icon: Loader2, className: 'border-amber-400/30 bg-amber-500/10 text-amber-100' }
      : liveStatus.connectionState === 'connected'
        ? { label: 'Live', icon: Wifi, className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' }
        : { label: 'Reconnecting', icon: Activity, className: 'border-sky-400/30 bg-sky-500/10 text-sky-100' };
  const StatusIcon = statusTone.icon;
  const signalCount = signals.length;
  const distanceToEntry = activeSignal && currentPrice != null
    ? Math.abs(((currentPrice - activeSignal.entry) / activeSignal.entry) * 100)
    : null;

  const quickSymbols = isDeriv
    ? ['R_10', 'R_25', 'R_50', 'R_75', 'R_100']
    : ['EURUSD', 'GBPUSD', 'XAUUSD', 'NAS100', 'BTCUSD'];
  const symbolOptions = isDeriv ? DERIV_SYMBOLS : LIVE_CHART_SYMBOLS;
  const timeframeOptions = isDeriv ? DERIV_TIMEFRAMES : LIVE_CHART_TIMEFRAMES;
  const providerLabel = isDeriv ? 'Deriv live feed' : 'TradingView market feed';
  const pageLabel = isDeriv ? 'Signals Desk' : 'Signals FX Desk';
  const providerDescription = isDeriv
    ? 'Live synthetic indices with EMA50 and EMA200 reclaim logic.'
    : 'Forex, commodities, indices, and crypto using the same Signals layout.';

  if (authLoading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center p-4">
        <Card className="w-full max-w-md border-white/10 bg-slate-950/80 text-slate-100">
          <CardContent className="flex items-center justify-center gap-3 p-8 text-sm text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading signals workspace...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center p-4">
        <Card className="w-full max-w-md border-white/10 bg-slate-950/80 text-slate-100">
          <CardContent className="p-8 text-center text-sm text-slate-300">
            Sign in to open the live Signals desk.
          </CardContent>
        </Card>
      </div>
    );
  }

  const blocked = isDeriv
    ? user.subscription !== 'TOP_TIER' && user.subscription !== 'VIP_AUTO_TRADER'
    : user.subscription === 'FREE';

  if (blocked) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center p-4">
        <Card className="w-full max-w-2xl overflow-hidden border-amber-400/20 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),rgba(15,23,42,0.96)_45%)] text-slate-100">
          <CardContent className="p-8 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-300/10 text-amber-200">
              <Crown className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold">Signals is part of the premium execution stack</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
              {isDeriv
                ? 'Upgrade to PRO+ to unlock the Deriv Signals desk with session-grade entries, live EMA overlays, and push-ready execution tickets.'
                : 'Upgrade to any paid plan to unlock the TradingView Signals desk with live forex, commodity, index, and crypto setups.'}
            </p>
            <div className="mt-6">
              <Button className="bg-amber-400 text-slate-950 hover:bg-amber-300" onClick={() => { window.location.href = '/dashboard/billing'; }}>
                {isDeriv ? 'Upgrade to PRO+' : 'Upgrade Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="mobile-card border-white/10">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45">
                  <Sparkles className="h-4 w-4 text-[var(--gold-light)]" />
                  {pageLabel}
                </div>
                <h1 className="mt-2 text-2xl font-semibold text-white">Signals</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                  Live chart, active session signals, and past signal history in the same dashboard flow the scanner used.
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/40">{providerLabel} · {providerDescription}</p>
              </div>

              <Badge variant="outline" className={statusTone.className}>
                <StatusIcon className={`mr-2 h-3.5 w-3.5 ${liveStatus.loadingHistory ? 'animate-spin' : ''}`} />
                {statusTone.label}
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: Radar, label: 'Active Signals', value: `${signalCount}/3` },
                { icon: CandlestickChart, label: 'Current Price', value: currentPrice == null ? '-' : formatPrice(currentPrice) },
                { icon: Target, label: 'Risk Model', value: '1 : 2' },
                { icon: BellRing, label: 'Alerts', value: 'Server On' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
                    <span>{item.label}</span>
                    <item.icon className="h-4 w-4 text-white/60" />
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card border-white/10">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45">
              <Waves className="h-4 w-4 text-cyan-300" />
              Controls
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Quick symbols</label>
                <div className="flex flex-wrap gap-2">
                  {quickSymbols.map((value) => {
                    const option = isDeriv ? getDerivSymbol(value) : getLiveChartSymbol(value);
                    const active = symbol === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSymbol(value)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? 'border-[rgba(255,223,112,0.35)] bg-white/10 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'}`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Index / pair</span>
                  <select value={symbol} onChange={(event) => setSymbol(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40">
                    {symbolOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-slate-300">
                  <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Signal timeframe</span>
                  <select value={timeframe} onChange={(event) => setTimeframe(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40">
                    {timeframeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.03 }} className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="mobile-card border-white/10">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45">
                <Activity className="h-4 w-4 text-emerald-300" />
                Active Signals
              </div>
              <span className="text-xs text-white/40">{signalCount} live</span>
            </div>

            <div className="mt-4 space-y-3">
              {SESSION_ORDER.map((session) => {
                const signal = signalMap.get(session) ?? null;
                const active = selectedSession === session;
                return (
                  <button
                    key={session}
                    type="button"
                    onClick={() => setSelectedSession(session)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-[rgba(255,223,112,0.3)] bg-white/10' : 'border-white/8 bg-white/5 hover:border-white/16'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{SESSION_META[session].label}</div>
                        <div className="mt-1 text-sm font-medium text-slate-100">{signal ? selectedSymbol.label : 'No active signal'}</div>
                      </div>
                      <Badge variant="outline" className={signal ? (signal.direction === 'buy' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-rose-400/30 bg-rose-500/10 text-rose-100') : 'border-white/10 bg-transparent text-slate-400'}>
                        {signal ? signal.direction.toUpperCase() : 'Standby'}
                      </Badge>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-300 sm:grid-cols-4">
                      <div>
                        <div className="text-white/40">Entry</div>
                        <div className="mt-1 font-medium text-slate-100">{signal ? formatPrice(signal.entry) : '-'}</div>
                      </div>
                      <div>
                        <div className="text-white/40">SL</div>
                        <div className="mt-1 font-medium text-slate-100">{signal ? formatPrice(signal.stopLoss) : '-'}</div>
                      </div>
                      <div>
                        <div className="text-white/40">TP</div>
                        <div className="mt-1 font-medium text-slate-100">{signal ? formatPrice(signal.takeProfit) : '-'}</div>
                      </div>
                      <div>
                        <div className="text-white/40">Time</div>
                        <div className="mt-1 font-medium text-slate-100">{signal ? formatSignalTime(signal.candleTime) : 'Waiting'}</div>
                      </div>
                    </div>

                    {signal ? (
                      <p className="mt-3 text-xs leading-5 text-white/45">{signal.executionNote}</p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card border-white/10">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45">
                  <History className="h-4 w-4 text-emerald-300" />
                  Past Signals
                </div>
                <p className="mt-2 text-sm text-white/55">Archived signals for the current feed. Filter by asset class to narrow the list.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {assetFilterOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAssetFilter(option)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${assetFilter === option ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100' : 'border-white/10 bg-slate-950/55 text-slate-300 hover:border-white/20 hover:text-slate-100'}`}
                  >
                    {option === 'all' ? 'All assets' : option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {filteredHistory.length > 0 ? filteredHistory.slice(0, 6).map((item) => (
                <div key={item.key} className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-slate-100">{item.symbolLabel}</div>
                      <div className="mt-1 text-xs text-white/40">{item.assetClass} · {SESSION_META[item.session].shortLabel} · {item.timeframe}</div>
                    </div>
                    <Badge variant="outline" className={item.direction === 'buy' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-rose-400/30 bg-rose-500/10 text-rose-100'}>
                      {item.direction.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                    <div className="rounded-xl border border-white/8 bg-white/5 p-2">E {formatPrice(item.entry)}</div>
                    <div className="rounded-xl border border-white/8 bg-white/5 p-2">SL {formatPrice(item.stopLoss)}</div>
                    <div className="rounded-xl border border-white/8 bg-white/5 p-2">TP {formatPrice(item.takeProfit)}</div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                    <span>{formatSignalTime(item.candleTime)}</span>
                    <span>{item.confidence}% confidence</span>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-white/45">
                  {history.length > 0 ? 'No archived signals match the selected asset class yet.' : 'Past signals will appear here as new session signals are generated.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.06 }} className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="mobile-card overflow-hidden border-white/10">
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Chart</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-50">EMA50 / EMA200 signal map</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-white/45">
                <span>{selectedSymbol.label}</span>
                <span>·</span>
                <span>{selectedTimeframe.label}</span>
                <span>·</span>
                <span>{liveStatus.candleCount} candles</span>
                {chartError ? (
                  <Badge variant="outline" className="border-red-400/30 bg-red-500/10 text-red-100">
                    <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                    {chartError}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="h-[24rem] overflow-hidden rounded-[1.25rem] border border-white/8 bg-slate-950/70 sm:h-[28rem]">
              {isDeriv ? (
                <LiveChart
                  symbol={symbol}
                  granularity={selectedDerivTimeframe?.granularity ?? getDerivTimeframe(timeframe).granularity}
                  token={token}
                  overlay={chartOverlay}
                  onCandlesChange={setCandles}
                  onError={setChartError}
                  onStatusChange={setLiveStatus}
                  className="h-full"
                />
              ) : (
                <TradingViewLiveChart
                  symbol={symbol}
                  timeframe={timeframe}
                  token={token}
                  overlay={chartOverlay}
                  onCandlesChange={setCandles}
                  onError={setChartError}
                  onStatusChange={setLiveStatus}
                  className="h-full"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card border-white/10">
            <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/45">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Session Performance
            </div>

            {sessionStats.map((item) => (
              <div key={item.session} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-100">{SESSION_META[item.session].label}</div>
                    <div className="mt-1 text-xs text-white/40">{item.total} archived signals in the current filter</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Avg confidence</div>
                    <div className="mt-1 text-lg font-semibold text-slate-50">{item.total > 0 ? `${item.avgConfidence}%` : '-'}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-300">
                  <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">Total {item.total}</div>
                  <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">Buys {item.buyCount}</div>
                  <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">Sells {item.sellCount}</div>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm leading-6 text-slate-300">
              Keep the chart on 15m or 30m for cleaner structure. Lower timeframes can still work, but they naturally produce noisier session signals.
            </div>

            {activeSignal ? (
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-100">Selected signal</span>
                  <Badge variant="outline" className={activeSignal.direction === 'buy' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-rose-400/30 bg-rose-500/10 text-rose-100'}>
                    {activeSignal.direction.toUpperCase()}
                  </Badge>
                </div>
                <div className="mt-3 text-xs text-white/45">{SESSION_META[activeSignal.session].label} · {selectedSymbol.label} · {selectedTimeframe.label}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                  <div className="rounded-xl border border-white/8 bg-white/5 p-2">E {formatPrice(activeSignal.entry)}</div>
                  <div className="rounded-xl border border-white/8 bg-white/5 p-2">SL {formatPrice(activeSignal.stopLoss)}</div>
                  <div className="rounded-xl border border-white/8 bg-white/5 p-2">TP {formatPrice(activeSignal.takeProfit)}</div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
