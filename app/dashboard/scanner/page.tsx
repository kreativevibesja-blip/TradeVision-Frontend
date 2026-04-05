'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { api, openScannerPanelsStream } from '@/lib/api';
import type {
  ScanResult,
  ScannerPotentialTrade,
  ScannerAlert,
  ScannerSession,
  ScannerSessionType,
  ScannerSessionSummary,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';
import {
  Radar,
  TrendingUp,
  TrendingDown,
  Bell,
  BellOff,
  Clock,
  Shield,
  Flame,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Target,
  Eye,
  EyeOff,
  Trophy,
  Sparkles,
} from 'lucide-react';

// ── Helpers ──

const SESSION_LABELS: Record<ScannerSessionType, string> = {
  london: 'London',
  newyork: 'New York',
  volatility: 'Volatility Session',
};

const SESSION_HOURS: Record<ScannerSessionType, string> = {
  london: '2:00 AM – 11:00 AM EST',
  newyork: '8:00 AM – 5:00 PM EST',
  volatility: '2:00 AM – 5:00 PM EST daily on Volatility 10-100 and 10s-100s',
};

function getSessionStatusText(sessionType: ScannerSessionType, windowActive: boolean) {
  if (sessionType === 'volatility') {
    return SESSION_HOURS[sessionType];
  }

  return windowActive ? SESSION_HOURS[sessionType] : 'Market Closed';
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatPrice(price: number | null | undefined) {
  if (price == null || !Number.isFinite(price)) return '-';
  if (price >= 100) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(5);
}

function getLiveTradePulse(result: ScanResult) {
  const livePrice = result.currentPrice;
  if (livePrice == null || !Number.isFinite(livePrice)) {
    return null;
  }

  const risk = Math.abs(result.entry - result.stopLoss);
  if (!Number.isFinite(risk) || risk <= 0) {
    return null;
  }

  const primaryReward = Math.abs(result.takeProfit - result.entry);
  const signedMove = result.direction === 'buy' ? livePrice - result.entry : result.entry - livePrice;
  const state: 'profit' | 'drawdown' | 'neutral' = signedMove > risk * 0.08
    ? 'profit'
    : signedMove < -risk * 0.08
      ? 'drawdown'
      : 'neutral';
  const progressBase = result.direction === 'buy'
    ? (livePrice - result.stopLoss) / Math.max(result.takeProfit - result.stopLoss, Number.EPSILON)
    : (result.stopLoss - livePrice) / Math.max(result.stopLoss - result.takeProfit, Number.EPSILON);
  const pathProgress = Math.max(0, Math.min(1, progressBase));

  return {
    livePrice,
    state,
    signedMove,
    percentFromEntry: result.entry !== 0 ? (signedMove / result.entry) * 100 : 0,
    moveInR: signedMove / risk,
    pathProgress,
    tpProgress: primaryReward > 0 ? Math.max(0, Math.min(1, Math.abs(signedMove) / primaryReward)) : 0,
  };
}

function getTradePulseClasses(state: 'profit' | 'drawdown' | 'neutral') {
  if (state === 'profit') {
    return {
      shell: 'border-emerald-400/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(5,150,105,0.04)_52%,rgba(6,78,59,0.06))] text-emerald-50',
      glow: 'from-emerald-400/45 via-cyan-300/20 to-transparent',
      trail: 'from-emerald-300 via-emerald-400 to-cyan-300',
      label: 'In Profit',
      text: 'text-emerald-200',
    };
  }

  if (state === 'drawdown') {
    return {
      shell: 'border-rose-400/25 bg-[linear-gradient(135deg,rgba(244,63,94,0.18),rgba(190,24,93,0.04)_52%,rgba(76,5,25,0.06))] text-rose-50',
      glow: 'from-rose-400/45 via-orange-300/20 to-transparent',
      trail: 'from-rose-300 via-rose-400 to-orange-300',
      label: 'Drawdown',
      text: 'text-rose-200',
    };
  }

  return {
    shell: 'border-cyan-400/20 bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(14,116,144,0.04)_52%,rgba(8,47,73,0.06))] text-cyan-50',
    glow: 'from-cyan-300/40 via-blue-300/20 to-transparent',
    trail: 'from-cyan-300 via-sky-300 to-blue-300',
    label: 'Near Entry',
    text: 'text-cyan-200',
  };
}

function getTradeRunnerAnimation(state: 'profit' | 'drawdown' | 'neutral') {
  if (state === 'profit') {
    return {
      travelDuration: 0.35,
      limbDuration: 0.28,
      glowClass: 'shadow-[0_0_18px_rgba(52,211,153,0.45)]',
    };
  }

  if (state === 'drawdown') {
    return {
      travelDuration: 0.75,
      limbDuration: 0.85,
      glowClass: 'shadow-[0_0_14px_rgba(251,113,133,0.38)]',
    };
  }

  return {
    travelDuration: 0.5,
    limbDuration: 0.5,
    glowClass: 'shadow-[0_0_16px_rgba(103,232,249,0.36)]',
  };
}

function confidenceColor(score: number) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

function confidenceLabel(score: number) {
  if (score >= 80) return 'High';
  if (score >= 60) return 'Medium';
  return 'Low';
}

function formatTimeframeLabel(timeframe: string) {
  return timeframe.toUpperCase();
}

function getEntryInstruction(result: ScanResult) {
  const timeframeLabel = formatTimeframeLabel(result.timeframe);
  const engulfingLabel = result.direction === 'buy' ? 'Bullish engulfing' : 'Bearish engulfing';
  const hasDirectionalEngulfing = result.confirmations.includes(engulfingLabel);

  if (result.status === 'triggered') {
    return {
      badgeLabel: 'Enter Now',
      badgeVariant: 'default' as const,
      message: `Entry is live now on the ${timeframeLabel} setup.`,
    };
  }

  if (result.status === 'active') {
    if (!hasDirectionalEngulfing) {
      return {
        badgeLabel: 'Await Candle Close',
        badgeVariant: 'secondary' as const,
        message: `Enter after the current ${timeframeLabel} candle closes with a ${engulfingLabel.toLowerCase()} confirmation.`,
      };
    }

    return {
      badgeLabel: 'Await Entry Trigger',
      badgeVariant: 'secondary' as const,
      message: `Stand by for the ${timeframeLabel} entry trigger to complete before executing.`,
    };
  }

  if (result.status === 'closed') {
    return {
      badgeLabel: result.closeReason === 'tp' ? 'Closed TP' : 'Closed SL',
      badgeVariant: 'secondary' as const,
      message: result.closeReason === 'tp'
        ? 'This setup has already completed at take profit.'
        : 'This setup has already completed at stop loss.',
    };
  }

  if (result.status === 'invalidated') {
    return {
      badgeLabel: 'Invalidated',
      badgeVariant: 'destructive' as const,
      message: 'The setup is no longer valid for entry.',
    };
  }

  return {
    badgeLabel: 'Expired',
    badgeVariant: 'outline' as const,
    message: 'This setup has expired and should not be traded.',
  };
}

// ── Scan interval ──

const BACKGROUND_REFRESH_MS = 45_000;
export default function ScannerPage() {
  const { user, token, loading: authLoading } = useAuth();

  // Scanner state
  const [sessions, setSessions] = useState<ScannerSession[]>([]);
  const [londonWindowActive, setLondonWindowActive] = useState(false);
  const [newyorkWindowActive, setNewyorkWindowActive] = useState(false);
  const [volatilityWindowActive, setVolatilityWindowActive] = useState(true);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [potentialTrades, setPotentialTrades] = useState<ScannerPotentialTrade[]>([]);
  const [historyResults, setHistoryResults] = useState<ScanResult[]>([]);
  const [alerts, setAlerts] = useState<ScannerAlert[]>([]);
  const [summary, setSummary] = useState<ScannerSessionSummary | null>(null);
  const [scanning, setScanning] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [togglingSession, setTogglingSession] = useState<ScannerSessionType | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showPotentialTrades, setShowPotentialTrades] = useState(false);
  const [showClosedTrades, setShowClosedTrades] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const backgroundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundRefreshInFlightRef = useRef(false);

  // Check if user has a session enabled
  const isSessionEnabled = useCallback(
    (type: ScannerSessionType) => sessions.some((s) => s.sessionType === type && s.isActive),
    [sessions],
  );

  const anySessionEnabled = isSessionEnabled('london') || isSessionEnabled('newyork') || isSessionEnabled('volatility');
  const unreadAlertCount = alerts.filter((a) => !a.read).length;

  // ── Load initial data ──
  const loadStatus = useCallback(async () => {
    if (!token) return;
    try {
      const status = await api.scanner.getStatus(token);
      setSessions(status.sessions);
      setLondonWindowActive(status.londonActive);
      setNewyorkWindowActive(status.newyorkActive);
      setVolatilityWindowActive(status.volatilityActive);
    } catch {
      // silent
    }
  }, [token]);

  const loadResults = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.scanner.getResults(token, undefined, 20, 'current');
      setResults(data.results);
    } catch {
      // silent
    }
  }, [token]);

  const loadHistoryResults = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.scanner.getResults(token, undefined, 50, 'history');
      setHistoryResults(data.results);
    } catch {
      // silent
    }
  }, [token]);

  const loadPotentialTrades = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.scanner.getPotentials(token, 10);
      setPotentialTrades(data.potentials);
    } catch {
      // silent
    }
  }, [token]);

  const loadAlerts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.scanner.getAlerts(token);
      setAlerts(data.alerts);
    } catch {
      // silent
    }
  }, [token]);

  const loadSummary = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api.scanner.getSummary(token);
      setSummary(data.summary);
    } catch {
      // silent
    }
  }, [token]);

  // ── Initial load ──
  useEffect(() => {
    if (!token || authLoading) return;

    let active = true;

    const bootstrap = async () => {
      await Promise.allSettled([loadStatus(), loadResults(), loadSummary()]);

      if (active) {
        setInitialLoading(false);
      }

      void Promise.allSettled([loadPotentialTrades(), loadHistoryResults(), loadAlerts()]);
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [token, authLoading, loadStatus, loadResults, loadPotentialTrades, loadHistoryResults, loadAlerts, loadSummary]);

  // ── Realtime alerts via Supabase ──
  useEffect(() => {
    if (!supabase || !user) return;

    const alertsChannel = supabase
      .channel('scanner-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ScannerAlert',
          filter: `userId=eq.${user.id}`,
        },
        (payload) => {
          const newAlert = payload.new as ScannerAlert;
          setAlerts((prev) => [newAlert, ...prev]);
        },
      )
      .subscribe();

    const resultsChannel = supabase
      .channel('scanner-results')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ScanResult',
          filter: `userId=eq.${user.id}`,
        },
        () => {
          if (!token) {
            return;
          }

          void Promise.all([loadHistoryResults(), loadSummary()]);
        },
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(alertsChannel);
      void supabase?.removeChannel(resultsChannel);
    };
  }, [user, token, loadHistoryResults, loadSummary]);

  // ── Push-driven live feed and potentials ──
  useEffect(() => {
    if (!token || !user || user.subscription !== 'TOP_TIER') {
      return;
    }

    const abortController = new AbortController();
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      try {
        await openScannerPanelsStream(token, {
          signal: abortController.signal,
          onPanels: (payload) => {
            setResults(payload.results);
            setPotentialTrades(payload.potentials);
          },
        });

        if (!abortController.signal.aborted) {
          retryTimer = setTimeout(() => {
            void connect();
          }, 1500);
        }
      } catch {
        if (abortController.signal.aborted) {
          return;
        }

        retryTimer = setTimeout(() => {
          void connect();
        }, 3000);
      }
    };

    void connect();

    return () => {
      abortController.abort();
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [token, user]);

  // ── Passive refresh interval ──
  useEffect(() => {
    if (!token) {
      if (backgroundIntervalRef.current) {
        clearInterval(backgroundIntervalRef.current);
        backgroundIntervalRef.current = null;
      }
      return;
    }

    const refreshScannerData = async () => {
      if (backgroundRefreshInFlightRef.current) return;
      backgroundRefreshInFlightRef.current = true;
      setScanning(true);
      try {
        await Promise.all([loadStatus(), loadHistoryResults(), loadAlerts(), loadSummary()]);
      } catch {
        // silent
      } finally {
        backgroundRefreshInFlightRef.current = false;
        setScanning(false);
      }
    };

    backgroundIntervalRef.current = setInterval(refreshScannerData, BACKGROUND_REFRESH_MS);

    return () => {
      if (backgroundIntervalRef.current) {
        clearInterval(backgroundIntervalRef.current);
        backgroundIntervalRef.current = null;
      }
    };

  }, [token, loadAlerts, loadHistoryResults, loadStatus, loadSummary]);

  // ── Toggle session ──
  const handleToggleSession = async (type: ScannerSessionType) => {
    if (!token) return;
    setTogglingSession(type);
    try {
      const currentlyEnabled = isSessionEnabled(type);
      const res = await api.scanner.toggle(type, !currentlyEnabled, token);
      setSessions((prev) => {
        const filtered = prev.filter((s) => s.sessionType !== type);
        return [...filtered, res.session];
      });
    } catch {
      // silent
    } finally {
      setTogglingSession(null);
    }
  };

  // ── Mark alerts read ──
  const handleMarkAllRead = async () => {
    if (!token) return;
    const unreadIds = alerts.filter((a) => !a.read).map((a) => a.id);
    if (unreadIds.length === 0) return;
    try {
      await api.scanner.markAlertsRead(unreadIds, token);
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch {
      // silent
    }
  };

  // ── Loading states ──
  if (authLoading || initialLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Please sign in to use the scanner.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.subscription !== 'TOP_TIER') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Radar className="mx-auto h-12 w-12 text-primary/60" />
            <h2 className="text-xl font-bold">Smart Session Scanner</h2>
            <p className="text-muted-foreground">
              Upgrade to the PRO+ plan to unlock the Smart Session Scanner that monitors
              markets and alerts you to high-probability setups in real time.
            </p>
            <Button variant="gradient" onClick={() => (window.location.href = '/dashboard/billing')}>
              Upgrade to PRO+
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topResult = results.find((r) => r.rank === 1 && r.status === 'active');
  const liveResults = results
    .filter((r) => r.status === 'triggered')
    .sort((left, right) => {
      if (left.confidenceScore !== right.confidenceScore) {
        return right.confidenceScore - left.confidenceScore;
      }

      const leftTriggeredAt = left.triggeredAt ? new Date(left.triggeredAt).getTime() : 0;
      const rightTriggeredAt = right.triggeredAt ? new Date(right.triggeredAt).getTime() : 0;
      return rightTriggeredAt - leftTriggeredAt;
    });
  const closedResults = results.filter((r) => r.status === 'closed');

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Radar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">Smart Session Scanner</h1>
                <p className="text-sm text-muted-foreground">
                  London and New York scan your session markets, while volatility setups scan 24/7 in the backend.
                </p>
              </div>
            </div>

            {/* Alert bell */}
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative rounded-xl p-3 transition-colors hover:bg-white/5"
            >
              {unreadAlertCount > 0 ? (
                <>
                  <Bell className="h-5 w-5 text-yellow-400" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
                  </span>
                </>
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Scanning indicator */}
          <div className="mt-4 min-h-5">
            <div className={`flex items-center gap-2 text-sm text-primary transition-opacity ${scanning ? 'opacity-100' : 'opacity-0'}`}>
              <Loader2 className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
              <span>Refreshing scanner data...</span>
            </div>
          </div>
        </div>

        {/* ── Session Toggles ── */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(['london', 'newyork', 'volatility'] as const).map((type) => {
            const enabled = isSessionEnabled(type);
            const windowActive = type === 'london'
              ? londonWindowActive
              : type === 'newyork'
                ? newyorkWindowActive
                : volatilityWindowActive;
            const toggling = togglingSession === type;

            return (
              <Card key={type} className={enabled ? 'ring-1 ring-primary/30' : ''}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${windowActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-zinc-600'}`}
                    />
                    <div>
                      <p className="font-semibold">{SESSION_LABELS[type]}</p>
                      <p className="text-xs text-muted-foreground">{getSessionStatusText(type, windowActive)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleSession(type)}
                    disabled={toggling}
                    className={`relative h-7 w-12 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-zinc-700'} ${toggling ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`absolute top-0.5 block h-6 w-6 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                    />
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Alerts Panel (collapsible) ── */}
        <AnimatePresence>
          {showAlerts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-6 overflow-hidden"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Alerts</CardTitle>
                  {unreadAlertCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                      Mark all read
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="max-h-64 divide-y divide-white/5 overflow-y-auto p-0">
                  {alerts.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">No alerts yet.</p>
                  ) : (
                    alerts.slice(0, 30).map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-3 px-4 py-3 ${!alert.read ? 'bg-primary/5' : ''}`}
                      >
                        {alert.type === 'trade' && <ArrowUpCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />}
                        {alert.type === 'warning' && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />}
                        {alert.type === 'info' && <Bell className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-relaxed">{alert.message}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{formatTime(alert.createdAt)}</p>
                        </div>
                        {!alert.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Top Setup (highlighted) ── */}
        {topResult && (
          <div className="mb-6">
            <Card className="overflow-hidden ring-1 ring-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <span className="text-sm font-bold text-orange-400">#1 Best Setup</span>
                </div>
                <SetupCard result={topResult} expanded={expandedResult === topResult.id} onToggle={() => setExpandedResult(expandedResult === topResult.id ? null : topResult.id)} isTop />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Live Feed ── */}
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Live Feed</h2>
          {!anySessionEnabled ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Radar className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  Enable a scanner mode above to start scanning markets.
                </p>
              </CardContent>
            </Card>
          ) : liveResults.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Radar className="mx-auto mb-3 h-10 w-10 animate-pulse text-primary/40" />
                <p className="text-muted-foreground">
                  {scanning
                    ? 'Refreshing triggered setups...'
                    : 'No triggered live trades are active right now. The scanner will keep monitoring.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {liveResults
                .filter((r) => !topResult || r.id !== topResult.id)
                .slice(0, 10)
                .map((result) => (
                  <Card key={result.id}>
                    <CardContent className="p-4">
                      <SetupCard
                        result={result}
                        expanded={expandedResult === result.id}
                        onToggle={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                      />
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {/* ── Potential Trades ── */}
        <div className="mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Potential Trades</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPotentialTrades((prev) => !prev)}>
                {showPotentialTrades ? 'Hide watchlist' : 'View watchlist'}
              </Button>
            </CardHeader>
            <AnimatePresence initial={false}>
              {showPotentialTrades && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <CardContent className="pt-0">
                    {!anySessionEnabled ? (
                      <div className="rounded-xl bg-white/5 p-8 text-center">
                        <EyeOff className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-muted-foreground">Enable a scanner mode above to see the watchlist.</p>
                      </div>
                    ) : potentialTrades.length === 0 ? (
                      <div className="rounded-xl bg-white/5 p-8 text-center">
                        <Eye className="mx-auto mb-3 h-10 w-10 text-primary/40" />
                        <p className="text-muted-foreground">
                          No strong potential trades are forming right now. The scanner is still watching for price to move into cleaner trigger locations.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-2">
                        {potentialTrades.map((trade) => (
                          <Card key={`${trade.sessionType}-${trade.symbol}-${trade.direction}`}>
                            <CardContent className="p-4">
                              <PotentialTradeCard trade={trade} />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* ── Closed Trades ── */}
        <div className="mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Closed Trades</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowClosedTrades((prev) => !prev)}>
                {showClosedTrades ? 'Hide closed trades' : 'View closed trades'}
              </Button>
            </CardHeader>
            <AnimatePresence initial={false}>
              {showClosedTrades && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <CardContent className="pt-0">
                    {closedResults.length === 0 ? (
                      <div className="rounded-xl bg-white/5 p-6 text-center text-sm text-muted-foreground">
                        Closed trades will appear here after TP or SL is hit.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {closedResults.slice(0, 10).map((result) => (
                          <Card key={result.id}>
                            <CardContent className="p-4">
                              <SetupCard
                                result={result}
                                expanded={expandedResult === result.id}
                                onToggle={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* ── History Panel ── */}
        <div className="mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Signal History</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory((prev) => !prev)}>
                {showHistory ? 'Hide history' : 'View history'}
              </Button>
            </CardHeader>
            <AnimatePresence initial={false}>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <CardContent className="pt-0">
                    {historyResults.length === 0 ? (
                      <div className="rounded-xl bg-white/5 p-6 text-center text-sm text-muted-foreground">
                        Older signals will appear here after the trading day rolls over.
                      </div>
                    ) : (
                      <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-2">
                        {historyResults.slice(0, 20).map((result) => (
                          <Card key={result.id}>
                            <CardContent className="p-4">
                              <SetupCard
                                result={result}
                                expanded={expandedResult === result.id}
                                onToggle={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* ── Scanner Summary ── */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scanner Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <SummaryItem label="Total Setups" value={summary.total} icon={BarChart3} color="text-blue-400" />
                <SummaryItem label="Active" value={summary.active} icon={Target} color="text-green-400" />
                <SummaryItem label="Triggered" value={summary.triggered} icon={CheckCircle2} color="text-emerald-400" />
                <SummaryItem label="Closed" value={summary.closed} icon={Trophy} color="text-amber-400" />
                <SummaryItem label="Invalidated" value={summary.invalidated} icon={XCircle} color="text-red-400" />
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

// ── Setup Card Component ──

function SetupCard({
  result,
  expanded,
  onToggle,
  isTop,
}: {
  result: ScanResult;
  expanded: boolean;
  onToggle: () => void;
  isTop?: boolean;
}) {
  const isBuy = result.direction === 'buy';
  const outcomeBadge = result.status === 'closed'
    ? result.closeReason === 'tp'
      ? { label: 'Win', variant: 'success' as const }
      : { label: 'Loss', variant: 'destructive' as const }
    : result.status === 'invalidated'
      ? { label: 'No Entry', variant: 'outline' as const }
      : null;
  const entryInstruction = getEntryInstruction(result);
  const livePulse = getLiveTradePulse(result);

  return (
    <div>
      {/* Main row */}
      <button onClick={onToggle} className="flex w-full items-center gap-3 text-left">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isBuy ? 'bg-green-500/10' : 'bg-red-500/10'}`}
        >
          {isBuy ? (
            <TrendingUp className="h-5 w-5 text-green-400" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{result.symbol}</span>
            <Badge variant={isBuy ? 'success' : 'destructive'}>{result.direction.toUpperCase()}</Badge>
            <Badge variant={entryInstruction.badgeVariant}>{entryInstruction.badgeLabel}</Badge>
            {outcomeBadge ? <Badge variant={outcomeBadge.variant}>{outcomeBadge.label}</Badge> : null}
            {result.rank && result.rank <= 3 && (
              <span className="text-xs font-medium text-muted-foreground">#{result.rank}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {result.strategy && <span>{result.strategy}</span>}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(result.createdAt)}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{entryInstruction.message}</p>

          {livePulse && (result.status === 'triggered' || result.status === 'active') ? (
            <LiveTradePulse result={result} pulse={livePulse} />
          ) : null}
        </div>

        <div className="flex shrink-0 items-center self-start pt-1">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid gap-3 border-t border-white/5 pt-4 sm:grid-cols-2 xl:grid-cols-4">
              <PriceRow label="Live Price" value={formatPrice(result.currentPrice)} color="text-cyan-300" />
              <PriceRow label="Entry" value={formatPrice(result.entry)} color="text-foreground" />
              <PriceRow label="Stop Loss" value={formatPrice(result.stopLoss)} color="text-red-400" />
              <PriceRow label="Final TP (1:2)" value={formatPrice(result.takeProfit)} color="text-green-400" />
            </div>

            {(result.triggeredAt || result.closedAt) && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {result.triggeredAt ? <PriceRow label="Entry Ready" value={formatTime(result.triggeredAt)} color="text-emerald-400" /> : null}
                {result.closedAt ? <PriceRow label={result.closeReason === 'tp' ? 'Closed at TP' : 'Closed at SL'} value={formatTime(result.closedAt)} color={result.closeReason === 'tp' ? 'text-amber-400' : 'text-red-400'} /> : null}
              </div>
            )}

            {result.confirmations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.confirmations.map((c, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {c}
                  </Badge>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span>Timeframe: {result.timeframe}</span>
              <span>Mode: {SESSION_LABELS[result.sessionType]}</span>
              <span>Confidence: {confidenceLabel(result.confidenceScore)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LiveTradePulse({
  result,
  pulse,
}: {
  result: ScanResult;
  pulse: NonNullable<ReturnType<typeof getLiveTradePulse>>;
}) {
  const classes = getTradePulseClasses(pulse.state);
  const runnerAnimation = getTradeRunnerAnimation(pulse.state);
  const signedPriceText = `${pulse.signedMove >= 0 ? '+' : '-'}${formatPrice(Math.abs(pulse.signedMove))}`;
  const percentText = `${pulse.percentFromEntry >= 0 ? '+' : ''}${pulse.percentFromEntry.toFixed(2)}%`;
  const rText = `${pulse.moveInR >= 0 ? '+' : ''}${pulse.moveInR.toFixed(2)}R`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22 }}
      className={`relative mt-3 overflow-hidden rounded-2xl border px-3 py-3 ${classes.shell}`}
    >
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 -left-1/4 w-1/2 bg-gradient-to-r ${classes.glow} blur-2xl`}
        animate={{ x: ['0%', '140%'] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <motion.div
              className={`h-2.5 w-2.5 rounded-full ${pulse.state === 'profit' ? 'bg-emerald-300' : pulse.state === 'drawdown' ? 'bg-rose-300' : 'bg-cyan-300'}`}
              animate={{ scale: [1, 1.55, 1], opacity: [0.9, 0.45, 0.9] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Live Position Pulse</span>
            <Sparkles className="h-3.5 w-3.5 text-white/60" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className={`font-semibold ${classes.text}`}>{classes.label}</span>
            <span className="text-white/80">at {formatPrice(result.currentPrice)}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-right text-[11px] sm:min-w-[16rem]">
          <div>
            <p className="text-white/45">Move</p>
            <p className="font-semibold text-white">{signedPriceText}</p>
          </div>
          <div>
            <p className="text-white/45">Entry Drift</p>
            <p className="font-semibold text-white">{percentText}</p>
          </div>
          <div>
            <p className="text-white/45">R</p>
            <p className="font-semibold text-white">{rText}</p>
          </div>
        </div>
      </div>

      <div className="relative mt-3">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/45">
          <span>Stop</span>
          <span>Entry</span>
          <span>TP1</span>
        </div>
        <div className="relative mt-2 h-3">
          {/* Track bar (clipped) */}
          <div className="absolute inset-0 overflow-hidden rounded-full bg-black/25 ring-1 ring-white/10">
            <motion.div
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${classes.trail}`}
              animate={{ width: `${Math.max(4, pulse.pathProgress * 100)}%` }}
              transition={{ duration: runnerAnimation.travelDuration, ease: 'easeOut' }}
            />
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/25" />
          </div>
          {/* Finish line flag (above track, not clipped) */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-4 items-end justify-between" aria-hidden>
            <div className="h-7 w-[2px] rounded-full bg-white/65" />
            <div className="relative h-5 w-3 overflow-hidden rounded-sm border border-white/20 bg-white/10">
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                <div className="bg-white/80" />
                <div className="bg-slate-900/90" />
                <div className="bg-slate-900/90" />
                <div className="bg-white/80" />
              </div>
            </div>
          </div>
          {/* Runner (not clipped, floats above the bar) */}
          <motion.div
            className="absolute h-10 w-10"
            style={{ top: '50%', marginTop: '-20px' }}
            animate={{
              left: `calc(${pulse.pathProgress * 100}% - 20px)`,
              y: [0, -1.5, 0, -1.5, 0],
            }}
            transition={{
              left: { duration: runnerAnimation.travelDuration, ease: 'easeOut' },
              y: { duration: runnerAnimation.limbDuration, repeat: Infinity, ease: 'linear' },
            }}
          >
            <div className={`absolute inset-0 rounded-full ${runnerAnimation.glowClass}`} />
            <svg viewBox="0 0 40 40" className="h-10 w-10 overflow-visible drop-shadow-lg">
              {/* Head */}
              <motion.circle
                cx="22"
                cy="6"
                r="3.5"
                className={pulse.state === 'profit' ? 'fill-emerald-300' : pulse.state === 'drawdown' ? 'fill-rose-300' : 'fill-cyan-300'}
              />
              {/* Torso — leaning forward */}
              <line
                x1="21" y1="10" x2="18" y2="20"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={pulse.state === 'profit' ? 'text-emerald-200' : pulse.state === 'drawdown' ? 'text-rose-200' : 'text-cyan-200'}
              />
              {/* Left arm (pumps forward when right leg is forward) */}
              <motion.line
                x1="20" y1="12" x2="14" y2="16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={pulse.state === 'profit' ? 'text-emerald-100' : pulse.state === 'drawdown' ? 'text-rose-100' : 'text-cyan-100'}
                animate={{ rotate: [-35, 35, -35] }}
                transition={{ duration: runnerAnimation.limbDuration, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '20px 12px' }}
              />
              {/* Right arm (opposite of left) */}
              <motion.line
                x1="20" y1="12" x2="26" y2="16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className={pulse.state === 'profit' ? 'text-emerald-100' : pulse.state === 'drawdown' ? 'text-rose-100' : 'text-cyan-100'}
                animate={{ rotate: [35, -35, 35] }}
                transition={{ duration: runnerAnimation.limbDuration, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '20px 12px' }}
              />
              {/* Left thigh */}
              <motion.line
                x1="18" y1="20" x2="13" y2="27"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={pulse.state === 'profit' ? 'text-emerald-200' : pulse.state === 'drawdown' ? 'text-rose-200' : 'text-cyan-200'}
                animate={{ rotate: [-40, 40, -40] }}
                transition={{ duration: runnerAnimation.limbDuration, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '18px 20px' }}
              />
              {/* Left shin */}
              <motion.line
                x1="13" y1="27" x2="11" y2="34"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                className={pulse.state === 'profit' ? 'text-emerald-100' : pulse.state === 'drawdown' ? 'text-rose-100' : 'text-cyan-100'}
                animate={{ rotate: [-40, 40, -40] }}
                transition={{ duration: runnerAnimation.limbDuration, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '13px 27px' }}
              />
              {/* Right thigh (opposite phase) */}
              <motion.line
                x1="18" y1="20" x2="23" y2="27"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={pulse.state === 'profit' ? 'text-emerald-200' : pulse.state === 'drawdown' ? 'text-rose-200' : 'text-cyan-200'}
                animate={{ rotate: [40, -40, 40] }}
                transition={{ duration: runnerAnimation.limbDuration, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '18px 20px' }}
              />
              {/* Right shin (opposite phase) */}
              <motion.line
                x1="23" y1="27" x2="25" y2="34"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                className={pulse.state === 'profit' ? 'text-emerald-100' : pulse.state === 'drawdown' ? 'text-rose-100' : 'text-cyan-100'}
                animate={{ rotate: [40, -40, 40] }}
                transition={{ duration: runnerAnimation.limbDuration, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformOrigin: '23px 27px' }}
              />
            </svg>
          </motion.div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-white/65">
          <span>{formatPrice(result.stopLoss)}</span>
          <span>{formatPrice(result.entry)}</span>
          <span>{formatPrice(result.takeProfit)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function PotentialTradeCard({ trade }: { trade: ScannerPotentialTrade }) {
  const isBuy = trade.direction === 'buy';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{trade.symbol}</span>
            <Badge variant={isBuy ? 'success' : 'destructive'}>{trade.direction.toUpperCase()}</Badge>
            <Badge variant="outline">{SESSION_LABELS[trade.sessionType]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{trade.strategy}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{trade.narrative}</p>
        </div>

        <div className="min-w-[140px] rounded-xl bg-white/5 p-3 text-right">
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Activation chance</p>
          <p className="mt-1 text-2xl font-bold">{Math.round(trade.activationProbability)}%</p>
          <Progress value={trade.activationProbability} className="mt-2 h-2" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <PriceRow label="Current Price" value={formatPrice(trade.currentPrice)} color="text-foreground" />
        <PriceRow label="Projected Entry" value={formatPrice(trade.entry)} color="text-foreground" />
        <PriceRow label="Projected Stop" value={formatPrice(trade.stopLoss)} color="text-red-400" />
        <PriceRow label="Projected Final TP (1:2)" value={formatPrice(trade.takeProfit)} color="text-green-400" />
      </div>

      {trade.contextLabels.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Current market context</p>
          <div className="flex flex-wrap gap-1.5">
            {trade.contextLabels.map((label) => (
              <Badge key={label} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-400">Already in place</p>
          <div className="space-y-2">
            {trade.fulfilledConditions.map((condition) => (
              <div key={condition} className="flex items-start gap-2 rounded-lg bg-emerald-500/5 px-3 py-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{condition}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-400">Scanner is waiting for</p>
          <div className="space-y-2">
            {trade.requiredTriggers.slice(0, 5).map((condition) => (
              <div key={condition} className="flex items-start gap-2 rounded-lg bg-amber-500/5 px-3 py-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <span>{condition}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small components ──

function PriceRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-mono text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function SummaryItem({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white/5 p-3 text-center">
      <Icon className={`mx-auto mb-1 h-5 w-5 ${color}`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
