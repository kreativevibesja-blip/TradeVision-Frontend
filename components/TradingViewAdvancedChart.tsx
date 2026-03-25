'use client';

import { useEffect, useId, useRef } from 'react';

interface TradingViewAdvancedChartProps {
  symbol: string;
  interval: string;
}

declare global {
  interface Window {
    TradingView?: unknown;
  }
}

export function TradingViewAdvancedChart({ symbol, interval }: TradingViewAdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerId = useId().replace(/:/g, '_');

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget h-full w-full';
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

  return <div ref={containerRef} className="h-full min-h-[420px] w-full" />;
}