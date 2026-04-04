'use client';

import { useEffect, useRef, useState } from 'react';
import { CandlestickSeries, ColorType, LineSeries, LineStyle, createChart } from 'lightweight-charts';
import { calculateEmaSeries } from '@/lib/ema';
import { cn } from '@/lib/utils';
import type { ChartCandle, ChartOverlaySet } from '@/lib/live-chart-drawings';

interface AnnotatedCandlesChartProps {
  candles: ChartCandle[];
  overlay: ChartOverlaySet | null;
  className?: string;
  height?: number;
  loading?: boolean;
  loadingMessage?: string;
  resetKey?: string;
}

interface OverlayRect {
  key: string;
  left: number;
  width: number;
  top: number;
  height: number;
  color: string;
  borderColor: string;
  label: string;
}

const CHART_BG = '#020617';
const GRID = '#1e293b';
const TEXT = '#e2e8f0';
const EMA_50_COLOR = '#38bdf8';
const EMA_200_COLOR = '#f59e0b';

export function AnnotatedCandlesChart({
  candles,
  overlay,
  className,
  height,
  loading = false,
  loadingMessage = 'Loading chart...',
  resetKey,
}: AnnotatedCandlesChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const ema50SeriesRef = useRef<any>(null);
  const ema200SeriesRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const overlayFrameRef = useRef<number | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const hasFittedRef = useRef(false);
  const [overlayRects, setOverlayRects] = useState<OverlayRect[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    const getChartHeight = () => {
      if (!chartContainerRef.current) {
        return height ?? 520;
      }

      return chartContainerRef.current.clientHeight || height || 520;
    };

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
      height: getChartHeight(),
      leftPriceScale: {
        visible: false,
      },
      rightPriceScale: {
        visible: true,
        borderColor: GRID,
        borderVisible: true,
        ticksVisible: true,
        entireTextOnly: false,
        minimumWidth: 76,
        autoScale: true,
        scaleMargins: {
          top: 0.12,
          bottom: 0.12,
        },
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

    const ema50Series = chart.addSeries(LineSeries, {
      color: EMA_50_COLOR,
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: true,
      priceLineVisible: false,
    });

    const ema200Series = chart.addSeries(LineSeries, {
      color: EMA_200_COLOR,
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: true,
      priceLineVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    ema50SeriesRef.current = ema50Series;
    ema200SeriesRef.current = ema200Series;

    const resize = () => {
      if (!chartContainerRef.current || !chartRef.current) {
        return;
      }

      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: getChartHeight(),
      });
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
      ema50SeriesRef.current = null;
      ema200SeriesRef.current = null;
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

      if (!chart || !candleSeries || !overlay?.zones?.length) {
        setOverlayRects([]);
        return;
      }

      const nextRects: OverlayRect[] = [];
      for (const zone of overlay.zones) {
        const leftCoord = chart.timeScale().timeToCoordinate(zone.fromTime);
        const rightCoord = chart.timeScale().timeToCoordinate(zone.toTime);
        const high = Math.max(zone.start, zone.end);
        const low = Math.min(zone.start, zone.end);
        const topCoord = candleSeries.priceToCoordinate(high);
        const bottomCoord = candleSeries.priceToCoordinate(low);

        if ([leftCoord, rightCoord, topCoord, bottomCoord].some((value) => value == null)) {
          continue;
        }

        const left = Math.min(leftCoord, rightCoord);
        const width = Math.max(Math.abs(rightCoord - leftCoord), 8);
        const top = Math.min(topCoord, bottomCoord);
        const heightValue = Math.max(Math.abs(bottomCoord - topCoord), 8);

        nextRects.push({
          key: zone.key,
          left,
          width,
          top,
          height: heightValue,
          color: zone.color,
          borderColor: zone.borderColor,
          label: zone.label,
        });
      }

      setOverlayRects(nextRects);
    });
  };

  useEffect(() => {
    hasFittedRef.current = false;
  }, [resetKey]);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const ema50Series = ema50SeriesRef.current;
    const ema200Series = ema200SeriesRef.current;
    if (!chart || !candleSeries || !ema50Series || !ema200Series) {
      return;
    }

    candleSeries.setData(candles);
    ema50Series.setData(calculateEmaSeries(candles, 50));
    ema200Series.setData(calculateEmaSeries(candles, 200));

    if (candles.length > 0 && !hasFittedRef.current) {
      chart.timeScale().fitContent();
      hasFittedRef.current = true;
    }

    queueOverlayCalculation();
  }, [candles]);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    if (!candleSeries) {
      return;
    }

    for (const priceLine of priceLinesRef.current) {
      candleSeries.removePriceLine(priceLine);
    }
    priceLinesRef.current = [];

    if (!overlay) {
      queueOverlayCalculation();
      return;
    }

    for (const level of overlay.levels) {
      const priceLine = candleSeries.createPriceLine({
        price: level.price,
        color: level.color,
        lineWidth: 2,
        lineStyle: level.style === 'dashed' ? LineStyle.Dashed : LineStyle.Solid,
        axisLabelVisible: true,
        title: level.label,
      });
      priceLinesRef.current.push(priceLine);
    }

    queueOverlayCalculation();
  }, [overlay]);

  const legendItems = [
    ...(overlay?.legendItems ?? []),
    { key: 'ema-50', label: 'EMA 50', color: EMA_50_COLOR },
    { key: 'ema-200', label: 'EMA 200', color: EMA_200_COLOR },
  ];

  return (
    <div className={cn('relative h-full w-full min-h-0 overflow-hidden rounded-[1rem] bg-slate-950', className)}>
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
              borderColor: rect.borderColor,
            }}
          >
            <span className="absolute left-2 top-1 rounded bg-slate-950/75 px-1.5 py-0.5 text-[10px] font-medium text-slate-100">
              {rect.label}
            </span>
          </div>
        ))}
      </div>

      {legendItems.length ? (
        <div className="pointer-events-none absolute right-4 top-4 z-10 flex max-w-[18rem] flex-wrap justify-end gap-2">
          {legendItems.map((item) => (
            <span key={item.key} className="rounded-full border border-white/10 bg-slate-900/85 px-2.5 py-1 text-[10px] font-medium text-slate-100 backdrop-blur" style={{ boxShadow: `inset 0 0 0 1px ${item.color}` }}>
              {item.label}
            </span>
          ))}
        </div>
      ) : null}

      {loading && candles.length === 0 ? (
        <div className="absolute inset-0 z-20 animate-pulse bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="flex h-full items-center justify-center text-sm text-slate-400">{loadingMessage}</div>
        </div>
      ) : null}

      {!loading && candles.length === 0 ? (
        <div className="absolute inset-0 z-20 bg-slate-950/80">
          <div className="flex h-full items-center justify-center text-sm text-slate-500">No candles available.</div>
        </div>
      ) : null}
    </div>
  );
}