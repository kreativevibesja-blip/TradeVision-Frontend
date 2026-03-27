'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Loader2, Wifi, WifiOff } from 'lucide-react';
import { DERIV_ANALYSIS_CANDLE_COUNT, type DerivCandle, getDerivCacheKey } from '@/lib/deriv-live';
import { AnnotatedCandlesChart } from '@/components/AnnotatedCandlesChart';
import type { ChartOverlaySet } from '@/lib/live-chart-drawings';
import { cn } from '@/lib/utils';

interface LiveChartProps {
  symbol: string;
  granularity: number;
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

export function LiveChart({
  symbol,
  granularity,
  overlay,
  onCandlesChange,
  onError,
  onStatusChange,
  className,
  height,
}: LiveChartProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
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
      setCandles([]);
      setLoadingHistory(true);
    }

    setConnectionState('connecting');
    onError?.('');

    wsRef.current?.close();
    const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=102880');
    wsRef.current = ws;

    const requestHistory = () => {
      ws.send(
        JSON.stringify({
          ticks_history: symbol,
          style: 'candles',
          granularity,
          count: MAX_CANDLES,
          end: 'latest',
        })
      );
    };

    const subscribeTicks = () => {
      ws.send(
        JSON.stringify({
          ticks: symbol,
          subscribe: 1,
        })
      );
    };

    ws.onopen = () => {
      setConnectionState('connected');
      requestHistory();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as any;
        if (message.error?.message) {
          onError?.(message.error.message);
          setConnectionState('disconnected');
          return;
        }

        if (message.msg_type === 'candles' && Array.isArray(message.candles)) {
          const mapped = message.candles
            .map((candle: any) => ({
              time: Number(candle.epoch),
              open: Number(candle.open),
              high: Number(candle.high),
              low: Number(candle.low),
              close: Number(candle.close),
            }))
            .filter((candle: DerivCandle) => [candle.time, candle.open, candle.high, candle.low, candle.close].every(Number.isFinite));

          candlesRef.current = mapped;
          setCandles(mapped);
          setCandleCount(mapped.length);
          storeCachedCandles(symbol, granularity, mapped);
          onCandlesChange?.(mapped.slice(-MAX_CANDLES));
          setLoadingHistory(false);
          subscribeTicks();
          return;
        }

        if (message.msg_type === 'tick' && message.tick) {
          const epoch = Number(message.tick.epoch);
          const quote = Number(message.tick.quote);
          if (!Number.isFinite(epoch) || !Number.isFinite(quote)) {
            return;
          }

          const candleTime = Math.floor(epoch / granularity) * granularity;
          const nextCandles = [...candlesRef.current];
          const lastCandle = nextCandles[nextCandles.length - 1];

          if (lastCandle && lastCandle.time === candleTime) {
            const updated = {
              ...lastCandle,
              high: Math.max(lastCandle.high, quote),
              low: Math.min(lastCandle.low, quote),
              close: quote,
            };
            nextCandles[nextCandles.length - 1] = updated;
          } else {
            const open = lastCandle?.close ?? quote;
            const created = {
              time: candleTime,
              open,
              high: Math.max(open, quote),
              low: Math.min(open, quote),
              close: quote,
            };
            nextCandles.push(created);
            if (nextCandles.length > MAX_CANDLES) {
              nextCandles.splice(0, nextCandles.length - MAX_CANDLES);
            }
          }

          candlesRef.current = nextCandles;
          setCandles(nextCandles);
          setCandleCount(nextCandles.length);
          storeCachedCandles(symbol, granularity, nextCandles);
          onCandlesChange?.(nextCandles.slice(-MAX_CANDLES));
        }
      } catch {
        onError?.('Failed to parse Deriv data feed.');
      }
    };

    ws.onerror = () => {
      setConnectionState('disconnected');
      onError?.('Deriv live feed connection failed.');
    };

    ws.onclose = () => {
      setConnectionState('disconnected');
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [symbol, granularity, onCandlesChange, onError]);

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
