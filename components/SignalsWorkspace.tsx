'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Bell,
  BellRing,
  BrainCircuit,
  Crown,
  Filter,
  Flame,
  Layers3,
  Loader2,
  Shield,
  ShieldCheck,
  Siren,
  Sparkles,
  Target,
  TrendingUp,
  Waves,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { api, type ScannedSignal } from '@/lib/api';
import {
  DERIV_SYMBOLS,
  getDerivTimeframe,
} from '@/lib/deriv-live';
import {
  LIVE_CHART_SYMBOLS,
  getLiveChartTimeframe,
} from '@/lib/live-chart';

type SignalSession = 'asian' | 'london' | 'newyork';
type SignalDirection = 'buy' | 'sell';
type SignalSource = 'deriv' | 'tradingview';

interface SignalsWorkspaceProps {
  source?: SignalSource;
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
  grade: ScannedSignal['grade'];
  status: ScannedSignal['status'];
}

type ActiveSignalRecord = ScannedSignal & { savedAt: number };

interface MarketScanTarget {
  value: string;
  label: string;
  category: string;
}

const SESSION_ORDER: SignalSession[] = ['asian', 'london', 'newyork'];
const SIGNAL_HISTORY_LIMIT = 18;
const DEFAULT_QUALITY_FILTER: Array<ScannedSignal['grade']> = ['A+', 'A'];

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
  headline: string;
}> = {
  asian: {
    label: 'Asian Session',
    shortLabel: 'Asia',
    hours: '7:00 PM - 2:00 AM ET',
    description: 'Accumulation, compression, and quieter reclaim setups.',
    accent: 'from-cyan-400/35 via-sky-400/20 to-transparent',
    chip: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
    headline: 'Liquidity mapping',
  },
  london: {
    label: 'London Session',
    shortLabel: 'London',
    hours: '2:00 AM - 11:00 AM ET',
    description: 'Momentum handoff with cleaner continuation breaks.',
    accent: 'from-emerald-400/35 via-teal-300/20 to-transparent',
    chip: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
    headline: 'Institutional expansion',
  },
  newyork: {
    label: 'New York Session',
    shortLabel: 'New York',
    hours: '8:00 AM - 5:00 PM ET',
    description: 'Expansion and follow-through once US liquidity arrives.',
    accent: 'from-amber-300/35 via-orange-300/20 to-transparent',
    chip: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
    headline: 'Execution pressure',
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const STATUS_META: Record<ScannedSignal['status'], { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100',
  },
  running_profit: {
    label: 'Running Profit',
    className: 'border-emerald-300/30 bg-emerald-400/12 text-emerald-100',
  },
  tp_hit: {
    label: 'TP Hit',
    className: 'border-amber-300/35 bg-amber-300/12 text-amber-100',
  },
  sl_hit: {
    label: 'SL Hit',
    className: 'border-rose-300/30 bg-rose-400/12 text-rose-100',
  },
  expired: {
    label: 'Expired',
    className: 'border-white/15 bg-white/8 text-white/70',
  },
};

const GRADE_META: Record<ScannedSignal['grade'], string> = {
  'A+': 'border-amber-300/35 bg-amber-300/12 text-amber-100',
  A: 'border-yellow-200/25 bg-yellow-200/10 text-yellow-50',
  'B+': 'border-white/15 bg-white/8 text-white/80',
};

const SIGNAL_CACHE_PREFIX = 'signals_terminal_cache';

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

const formatAssetClass = (value: string | null | undefined) => {
  if (!value) {
    return 'Unclassified';
  }

  return ASSET_CLASS_LABELS[value] ?? value.replace(/-/g, ' ');
};

const readCache = (source: SignalSource, timeframe: string) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(`${SIGNAL_CACHE_PREFIX}:${source}:${timeframe}`);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { savedAt: number; signals: ActiveSignalRecord[] };
    if (Date.now() - parsed.savedAt > 45_000) {
      return null;
    }

    return parsed.signals;
  } catch {
    return null;
  }
};

