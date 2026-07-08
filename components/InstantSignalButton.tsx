'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Crown, Loader2, Lock, Sparkles, Target, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api, type InstantSignal, type InstantSignalRequestPayload } from '@/lib/api';

interface InstantSignalButtonProps {
  assetClass: 'forex' | 'deriv';
  symbol: string;
  timeframe: string;
  candles: InstantSignalRequestPayload['candles'];
  currentPrice?: number | null;
  token?: string | null;
  subscription?: string | null;
  className?: string;
  onSignal?: (signal: InstantSignal) => void;
}

const isProPlus = (subscription?: string | null) => subscription === 'TOP_TIER' || subscription === 'VIP_AUTO_TRADER';
const formatPrice = (value: number | null) => value == null ? '-' : value.toLocaleString(undefined, { maximumFractionDigits: 5 });

export function InstantSignalButton({
  assetClass,
  symbol,
  timeframe,
  candles,
  currentPrice,
  token,
  subscription,
  className,
  onSignal,
}: InstantSignalButtonProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [activeSignal, setActiveSignal] = useState<InstantSignal | null>(null);
  const [loadingActive, setLoadingActive] = useState(false);
  const [scanState, setScanState] = useState<'ready' | 'scanning'>('ready');
  const [resultSignal, setResultSignal] = useState<InstantSignal | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');

  const allowed = isProPlus(subscription);
  const disabledReason = activeSignal ? 'Signal already active for this market.' : '';
  const buttonLabel = useMemo(() => {
    if (!allowed) return 'Locked';
    if (activeSignal) return 'Active Signal Running';
    if (scanState === 'scanning') return 'Scanning...';
    return 'Get Signal';
  }, [activeSignal, allowed, scanState]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!allowed || !token || !symbol) {
      setActiveSignal(null);
      return;
    }

    let active = true;
    setLoadingActive(true);
    api.instantSignals
      .getActive(symbol, token)
      .then(({ signal }) => {
        if (active) setActiveSignal(signal);
      })
      .catch(() => {
        if (active) setActiveSignal(null);
      })
      .finally(() => {
        if (active) setLoadingActive(false);
      });

    return () => {
      active = false;
    };
  }, [allowed, symbol, token]);

  const runSignal = async () => {
    setError('');
    if (!allowed) {
      setUpgradeOpen(true);
      return;
    }
    if (!token || activeSignal || scanState === 'scanning') {
      return;
    }
    if (candles.length < 30) {
      setError('Load more candles before requesting a signal.');
      return;
    }

    try {
      setScanState('scanning');
      const payload: InstantSignalRequestPayload = {
        symbol,
        timeframe,
        candles: candles.slice(-160),
        currentPrice: currentPrice ?? candles.at(-1)?.close ?? null,
      };
      const response = assetClass === 'forex'
        ? await api.instantSignals.createForex(payload, token)
        : await api.instantSignals.createDeriv(payload, token);
      setActiveSignal(response.signal.status === 'no_signal' ? null : response.signal);
      setResultSignal(response.signal);
      setResultOpen(true);
      setScanState('ready');
      onSignal?.(response.signal);
    } catch (signalError: any) {
      if (signalError?.message === 'ACTIVE_SIGNAL_EXISTS') {
        setError('Signal already active for this market.');
      } else {
        setError(signalError?.message || 'Instant signal failed.');
      }
      setScanState('ready');
    }
  };

  const modals = (
    <>
      {upgradeOpen ? (
        <div className="fixed inset-0 z-[100] grid min-h-[100svh] place-items-center bg-slate-950/70 px-4 py-20 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl">
            <button
              type="button"
              onClick={() => setUpgradeOpen(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              aria-label="Close upgrade prompt"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-start justify-between gap-4 pr-12">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Crown className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Pro+ Feature</p>
            <h3 className="mt-2 text-2xl font-bold">Unlock Instant Signal</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">Instant Signal is available only on Pro+. Upgrade to scan the visible live chart and get a clean entry or no-signal result.</p>
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              <Sparkles className="h-4 w-4 text-blue-600" />
              The backend validates plan access before any signal is generated.
            </div>
            <div className="mt-6 flex gap-3">
              <Link href="/dashboard/billing" className="flex-1">
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">Upgrade</Button>
              </Link>
              <Button variant="outline" onClick={() => setUpgradeOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      ) : null}

      {resultOpen && resultSignal ? (
        <div className="fixed inset-0 z-[100] grid min-h-[100svh] place-items-center bg-slate-950/75 px-4 py-20 backdrop-blur-sm">
          <div className="relative max-h-[calc(100svh-6rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              onClick={() => setResultOpen(false)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              aria-label="Close signal result"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-start justify-between gap-4 pr-12">
              <div className={resultSignal.status === 'entry_now' ? 'rounded-xl bg-blue-50 p-3 text-blue-600' : 'rounded-xl bg-slate-100 p-3 text-slate-500'}>
                {resultSignal.status === 'entry_now' ? <Target className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
              </div>
            </div>

            {resultSignal.status === 'entry_now' ? (
              <>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Enter Now</p>
                <h3 className="mt-2 text-2xl font-bold">{resultSignal.market} {resultSignal.direction.toUpperCase()}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Valid rejection structure found. This is an immediate signal, not a wait-for-confirmation setup.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-400">Entry</p>
                    <p className="mt-1 font-bold">{formatPrice(resultSignal.entry)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-400">SL</p>
                    <p className="mt-1 font-bold">{formatPrice(resultSignal.stopLoss)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-400">TP</p>
                    <p className="mt-1 font-bold">{formatPrice(resultSignal.takeProfit)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-400">RR</p>
                    <p className="mt-1 font-bold">{resultSignal.riskReward ?? '-'}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-700">
                  {resultSignal.confirmationText || 'Enter now from the current rejection level.'}
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Confidence</p>
                    <p className="text-2xl font-black text-blue-600">{resultSignal.confidence}%</p>
                  </div>
                  <Link href="/dashboard/signals">
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">View Signal</Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-slate-500">No Signal</p>
                <h3 className="mt-2 text-2xl font-bold">No clean entry now</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {resultSignal.confirmationText || 'The visible chart does not show a valid rejection structure at a clean level.'}
                </p>
                <div className="mt-5 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-600">
                  The engine rejected this because a trend alone is not enough. It needs a tradable reaction from structure.
                </div>
                <div className="mt-6 flex justify-end">
                  <Button variant="outline" onClick={() => setResultOpen(false)}>Close</Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );

  return (
    <>
      <div className={className} title={disabledReason}>
        <Button
          type="button"
          onClick={() => void runSignal()}
          disabled={(allowed && Boolean(activeSignal)) || scanState === 'scanning' || loadingActive}
          className={allowed ? 'h-10 bg-blue-600 px-3 text-sm text-white hover:bg-blue-700 sm:h-11 sm:px-4' : 'h-10 bg-slate-200 px-3 text-sm text-slate-600 hover:bg-slate-300 sm:h-11 sm:px-4'}
        >
          {!allowed ? <Lock className="mr-1.5 h-4 w-4" /> : scanState === 'scanning' || loadingActive ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Zap className="mr-1.5 h-4 w-4" />}
          {buttonLabel}
        </Button>
        {error ? <div className="mt-1 text-xs font-medium text-red-300">{error}</div> : null}
      </div>
      {mounted ? createPortal(modals, document.body) : null}
    </>
  );
}
