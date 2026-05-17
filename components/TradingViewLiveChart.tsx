'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Loader2, Wifi, WifiOff } from 'lucide-react';
import { api } from '@/lib/api';
import { AnnotatedCandlesChart } from '@/components/AnnotatedCandlesChart';
import type { LiveChartStatus } from '@/components/LiveChart';
import type { ChartOverlaySet } from '@/lib/live-chart-drawings';
import type { DerivCandle } from '@/lib/deriv-live';
import { cn } from '@/lib/utils';
import { usePageActivity } from '@/hooks/usePageActivity';
import { trackPollingMetric } from '@/lib/egressMetrics';

interface TradingViewLiveChartProps {
  symbol: string;
  timeframe: string;
  token?: string | null;
  overlay: ChartOverlaySet | null;
  onCandlesChange?: (candles: DerivCandle[]) => void;
  onError?: (message: string) => void;
  onStatusChange?: (status: LiveChartStatus) => void;
  className?: string;
  height?: number;
}

type ConnectionState = LiveChartStatus['connectionState'];

const CACHE_TTL_MS = 45_000;
const POLL_INTERVAL_MS = 15_000;

const getCacheKey = (symbol: string, timeframe: string) => `tradingview_live_chart_cache:${symbol}:${timeframe}`;

const readCachedCandles = (symbol: string, timeframe: string): DerivCandle[] | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(getCacheKey(symbol, timeframe));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { savedAt: number; candles: DerivCandle[] };
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > CACHE_TTL_MS || !Array.isArray(parsed.candles)) {
      window.localStorage.removeItem(getCacheKey(symbol, timeframe));
      return null;
    }

    return parsed.candles;
  } catch {
    return null;
  }
};

const storeCachedCandles = (symbol: string, timeframe: string, candles: DerivCandle[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      getCacheKey(symbol, timeframe),
      JSON.stringify({ savedAt: Date.now(), candles }),
    );
  } catch {
    // Ignore cache failures.
  }
};

const mapMarketCandles = (
  candles: Array<{ timestamp: string; open: number; high: number; low: number; close: number }>,
) =>
  candles
    .map((candle) => ({
      time: Math.floor(new Date(candle.timestamp).getTime() / 1000),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }))
    .filter((candle) => [candle.time, candle.open, candle.high, candle.low, candle.close].every(Number.isFinite))
    .sort((left, right) => left.time - right.time);

export function TradingViewLiveChart({
  symbol,
  timeframe,
  token,
  overlay,
  onCandlesChange,
  onError,
  onStatusChange,
  className,
  height,
}: TradingViewLiveChartProps) {
  const { isActive } = usePageActivity();
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
    const cachedCandles = readCachedCandles(symbol, timeframe);
    if (cachedCandles?.length) {
      candlesRef.current = cachedCandles;
      setCandles(cachedCandles);
      setCandleCount(cachedCandles.length);
      onCandlesChange?.(cachedCandles);
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
    const stopMetric = trackPollingMetric(`tradingview-live-chart:${symbol}:${timeframe}`);

    const fetchSnapshot = async () => {
      try {
        const { marketData } = await api.getLiveChartMarketData(symbol, timeframe, token);
        if (!active) {
          return;
        }

        const mapped = mapMarketCandles(marketData.candles);
        candlesRef.current = mapped;
        setCandles(mapped);
        setCandleCount(mapped.length);
        storeCachedCandles(symbol, timeframe, mapped);
        onCandlesChange?.(mapped);
        setConnectionState('connected');
        setLoadingHistory(false);
        onError?.('');
      } catch (error) {
        if (!active) {
          return;
        }

        setConnectionState('disconnected');
        setLoadingHistory(false);
        onError?.(error instanceof Error ? error.message : 'Failed to load TradingView market data.');
      }
    };

    void fetchSnapshot();

    const intervalId = isActive
      ? window.setInterval(() => {
          void fetchSnapshot();
        }, POLL_INTERVAL_MS)
      : null;

    return () => {
      active = false;
      stopMetric();
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isActive, onCandlesChange, onError, symbol, timeframe, token]);

  const StatusIcon = statusMeta.icon;

  return (
    <div className={cn('relative h-full w-full min-h-0 overflow-hidden rounded-[1rem] bg-slate-950', className)}>
      <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 backdrop-blur">
        <StatusIcon className={`h-3.5 w-3.5 ${statusMeta.className} ${loadingHistory ? 'animate-spin' : ''}`} />
        {statusMeta.label}
      </div>

      <AnnotatedCandlesChart
        candles={candles}
        overlay={overlay}
        height={height}
        loading={loadingHistory && candles.length === 0}
        loadingMessage="Loading TradingView candles..."
        resetKey={`${symbol}:${timeframe}`}
      />
    </div>
  );
}
