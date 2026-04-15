'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
  api,
  type AutoPerformance,
  type AutoTrade,
  type AutoTradeLog,
  type AutoTradeSettings,
} from '@/lib/api';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Bot,
  ChevronLeft,
  Loader2,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  User,
  XCircle,
} from 'lucide-react';

interface AutoTradingUser {
  userId: string;
  email: string;
  name: string | null;
  autoMode: string;
  isActive: boolean;
  connected: boolean;
  performance: AutoPerformance | null;
}

interface SystemOverview {
  totalTradesToday: number;
  totalProfitToday: number;
  recentLogs: AutoTradeLog[];
}

export default function AdminAutoTraderPage() {
  const { token, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AutoTradingUser[]>([]);
  const [system, setSystem] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<{
    settings: AutoTradeSettings | null;
    performance: AutoPerformance | null;
    trades: AutoTrade[];
    logs: AutoTradeLog[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadOverview = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.admin.autoTradingOverview(token);
      setUsers(res.users);
      setSystem(res.system);
    } catch (err) {
      console.error('Failed to load auto trading overview:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const loadUserDetail = async (userId: string) => {
    if (!token) return;
    setSelectedUserId(userId);
    setDetailLoading(true);
    try {
      const res = await api.admin.autoTradingUserDetail(userId, token);
      setUserDetail(res);
    } catch (err) {
      console.error('Failed to load user detail:', err);
    }
    setDetailLoading(false);
  };

  const handleDisableUser = async (userId: string) => {
    if (!token) return;
    await api.admin.autoTradingDisableUser(userId, token);
    await loadOverview();
    if (selectedUserId === userId) {
      setSelectedUserId(null);
      setUserDetail(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // ── User Detail View ──
  if (selectedUserId && userDetail) {
    const u = users.find((usr) => usr.userId === selectedUserId);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => { setSelectedUserId(null); setUserDetail(null); }}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <div>
            <h2 className="text-lg font-bold">{u?.email ?? selectedUserId}</h2>
            <p className="text-xs text-muted-foreground">{u?.name ?? 'User detail'}</p>
          </div>
        </div>

        {/* Settings */}
        <Card className="mobile-card">
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Settings</h3>
            {userDetail.settings ? (
              <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <div>Mode: <span className="font-semibold">{userDetail.settings.autoMode}</span></div>
                <div>Risk/Trade: <span className="font-semibold">{userDetail.settings.riskPerTrade}%</span></div>
                <div>Max Daily Loss: <span className="font-semibold">{userDetail.settings.maxDailyLoss}%</span></div>
                <div>Max Trades/Day: <span className="font-semibold">{userDetail.settings.maxTradesPerDay}</span></div>
                <div>Gold Only: <span className="font-semibold">{userDetail.settings.goldOnly ? 'Yes' : 'No'}</span></div>
                <div>Connected: <span className="font-semibold">{userDetail.settings.connected ? 'Yes' : 'No'}</span></div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No settings configured</p>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        {userDetail.performance && (
          <Card className="mobile-card">
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Performance</h3>
              <div className="grid grid-cols-3 gap-4 text-center sm:grid-cols-6">
                <div>
                  <p className="text-[10px] text-muted-foreground">Trades</p>
                  <p className="text-sm font-bold">{userDetail.performance.totalTrades}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Wins</p>
                  <p className="text-sm font-bold text-emerald-400">{userDetail.performance.wins}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Losses</p>
                  <p className="text-sm font-bold text-red-400">{userDetail.performance.losses}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Win Rate</p>
                  <p className="text-sm font-bold">{userDetail.performance.winRate}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Profit</p>
                  <p className={`text-sm font-bold ${userDetail.performance.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ${userDetail.performance.totalProfit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Drawdown</p>
                  <p className="text-sm font-bold text-red-400">${userDetail.performance.drawdown.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trade History */}
        <Card className="mobile-card">
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Trade History ({userDetail.trades.length})</h3>
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {userDetail.trades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                  <div className="flex items-center gap-2">
                    {trade.direction === 'buy' ? <ArrowUp className="h-3 w-3 text-emerald-400" /> : <ArrowDown className="h-3 w-3 text-red-400" />}
                    <span className="text-xs font-medium">{trade.symbol}</span>
                    <span className="text-[10px] text-muted-foreground">{trade.lotSize} lots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${
                      trade.result === 'win' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : trade.result === 'loss' ? 'border-red-500/30 bg-red-500/10 text-red-300'
                        : 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300'
                    }`}>
                      {trade.result ?? trade.status}
                    </Badge>
                    <span className={`text-xs font-bold ${(trade.profit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(trade.profit ?? 0) >= 0 ? '+' : ''}{(trade.profit ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card className="mobile-card">
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Logs ({userDetail.logs.length})</h3>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {userDetail.logs.slice(0, 50).map((log) => (
                <div key={log.id} className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2">
                  <div className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    log.action === 'executed' ? 'bg-emerald-400' : log.action === 'rejected' ? 'bg-red-400' : 'bg-cyan-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium">{log.action.replace(/_/g, ' ')}</p>
                    {log.reason && <p className="truncate text-[10px] text-muted-foreground">{log.reason}</p>}
                  </div>
                  <span className="shrink-0 text-[9px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Disable button */}
        <Button variant="destructive" size="sm" onClick={() => handleDisableUser(selectedUserId)}>
          <XCircle className="mr-1.5 h-3.5 w-3.5" /> Disable Auto Trading for This User
        </Button>
      </div>
    );
  }

  // ── Overview ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Auto Trading Admin</h1>
            <p className="text-xs text-muted-foreground">Monitor and control user auto trading</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={loadOverview}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* System Stats */}
      {system && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="mobile-card">
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground">Active Users</span>
              <p className="mt-1 text-2xl font-bold">{users.filter((u) => u.isActive).length}</p>
              <p className="text-[10px] text-muted-foreground">{users.length} total configured</p>
            </CardContent>
          </Card>
          <Card className="mobile-card">
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground">Trades Today</span>
              <p className="mt-1 text-2xl font-bold">{system.totalTradesToday}</p>
            </CardContent>
          </Card>
          <Card className="mobile-card">
            <CardContent className="p-4">
              <span className="text-xs text-muted-foreground">Total Profit Today</span>
              <p className={`mt-1 text-2xl font-bold ${system.totalProfitToday >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${system.totalProfitToday.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card className="mobile-card">
        <CardContent className="p-4">
          <h3 className="mb-3 text-sm font-semibold">Users ({users.length})</h3>
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.userId}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 cursor-pointer hover:border-white/10 transition-colors"
                onClick={() => loadUserDetail(u.userId)}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white/5 p-1.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{u.email}</p>
                    <p className="text-[10px] text-muted-foreground">{u.name ?? 'No name'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`text-[10px] ${
                    u.isActive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-zinc-600 bg-zinc-800/50 text-zinc-400'
                  }`}>
                    {u.autoMode}
                  </Badge>
                  {u.performance && (
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-medium">{u.performance.winRate}% WR</p>
                      <p className={`text-[10px] font-bold ${u.performance.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        ${u.performance.totalProfit.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); handleDisableUser(u.userId); }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No users have configured auto trading</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent System Logs */}
      {system && system.recentLogs.length > 0 && (
        <Card className="mobile-card">
          <CardContent className="p-4">
            <h3 className="mb-3 text-sm font-semibold">Recent System Logs</h3>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {system.recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2">
                  <div className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    log.action === 'executed' ? 'bg-emerald-400' : log.action === 'rejected' ? 'bg-red-400' : 'bg-cyan-400'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium">{log.action.replace(/_/g, ' ')}</p>
                    {log.reason && <p className="truncate text-[10px] text-muted-foreground">{log.reason}</p>}
                  </div>
                  <span className="shrink-0 text-[9px] text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
