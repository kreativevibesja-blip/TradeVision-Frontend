'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { api, TradeSignal, RiskSettings, Mt5Connection, AutoMode } from '@/lib/api';
import {
  Bot,
  Wifi,
  WifiOff,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Settings2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const MODE_LABELS: Record<AutoMode, { label: string; desc: string; color: string }> = {
  manual: { label: 'Manual', desc: 'Review & approve every signal before execution', color: 'text-blue-400' },
  semi: { label: 'Semi-Auto', desc: 'Auto-approve A+ signals, confirm the rest', color: 'text-yellow-400' },
  full: { label: 'Full Auto', desc: 'All signals execute automatically via EA', color: 'text-green-400' },
};

const CONFIDENCE_COLORS: Record<string, string> = {
  'A+': 'bg-green-500/20 text-green-400 border-green-500/30',
  A: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  B: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  avoid: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400' },
  ready: { label: 'Ready', className: 'bg-blue-500/20 text-blue-400' },
  executed: { label: 'Executed', className: 'bg-green-500/20 text-green-400' },
  cancelled: { label: 'Cancelled', className: 'bg-zinc-500/20 text-zinc-400' },
  expired: { label: 'Expired', className: 'bg-zinc-500/20 text-zinc-400' },
};

export default function AutoTraderPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [connection, setConnection] = useState<Mt5Connection | null>(null);
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [settings, setSettings] = useState<RiskSettings>({
    riskPerTrade: 1.0,
    maxDailyLoss: 5.0,
    maxTradesPerDay: 3,
    autoMode: 'manual',
    killSwitch: false,
  });
  const [loading, setLoading] = useState(true);
  const [connectForm, setConnectForm] = useState({ accountId: '', broker: '', serverName: '' });
  const [settingsForm, setSettingsForm] = useState<RiskSettings>(settings);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [tab, setTab] = useState<'signals' | 'settings'>('signals');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [connRes, sigRes, setRes] = await Promise.all([
        api.autotrader.getConnection(token),
        api.autotrader.getSignals(token),
        api.autotrader.getSettings(token),
      ]);
      setConnection(connRes.connection);
      setSignals(sigRes.signals);
      setSettings(setRes.settings);
      setSettingsForm(setRes.settings);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) load();
    else if (!authLoading) setLoading(false);
  }, [token, authLoading, load]);

  // Refresh signals every 5s
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const sigRes = await api.autotrader.getSignals(token);
        setSignals(sigRes.signals);
      } catch {
        // silent
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleConnect = async () => {
    if (!token || !connectForm.accountId.trim()) return;
    try {
      const res = await api.autotrader.connect(connectForm, token);
      setConnection(res.connection);
      setConnectForm({ accountId: '', broker: '', serverName: '' });
    } catch {
      // silent
    }
  };

  const handleDisconnect = async () => {
    if (!token) return;
    try {
      await api.autotrader.disconnect(token);
      setConnection(null);
    } catch {
      // silent
    }
  };

  const handleApprove = async (id: string) => {
    if (!token) return;
    try {
      const res = await api.autotrader.approveSignal(id, token);
      setSignals((prev) => prev.map((s) => (s.id === id ? res.signal : s)));
    } catch {
      // silent
    }
  };

  const handleCancel = async (id: string) => {
    if (!token) return;
    try {
      const res = await api.autotrader.cancelSignal(id, token);
      setSignals((prev) => prev.map((s) => (s.id === id ? res.signal : s)));
    } catch {
      // silent
    }
  };

  const handleKillSwitch = async () => {
    if (!token) return;
    try {
      const res = await api.autotrader.toggleKillSwitch(!settings.killSwitch, token);
      setSettings(res.settings);
      setSettingsForm(res.settings);
    } catch {
      // silent
    }
  };

  const handleSaveSettings = async () => {
    if (!token) return;
    try {
      const res = await api.autotrader.updateSettings(settingsForm, token);
      setSettings(res.settings);
      setSettingsForm(res.settings);
      setSettingsDirty(false);
    } catch {
      // silent
    }
  };

  const updateSettingsField = <K extends keyof RiskSettings>(key: K, value: RiskSettings[K]) => {
    setSettingsForm((prev) => ({ ...prev, [key]: value }));
    setSettingsDirty(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center"><p className="text-muted-foreground">Loading AutoTrader...</p></CardContent></Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center"><p className="text-muted-foreground">Please sign in to access AutoTrader.</p></CardContent></Card>
      </div>
    );
  }

  const pendingSignals = signals.filter((s) => s.status === 'pending' || s.status === 'ready');
  const historicalSignals = signals.filter((s) => s.status === 'executed' || s.status === 'cancelled' || s.status === 'expired');
  const modeInfo = MODE_LABELS[settings.autoMode];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            AutoTrader
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Semi-automated MT5 trading powered by your analysis signals</p>
        </div>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </motion.div>

      {/* Status Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Connection Status */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            {connection?.isActive ? (
              <Wifi className="h-5 w-5 text-green-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-zinc-500" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">MT5 Connection</p>
              {connection?.isActive ? (
                <p className="text-sm font-medium truncate">{connection.broker || connection.accountId}</p>
              ) : (
                <p className="text-sm text-zinc-500">Disconnected</p>
              )}
            </div>
            <Badge variant="outline" className={connection?.isActive ? 'border-green-500/30 text-green-400' : 'border-zinc-500/30 text-zinc-500'}>
              {connection?.isActive ? 'Online' : 'Offline'}
            </Badge>
          </CardContent>
        </Card>

        {/* Kill Switch */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            {settings.killSwitch ? (
              <ShieldAlert className="h-5 w-5 text-red-400" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-green-400" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Kill Switch</p>
              <p className={`text-sm font-medium ${settings.killSwitch ? 'text-red-400' : 'text-green-400'}`}>
                {settings.killSwitch ? 'ACTIVE — Trading Halted' : 'Inactive'}
              </p>
            </div>
            <Button
              size="sm"
              variant={settings.killSwitch ? 'default' : 'outline'}
              className={settings.killSwitch ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={handleKillSwitch}
            >
              {settings.killSwitch ? 'Disable' : 'Enable'}
            </Button>
          </CardContent>
        </Card>

        {/* Auto Mode */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Zap className={`h-5 w-5 ${modeInfo.color}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Mode</p>
              <p className={`text-sm font-medium ${modeInfo.color}`}>{modeInfo.label}</p>
            </div>
            <p className="text-xs text-muted-foreground max-w-[120px] text-right hidden sm:block">{modeInfo.desc}</p>
          </CardContent>
        </Card>
      </div>

      {/* MT5 Connection Panel */}
      {!connection?.isActive && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardHeader><CardTitle className="text-base">Connect MT5 Account</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Enter your MT5 account details. The Expert Advisor will authenticate using these credentials.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs">Account ID *</Label>
                  <Input placeholder="e.g. 12345678" value={connectForm.accountId} onChange={(e) => setConnectForm((p) => ({ ...p, accountId: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Broker</Label>
                  <Input placeholder="e.g. ICMarkets" value={connectForm.broker} onChange={(e) => setConnectForm((p) => ({ ...p, broker: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Server</Label>
                  <Input placeholder="e.g. ICMarkets-Live" value={connectForm.serverName} onChange={(e) => setConnectForm((p) => ({ ...p, serverName: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleConnect} disabled={!connectForm.accountId.trim()}>
                <Wifi className="h-4 w-4 mr-1" /> Connect
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {connection?.isActive && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wifi className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-sm font-medium">{connection.broker || 'MT5'} — {connection.accountId}</p>
                <p className="text-xs text-muted-foreground">{connection.serverName || 'Connected'}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              <WifiOff className="h-4 w-4 mr-1" /> Disconnect
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {(['signals', 'settings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'signals' ? 'Signals' : 'Risk Settings'}
          </button>
        ))}
      </div>

      {/* Signals Tab */}
      {tab === 'signals' && (
        <div className="space-y-4">
          {/* Active / Pending Signals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Active Signals
                {pendingSignals.length > 0 && (
                  <Badge className="bg-primary/20 text-primary">{pendingSignals.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingSignals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No pending signals. Run an analysis to generate trade signals.</p>
              ) : (
                <div className="space-y-3">
                  {pendingSignals.map((signal) => (
                    <SignalCard key={signal.id} signal={signal} onApprove={handleApprove} onCancel={handleCancel} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Signal History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historicalSignals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No signal history yet.</p>
              ) : (
                <div className="space-y-2">
                  {historicalSignals.slice(0, 20).map((signal) => (
                    <div key={signal.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        {signal.direction === 'buy' ? (
                          <TrendingUp className="h-4 w-4 text-green-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        )}
                        <div>
                          <span className="text-sm font-medium">{signal.symbol}</span>
                          <span className="text-xs text-muted-foreground ml-2">{signal.direction.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={CONFIDENCE_COLORS[signal.confidence] || ''} variant="outline">
                          {signal.confidence}
                        </Badge>
                        <Badge className={STATUS_BADGES[signal.status]?.className || ''}>
                          {STATUS_BADGES[signal.status]?.label || signal.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Risk Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto Mode */}
            <div>
              <Label className="text-sm font-medium">Execution Mode</Label>
              <div className="grid gap-2 mt-2 sm:grid-cols-3">
                {(Object.entries(MODE_LABELS) as [AutoMode, typeof MODE_LABELS['manual']][]).map(([mode, info]) => (
                  <button
                    key={mode}
                    onClick={() => updateSettingsField('autoMode', mode)}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      settingsForm.autoMode === mode
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <p className={`text-sm font-medium ${info.color}`}>{info.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{info.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Parameters */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Risk Per Trade (%)</Label>
                <Input
                  type="number"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={settingsForm.riskPerTrade}
                  onChange={(e) => updateSettingsField('riskPerTrade', Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-xs">Max Daily Loss (%)</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  step={0.5}
                  value={settingsForm.maxDailyLoss}
                  onChange={(e) => updateSettingsField('maxDailyLoss', Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-xs">Max Trades / Day</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={settingsForm.maxTradesPerDay}
                  onChange={(e) => updateSettingsField('maxTradesPerDay', Number(e.target.value))}
                />
              </div>
            </div>

            {/* Kill Switch Info */}
            <div className={`p-3 rounded-xl border ${settings.killSwitch ? 'border-red-500/30 bg-red-500/10' : 'border-white/10'}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${settings.killSwitch ? 'text-red-400' : 'text-muted-foreground'}`} />
                <p className="text-sm font-medium">Kill Switch</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                When active, the kill switch immediately halts all automated trading. No new signals will be sent to your EA.
              </p>
              <Button size="sm" variant={settings.killSwitch ? 'destructive' : 'outline'} className="mt-2" onClick={handleKillSwitch}>
                {settings.killSwitch ? 'Disable Kill Switch' : 'Enable Kill Switch'}
              </Button>
            </div>

            {settingsDirty && (
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>Save Settings</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Signal Card Component ──

function SignalCard({
  signal,
  onApprove,
  onCancel,
}: {
  signal: TradeSignal;
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const isBuy = signal.direction === 'buy';
  const rr = signal.stopLoss !== 0
    ? Math.abs(signal.takeProfit - signal.entryPrice) / Math.abs(signal.entryPrice - signal.stopLoss)
    : 0;

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {isBuy ? (
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-400" />
            </div>
          )}
          <div>
            <p className="font-semibold">{signal.symbol}</p>
            <p className={`text-xs font-medium ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
              {signal.direction.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={CONFIDENCE_COLORS[signal.confidence] || ''} variant="outline">
            {signal.confidence}
          </Badge>
          <Badge className={STATUS_BADGES[signal.status]?.className || ''}>
            {STATUS_BADGES[signal.status]?.label || signal.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mt-3 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Entry</p>
          <p className="text-sm font-mono">{signal.entryPrice.toFixed(5)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">SL</p>
          <p className="text-sm font-mono text-red-400">{signal.stopLoss.toFixed(5)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">TP</p>
          <p className="text-sm font-mono text-green-400">{signal.takeProfit.toFixed(5)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">R:R</p>
          <p className="text-sm font-mono">{rr > 0 ? `1:${rr.toFixed(1)}` : '—'}</p>
        </div>
      </div>

      {(signal.status === 'pending' || signal.status === 'ready') && (
        <div className="flex gap-2 mt-3 justify-end">
          {signal.status === 'pending' && (
            <Button size="sm" onClick={() => onApprove(signal.id)}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onCancel(signal.id)}>
            <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
