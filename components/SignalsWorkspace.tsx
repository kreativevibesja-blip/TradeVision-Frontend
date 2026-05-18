'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  BellRing,
  ChevronDown,
  Crown,
  History,
  Loader2,
  Radar,
  ShieldCheck,
  Target,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
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
}

interface ActiveSignalRecord extends PersistedSignalRecord {
  reason: string;
  executionNote: string;
  setupLabel: string;
}

interface MarketScanTarget {
  value: string;
  label: string;
  category: string;
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

export function SignalsWorkspace({ source = 'deriv' }: SignalsWorkspaceProps) {
  const { user, token, loading: authLoading } = useAuth();
  const isDeriv = source === 'deriv';
  const [timeframe, setTimeframe] = useState(isDeriv ? '15m' : 'M15');
  const [history, setHistory] = useState<PersistedSignalRecord[]>([]);
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [activeSignals, setActiveSignals] = useState<ActiveSignalRecord[]>([]);
  const [selectedSignalKey, setSelectedSignalKey] = useState<string | null>(null);
  const [scanState, setScanState] = useState<{ loading: boolean; error: string; lastUpdated: number | null }>({
    loading: true,
    error: '',
    lastUpdated: null,
  });

  useEffect(() => {
    setTimeframe(isDeriv ? '15m' : 'M15');
    setHistory(readHistory(source));
    setAssetFilter('all');
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
    () => activeSignals.filter((item) => assetFilter === 'all' || item.assetClass === assetFilter),
    [activeSignals, assetFilter],
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

        setActiveSignals(signals.map((signal) => ({ ...signal, timeframe: selectedTimeframe.label, savedAt: Date.now() })));
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
    }, 180000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [marketUniverse, selectedTimeframe.label, source, timeframe, token]);

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
      ? { label: 'Hydrating', icon: Loader2, className: 'border-amber-400/30 bg-amber-500/10 text-amber-100' }
      : scanState.lastUpdated
        ? { label: 'Live', icon: Wifi, className: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' }
        : { label: 'Reconnecting', icon: Activity, className: 'border-sky-400/30 bg-sky-500/10 text-sky-100' };
  const StatusIcon = statusTone.icon;
  const signalCount = activeSignals.length;
  const providerLabel = isDeriv ? 'Deriv market universe' : 'Pairs and indices universe';

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
            Sign in to view your signals.
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
                ? 'Upgrade to PRO+ to unlock Deriv signals with session-grade entries and live updates.'
                : 'Upgrade to any paid plan to unlock TradingView signals across forex, commodities, indices, and crypto.'}
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
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
        <Card className="mobile-card border-white/10">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-white">Signals</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                  Active session signals and recent signal history.
                </p>
              </div>

              <Badge variant="outline" className={statusTone.className}>
                <StatusIcon className={`mr-2 h-3.5 w-3.5 ${scanState.loading ? 'animate-spin' : ''}`} />
                {statusTone.label}
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: Radar, label: 'Active Signals', value: `${signalCount}/3` },
                { icon: Target, label: 'Markets', value: `${marketUniverse.length} scanned` },
                { icon: BellRing, label: 'Timeframe', value: selectedTimeframe.label },
                { icon: Activity, label: 'Feed', value: providerLabel },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
                    <span>{item.label}</span>
                    <item.icon className="h-4 w-4 text-white/60" />
                  </div>
                  <div className="mt-3 text-lg font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </div>

            {scanState.error ? (
              <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {scanState.error}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.03 }}>
        <Card className="mobile-card border-white/10">
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3">
              <details open className="group rounded-2xl border border-white/8 bg-white/5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Activity className="h-4 w-4 text-emerald-300" />
                    Active Signals
                    <span className="text-xs font-normal text-white/40">{signalCount} live</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-white/45 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-3 border-t border-white/8 px-4 py-4">
                  {SESSION_ORDER.map((session) => {
                    return null;
                  })}
                  {filteredActiveSignals.length > 0 ? filteredActiveSignals.map((signal) => {
                    const active = selectedSignalKey === signal.key;

                    return (
                      <button
                        key={signal.key}
                        type="button"
                        onClick={() => setSelectedSignalKey(signal.key)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-[rgba(255,223,112,0.3)] bg-white/10' : 'border-white/8 bg-white/5 hover:border-white/16'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">{SESSION_META[signal.session].label}</div>
                            <div className="mt-1 text-sm font-medium text-slate-100">{signal.symbolLabel}</div>
                            <div className="mt-1 text-xs text-white/40">{signal.assetClass}</div>
                          </div>
                          <Badge variant="outline" className={signal.direction === 'buy' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-rose-400/30 bg-rose-500/10 text-rose-100'}>
                            {signal.direction.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-300 sm:grid-cols-4">
                          <div><div className="text-white/40">Entry</div><div className="mt-1 font-medium text-slate-100">{formatPrice(signal.entry)}</div></div>
                          <div><div className="text-white/40">SL</div><div className="mt-1 font-medium text-slate-100">{formatPrice(signal.stopLoss)}</div></div>
                          <div><div className="text-white/40">TP</div><div className="mt-1 font-medium text-slate-100">{formatPrice(signal.takeProfit)}</div></div>
                          <div><div className="text-white/40">Time</div><div className="mt-1 font-medium text-slate-100">{formatSignalTime(signal.candleTime)}</div></div>
                        </div>

                        <p className="mt-3 text-xs leading-5 text-white/45">{signal.executionNote}</p>
                      </button>
                    );
                  }) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-white/45">
                      No live signals right now.
                    </div>
                  )}
                </div>
              </details>

              <details className="group rounded-2xl border border-white/8 bg-white/5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <History className="h-4 w-4 text-emerald-300" />
                    Past Signals
                    <span className="text-xs font-normal text-white/40">{filteredHistory.length} shown</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-white/45 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-3 border-t border-white/8 px-4 py-4">
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
              </details>

              <details className="group rounded-2xl border border-white/8 bg-white/5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 text-left">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    Selected Signal
                  </div>
                  <ChevronDown className="h-4 w-4 text-white/45 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-white/8 px-4 py-4">
                  {activeSignal ? (
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-slate-300">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-100">{activeSignal.symbolLabel}</div>
                          <div className="mt-1 text-xs text-white/40">{SESSION_META[activeSignal.session].label} · {activeSignal.timeframe}</div>
                        </div>
                        <Badge variant="outline" className={activeSignal.direction === 'buy' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border-rose-400/30 bg-rose-500/10 text-rose-100'}>
                          {activeSignal.direction.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-slate-300 sm:grid-cols-4">
                        <div className="rounded-xl border border-white/8 bg-white/5 p-2">Entry {formatPrice(activeSignal.entry)}</div>
                        <div className="rounded-xl border border-white/8 bg-white/5 p-2">SL {formatPrice(activeSignal.stopLoss)}</div>
                        <div className="rounded-xl border border-white/8 bg-white/5 p-2">TP {formatPrice(activeSignal.takeProfit)}</div>
                        <div className="rounded-xl border border-white/8 bg-white/5 p-2">Confidence {activeSignal.confidence}%</div>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-white/45">{activeSignal.reason}</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-white/45">
                      No active signal selected yet.
                    </div>
                  )}
                </div>
              </details>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
