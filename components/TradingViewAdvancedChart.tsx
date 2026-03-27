'use client';

import { useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TradingViewAdvancedChartProps {
  symbol: string;
  interval: string;
  className?: string;
}

declare global {
  interface Window {
    TradingView?: unknown;
  }
}

export function TradingViewAdvancedChart({ symbol, interval, className }: TradingViewAdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerId = useId().replace(/:/g, '_');

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget absolute inset-0';
    widgetContainer.id = containerId;

    const copyright = document.createElement('div');
    copyright.className = 'tradingview-widget-copyright hidden';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      container_id: containerId,
    });

    containerRef.current.appendChild(widgetContainer);
    containerRef.current.appendChild(copyright);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, containerId]);

  return <div ref={containerRef} className={cn('tradingview-widget-container relative h-full w-full overflow-hidden', className)} />;
}