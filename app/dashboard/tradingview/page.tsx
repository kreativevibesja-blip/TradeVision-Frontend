'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { InstantSignalButton } from '@/components/InstantSignalButton';
import { TradingViewLiveChart } from '@/components/TradingViewLiveChart';
import { useAuth } from '@/hooks/useAuth';
import { LIVE_CHART_SYMBOL_GROUPS, LIVE_CHART_SYMBOLS, LIVE_CHART_TIMEFRAMES, getLiveChartSymbol, getLiveChartTimeframe } from '@/lib/live-chart';
import type { DerivCandle } from '@/lib/deriv-live';

const STORAGE_KEY = 'dashboard_forex_live_chart_state';

const readStoredState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null') as { symbol?: string; timeframe?: string } | null;
    return parsed;
  } catch {
    return null;
  }
};

export default function TradingViewDashboardPage() {
  const { user, token, loading } = useAuth();
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('M15');
  const [candles, setCandles] = useState<DerivCandle[]>([]);
  const [chartError, setChartError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredState();
    if (stored?.symbol) setSymbol(stored.symbol);
    if (stored?.timeframe) setTimeframe(stored.timeframe);
    setReady(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ symbol, timeframe }));
    }
  }, [symbol, timeframe]);

  const selectedSymbol = useMemo(() => getLiveChartSymbol(symbol), [symbol]);
  const selectedTimeframe = useMemo(() => getLiveChartTimeframe(timeframe), [timeframe]);

  if (loading || !ready) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center text-sm text-slate-500">Loading Forex workspace...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F7F9FC] p-2 sm:p-3 lg:p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
              <span>Forex Live Charts</span>
              <button type="button" title="Forex workspace with backend-polled candles and instant Pro+ signals." className="rounded-full border border-slate-200 p-1 text-slate-400">
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value)}
                  className="h-11 min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 sm:w-[15rem]"
                >
                  {LIVE_CHART_SYMBOL_GROUPS.map((group) => (
                    <optgroup key={group.value} label={group.label}>
                      {LIVE_CHART_SYMBOLS.filter((option) => option.category === group.value).map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
                  {LIVE_CHART_TIMEFRAMES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTimeframe(option.value)}
                      className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition ${timeframe === option.value ? 'bg-blue-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.25)]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="fixed inset-x-3 bottom-3 z-30 sm:static sm:z-auto">
                <InstantSignalButton
                  assetClass="forex"
                  symbol={symbol}
                  timeframe={timeframe}
                  candles={candles}
                  currentPrice={candles.at(-1)?.close ?? null}
                  token={token}
                  subscription={user?.subscription}
                  className="flex justify-end"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {chartError ? <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{chartError}</div> : null}

      <div className="mt-3 min-h-[58svh] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
        <TradingViewLiveChart
          symbol={selectedSymbol.value}
          timeframe={selectedTimeframe.value}
          token={token}
          overlay={null}
          onCandlesChange={setCandles}
          onError={setChartError}
          className="rounded-none"
        />
      </div>
    </motion.section>
  );
}