const writeCache = (source: SignalSource, timeframe: string, signals: ActiveSignalRecord[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(
    `${SIGNAL_CACHE_PREFIX}:${source}:${timeframe}`,
    JSON.stringify({ savedAt: Date.now(), signals }),
  );
};

const formatStatusTime = (value: number | null) => {
  if (!value) {
    return 'Awaiting live refresh';
  }

  return `Updated ${new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round((value - Date.now()) / 60000), 'minute')}`;
};

const getHeadline = (signalCount: number) => {
  if (signalCount >= 6) return 'Institutional Signal Flow';
  if (signalCount >= 3) return 'Precision Market Execution';
  return 'High-Probability Trade Intelligence';
};

const toggleQuality = (current: Array<ScannedSignal['grade']>, grade: ScannedSignal['grade']) => (
  current.includes(grade) ? current.filter((item) => item !== grade) : [...current, grade]
);

function SnapshotChart({ signal }: { signal: ScannedSignal }) {
  const width = 420;
  const height = 220;
  const padding = 16;
  const candles = signal.snapshot.candles;

  const prices = [
    ...candles.flatMap((candle) => [candle.high, candle.low]),
    ...signal.snapshot.zones.flatMap((zone) => [zone.top, zone.bottom]),
  ];
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = Math.max(maxPrice - minPrice, Number.EPSILON);
  const candleGap = (width - padding * 2) / Math.max(candles.length, 1);
  const mapY = (price: number) => padding + ((maxPrice - price) / priceRange) * (height - padding * 2);
  const mapX = (index: number) => padding + candleGap * index + candleGap / 2;
  const toneClass = signal.direction === 'buy' ? 'text-emerald-300' : 'text-rose-300';

  const zoneStyles: Record<ScannedSignal['snapshot']['zones'][number]['tone'], string> = {
    entry: 'rgba(250,204,21,0.22)',
    risk: 'rgba(244,63,94,0.18)',
    target: 'rgba(16,185,129,0.18)',
    demand: 'rgba(16,185,129,0.14)',
    supply: 'rgba(244,63,94,0.14)',
    value: 'rgba(59,130,246,0.14)',
  };

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,17,23,0.95),rgba(10,14,20,0.8))] p-3 shadow-[0_28px_70px_rgba(0,0,0,0.4)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.32em] text-white/35">Chart Snapshot</div>
          <div className={`mt-1 text-sm font-semibold ${toneClass}`}>{signal.setupLabel}</div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/55">
          BOS · CHOCH · FVG
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full overflow-visible">
        <defs>
          <linearGradient id={`signal-gradient-${signal.key}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={signal.direction === 'buy' ? '#34d399' : '#fb7185'} stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={width} height={height} rx="22" fill="rgba(255,255,255,0.02)" />
        {signal.snapshot.zones.map((zone) => {
          const top = mapY(Math.max(zone.top, zone.bottom));
          const bottom = mapY(Math.min(zone.top, zone.bottom));
          const y = Math.min(top, bottom);
          const zoneHeight = Math.max(Math.abs(bottom - top), 2);
          return (
            <g key={`${signal.key}:${zone.label}:${zone.tone}`}>
              <rect x={padding} y={y} width={width - padding * 2} height={zoneHeight} fill={zoneStyles[zone.tone]} rx="8" />
              <text x={width - padding - 6} y={y + 12} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.55)">
                {zone.label}
              </text>
            </g>
          );
        })}
        {candles.map((candle, index) => {
          const x = mapX(index);
          const openY = mapY(candle.open);
          const closeY = mapY(candle.close);
          const highY = mapY(candle.high);
          const lowY = mapY(candle.low);
          const bullish = candle.close >= candle.open;
          return (
            <g key={`${signal.key}:${candle.time}`}>
              <line x1={x} y1={highY} x2={x} y2={lowY} stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
              <rect
                x={x - candleGap * 0.22}
                y={Math.min(openY, closeY)}
                width={Math.max(candleGap * 0.44, 3)}
                height={Math.max(Math.abs(closeY - openY), 2)}
                rx="3"
                fill={bullish ? 'rgba(16,185,129,0.78)' : 'rgba(244,63,94,0.78)'}
              />
            </g>
          );
        })}
        {signal.snapshot.annotations.map((annotation, index) => {
          const candleIndex = candles.findIndex((candle) => candle.time === annotation.candleTime);
          if (candleIndex === -1) {
            return null;
          }

          const x = mapX(candleIndex);
          const y = mapY(annotation.price);
          const fill = annotation.tone === 'bullish' ? '#34d399' : annotation.tone === 'bearish' ? '#fb7185' : '#fbbf24';
          return (
            <g key={`${signal.key}:${annotation.label}:${index}`}>
              <circle cx={x} cy={y} r="4" fill={fill} />
              <text x={x + 8} y={y - 6} fontSize="10" fill="rgba(255,255,255,0.74)">{annotation.label}</text>
            </g>
          );
        })}
      </svg>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-white/65">
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2">Entry {formatPrice(signal.entry)}</div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2">SL {formatPrice(signal.stopLoss)}</div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2">TP {formatPrice(signal.takeProfit)}</div>
      </div>
    </div>
  );
}

function SignalSkeleton() {
  return (
    <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="animate-pulse space-y-4">
        <div className="h-3 w-28 rounded-full bg-white/10" />
        <div className="h-7 w-48 rounded-full bg-white/10" />
        <div className="h-44 rounded-[24px] bg-white/10" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-14 rounded-2xl bg-white/10" />
          <div className="h-14 rounded-2xl bg-white/10" />
          <div className="h-14 rounded-2xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export function SignalsWorkspace({ source = 'deriv' }: SignalsWorkspaceProps) {
  const { user, token, loading: authLoading } = useAuth();
  const isDeriv = source === 'deriv';
  const [timeframe, setTimeframe] = useState(isDeriv ? '15m' : 'M15');
  const [history, setHistory] = useState<PersistedSignalRecord[]>([]);
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [activeSignals, setActiveSignals] = useState<ActiveSignalRecord[]>([]);
  const [selectedSignalKey, setSelectedSignalKey] = useState<string | null>(null);
  const [qualityFilter, setQualityFilter] = useState<Array<ScannedSignal['grade']>>(DEFAULT_QUALITY_FILTER);
  const [sessionFilter, setSessionFilter] = useState<SignalSession | 'all'>('all');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [watchlistSaving, setWatchlistSaving] = useState(false);
  const [scanState, setScanState] = useState<{ loading: boolean; error: string; lastUpdated: number | null }>({
    loading: true,
    error: '',
    lastUpdated: null,
  });

  useEffect(() => {
    setTimeframe(isDeriv ? '15m' : 'M15');
    setHistory(readHistory(source));
    setAssetFilter('all');
    setQualityFilter(DEFAULT_QUALITY_FILTER);
    setSessionFilter('all');
    setActiveSignals([]);
    setSelectedSignalKey(null);
    setScanState({ loading: true, error: '', lastUpdated: null });
  }, [isDeriv, source]);

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
  const marketUniverse = useMemo<MarketScanTarget[]>(() => {
    if (isDeriv) {
      return DERIV_SYMBOLS.map((item) => ({
        value: item.value,
        label: item.label,
        category: item.category,
      }));
    }

    return LIVE_CHART_SYMBOLS
      .filter((item) => item.category !== 'crypto')
      .map((item) => ({
        value: item.value,
        label: item.label,
        category: item.category,
      }));
  }, [isDeriv]);
  const assetFilterOptions = useMemo(
    () => ['all', ...Array.from(new Set([...activeSignals, ...history].map((item) => item.assetClass))).filter(Boolean)],
    [activeSignals, history],
  );
  const filteredActiveSignals = useMemo(
    () => activeSignals.filter((item) => {
      const assetMatch = assetFilter === 'all' || item.assetClass === assetFilter;
      const sessionMatch = sessionFilter === 'all' || item.session === sessionFilter;
      const qualityMatch = qualityFilter.includes(item.grade);
      return assetMatch && sessionMatch && qualityMatch;
    }),
    [activeSignals, assetFilter, qualityFilter, sessionFilter],
  );
  const filteredHistory = useMemo(
    () => history.filter((item) => assetFilter === 'all' || item.assetClass === assetFilter),
    [assetFilter, history],
  );
  const activeSignal = useMemo(
    () => filteredActiveSignals.find((item) => item.key === selectedSignalKey) ?? filteredActiveSignals[0] ?? null,
    [filteredActiveSignals, selectedSignalKey],
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const scanUniverse = async () => {
      try {
        setScanState((current) => ({ ...current, loading: true, error: '' }));
        const cached = readCache(source, timeframe);
        if (cached && !cancelled) {
          setActiveSignals(cached);
          setScanState((current) => ({ ...current, loading: false, error: '', lastUpdated: Date.now() }));
        }
        const { signals, generatedAt } = await api.scanSignalsMarket({
          source,
          timeframe,
          targets: marketUniverse.map((target) => ({
            symbol: target.value,
            symbolLabel: target.label,
            assetClass: formatAssetClass(target.category),
          })),
        }, token);

        if (cancelled) {
          return;
        }

        const nextSignals = signals.map((signal) => ({ ...signal, timeframe: selectedTimeframe.label, savedAt: Date.now() }));
        setActiveSignals(nextSignals);
        writeCache(source, timeframe, nextSignals);
        setScanState({ loading: false, error: '', lastUpdated: new Date(generatedAt).getTime() || Date.now() });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setActiveSignals([]);
        setScanState({
          loading: false,
          error: error instanceof Error ? error.message : 'Unable to scan the market right now.',
          lastUpdated: null,
        });
      }
    };

    void scanUniverse();
    const interval = window.setInterval(() => {
      void scanUniverse();
    }, 90000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [marketUniverse, selectedTimeframe.label, source, timeframe, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const loadWatchlist = async () => {
      try {
        const response = await api.notifications.getSignalWatchlist(source, token);
        if (!cancelled) {
          setAlertsEnabled(response.watchlist?.enabled !== false);
        }
      } catch {
        if (!cancelled) {
          setAlertsEnabled(true);
        }
      }
    };

    void loadWatchlist();
    return () => {
      cancelled = true;
    };
  }, [source, token]);

  useEffect(() => {
    if (!activeSignal) {
      setSelectedSignalKey(null);
      return;
    }

    if (!selectedSignalKey || !filteredActiveSignals.some((item) => item.key === selectedSignalKey)) {
      setSelectedSignalKey(activeSignal.key);
    }
  }, [activeSignal, filteredActiveSignals, selectedSignalKey]);

  useEffect(() => {
    if (typeof window === 'undefined' || activeSignals.length === 0) {
      return;
    }

    const existing = readHistory(source);
    const existingKeys = new Set(existing.map((item) => item.key));
    const additions = activeSignals
      .map((signal) => ({
        key: signal.key,
        source: signal.source,
        assetClass: signal.assetClass,
        session: signal.session,
        direction: signal.direction,
        symbol: signal.symbol,
        symbolLabel: signal.symbolLabel,
        timeframe: signal.timeframe,
        entry: signal.entry,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
        confidence: signal.confidence,
        candleTime: signal.candleTime,
        savedAt: signal.savedAt,
        grade: signal.grade,
        status: signal.status,
      }))
      .filter((item) => !existingKeys.has(item.key));

    if (additions.length === 0) {
      return;
    }

    const nextHistory = [...additions, ...existing].slice(0, SIGNAL_HISTORY_LIMIT);
    writeHistory(source, nextHistory);
    setHistory(nextHistory);
  }, [activeSignals, source]);

  const statusTone = scanState.error
    ? { label: 'Feed issue', icon: WifiOff, className: 'border-red-500/30 bg-red-500/10 text-red-100' }
    : scanState.loading && !scanState.lastUpdated
      ? { label: 'Initializing', icon: Loader2, className: 'border-amber-400/30 bg-amber-500/10 text-amber-100' }
      : scanState.lastUpdated
        ? { label: 'Live', icon: Wifi, className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' }
        : { label: 'Reconnecting', icon: Activity, className: 'border-sky-400/30 bg-sky-500/10 text-sky-100' };
  const StatusIcon = statusTone.icon;
  const signalCount = activeSignals.length;
  const providerLabel = isDeriv ? 'Synthetic, volatility, and deriv flow' : 'Forex, indices, commodities, and crypto';
  const headline = getHeadline(filteredActiveSignals.length);
  const selectedSignal = activeSignal;
  const avgConfidence = filteredActiveSignals.length > 0
    ? Math.round(filteredActiveSignals.reduce((total, item) => total + item.confidence, 0) / filteredActiveSignals.length)
    : 0;
  const sessionLiveCount = SESSION_ORDER.map((session) => ({
    session,
    count: activeSignals.filter((item) => item.session === session && item.status !== 'expired').length,
  }));

  const saveWatchlist = async (signal: ActiveSignalRecord | null, enabled: boolean) => {
    if (!token || !signal) {
      setAlertsEnabled(enabled);
      return;
    }

    try {
      setWatchlistSaving(true);
      await api.notifications.saveSignalWatchlist({
        source,
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        symbolLabel: signal.symbolLabel,
        assetClass: signal.assetClass,
        enabled,
      }, token);
      setAlertsEnabled(enabled);
    } finally {
      setWatchlistSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center p-4 text-slate-100">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,210,106,0.18),rgba(4,8,15,0.96)_55%)] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-center gap-3 text-sm text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Building your live signal terminal...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center p-4 text-slate-100">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,210,106,0.16),rgba(4,8,15,0.96)_60%)] p-8 text-center text-sm text-slate-300 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
            Sign in to view your signals.
        </div>
      </div>
    );
  }

  const blocked = isDeriv
    ? user.subscription !== 'TOP_TIER' && user.subscription !== 'VIP_AUTO_TRADER'
    : user.subscription === 'FREE';

  if (blocked) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-[36px] border border-amber-400/20 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.18),rgba(15,23,42,0.96)_45%)] text-slate-100 shadow-[0_40px_140px_rgba(0,0,0,0.48)]">
          <div className="p-8 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-300/10 text-amber-200">
              <Crown className="h-6 w-6" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold">Signals is part of the premium execution stack</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
              {isDeriv
                ? 'Upgrade to PRO+ to unlock Deriv signals with session-grade entries and live updates.'
                : 'Upgrade to any paid plan to unlock TradingView signals across forex, commodities, indices, and crypto.'}
            </p>
            <div className="mt-6">
              <Button className="bg-amber-400 text-slate-950 hover:bg-amber-300" onClick={() => { window.location.href = '/dashboard/billing'; }}>
                {isDeriv ? 'Upgrade to PRO+' : 'Upgrade Now'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 pb-28 text-slate-100">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.16),transparent_42%),radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(180deg,#05070c_0%,#070b13_48%,#05070c_100%)]" />

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-[0_34px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-amber-100">
              <Sparkles className="h-3.5 w-3.5" />
              TradeVision AI Signals
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-[2.7rem]">
              {headline}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
              AI-ranked institutional setups across {providerLabel.toLowerCase()} with structure confirmation, liquidity context, and execution-ready levels.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: Waves, label: 'Live Signals', value: String(filteredActiveSignals.length), subvalue: `${DEFAULT_QUALITY_FILTER.join(' + ')} focus` },
                { icon: Target, label: 'Markets Monitored', value: String(marketUniverse.length), subvalue: providerLabel },
                { icon: BrainCircuit, label: 'AI Confidence Engine', value: `${avgConfidence || 0}%`, subvalue: 'SMC weighted scoring' },
                { icon: Activity, label: 'Session Status', value: scanState.error ? 'Watch feed' : 'Monitoring', subvalue: formatStatusTime(scanState.lastUpdated) },
              ].map((item) => (
                <div key={item.label} className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 backdrop-blur">
                  <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
                    <span>{item.label}</span>
                    <item.icon className="h-4 w-4 text-amber-200/90" />
                  </div>
                  <div className="mt-4 text-2xl font-semibold text-white">{item.value}</div>
                  <div className="mt-2 text-xs leading-5 text-white/48">{item.subvalue}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full max-w-sm rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/45">Terminal Status</div>
                <div className="mt-2 text-lg font-semibold text-white">{statusTone.label}</div>
              </div>
              <Badge variant="outline" className={statusTone.className}>
                <StatusIcon className={`mr-2 h-3.5 w-3.5 ${scanState.loading ? 'animate-spin' : ''}`} />
                {statusTone.label}
              </Badge>
            </div>
            <div className="mt-5 space-y-3">
              {sessionLiveCount.map(({ session, count }) => (
                <div key={session} className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between gap-3 text-sm text-white">
                    <span>{SESSION_META[session].label}</span>
                    <span className="text-amber-100">{count}</span>
                  </div>
                  <div className="mt-2 text-xs text-white/48">{SESSION_META[session].headline}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {scanState.error ? (
          <div className="mt-5 rounded-[24px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {scanState.error}
          </div>
        ) : null}
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.04 }} className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Live Signal Feed</div>
              <div className="mt-2 text-lg font-semibold text-white">High-confluence opportunities only</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {SESSION_ORDER.map((session) => (
                <button
                  key={session}
                  type="button"
                  onClick={() => setSessionFilter((current) => current === session ? 'all' : session)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${sessionFilter === session ? SESSION_META[session].chip : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:text-white'}`}
                >
                  {SESSION_META[session].shortLabel}
                </button>
              ))}
            </div>
          </div>

          {scanState.loading && activeSignals.length === 0 ? (
            <div className="space-y-4">
              <SignalSkeleton />
              <SignalSkeleton />
            </div>
          ) : filteredActiveSignals.length > 0 ? filteredActiveSignals.map((signal, index) => {
            const active = selectedSignalKey === signal.key;
            const statusMeta = STATUS_META[signal.status];

            return (
              <motion.button
                key={signal.key}
                type="button"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: index * 0.03 }}
                onClick={() => setSelectedSignalKey(signal.key)}
                className={`relative w-full overflow-hidden rounded-[32px] border p-4 text-left shadow-[0_26px_90px_rgba(0,0,0,0.3)] transition sm:p-5 ${active ? 'border-amber-300/30 bg-[linear-gradient(145deg,rgba(255,255,255,0.11),rgba(255,255,255,0.04))]' : 'border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] hover:border-white/20'} backdrop-blur-xl`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.16),transparent_28%),radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_18%)] ${signal.status === 'running_profit' ? 'animate-pulse' : ''}`} />
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={GRADE_META[signal.grade]}>{signal.grade}</Badge>
                        <Badge variant="outline" className={signal.direction === 'buy' ? 'border-emerald-300/35 bg-emerald-400/10 text-emerald-100' : 'border-rose-300/35 bg-rose-400/10 text-rose-100'}>
                          {signal.direction.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={statusMeta.className}>{statusMeta.label}</Badge>
                        <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-white/75">{signal.assetClass}</Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap items-end gap-3">
                        <h2 className="text-2xl font-semibold text-white">{signal.symbolLabel}</h2>
                        <span className="text-sm text-white/45">{signal.timeframe}</span>
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/62">{signal.reason}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/38">Confidence</div>
                      <div className="mt-2 text-3xl font-semibold text-white">{signal.confidence}%</div>
                      <div className="mt-2 text-xs text-white/48">{formatSignalTime(signal.candleTime)}</div>
                    </div>
                  </div>

                  <SnapshotChart signal={signal} />

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { label: 'Entry', value: formatPrice(signal.entry) },
                        { label: 'Stop Loss', value: formatPrice(signal.stopLoss) },
                        { label: 'Take Profit', value: formatPrice(signal.takeProfit) },
                        { label: 'RR', value: `${signal.rrRatio.toFixed(2)}R` },
                      ].map((item) => (
                        <div key={item.label} className="rounded-[22px] border border-white/8 bg-white/[0.04] p-3">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-white/38">{item.label}</div>
                          <div className="mt-2 text-sm font-semibold text-white">{item.value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/38">Institutional Confluence</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {signal.confluences.map((item) => (
                          <span key={`${signal.key}:${item}`} className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/72">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/8 bg-white/[0.04] p-3">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] text-white/65">{SESSION_META[signal.session].label}</span>
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] text-white/65">Current {formatPrice(signal.currentPrice)}</span>
                    </div>
                    <div className="text-xs text-white/45">{signal.executionNote}</div>
                  </div>
                </div>
              </motion.button>
            );
          }) : (
            <div className="overflow-hidden rounded-[32px] border border-dashed border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 text-center shadow-[0_26px_90px_rgba(0,0,0,0.3)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-100">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">Monitoring live market structure...</h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/55">
                The engine is filtering for BOS, CHOCH, liquidity sweeps, premium-discount alignment, and strong risk-reward before a setup enters the terminal.
              </p>
            </div>
          )}
        </motion.section>

        <motion.aside initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34, delay: 0.08 }} className="space-y-4">
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_26px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Signal Engine</div>
                <div className="mt-2 text-lg font-semibold text-white">Weighted confidence architecture</div>
              </div>
              <Layers3 className="h-5 w-5 text-amber-100" />
            </div>
            <div className="mt-5 space-y-3">
              {selectedSignal ? Object.entries(selectedSignal.quality).map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-xs text-white/55">
                    <span className="capitalize">{label}</span>
                    <span>{value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(250,204,21,0.92),rgba(255,255,255,0.82))]" style={{ width: `${value}%` }} />
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-4 text-sm text-white/55">
                  Select a live setup to inspect structure, liquidity, FVG, session, trend, volatility, and RR scoring.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_26px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Alert Terminal</div>
                <div className="mt-2 text-lg font-semibold text-white">Premium execution alerts</div>
              </div>
              <BellRing className="h-5 w-5 text-amber-100" />
            </div>
            <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">Push, browser, and mobile alerts</div>
                  <div className="mt-1 text-xs text-white/48">Visual design refreshed while preserving the existing delivery system.</div>
                </div>
                <button
                  type="button"
                  onClick={() => void saveWatchlist(selectedSignal, !alertsEnabled)}
                  disabled={watchlistSaving}
                  className={`inline-flex h-11 min-w-24 items-center justify-center rounded-full border px-4 text-xs font-medium transition ${alertsEnabled ? 'border-amber-300/30 bg-amber-300/12 text-amber-100' : 'border-white/10 bg-white/[0.04] text-white/65'} ${watchlistSaving ? 'opacity-60' : ''}`}
                >
                  {watchlistSaving ? 'Saving...' : alertsEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              {selectedSignal ? (
                <div className="mt-4 rounded-[22px] border border-amber-300/15 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.12),rgba(255,255,255,0.04)_60%)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{selectedSignal.symbolLabel} {selectedSignal.direction.toUpperCase()}</div>
                      <div className="mt-1 text-xs text-white/48">{selectedSignal.confidence}% confidence · {selectedSignal.grade} quality</div>
                    </div>
                    <Badge variant="outline" className={STATUS_META[selectedSignal.status].className}>{STATUS_META[selectedSignal.status].label}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-white/70">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-2">E {formatPrice(selectedSignal.entry)}</div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-2">SL {formatPrice(selectedSignal.stopLoss)}</div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-2">TP {formatPrice(selectedSignal.takeProfit)}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_26px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">Archived Flow</div>
                <div className="mt-2 text-lg font-semibold text-white">Recent published setups</div>
              </div>
              <Flame className="h-5 w-5 text-amber-100" />
            </div>
            <div className="mt-5 space-y-3">
              {filteredHistory.length > 0 ? filteredHistory.slice(0, 5).map((item) => (
                <div key={item.key} className="rounded-[22px] border border-white/8 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-white">{item.symbolLabel}</div>
                      <div className="mt-1 text-[11px] text-white/42">{item.assetClass} · {SESSION_META[item.session].shortLabel}</div>
                    </div>
                    <Badge variant="outline" className={GRADE_META[item.grade]}>{item.grade}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/55">
                    <span>{formatSignalTime(item.candleTime)}</span>
                    <span>{item.confidence}%</span>
                  </div>
                </div>
              )) : (
                <div className="rounded-[22px] border border-dashed border-white/12 bg-white/[0.03] p-4 text-sm text-white/55">
                  Awaiting high-probability execution to populate the archive.
                </div>
              )}
            </div>
          </div>
        </motion.aside>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-30 px-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,20,0.92),rgba(6,9,14,0.96))] px-4 py-3 shadow-[0_20px_90px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
          <div className="flex items-center gap-2 text-xs text-white/72">
            <Filter className="h-4 w-4 text-amber-100" />
            Filters
          </div>
          <div className="flex flex-1 flex-wrap justify-center gap-2">
            {DEFAULT_QUALITY_FILTER.concat('B+' as const).map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => setQualityFilter((current) => toggleQuality(current, grade))}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${qualityFilter.includes(grade) ? GRADE_META[grade] : 'border-white/10 bg-white/[0.04] text-white/60'}`}
              >
                {grade}
              </button>
            ))}
            {assetFilterOptions.slice(0, 4).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAssetFilter(option)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${assetFilter === option ? 'border-amber-300/25 bg-amber-300/10 text-amber-100' : 'border-white/10 bg-white/[0.04] text-white/60'}`}
              >
                {option === 'all' ? 'All' : option}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void saveWatchlist(selectedSignal, !alertsEnabled)}
            disabled={watchlistSaving}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition ${alertsEnabled ? 'border-amber-300/25 bg-amber-300/10 text-amber-100' : 'border-white/10 bg-white/[0.04] text-white/70'}`}
          >
            <Bell className="h-4 w-4" />
            {alertsEnabled ? 'Alerts On' : 'Alerts Off'}
          </button>
        </div>
      </div>
    </div>
  );
}
