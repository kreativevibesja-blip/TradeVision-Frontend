'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CandlestickSeries, ColorType, createChart } from 'lightweight-charts';
import { Activity, Loader2, Wifi, WifiOff } from 'lucide-react';
import { DERIV_ANALYSIS_CANDLE_COUNT, type DerivAnalysisResult, type DerivCandle, getDerivCacheKey } from '@/lib/deriv-live';

interface LiveChartProps {
  symbol: string;
  granularity: number;
  analysis: DerivAnalysisResult | null;
  onCandlesChange?: (candles: DerivCandle[]) => void;
  onError?: (message: string) => void;
  height?: number;
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected';

interface OverlayRect {
  key: string;
  left: number;
  width: number;
  top: number;
  height: number;
  color: string;
  label: string;
}

const CHART_BG = '#0f172a';
const GRID = '#1e293b';
const TEXT = '#e2e8f0';
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

const sortZoneBounds = (start: number, end: number) => ({ low: Math.min(start, end), high: Math.max(start, end) });

export function LiveChart({ symbol, granularity, analysis, onCandlesChange, onError, height = 520 }: LiveChartProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const overlayFrameRef = useRef<number | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const candlesRef = useRef<DerivCandle[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [overlayRects, setOverlayRects] = useState<OverlayRect[]>([]);

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
    if (!chartContainerRef.current) {
      return;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: CHART_BG },
        textColor: TEXT,
      },
      grid: {
        vertLines: { color: GRID },
        horzLines: { color: GRID },
      },
      width: chartContainerRef.current.clientWidth,
      height,
      rightPriceScale: {
        borderColor: GRID,
      },
      timeScale: {
        borderColor: GRID,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: '#334155' },
        horzLine: { color: '#334155' },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const resize = () => {
      if (!chartContainerRef.current || !chartRef.current) {
        return;
      }
      chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth, height });
      queueOverlayCalculation();
    };

    resizeObserverRef.current = new ResizeObserver(resize);
    resizeObserverRef.current.observe(chartContainerRef.current);

    return () => {
      if (overlayFrameRef.current) {
        window.cancelAnimationFrame(overlayFrameRef.current);
      }
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [height]);

  const queueOverlayCalculation = () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (overlayFrameRef.current) {
      window.cancelAnimationFrame(overlayFrameRef.current);
    }

    overlayFrameRef.current = window.requestAnimationFrame(() => {
      const chart = chartRef.current;
      const candleSeries = candleSeriesRef.current;
      const container = chartContainerRef.current;

      if (!chart || !candleSeries || !container || !analysis?.zones?.length) {
        setOverlayRects([]);
        return;
      }

      const nextRects: OverlayRect[] = [];

      for (const zone of analysis.zones) {
        if (zone.fromTime == null || zone.toTime == null) {
          continue;
        }

        const leftCoord = chart.timeScale().timeToCoordinate(zone.fromTime);
        const rightCoord = chart.timeScale().timeToCoordinate(zone.toTime);
        const bounds = sortZoneBounds(zone.start, zone.end);
        const topCoord = candleSeries.priceToCoordinate(bounds.high);
        const bottomCoord = candleSeries.priceToCoordinate(bounds.low);

        if ([leftCoord, rightCoord, topCoord, bottomCoord].some((value) => value == null)) {
          continue;
        }

        const left = Math.min(leftCoord, rightCoord);
        const width = Math.max(Math.abs(rightCoord - leftCoord), 8);
        const top = Math.min(topCoord, bottomCoord);
        const heightValue = Math.max(Math.abs(bottomCoord - topCoord), 8);

        nextRects.push({
          key: `${zone.type}-${zone.fromTime}-${zone.toTime}-${zone.start}-${zone.end}`,
          left,
          width,
          top,
          height: heightValue,
          color: zone.type === 'demand' ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)',
          label: zone.type === 'demand' ? 'Demand' : 'Supply',
        });
      }

      setOverlayRects(nextRects);
    });
  };

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    if (!candleSeries) {
      return;
    }

    for (const priceLine of priceLinesRef.current) {
      candleSeries.removePriceLine(priceLine);
    }
    priceLinesRef.current = [];

    if (!analysis) {
      queueOverlayCalculation();
      return;
    }

    const createLine = (price: number | null, color: string, title: string) => {
      if (price == null) {
        return;
      }

      const line = candleSeries.createPriceLine({
        price,
        color,
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title,
      });

      priceLinesRef.current.push(line);
    };

    createLine(analysis.entry, '#38bdf8', 'Entry');
    createLine(analysis.stopLoss, '#ef4444', 'SL');
    createLine(analysis.takeProfit, '#22c55e', 'TP');
    queueOverlayCalculation();
  }, [analysis]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }

    const cachedCandles = readCachedCandles(symbol, granularity);
    if (cachedCandles?.length) {
      candlesRef.current = cachedCandles;
      candleSeriesRef.current?.setData(cachedCandles);
      chart.timeScale().fitContent();
      onCandlesChange?.(cachedCandles.slice(-MAX_CANDLES));
      setLoadingHistory(false);
    } else {
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
          candleSeriesRef.current?.setData(mapped);
          chart.timeScale().fitContent();
          storeCachedCandles(symbol, granularity, mapped);
          onCandlesChange?.(mapped.slice(-MAX_CANDLES));
          setLoadingHistory(false);
          queueOverlayCalculation();
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
            candleSeriesRef.current?.update(updated);
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
            candleSeriesRef.current?.update(created);
          }

          candlesRef.current = nextCandles;
          storeCachedCandles(symbol, granularity, nextCandles);
          onCandlesChange?.(nextCandles.slice(-MAX_CANDLES));
          queueOverlayCalculation();
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

  useEffect(() => {
    queueOverlayCalculation();
  }, [analysis, symbol, granularity]);

  const StatusIcon = statusMeta.icon;

  return (
    <div ref={hostRef} className="relative h-full min-h-[520px] overflow-hidden rounded-[1.5rem] bg-slate-950">
      <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 backdrop-blur">
        <StatusIcon className={`h-3.5 w-3.5 ${statusMeta.className} ${loadingHistory ? 'animate-spin' : ''}`} />
        {statusMeta.label}
      </div>

      <div ref={chartContainerRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
        {overlayRects.map((rect) => (
          <div
            key={rect.key}
            className="absolute rounded-lg border"
            style={{
              left: rect.left,
              width: rect.width,
              top: rect.top,
              height: rect.height,
              backgroundColor: rect.color,
              borderColor: rect.color.replace('0.18', '0.45'),
            }}
          >
            <span className="absolute left-2 top-1 rounded bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-100">
              {rect.label}
            </span>
          </div>
        ))}
      </div>

      {loadingHistory && candlesRef.current.length === 0 ? (
        <div className="absolute inset-0 z-20 animate-pulse bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading Deriv candles...</div>
        </div>
      ) : null}
    </div>
  );
}
