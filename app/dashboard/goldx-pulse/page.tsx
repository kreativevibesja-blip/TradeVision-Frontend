'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, Activity, BarChart3, CandlestickChart, Flame, Loader2, Lock, Power, RadioTower, ShieldAlert, Sparkles, Trash2, Wallet, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  api,
  openGoldxPulseStream,
  type BillingSummary,
  type GoldxPulseAccess,
  type GoldxPulseSnapshot,
  type GoldxPulseSymbol,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type WorkspaceMode = 'digit-pulse' | 'range-pressure';

const defaultSnapshot: GoldxPulseSnapshot = {
  connected: false,
  connectionState: 'disconnected',
  account: null,
  settings: {
    symbol: 'R_75',
    stake: 1,
    duration: 5,
    strategyMode: 'digit-pulse',
    selectedDigit: 7,
    maxDailyLoss: null,
    cooldownMs: 15000,
  },
  ticks: [],
  totalTickCount: 0,
  analytics: {
    frequencyMap: Array.from({ length: 10 }, () => 0),
    mostFrequentDigit: null,
    leastFrequentDigit: null,
    currentStreakDigit: null,
    currentStreakLength: 0,
    longestStreakDigit: null,
    longestStreakLength: 0,
    aboveFivePct: 0,
    belowFivePct: 0,
    bias: 'neutral',
  },
  trades: [],
  cooldownRemainingMs: 0,
  dailyLoss: 0,
  error: null,
  updatedAt: new Date(0).toISOString(),
};

const categoryLabels: Record<GoldxPulseSymbol['category'], string> = {
  volatility: 'Volatility',
  'volatility-1s': 'Volatility (1s)',
  jump: 'Jump',
  step: 'Step',
  'boom-crash': 'Boom & Crash',
};

