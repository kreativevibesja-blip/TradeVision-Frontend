'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
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
} from 'lucide-react';

// ── Helpers ──

const SESSION_LABELS: Record<ScannerSessionType, string> = {
  london: 'London',
  newyork: 'New York',
  volatility: 'Volatility 24/7',
};

const SESSION_HOURS: Record<ScannerSessionType, string> = {
  london: '2:00 AM – 11:00 AM EST',
  newyork: '8:00 AM – 5:00 PM EST',
  volatility: 'Runs 24/7 on Volatility 10-100 and 10s-100s',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatPrice(price: number) {
  if (price >= 100) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(5);
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

// ── Scan interval ──

const SCAN_INTERVAL_MS = 45_000; // passive refresh only; backend scanner runs independently

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
  const [showHistory, setShowHistory] = useState(false);

  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const refreshInFlightRef = useRef(false);

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
    Promise.all([loadStatus(), loadResults(), loadPotentialTrades(), loadHistoryResults(), loadAlerts(), loadSummary()]).finally(() =>
      setInitialLoading(false),
    );
  }, [token, authLoading, loadStatus, loadResults, loadPotentialTrades, loadHistoryResults, loadAlerts, loadSummary]);

  // ── Realtime alerts via Supabase ──
  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase
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

    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [user]);

  // ── Passive refresh interval ──
  useEffect(() => {
    if (!token) {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      return;
    }

    const refreshScannerData = async () => {
      if (refreshInFlightRef.current) return;
      refreshInFlightRef.current = true;
      setScanning(true);
      try {
        await Promise.all([loadStatus(), loadResults(), loadPotentialTrades(), loadHistoryResults(), loadAlerts(), loadSummary()]);
      } catch {
        // silent
      } finally {
        refreshInFlightRef.current = false;
        setScanning(false);
      }
    };

    void refreshScannerData();

    scanIntervalRef.current = setInterval(refreshScannerData, SCAN_INTERVAL_MS);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [token, loadAlerts, loadHistoryResults, loadPotentialTrades, loadResults, loadStatus, loadSummary]);

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
  const liveResults = results.filter((r) => r.status !== 'closed');
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
                      <p className="text-xs text-muted-foreground">{SESSION_HOURS[type]}</p>
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
                  {scanning ? 'Scanning for setups...' : 'No live setups are active right now. The scanner will keep monitoring.'}
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
          <h2 className="mb-3 text-lg font-semibold">Potential Trades</h2>
          {!anySessionEnabled ? (
            <Card>
              <CardContent className="p-8 text-center">
                <EyeOff className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">Enable a scanner mode above to see the watchlist.</p>
              </CardContent>
            </Card>
          ) : potentialTrades.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="mx-auto mb-3 h-10 w-10 text-primary/40" />
                <p className="text-muted-foreground">
                  No strong potential trades are forming right now. The scanner is still watching for price to move into cleaner trigger locations.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {potentialTrades.map((trade) => (
                <Card key={`${trade.sessionType}-${trade.symbol}-${trade.direction}`}>
                  <CardContent className="p-4">
                    <PotentialTradeCard trade={trade} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── Closed Trades ── */}
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Closed Trades</h2>
          {closedResults.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Closed trades will appear here after TP or SL is hit.
              </CardContent>
            </Card>
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
                      <div className="space-y-3">
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
  const statusBadge = {
    active: { label: 'Active', variant: 'success' as const },
    triggered: { label: 'Triggered', variant: 'default' as const },
    closed: { label: result.closeReason === 'tp' ? 'Closed TP' : 'Closed SL', variant: 'secondary' as const },
    invalidated: { label: 'Invalidated', variant: 'destructive' as const },
    expired: { label: 'Expired', variant: 'outline' as const },
  }[result.status];

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
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
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
        </div>

        {/* Confidence */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full ${confidenceColor(result.confidenceScore)}`}
                style={{ width: `${Math.min(100, result.confidenceScore)}%` }}
              />
            </div>
            <span className="text-xs font-medium">{Math.round(result.confidenceScore)}%</span>
          </div>
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
            <div className="mt-4 grid gap-3 sm:grid-cols-3 border-t border-white/5 pt-4">
              <PriceRow label="Entry" value={formatPrice(result.entry)} color="text-foreground" />
              <PriceRow label="Stop Loss" value={formatPrice(result.stopLoss)} color="text-red-400" />
              <PriceRow label="Take Profit" value={formatPrice(result.takeProfit)} color="text-green-400" />
            </div>

            {(result.triggeredAt || result.closedAt) && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {result.triggeredAt ? <PriceRow label="Triggered" value={formatTime(result.triggeredAt)} color="text-emerald-400" /> : null}
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

      <div className="grid gap-3 sm:grid-cols-4">
        <PriceRow label="Current Price" value={formatPrice(trade.currentPrice)} color="text-foreground" />
        <PriceRow label="Projected Entry" value={formatPrice(trade.entry)} color="text-foreground" />
        <PriceRow label="Projected Stop" value={formatPrice(trade.stopLoss)} color="text-red-400" />
        <PriceRow label="Projected Target" value={formatPrice(trade.takeProfit)} color="text-green-400" />
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
