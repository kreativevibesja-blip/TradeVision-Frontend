'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Crown, Loader2, Lock, Sparkles, X, Zap } from 'lucide-react';
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
  const [scanState, setScanState] = useState<'ready' | 'scanning' | 'completed'>('ready');
  const [error, setError] = useState('');

  const allowed = isProPlus(subscription);
  const disabledReason = activeSignal ? 'Signal already active for this market.' : '';
  const buttonLabel = useMemo(() => {
    if (!allowed) return 'Locked';
    if (activeSignal) return 'Active Signal Running';
    if (scanState === 'scanning') return 'Scanning...';
    if (scanState === 'completed') return 'Completed';
    return 'Signal';
  }, [activeSignal, allowed, scanState]);

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
      setScanState('completed');
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

      {upgradeOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Crown className="h-5 w-5" />
              </div>
              <button type="button" onClick={() => setUpgradeOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">Pro+ Feature</p>
            <h3 className="mt-2 text-2xl font-bold">Unlock Instant Signal</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">Instant Signal is available only on Pro+. Upgrade to scan the visible live chart and get a clean entry, wait, or no-signal result.</p>
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
    </>
  );
}