function formatCurrency(value: number | null | undefined, currency = 'USD') {
  if (value == null || Number.isNaN(value)) {
    return '-';
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString();
}

function buildPolylinePoints(values: number[]) {
  if (values.length === 0) {
    return '';
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');
}

  const digitOptions = Array.from({ length: 10 }, (_, digit) => String(digit));
  const durationOptions = Array.from({ length: 10 }, (_, index) => String(index + 1));
  const darkSelectClassName = 'h-11 w-full appearance-none rounded-xl border border-white/10 bg-slate-900/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/30 focus:ring-2 focus:ring-cyan-400/20';

export default function GoldxPulsePage() {
  const { user, token, loading: authLoading } = useAuth();
  const [access, setAccess] = useState<GoldxPulseAccess | null>(null);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [symbols, setSymbols] = useState<GoldxPulseSymbol[]>([]);
  const [snapshot, setSnapshot] = useState<GoldxPulseSnapshot>(defaultSnapshot);
  const [apiToken, setApiToken] = useState('');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('digit-pulse');
  const [assistedPanelsOn, setAssistedPanelsOn] = useState(true);
  const [stake, setStake] = useState('1');
  const [duration, setDuration] = useState('5');
  const [selectedDigit, setSelectedDigit] = useState('7');
  const [selectedSymbol, setSelectedSymbol] = useState('R_75');
  const [maxDailyLoss, setMaxDailyLoss] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState('15');
  const [loading, setLoading] = useState(true);
  const [connectBusy, setConnectBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [placingTrade, setPlacingTrade] = useState<string | null>(null);
  const [clearingResults, setClearingResults] = useState(false);
  const [pulseRenewing, setPulseRenewing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    void Promise.all([
      api.goldxPulse.getAccess(token),
      api.getBillingSummary(token),
    ])
      .then(async ([response, billingResponse]) => {
        if (!active) {
          return;
        }

        setAccess(response.access);
        setBilling(billingResponse.billing);
        setSymbols(response.symbols);

        if (response.access.active) {
          const sessionResponse = await api.goldxPulse.getSession(token);
          if (!active) {
            return;
          }
          setSnapshot(sessionResponse.snapshot);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to load GoldX Pulse.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const pulseStatus = billing?.goldxPulse;

  const handlePulseResume = async () => {
    if (!token) {
      return;
    }

    try {
      setPulseRenewing(true);
      setError('');
      const response = await api.renewGoldxPulseSubscription(token);
      setBilling(response.billing);
      const accessResponse = await api.goldxPulse.getAccess(token);
      setAccess(accessResponse.access);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to resume GoldX Pulse access.');
    } finally {
      setPulseRenewing(false);
    }
  };

  useEffect(() => {
    setStake(String(snapshot.settings.stake));
    setDuration(String(snapshot.settings.duration));
    setSelectedDigit(String(snapshot.settings.selectedDigit));
    setSelectedSymbol(snapshot.settings.symbol);
    setMaxDailyLoss(snapshot.settings.maxDailyLoss != null ? String(snapshot.settings.maxDailyLoss) : '');
    setCooldownSeconds(String(Math.round(snapshot.settings.cooldownMs / 1000)));
    setWorkspaceMode(snapshot.settings.strategyMode);
  }, [
    snapshot.settings.stake,
    snapshot.settings.duration,
    snapshot.settings.selectedDigit,
    snapshot.settings.symbol,
    snapshot.settings.maxDailyLoss,
    snapshot.settings.cooldownMs,
    snapshot.settings.strategyMode,
  ]);

  useEffect(() => {
    if (!token || !access?.active) {
      return;
    }

    const controller = new AbortController();
    void openGoldxPulseStream(token, {
      signal: controller.signal,
      onSnapshot: (nextSnapshot) => {
        setSnapshot(nextSnapshot);
        setError('');
      },
      onError: (nextError) => {
        setError(nextError.message);
      },
    }).catch((nextError) => {
      if (!controller.signal.aborted) {
        setError(nextError instanceof Error ? nextError.message : 'GoldX Pulse stream unavailable.');
      }
    });

    return () => controller.abort();
  }, [token, access?.active]);

  const groupedSymbols = useMemo(() => {
    return symbols.reduce<Record<string, GoldxPulseSymbol[]>>((groups, symbol) => {
      const key = categoryLabels[symbol.category];
      groups[key] = groups[key] ? [...groups[key], symbol] : [symbol];
      return groups;
    }, {});
  }, [symbols]);

  const sparklinePoints = useMemo(() => buildPolylinePoints(snapshot.ticks.slice(-80).map((tick) => tick.quote)), [snapshot.ticks]);

  const streamedDigits = useMemo(() => {
    return snapshot.ticks.slice(-24).map((tick) => ({
      key: `${tick.epoch}-${tick.formattedQuote}`,
      digit: tick.digit,
    }));
  }, [snapshot.ticks]);

  const digitActionButtons = useMemo(() => {
    return Array.from({ length: 10 }, (_, digit) => ({
      digit,
      count: snapshot.analytics.frequencyMap[digit] ?? 0,
    }));
  }, [snapshot.analytics.frequencyMap]);

  const netProfit = useMemo(
    () => snapshot.trades.reduce((total, trade) => total + (trade.profit ?? 0), 0),
    [snapshot.trades],
  );

  const saveWorkspaceSettings = async () => {
    if (!token) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      const response = await api.goldxPulse.updateSettings({
        symbol: selectedSymbol,
        stake: Number(stake),
        duration: Number(duration),
        selectedDigit: Number(selectedDigit),
        strategyMode: workspaceMode,
        maxDailyLoss: maxDailyLoss === '' ? null : Number(maxDailyLoss),
        cooldownMs: Number(cooldownSeconds) * 1000,
      }, token);
      setSnapshot(response.snapshot);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save GoldX Pulse settings.');
    } finally {
      setSaving(false);
    }
  };

  const connectAccount = async () => {
    if (!token) {
      return;
    }

    try {
      setConnectBusy(true);
      setError('');
      const response = await api.goldxPulse.connect({ apiToken, symbol: selectedSymbol }, token);
      setSnapshot(response.snapshot);
      setApiToken('');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to connect Deriv account.');
    } finally {
      setConnectBusy(false);
    }
  };

  const disconnectAccount = async () => {
    if (!token) {
      return;
    }

    try {
      await api.goldxPulse.disconnect(token);
      setSnapshot(defaultSnapshot);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to disconnect Deriv account.');
    }
  };

  const placeTrade = async (action: 'OVER' | 'UNDER' | 'MATCH' | 'DIFFER', digit?: number) => {
    if (!token) {
      return;
    }

    try {
      setPlacingTrade(action);
      setError('');
      const response = await api.goldxPulse.placeTrade({
        action,
        symbol: selectedSymbol,
        stake: Number(stake),
        duration: Number(duration),
        digit: digit ?? Number(selectedDigit),
      }, token);
      setSnapshot(response.snapshot);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Trade request failed.');
    } finally {
      setPlacingTrade(null);
    }
  };

  const clearResults = async () => {
    if (!token || snapshot.trades.length === 0) {
      return;
    }

    try {
      setClearingResults(true);
      setError('');
      const response = await api.goldxPulse.clearResults(token);
      setSnapshot(response.snapshot);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to clear GoldX Pulse results.');
    } finally {
      setClearingResults(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-xl border-cyan-400/20 bg-slate-950/80">
          <CardContent className="flex items-center justify-center gap-3 p-8 text-slate-200">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
            Loading GoldX Pulse...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-xl border-cyan-400/20 bg-slate-950/80">
          <CardHeader>
            <CardTitle className="text-slate-100">GoldX Pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-300">
            <p>Sign in to access the Deriv options workspace.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!access?.active) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.95),rgba(15,23,42,0.95))] p-6 text-slate-100 shadow-[0_0_60px_rgba(6,182,212,0.12)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                GoldX Pulse
              </div>
              <h1 className="text-3xl font-semibold">Deriv Options Workspace</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Real-time tick intelligence, digit analytics, Matches/Differs and Over/Under execution, backed by live Deriv sessions through your secured dashboard.
              </p>
            </div>
            <Badge variant="warning" className="w-fit border-amber-300/30 bg-amber-400/10 px-3 py-1 text-amber-200">
              Subscription required
            </Badge>
          </div>
        </div>

        {pulseStatus && pulseStatus.status !== 'inactive' ? (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${pulseStatus.status === 'cancelled' ? 'border-amber-400/20 bg-amber-500/10 text-amber-100' : pulseStatus.status === 'expired' ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">
                  {pulseStatus.status === 'cancelled' ? 'GoldX Pulse is cancelled' : pulseStatus.status === 'expired' ? 'GoldX Pulse has expired' : `GoldX Pulse status: ${pulseStatus.status}`}
                </div>
                <div className="mt-1 text-xs opacity-85">
                  Expiry: {formatDateTime(pulseStatus.expiresAt)}
                  {pulseStatus.canRenew ? ' · You can resume access before this expiry passes.' : ''}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {pulseStatus.canRenew ? (
                  <Button variant="outline" onClick={handlePulseResume} disabled={pulseRenewing}>
                    {pulseRenewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Resume Pulse
                  </Button>
                ) : null}
                {pulseStatus.canPurchase ? (
                  <Link href="/checkout?plan=GOLDX_PULSE">
                    <Button variant="gradient">Renew Purchase</Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <Card className="border-amber-400/20 bg-slate-950/80 text-slate-100">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Lock className="h-5 w-5 text-amber-300" />
                <h2 className="text-xl font-semibold">GoldX Pulse access is locked</h2>
              </div>
              <p className="text-sm text-slate-300">
                {access?.reason || 'An active GoldX Pulse subscription is required before this workspace can load.'}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                If access has already been granted, refresh the dashboard after the subscription record becomes active.
              </p>
            </div>
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <ShieldAlert className="h-4 w-4 text-cyan-300" />
                Access source: {access?.source || 'none'}
              </div>
              <div className="text-sm text-slate-300">Plan: {access?.planName || 'GoldX Pulse'}</div>
              <div className="text-sm text-slate-300">Expiry: {formatDateTime(access?.expiresAt ?? null)}</div>
              <Link href="/dashboard/billing">
                <Button variant="gradient" className="w-full">Open Billing</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="rounded-[28px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.96))] p-6 shadow-[0_0_70px_rgba(14,165,233,0.12)]"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-200">
              <RadioTower className="h-3.5 w-3.5" />
              GoldX Pulse
            </div>
            <h1 className="text-3xl font-semibold">Digit Pulse Control Room</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              This is a trading tool, not financial advice. Connect a Deriv token, stream live ticks, inspect digit behavior, and execute assisted options trades with risk controls.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant={snapshot.connected ? 'success' : 'outline'} className="px-3 py-1 text-xs">
              {snapshot.connected ? 'Connected' : 'Not connected'}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-xs border-cyan-400/20 text-cyan-200">
              {snapshot.settings.symbol}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-xs border-fuchsia-400/20 text-fuchsia-200">
              {workspaceMode === 'digit-pulse' ? 'Digit Pulse Engine™' : 'Range Pressure Engine™'}
            </Badge>
          </div>
        </div>
      </motion.div>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="border-cyan-400/20 bg-slate-950/80">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wallet className="h-5 w-5 text-cyan-300" />
                Connection & Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {!snapshot.connected ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.22em] text-slate-400">Deriv API token</label>
                    <Input
                      value={apiToken}
                      onChange={(event) => setApiToken(event.target.value)}
                      placeholder="Paste your Deriv API token"
                      className="h-12 border-cyan-400/20 bg-slate-900/80 text-slate-100"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.22em] text-slate-400">Index</label>
                        <select value={selectedSymbol} onChange={(event) => setSelectedSymbol(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-cyan-400/20 bg-slate-900/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/30 focus:ring-2 focus:ring-cyan-400/20" style={{ colorScheme: 'dark' }}>
                        {Object.entries(groupedSymbols).map(([group, options]) => (
                            <optgroup key={group} label={group} className="bg-slate-950 text-slate-100">
                            {options.map((option) => (
                                <option key={option.symbol} value={option.symbol} className="bg-slate-950 text-slate-100">{option.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.22em] text-slate-400">Workspace mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant={workspaceMode === 'digit-pulse' ? 'gradient' : 'outline'} onClick={() => setWorkspaceMode('digit-pulse')}>Digit Pulse</Button>
                        <Button variant={workspaceMode === 'range-pressure' ? 'gradient' : 'outline'} onClick={() => setWorkspaceMode('range-pressure')}>Range Pressure</Button>
                      </div>
                    </div>
                  </div>
                  <Button variant="gradient" className="w-full gap-2" onClick={connectAccount} disabled={connectBusy || !apiToken.trim()}>
                    {connectBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    Connect Deriv Account
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Balance</div>
                    <div className="mt-2 text-2xl font-semibold text-cyan-200">{formatCurrency(snapshot.account?.balance, snapshot.account?.currency)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Account</div>
                    <div className="mt-2 space-y-2">
                      <div className="text-lg font-semibold text-slate-100">{snapshot.account?.accountType.toUpperCase()}</div>
                      <div className="break-all text-base font-medium text-slate-300">{snapshot.account?.loginId}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Session</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-100">
                      <Power className="h-4 w-4 text-emerald-300" />
                      {snapshot.connectionState}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-fuchsia-400/20 bg-slate-950/80">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CandlestickChart className="h-5 w-5 text-fuchsia-300" />
                Live Tick Stream
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.7))] p-4">
                <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span>Latest movement</span>
                  <span>{snapshot.ticks[snapshot.ticks.length - 1]?.formattedQuote || '-'}</span>
                </div>
                <div className="h-44 rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-3">
                  {sparklinePoints ? (
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                      <defs>
                        <linearGradient id="pulse-line" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <polyline fill="none" stroke="url(#pulse-line)" strokeWidth="2.2" points={sparklinePoints} />
                    </svg>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">Ticks will appear here after connection.</div>
                  )}
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(90deg,rgba(2,6,23,0.98),rgba(15,23,42,0.8)_18%,rgba(15,23,42,0.86)_82%,rgba(2,6,23,0.98))]">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <span>Current digits</span>
                  <span>{snapshot.totalTickCount} ticks</span>
                </div>
                <div className="relative overflow-hidden px-4 py-4">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-slate-950 via-slate-950/70 to-transparent" />
                  {streamedDigits.length > 0 ? (
                    <div className="flex min-h-12 items-center justify-end gap-3 overflow-hidden">
                      {streamedDigits.map((tick, index) => (
                        <motion.div
                          key={tick.key}
                          initial={{ opacity: 0, x: 18, scale: 0.92 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`flex h-12 min-w-[3rem] items-center justify-center rounded-2xl border px-3 text-lg font-semibold shadow-[0_0_24px_rgba(34,211,238,0.08)] ${index === streamedDigits.length - 1 ? 'border-cyan-300/30 bg-cyan-400/14 text-cyan-100' : 'border-cyan-400/10 bg-white/[0.04] text-slate-100'}`}
                        >
                          <span>{tick.digit}</span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-12 items-center justify-center text-sm text-slate-500">Digits will flow here after connection.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {assistedPanelsOn ? (
            <Card className="border-cyan-400/20 bg-slate-950/80">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChart3 className="h-5 w-5 text-cyan-300" />
                  {workspaceMode === 'digit-pulse' ? 'Digit Pulse Engine™' : 'Range Pressure Engine™'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {workspaceMode === 'digit-pulse' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {digitActionButtons.map((item) => (
                        <div
                          key={item.digit}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedDigit(String(item.digit))}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedDigit(String(item.digit));
                            }
                          }}
                          className={`rounded-2xl border p-3 text-center transition ${item.digit === Number(selectedDigit) ? 'border-cyan-300/60 bg-cyan-400/12 shadow-[0_0_0_1px_rgba(103,232,249,0.28)]' : item.digit === snapshot.analytics.mostFrequentDigit ? 'border-red-400/30 bg-red-500/10' : item.digit === snapshot.analytics.leastFrequentDigit ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-white/10 bg-white/5 hover:border-cyan-400/30 hover:bg-cyan-400/8'}`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                            <span>Digit {item.digit}</span>
                            <span className={`${item.digit === Number(selectedDigit) ? 'text-cyan-200' : 'text-slate-500'}`}>{item.digit === Number(selectedDigit) ? 'Selected' : 'Tap'}</span>
                          </div>
                          <div className="mt-2 text-2xl font-semibold">{item.count}</div>
                          <div className="mt-2 text-xs text-slate-500">Tap to set the active differ digit.</div>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Most frequent</div>
                        <div className="mt-2 text-xl font-semibold text-red-200">{snapshot.analytics.mostFrequentDigit ?? '-'}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Least frequent</div>
                        <div className="mt-2 text-xl font-semibold text-emerald-200">{snapshot.analytics.leastFrequentDigit ?? '-'}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Streak alert</div>
                        <div className="mt-2 flex items-center gap-2 text-xl font-semibold text-cyan-200">
                          <Flame className="h-5 w-5 text-amber-300" />
                          {snapshot.analytics.currentStreakDigit ?? '-'} × {snapshot.analytics.currentStreakLength}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Digits above 5</div>
                        <div className="mt-2 text-3xl font-semibold text-fuchsia-200">{snapshot.analytics.aboveFivePct}%</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Digits below 5</div>
                        <div className="mt-2 text-3xl font-semibold text-cyan-200">{snapshot.analytics.belowFivePct}%</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Bias</div>
                        <div className="mt-2 text-3xl font-semibold text-emerald-200">{snapshot.analytics.bias.toUpperCase()}</div>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Button variant="gradient" className="gap-2" onClick={() => placeTrade('OVER')} disabled={placingTrade != null || !snapshot.connected}>
                        <Activity className="h-4 w-4" />
                        Over 5
                      </Button>
                      <Button variant="outline" className="gap-2 border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20" onClick={() => placeTrade('UNDER')} disabled={placingTrade != null || !snapshot.connected}>
                        <Activity className="h-4 w-4" />
                        Under 5
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="border-fuchsia-400/20 bg-slate-950/80">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Zap className="h-5 w-5 text-fuchsia-300" />
                Trade Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Stake amount</label>
                  <Input value={stake} onChange={(event) => setStake(event.target.value)} className="h-11 border-white/10 bg-white/5 text-slate-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Tick duration</label>
                  <select value={duration} onChange={(event) => setDuration(event.target.value)} className={darkSelectClassName} style={{ colorScheme: 'dark' }}>
                    {durationOptions.map((value) => (
                      <option key={value} value={value} className="bg-slate-950 text-slate-100">{value} ticks</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Selected digit</label>
                  <select value={selectedDigit} onChange={(event) => setSelectedDigit(event.target.value)} className={darkSelectClassName} style={{ colorScheme: 'dark' }}>
                    {digitOptions.map((value) => (
                      <option key={value} value={value} className="bg-slate-950 text-slate-100">Digit {value}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Index</label>
                  <select value={selectedSymbol} onChange={(event) => setSelectedSymbol(event.target.value)} className={darkSelectClassName} style={{ colorScheme: 'dark' }}>
                    {Object.entries(groupedSymbols).map(([group, options]) => (
                      <optgroup key={group} label={group} className="bg-slate-950 text-slate-100">
                        {options.map((option) => (
                          <option key={option.symbol} value={option.symbol} className="bg-slate-950 text-slate-100">{option.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Max daily loss</label>
                  <Input value={maxDailyLoss} onChange={(event) => setMaxDailyLoss(event.target.value)} placeholder="Optional" className="h-11 border-white/10 bg-white/5 text-slate-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Trade cooldown (seconds)</label>
                  <Input value={cooldownSeconds} onChange={(event) => setCooldownSeconds(event.target.value)} className="h-11 border-white/10 bg-white/5 text-slate-100" />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant={assistedPanelsOn ? 'gradient' : 'outline'} onClick={() => setAssistedPanelsOn((value) => !value)}>
                  {assistedPanelsOn ? 'Panels ON' : 'Panels OFF'}
                </Button>
                <Button variant="outline" onClick={() => setWorkspaceMode(workspaceMode === 'digit-pulse' ? 'range-pressure' : 'digit-pulse')}>
                  Switch Strategy
                </Button>
                <Button variant="outline" onClick={saveWorkspaceSettings} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Controls'}
                </Button>
                {snapshot.connected ? (
                  <Button variant="destructive" onClick={disconnectAccount}>Disconnect</Button>
                ) : null}
              </div>

              {workspaceMode === 'range-pressure' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant="gradient" className="gap-2" onClick={() => placeTrade('OVER')} disabled={placingTrade != null || !snapshot.connected}>Over</Button>
                  <Button variant="outline" className="gap-2 border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20" onClick={() => placeTrade('UNDER')} disabled={placingTrade != null || !snapshot.connected}>Under</Button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Button variant="outline" className="w-full max-w-md gap-2 border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100 hover:bg-fuchsia-400/20" onClick={() => placeTrade('DIFFER', Number(selectedDigit))} disabled={placingTrade != null || !snapshot.connected}>
                    Differ {selectedDigit}
                  </Button>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span>Daily loss guard</span>
                  <span>{formatCurrency(snapshot.dailyLoss, snapshot.account?.currency || 'USD')}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span>Cooldown remaining</span>
                  <span>{Math.ceil(snapshot.cooldownRemainingMs / 1000)}s</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-400/20 bg-slate-950/80">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Sparkles className="h-5 w-5 text-emerald-300" />
                  Live Results
                </CardTitle>
                <button
                  type="button"
                  onClick={() => void clearResults()}
                  disabled={clearingResults || snapshot.trades.length === 0}
                  aria-label="Clear live results"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-red-300 transition hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {clearingResults ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(15,23,42,0.78),rgba(2,6,23,0.92))] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Net profit</div>
                <div className={`mt-2 text-3xl font-semibold ${netProfit >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                  {formatCurrency(netProfit, snapshot.account?.currency || 'USD')}
                </div>
                <div className="mt-2 text-xs text-slate-400">Running total across the live results list.</div>
              </div>

              <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {snapshot.trades.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    No trades yet. Connect your account, then use the assisted buttons to place the first contract.
                  </div>
                ) : snapshot.trades.map((trade) => (
                  <div key={trade.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-100">{trade.action} · {trade.symbol}</div>
                        <div className="mt-1 text-xs text-slate-400">{formatDateTime(trade.createdAt)}</div>
                      </div>
                      <Badge variant={trade.status === 'won' ? 'success' : trade.status === 'lost' ? 'destructive' : 'outline'}>
                        {trade.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300">
                      <div>Stake: {formatCurrency(trade.stake, snapshot.account?.currency || 'USD')}</div>
                      <div>Payout: {formatCurrency(trade.payout, snapshot.account?.currency || 'USD')}</div>
                      <div>Digit: {trade.digit ?? '-'}</div>
                      <div>Profit: {formatCurrency(trade.profit, snapshot.account?.currency || 'USD')}</div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">{trade.displayMessage}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-400/20 bg-slate-950/80">
            <CardContent className="p-5 text-sm text-amber-100/90">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
                <div>
                  <div className="font-medium text-amber-200">Risk notice</div>
                  <p className="mt-1 text-slate-300">This is a trading tool, not financial advice. Digit contracts can settle quickly. Use the daily loss guard and cooldown controls.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
