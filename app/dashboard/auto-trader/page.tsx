'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
  api,
  type AutoTradeSettings,
  type AutoTrade,
  type AutoTradeLog,
  type AutoPerformance,
  type AutoTradeMode,
  type CTraderPosition,
} from '@/lib/api';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bot,
  Crown,
  Link2,
  Link2Off,
  Loader2,
  Octagon,
  RefreshCw,
  Settings,
  Shield,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';

const MODE_LABELS: Record<AutoTradeMode, string> = {
  off: 'Off',
  assisted: 'Assisted',
  semi: 'Semi-Auto',
  full: 'Full Auto',
};

const MODE_DESCRIPTIONS: Record<AutoTradeMode, string> = {
  off: 'Auto trading disabled',
  assisted: 'Signals shown – you confirm each trade',
  semi: 'High-confidence trades execute automatically',
  full: 'All qualifying trades execute automatically',
};

const MODE_COLORS: Record<AutoTradeMode, string> = {
  off: 'border-zinc-600 bg-zinc-800/50 text-zinc-400',
  assisted: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  semi: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  full: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
};

export default function AutoTraderPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <AutoTraderContent />
    </Suspense>
  );
}

function AutoTraderContent() {
  const { user, token, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [settings, setSettings] = useState<AutoTradeSettings | null>(null);
  const [performance, setPerformance] = useState<AutoPerformance | null>(null);
  const [activeTrades, setActiveTrades] = useState<AutoTrade[]>([]);
  const [pendingTrades, setPendingTrades] = useState<AutoTrade[]>([]);
  const [history, setHistory] = useState<AutoTrade[]>([]);
  const [logs, setLogs] = useState<AutoTradeLog[]>([]);
  const [positions, setPositions] = useState<CTraderPosition[]>([]);
  const [balance, setBalance] = useState<{ balance: number; equity: number; currency: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [oauthAccounts, setOauthAccounts] = useState<Array<{
    accountId: string;
    accountNumber: number;
    live: boolean;
    brokerName: string;
    balance: number;
    currency: string;
  }> | null>(null);
  const [tempTokens, setTempTokens] = useState<{ access: string; refresh: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [tab, setTab] = useState<'active' | 'history' | 'logs'>('active');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [settingsRes, tradesRes, pendingRes, historyRes, logsRes] = await Promise.all([
        api.autoTrading.getSettings(token),
        api.autoTrading.getActiveTrades(token),
        api.autoTrading.getPending(token),
        api.autoTrading.getTrades(token, 'closed'),
        api.autoTrading.getLogs(token),
      ]);

      setSettings(settingsRes.settings);
      setPerformance(settingsRes.performance);
      setActiveTrades(tradesRes.trades);
      setPendingTrades(pendingRes.trades);
      setHistory(historyRes.trades);
      setLogs(logsRes.logs);

      if (settingsRes.settings?.connected) {
        const [posRes, balRes] = await Promise.all([
          api.autoTrading.getPositions(token).catch(() => ({ positions: [] })),
          api.autoTrading.getBalance(token).catch(() => null),
        ]);
        setPositions(posRes.positions);
        if (balRes) setBalance({ balance: balRes.balance, equity: balRes.equity, currency: balRes.currency });
      }
    } catch (err) {
      console.error('Failed to load auto trading data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 15s for active trades
  useEffect(() => {
    if (!token || !settings?.isActive) return;
    const interval = setInterval(load, 15_000);
    return () => clearInterval(interval);
  }, [token, settings?.isActive, load]);

  const updateMode = async (mode: AutoTradeMode) => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await api.autoTrading.updateSettings({ autoMode: mode, isActive: mode !== 'off' }, token);
      setSettings(res.settings);
    } catch { /* noop */ }
    setSaving(false);
  };

  const updateSetting = async (key: string, value: unknown) => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await api.autoTrading.updateSettings({ [key]: value } as Partial<AutoTradeSettings>, token);
      setSettings(res.settings);
    } catch { /* noop */ }
    setSaving(false);
  };

  const handleConnect = async () => {
    if (!token) return;
    setConnectLoading(true);
    setConnectError('');
    try {
      const { url } = await api.autoTrading.getOAuthUrl(token);
      window.location.href = url;
    } catch (err: any) {
      setConnectError(err?.message || 'Failed to start OAuth');
      setConnectLoading(false);
    }
  };

  const handleOAuthCallback = useCallback(async (code: string) => {
    if (!token) return;
    setConnectLoading(true);
    setConnectError('');
    try {
      const res = await api.autoTrading.connect(code, token);
      if (res.needsAccountSelection && res.accounts) {
        setOauthAccounts(res.accounts);
        setTempTokens({
          access: res.tempAccessToken!,
          refresh: res.tempRefreshToken!,
        });
        setShowConnect(true);
        setConnectLoading(false);
        return;
      }
      if (res.balance != null) {
        setBalance({ balance: res.balance, equity: res.balance, currency: res.currency! });
      }
      setShowConnect(false);
      await load();
    } catch (err: any) {
      setConnectError(err?.message || 'Failed to connect');
      setShowConnect(true);
    }
    setConnectLoading(false);
  }, [token, load]);

  // Handle OAuth callback — read ?code= from URL
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && token) {
      router.replace('/dashboard/auto-trader', { scroll: false });
      handleOAuthCallback(code);
    }
  }, [searchParams, token, router, handleOAuthCallback]);

  const handleSelectAccount = async (accountId: string) => {
    if (!token || !tempTokens) return;
    setConnectLoading(true);
    setConnectError('');
    try {
      const res = await api.autoTrading.selectAccount(accountId, tempTokens.access, tempTokens.refresh, token);
      setBalance({ balance: res.balance, equity: res.balance, currency: res.currency });
      setShowConnect(false);
      setOauthAccounts(null);
      setTempTokens(null);
      await load();
    } catch (err: any) {
      setConnectError(err?.message || 'Failed to select account');
    }
    setConnectLoading(false);
  };

  const handleDisconnect = async () => {
    if (!token) return;
    await api.autoTrading.disconnect(token);
    setBalance(null);
    setPositions([]);
    await load();
  };

  const handleEmergencyStop = async () => {
    if (!token) return;
    setStopping(true);
    try {
      await api.autoTrading.emergencyStop(true, token);
      await load();
    } catch { /* noop */ }
    setStopping(false);
  };

  const handleApproveTrade = async (tradeId: string) => {
    if (!token) return;
    try {
      await api.autoTrading.approveTrade(tradeId, token);
      await load();
    } catch { /* noop */ }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !['TOP_TIER', 'VIP_AUTO_TRADER'].includes(user.subscription)) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Crown className="mx-auto mb-4 h-10 w-10 text-amber-400" />
          <h2 className="mb-2 text-lg font-bold">PRO+ or VIP Required</h2>
          <p className="text-sm text-muted-foreground mb-4">Auto Trading is available for PRO+ and VIP Auto Trader subscribers.</p>
          <Link href="/checkout?plan=VIP_AUTO_TRADER">
            <Button variant="gradient" size="lg">Upgrade to VIP Auto Trader</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Auto Trader</h1>
            <p className="text-xs text-muted-foreground">cTrader automated execution</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={load}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          {settings?.isActive && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleEmergencyStop}
              disabled={stopping}
            >
              {stopping ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Octagon className="mr-1.5 h-3.5 w-3.5" />}
              Emergency Stop
            </Button>
          )}
        </div>
      </div>

      {/* Connection Status + Balance */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Connection */}
        <Card className="mobile-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">cTrader</span>
              {settings?.connected ? (
                <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px]">Connected</Badge>
              ) : (
                <Badge className="border-zinc-600 bg-zinc-800/50 text-zinc-400 text-[10px]">Not Connected</Badge>
              )}
            </div>
            {settings?.connected ? (
              <div className="mt-2">
                <p className="text-sm font-medium">{settings.ctraderAccountId}</p>
                <button onClick={handleDisconnect} className="mt-1 text-[10px] text-red-400 hover:underline">Disconnect</button>
              </div>
            ) : (
              <Button size="sm" className="mt-2 w-full" onClick={() => setShowConnect(true)}>
                <Link2 className="mr-1.5 h-3.5 w-3.5" /> Connect Account
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Balance */}
        <Card className="mobile-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Balance</span>
            {balance ? (
              <div className="mt-1">
                <p className="text-lg font-bold">${balance.balance.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">Equity: ${balance.equity.toFixed(2)}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="mobile-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Win Rate</span>
            <p className="mt-1 text-lg font-bold">{performance ? `${performance.winRate}%` : '—'}</p>
            <p className="text-[10px] text-muted-foreground">
              {performance ? `${performance.wins}W / ${performance.losses}L of ${performance.totalTrades}` : 'No data'}
            </p>
          </CardContent>
        </Card>

        {/* Profit */}
        <Card className="mobile-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Total Profit</span>
            <p className={`mt-1 text-lg font-bold ${(performance?.totalProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ${(performance?.totalProfit ?? 0).toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Drawdown: ${(performance?.drawdown ?? 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mode Selection */}
      <Card className="mobile-card">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Trading Mode</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="mr-1.5 h-3.5 w-3.5" /> Settings
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(MODE_LABELS) as AutoTradeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => updateMode(mode)}
                disabled={saving || (!settings?.connected && mode !== 'off')}
                className={`rounded-xl border p-3 text-left transition-all ${
                  settings?.autoMode === mode
                    ? MODE_COLORS[mode]
                    : 'border-white/5 bg-white/[0.02] text-muted-foreground hover:border-white/10'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <p className="text-xs font-semibold">{MODE_LABELS[mode]}</p>
                <p className="mt-0.5 text-[10px] opacity-70">{MODE_DESCRIPTIONS[mode]}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="mobile-card">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-semibold">Risk Management</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Risk Per Trade (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={settings?.riskPerTrade ?? 1}
                      onChange={(e) => updateSetting('riskPerTrade', Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max Daily Loss (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="50"
                      value={settings?.maxDailyLoss ?? 5}
                      onChange={(e) => updateSetting('maxDailyLoss', Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max Trades Per Day</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={settings?.maxTradesPerDay ?? 3}
                      onChange={(e) => updateSetting('maxTradesPerDay', Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Allowed Sessions</label>
                    <div className="mt-1 flex gap-2">
                      {['london', 'newyork'].map((session) => {
                        const active = settings?.allowedSessions?.includes(session);
                        return (
                          <button
                            key={session}
                            onClick={() => {
                              const current = settings?.allowedSessions ?? [];
                              const next = active
                                ? current.filter((s: string) => s !== session)
                                : [...current, session];
                              updateSetting('allowedSessions', next);
                            }}
                            className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                              active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-white/10 text-muted-foreground'
                            }`}
                          >
                            {session === 'london' ? 'London' : 'New York'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Symbol Filter</label>
                    <div className="mt-1">
                      <button
                        onClick={() => updateSetting('goldOnly', !settings?.goldOnly)}
                        className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                          settings?.goldOnly ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-white/10 text-muted-foreground'
                        }`}
                      >
                        {settings?.goldOnly ? '🥇 Gold Only' : '📊 All Symbols'}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Trades (Assisted Mode) */}
      {pendingTrades.length > 0 && (
        <Card className="mobile-card border-amber-500/20">
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-amber-300">
              <Zap className="mr-1.5 inline h-4 w-4" /> Pending Confirmation ({pendingTrades.length})
            </h3>
            <div className="space-y-2">
              {pendingTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-3">
                    {trade.direction === 'buy' ? (
                      <ArrowUp className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{trade.symbol} {trade.direction.toUpperCase()}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Entry: {trade.entryPrice} | SL: {trade.sl} | TP: {trade.tp}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleApproveTrade(trade.id)}>
                    Execute Trade
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Active / History / Logs */}
      <div className="flex gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1">
        {(['active', 'history', 'logs'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-all ${
              tab === t ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'active' ? `Active (${activeTrades.length})` : t === 'history' ? `History (${history.length})` : `Logs (${logs.length})`}
          </button>
        ))}
      </div>

      {/* Active Trades */}
      {tab === 'active' && (
        <div className="space-y-2">
          {activeTrades.length === 0 ? (
            <Card className="mobile-card">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No active trades
              </CardContent>
            </Card>
          ) : (
            activeTrades.map((trade) => (
              <Card key={trade.id} className="mobile-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {trade.direction === 'buy' ? (
                        <div className="rounded-lg bg-emerald-500/10 p-1.5">
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="rounded-lg bg-red-500/10 p-1.5">
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold">{trade.symbol}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {trade.direction.toUpperCase()} • {trade.lotSize} lots
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] ${
                      trade.status === 'executed' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    }`}>
                      {trade.status}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Entry</p>
                      <p className="text-xs font-medium">{trade.entryPrice}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">SL</p>
                      <p className="text-xs font-medium text-red-400">{trade.sl}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">TP</p>
                      <p className="text-xs font-medium text-emerald-400">{trade.tp}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Live cTrader Positions */}
          {positions.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Live cTrader Positions</h4>
              {positions.map((pos) => (
                <Card key={pos.orderId} className="mobile-card mb-2">
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-medium">{pos.symbol} {pos.direction.toUpperCase()}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Entry: {pos.entryPrice} | Current: {pos.currentPrice}
                      </p>
                    </div>
                    <p className={`text-sm font-bold ${pos.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pos.profit >= 0 ? '+' : ''}{pos.profit.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trade History */}
      {tab === 'history' && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <Card className="mobile-card">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No trade history
              </CardContent>
            </Card>
          ) : (
            history.map((trade) => (
              <Card key={trade.id} className="mobile-card">
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    {trade.direction === 'buy' ? (
                      <ArrowUp className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{trade.symbol} {trade.direction.toUpperCase()}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(trade.createdAt).toLocaleDateString()} • {trade.lotSize} lots
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`text-[10px] ${
                      trade.result === 'win' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : trade.result === 'loss' ? 'border-red-500/30 bg-red-500/10 text-red-300'
                        : 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300'
                    }`}>
                      {trade.result ?? 'closed'}
                    </Badge>
                    <p className={`mt-0.5 text-xs font-bold ${(trade.profit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(trade.profit ?? 0) >= 0 ? '+' : ''}{(trade.profit ?? 0).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Logs */}
      {tab === 'logs' && (
        <div className="space-y-1">
          {logs.length === 0 ? (
            <Card className="mobile-card">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No logs yet
              </CardContent>
            </Card>
          ) : (
            logs.slice(0, 50).map((log) => (
              <div key={log.id} className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                <div className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                  log.action === 'executed' ? 'bg-emerald-400'
                    : log.action === 'rejected' ? 'bg-red-400'
                    : log.action === 'emergency_stop' ? 'bg-red-500'
                    : 'bg-cyan-400'
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{log.action.replace(/_/g, ' ')}</p>
                  {log.reason && <p className="text-[10px] text-muted-foreground truncate">{log.reason}</p>}
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Connect / Account Selection Modal */}
      <AnimatePresence>
        {showConnect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => { setShowConnect(false); setOauthAccounts(null); setTempTokens(null); }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {oauthAccounts ? (
                <>
                  <h3 className="mb-4 text-lg font-bold">Select Trading Account</h3>
                  <p className="mb-3 text-xs text-muted-foreground">Choose the account you want to connect for auto trading:</p>
                  <div className="max-h-60 space-y-2 overflow-y-auto">
                    {oauthAccounts.map((acc) => (
                      <button
                        key={acc.accountId}
                        onClick={() => handleSelectAccount(acc.accountId)}
                        disabled={connectLoading}
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-primary/40 hover:bg-white/[0.06] disabled:opacity-50"
                      >
                        <div>
                          <p className="text-sm font-medium">#{acc.accountNumber}</p>
                          <p className="text-[10px] text-muted-foreground">{acc.brokerName} · {acc.live ? 'Live' : 'Demo'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{acc.currency} {acc.balance.toFixed(2)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {connectError && <p className="mt-2 text-xs text-red-400">{connectError}</p>}
                  <Button variant="outline" className="mt-4 w-full" onClick={() => { setShowConnect(false); setOauthAccounts(null); setTempTokens(null); }}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="mb-4 text-lg font-bold">Connect cTrader Account</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Click below to securely connect your cTrader account via OAuth. You will be redirected to cTrader to authorize access.
                  </p>
                  {connectError && <p className="mb-3 text-xs text-red-400">{connectError}</p>}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowConnect(false)}>Cancel</Button>
                    <Button className="flex-1" onClick={handleConnect} disabled={connectLoading}>
                      {connectLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Link2 className="mr-1.5 h-3.5 w-3.5" />}
                      Connect cTrader
                    </Button>
                  </div>
                  <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="text-[10px] text-amber-300/80">
                      <Shield className="mr-1 inline h-3 w-3" />
                      Your tokens are encrypted with AES-256 before storage. We never store plaintext credentials.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
