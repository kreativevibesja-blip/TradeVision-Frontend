'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Loader2, Wifi, WifiOff } from 'lucide-react';
import { api } from '@/lib/api';
import { DERIV_ANALYSIS_CANDLE_COUNT, type DerivCandle, getDerivCacheKey } from '@/lib/deriv-live';
import { AnnotatedCandlesChart } from '@/components/AnnotatedCandlesChart';
import type { ChartOverlaySet } from '@/lib/live-chart-drawings';
import { cn } from '@/lib/utils';

interface LiveChartProps {
  symbol: string;
  granularity: number;
  token?: string | null;
  overlay: ChartOverlaySet | null;
  onCandlesChange?: (candles: DerivCandle[]) => void;
  onError?: (message: string) => void;
  onStatusChange?: (status: LiveChartStatus) => void;
  className?: string;
  height?: number;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';

export interface LiveChartStatus {
  connectionState: ConnectionState;
  loadingHistory: boolean;
  candleCount: number;
}

const CACHE_TTL_MS = 30_000;
const MAX_CANDLES = DERIV_ANALYSIS_CANDLE_COUNT;
const SNAPSHOT_LIMIT = MAX_CANDLES;
const POLL_INTERVAL_MS = 5000;

const readCachedCandles = (symbol: string, granularity: number): DerivCandle[] | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getDerivCacheKey(symbol, granularity));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { savedAt: number; candles: DerivCandle[] };
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > CACHE_TTL_MS || !Array.isArray(parsed.candles)) {
      window.localStorage.removeItem(getDerivCacheKey(symbol, granularity));
      return null;
    }

    return parsed.candles;
  } catch {
    return null;
  }
};

const storeCachedCandles = (symbol: string, granularity: number, candles: DerivCandle[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      getDerivCacheKey(symbol, granularity),
      JSON.stringify({ savedAt: Date.now(), candles })
    );
  } catch {
    // Ignore cache failures.
  }
};

const mergeCandles = (existing: DerivCandle[], incoming: DerivCandle[]) => {
  const byTime = new Map<number, DerivCandle>();

  for (const candle of existing) {
    byTime.set(candle.time, candle);
  }

  for (const candle of incoming) {
    byTime.set(candle.time, candle);
  }

  return Array.from(byTime.values())
    .sort((a, b) => a.time - b.time)
    .slice(-MAX_CANDLES);
};

export function LiveChart({
  symbol,
  granularity,
  token,
  overlay,
  onCandlesChange,
  onError,
  onStatusChange,
  className,
  height,
}: LiveChartProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const candlesRef = useRef<DerivCandle[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [candleCount, setCandleCount] = useState(0);
  const [candles, setCandles] = useState<DerivCandle[]>([]);

  const statusMeta = useMemo(() => {
    if (loadingHistory) {
      return { label: 'Loading candles', icon: Loader2, className: 'text-amber-300' };
    }
    if (connectionState === 'connected') {
      return { label: 'Live', icon: Wifi, className: 'text-emerald-300' };
    }
    if (connectionState === 'connecting') {
      return { label: 'Connecting', icon: Activity, className: 'text-cyan-300' };
    }
    return { label: 'Offline', icon: WifiOff, className: 'text-red-300' };
  }, [connectionState, loadingHistory]);

  useEffect(() => {
    onStatusChange?.({ connectionState, loadingHistory, candleCount });
  }, [candleCount, connectionState, loadingHistory, onStatusChange]);

  useEffect(() => {
    const cachedCandles = readCachedCandles(symbol, granularity);
    if (cachedCandles?.length) {
      candlesRef.current = cachedCandles;
      setCandles(cachedCandles);
      setCandleCount(cachedCandles.length);
      onCandlesChange?.(cachedCandles.slice(-MAX_CANDLES));
      setLoadingHistory(false);
    } else {
      candlesRef.current = [];
      setCandles([]);
      setCandleCount(0);
      setLoadingHistory(true);
    }

    setConnectionState('connecting');
    onError?.('');

    if (!token) {
      setConnectionState('disconnected');
      setLoadingHistory(false);
      onError?.('Authentication is required for live chart data.');
      return;
    }

    let active = true;

    const applyIncomingCandles = (incoming: DerivCandle[], replaceAll = false) => {
      const nextCandles = replaceAll ? incoming.slice(-MAX_CANDLES) : mergeCandles(candlesRef.current, incoming);
      candlesRef.current = nextCandles;
      setCandles(nextCandles);
      setCandleCount(nextCandles.length);
      storeCachedCandles(symbol, granularity, nextCandles);
      onCandlesChange?.(nextCandles.slice(-MAX_CANDLES));
    };

    const fetchSnapshot = async (limit: number, replaceAll = false) => {
      try {
        const { marketData } = await api.getDerivLiveChartMarketData(symbol, granularity, token, limit);
        if (!active) {
          return;
        }

        const mapped = marketData.candles.filter((candle) =>
          [candle.time, candle.open, candle.high, candle.low, candle.close].every(Number.isFinite)
        );

        applyIncomingCandles(mapped, replaceAll);
        setConnectionState('connected');
        setLoadingHistory(false);
        onError?.('');
      } catch (error) {
        if (!active) {
          return;
        }

        setConnectionState('disconnected');
        setLoadingHistory(false);
        onError?.(error instanceof Error ? error.message : 'Failed to load Deriv live chart data.');
      }
    };

    void fetchSnapshot(SNAPSHOT_LIMIT, true);

    const intervalId = window.setInterval(() => {
      void fetchSnapshot(3, false);
    }, POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [symbol, granularity, token, onCandlesChange, onError]);

  const StatusIcon = statusMeta.icon;

  return (
    <div ref={hostRef} className={cn('relative h-full w-full min-h-0 overflow-hidden rounded-[1rem] bg-slate-950', className)}>
      <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 backdrop-blur">
        <StatusIcon className={`h-3.5 w-3.5 ${statusMeta.className} ${loadingHistory ? 'animate-spin' : ''}`} />
        {statusMeta.label}
      </div>

      <AnnotatedCandlesChart
        candles={candles}
        overlay={overlay}
        height={height}
        loading={loadingHistory && candles.length === 0}
        loadingMessage="Loading Deriv candles..."
        resetKey={`${symbol}:${granularity}`}
      />
    </div>
  );
}
