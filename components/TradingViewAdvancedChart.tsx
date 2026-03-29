'use client';

import { useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/utils';

const TRADINGVIEW_SCRIPT_ID = 'tradingview-widget-script';

type TradingViewWidgetInstance = {
  remove?: () => void;
};

type TradingViewWidgetOptions = {
  autosize: boolean;
  symbol: string;
  interval: string;
  timezone: string;
  theme: string;
  style: string;
  locale: string;
  allow_symbol_change: boolean;
  hide_top_toolbar: boolean;
  hide_legend: boolean;
  save_image: boolean;
  calendar: boolean;
  support_host: string;
  container_id: string;
};

type TradingViewApi = {
  widget: new (options: TradingViewWidgetOptions) => TradingViewWidgetInstance;
};

let tradingViewScriptPromise: Promise<TradingViewApi> | null = null;

const destroyWidget = (widget: TradingViewWidgetInstance | null) => {
  if (!widget?.remove) {
    return;
  }

  try {
    widget.remove();
  } catch {
    // TradingView can throw if React has already detached the underlying node.
  }
};

const loadTradingViewApi = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('TradingView can only load in the browser.'));
  }

  if (window.TradingView?.widget) {
    return Promise.resolve(window.TradingView as TradingViewApi);
  }

  if (!tradingViewScriptPromise) {
    tradingViewScriptPromise = new Promise<TradingViewApi>((resolve, reject) => {
      const existingScript = document.getElementById(TRADINGVIEW_SCRIPT_ID) as HTMLScriptElement | null;

      const handleReady = () => {
        if (window.TradingView?.widget) {
          resolve(window.TradingView as TradingViewApi);
          return;
        }

        reject(new Error('TradingView widget API did not initialize.'));
      };

      if (existingScript) {
        existingScript.addEventListener('load', handleReady, { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load TradingView widget API.')), { once: true });

        if ((existingScript as HTMLScriptElement).dataset.loaded === 'true') {
          handleReady();
        }

        return;
      }

      const script = document.createElement('script');
      script.id = TRADINGVIEW_SCRIPT_ID;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        script.dataset.loaded = 'true';
        handleReady();
      };
      script.onerror = () => reject(new Error('Failed to load TradingView widget API.'));
      document.head.appendChild(script);
    });
  }

  return tradingViewScriptPromise;
};

interface TradingViewAdvancedChartProps {
  symbol: string;
  interval: string;
  className?: string;
}

declare global {
  interface Window {
    TradingView?: TradingViewApi;
  }
}

export function TradingViewAdvancedChart({ symbol, interval, className }: TradingViewAdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<TradingViewWidgetInstance | null>(null);
  const containerId = useId().replace(/:/g, '_');

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let disposed = false;

    containerRef.current.innerHTML = `<div id="${containerId}" class="absolute inset-0" />`;

    void loadTradingViewApi()
      .then((tradingView) => {
        if (disposed || !containerRef.current) {
          return;
        }

        destroyWidget(widgetRef.current);
        widgetRef.current = new tradingView.widget({
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
      })
      .catch(() => {
        if (disposed || !containerRef.current) {
          return;
        }

        containerRef.current.innerHTML = '<div class="flex h-full items-center justify-center bg-slate-950 text-sm text-slate-400">Unable to load TradingView chart.</div>';
      });

    return () => {
      disposed = true;
      destroyWidget(widgetRef.current);
      widgetRef.current = null;

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, interval, containerId]);

  return <div ref={containerRef} className={cn('tradingview-widget-container relative h-full w-full overflow-hidden', className)} />;
}