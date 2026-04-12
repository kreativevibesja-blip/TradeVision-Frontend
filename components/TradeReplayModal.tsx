'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CandlestickSeries, ColorType, LineSeries, LineStyle, createChart } from 'lightweight-charts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ScannerTradeReplay } from '@/lib/api';
import { Loader2, Pause, Play, RotateCcw, X, Zap } from 'lucide-react';

interface TradeReplayModalProps {
  open: boolean;
  onClose: () => void;
  replay: ScannerTradeReplay | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const BASE_STEP_DELAY_MS = 320;

function formatPrice(price: number) {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 10) return price.toFixed(3);
  return price.toFixed(5);
}

function decompressCandles(candles: ScannerTradeReplay['replayCandles']) {
  return candles.map((candle) => ({
    time: Math.floor(candle[0] / 1000),
    open: candle[1],
    high: candle[2],
    low: candle[3],
    close: candle[4],
  }));
}

export function TradeReplayModal({ open, onClose, replay, loading, error, onRetry }: TradeReplayModalProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const markerSeriesRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [cursor, setCursor] = useState(1);
  const [flashState, setFlashState] = useState<'tp' | 'sl' | null>(null);

  const preEntryCandles = useMemo(() => replay ? decompressCandles(replay.preEntryCandles) : [], [replay]);
  const replayCandles = useMemo(() => replay ? decompressCandles(replay.replayCandles) : [], [replay]);
  const displayedCandles = useMemo(() => {
    if (!replay) return [];
    return [...preEntryCandles, ...replayCandles.slice(0, cursor)];
  }, [cursor, preEntryCandles, replay, replayCandles]);
  const currentCandle = replayCandles[Math.max(0, Math.min(cursor - 1, replayCandles.length - 1))] ?? null;

  useEffect(() => {
    if (!open) {
      return;
    }

    setSpeed(1);
    setIsPlaying(true);
    setCursor(1);
    setFlashState(null);
  }, [open, replay?.id]);

  useEffect(() => {
    if (!open || !replay || !isPlaying || replayCandles.length <= 1) {
      return;
    }

    if (cursor >= replayCandles.length) {
      setIsPlaying(false);
      if (replay.outcome === 'tp' || replay.outcome === 'sl') {
        setFlashState(replay.outcome);
        const timeout = window.setTimeout(() => setFlashState(null), 850);
        return () => window.clearTimeout(timeout);
      }
      return;
    }

    const timeout = window.setTimeout(() => {
      setCursor((current) => Math.min(current + 1, replayCandles.length));
    }, BASE_STEP_DELAY_MS / speed);

    return () => window.clearTimeout(timeout);
  }, [cursor, isPlaying, open, replay, replayCandles.length, speed]);

  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#020617' },
        textColor: '#e2e8f0',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 420,
      leftPriceScale: { visible: false },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.12, bottom: 0.12 },
      },
      timeScale: {
        borderColor: '#1e293b',
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
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      borderVisible: false,
    });

    const markerSeries = chart.addSeries(LineSeries, {
      color: '#60a5fa',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    markerSeriesRef.current = markerSeries;

    const resize = () => {
      if (!chartContainerRef.current || !chartRef.current) {
        return;
      }

      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight || 420,
      });
      chartRef.current.timeScale().fitContent();
    };

    resizeObserverRef.current = new ResizeObserver(resize);
    resizeObserverRef.current.observe(chartContainerRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      for (const priceLine of priceLinesRef.current) {
        candleSeries.removePriceLine(priceLine);
      }
      priceLinesRef.current = [];
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      markerSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const markerSeries = markerSeriesRef.current;
    const chart = chartRef.current;
    if (!candleSeries || !markerSeries || !chart || !replay) {
      return;
    }

    candleSeries.setData(displayedCandles);
    markerSeries.setData(currentCandle ? [{ time: currentCandle.time, value: currentCandle.close }] : []);

    for (const priceLine of priceLinesRef.current) {
      candleSeries.removePriceLine(priceLine);
    }
    priceLinesRef.current = [];

    priceLinesRef.current.push(
      candleSeries.createPriceLine({ price: replay.entry, color: '#3b82f6', lineWidth: 2, lineStyle: LineStyle.Solid, title: 'Entry' }),
      candleSeries.createPriceLine({ price: replay.stopLoss, color: '#ef4444', lineWidth: 2, lineStyle: LineStyle.Dashed, title: 'SL' }),
      candleSeries.createPriceLine({ price: replay.takeProfit, color: '#22c55e', lineWidth: 2, lineStyle: LineStyle.Solid, title: 'TP' }),
    );

    if (replay.takeProfit2 != null) {
      priceLinesRef.current.push(
        candleSeries.createPriceLine({ price: replay.takeProfit2, color: '#86efac', lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'TP2' }),
      );
    }

    chart.timeScale().fitContent();
  }, [currentCandle, displayedCandles, replay]);

  const progress = replay && replayCandles.length > 0 ? Math.min(100, Math.round((cursor / replayCandles.length) * 100)) : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.12 }}
            onClick={(event) => event.stopPropagation()}
            className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-20 rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="border-b border-white/10 px-4 pb-4 pt-5 sm:px-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-white sm:text-xl">{replay?.symbol ?? 'Trade Replay'}</h3>
                    {replay ? (
                      <>
                        <Badge variant={replay.direction === 'buy' ? 'success' : 'destructive'}>{replay.direction.toUpperCase()}</Badge>
                        <Badge variant="outline" className="border-blue-400/30 bg-blue-500/10 text-blue-200">{replay.timeframe}</Badge>
                        <Badge variant="outline" className={replay.outcome === 'tp' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : replay.outcome === 'sl' ? 'border-red-400/30 bg-red-500/10 text-red-200' : 'border-amber-400/30 bg-amber-500/10 text-amber-200'}>
                          {replay.outcome === 'tp' ? 'TP Hit' : replay.outcome === 'sl' ? 'SL Hit' : 'Live Replay'}
                        </Badge>
                      </>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Replay starts from the entry candle and advances candle by candle through the trade path.
                  </p>
                </div>

                {replay ? (
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <Metric label="Entry" value={formatPrice(replay.entry)} color="text-blue-300" />
                    <Metric label="SL" value={formatPrice(replay.stopLoss)} color="text-red-300" />
                    <Metric label="TP" value={formatPrice(replay.takeProfit)} color="text-emerald-300" />
                    <Metric label="Live Candle" value={currentCandle ? formatPrice(currentCandle.close) : '-'} color="text-cyan-300" />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="relative flex-1 px-3 pb-3 pt-3 sm:px-5 sm:pb-5">
              {flashState ? (
                <motion.div
                  initial={{ opacity: 0.55 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`pointer-events-none absolute inset-3 z-10 rounded-2xl ${flashState === 'tp' ? 'bg-emerald-500/25' : 'bg-red-500/25'} sm:inset-5`}
                />
              ) : null}

              <div className="relative h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 sm:h-[460px]">
                <div ref={chartContainerRef} className="h-full w-full" />
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75">
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading replay...
                    </div>
                  </div>
                ) : null}
                {!loading && error ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 p-6">
                    <div className="max-w-sm rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-center">
                      <p className="text-sm text-red-100">{error}</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>Try again</Button>
                    </div>
                  </div>
                ) : null}
              </div>

              {replay ? (
                <>
                  <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsPlaying((current) => !current)} disabled={loading || !!error || replayCandles.length <= 1}>
                        {isPlaying ? <Pause className="mr-1.5 h-4 w-4" /> : <Play className="mr-1.5 h-4 w-4" />}
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCursor(1);
                          setIsPlaying(false);
                          setFlashState(null);
                        }}
                        disabled={loading || !!error}
                      >
                        <RotateCcw className="mr-1.5 h-4 w-4" />
                        Restart
                      </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      <span className="text-slate-400">Speed</span>
                      {[1, 2, 4].map((value) => (
                        <button
                          key={value}
                          onClick={() => setSpeed(value as 1 | 2 | 4)}
                          className={`rounded-full px-3 py-1.5 transition-colors ${speed === value ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                        >
                          {value}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-cyan-300" /> Entry highlighted, replay progress {progress}%</span>
                      <span>{cursor}/{Math.max(replayCandles.length, 1)} candles</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        className={`h-full ${replay.outcome === 'tp' ? 'bg-emerald-400' : replay.outcome === 'sl' ? 'bg-red-400' : 'bg-cyan-400'}`}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className={`mt-1 font-mono text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}