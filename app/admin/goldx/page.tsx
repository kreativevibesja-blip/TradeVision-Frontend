'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type {
  GoldxAdminDashboard,
  GoldxAdminLicense,
  GoldxAdminSubscription,
  GoldxAuditLog,
  GoldxTradeHistoryEntry,
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Key,
  Users,
  Activity,
  Shield,
  TrendingUp,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Ban,
  CalendarPlus,
  Eye,
  Settings,
} from 'lucide-react';

type Tab = 'overview' | 'licenses' | 'subscriptions' | 'audit' | 'trades' | 'settings';

export default function AdminGoldxPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [dashboard, setDashboard] = useState<GoldxAdminDashboard | null>(null);
  const [licenses, setLicenses] = useState<GoldxAdminLicense[]>([]);
  const [subscriptions, setSubscriptions] = useState<GoldxAdminSubscription[]>([]);
  const [auditLogs, setAuditLogs] = useState<GoldxAuditLog[]>([]);
  const [trades, setTrades] = useState<GoldxTradeHistoryEntry[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [extendDays, setExtendDays] = useState<Record<string, number>>({});
  const [editSettingKey, setEditSettingKey] = useState<string | null>(null);
  const [editSettingValue, setEditSettingValue] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [d, l, s, a, t, st] = await Promise.all([
        api.goldx.admin.getDashboard(token),
        api.goldx.admin.getLicenses(token),
        api.goldx.admin.getSubscriptions(token),
        api.goldx.admin.getAuditLogs(token),
        api.goldx.admin.getTradeHistory(token),
        api.goldx.admin.getSettings(token),
      ]);
      setDashboard(d);
      setLicenses(l);
      setSubscriptions(s);
      setAuditLogs(a);
      setTrades(t);
      setSettings(st);
    } catch (err) {
      console.error('Failed to load GoldX admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = async (licenseId: string) => {
    if (!token) return;
    if (!confirm('Revoke this license? The user will lose EA access immediately.')) return;
    try {
      await api.goldx.admin.revokeLicense(licenseId, token);
      load();
    } catch (err) {
      console.error('Failed to revoke license:', err);
    }
  };

  const handleExtend = async (licenseId: string) => {
    if (!token) return;
    const days = extendDays[licenseId] || 30;
    try {
      await api.goldx.admin.extendLicense(licenseId, days, token);
      load();
    } catch (err) {
      console.error('Failed to extend license:', err);
    }
  };

  const handleUpdateSettings = async () => {
    if (!token || !editSettingKey) return;
    try {
      const parsed = JSON.parse(editSettingValue);
      await api.goldx.admin.updateSettings(editSettingKey, parsed, token);
      setEditSettingKey(null);
      load();
    } catch (err) {
      alert('Invalid JSON');
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'licenses', label: 'Licenses', icon: <Key className="h-4 w-4" /> },
    { key: 'subscriptions', label: 'Subscriptions', icon: <Users className="h-4 w-4" /> },
    { key: 'audit', label: 'Audit Logs', icon: <Eye className="h-4 w-4" /> },
    { key: 'trades', label: 'Trades', icon: <Activity className="h-4 w-4" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center py-20">
        <RotateCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">GoldX Admin</h1>
          <p className="text-sm text-muted-foreground">Manage licenses, subscriptions, and strategy settings</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RotateCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tab Bar */}
      <div className="mb-4 sm:hidden">
        <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Section
        </label>
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value as Tab)}
          className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-foreground outline-none transition-colors focus:border-primary/40"
        >
          {tabs.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 hidden gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1 sm:flex">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && dashboard && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Licenses', value: dashboard.totalLicenses, icon: Key, color: 'from-amber-500/20 to-amber-600/5' },
            { label: 'Active Licenses', value: dashboard.activeLicenses, icon: Shield, color: 'from-emerald-500/20 to-emerald-600/5' },
            { label: 'Total Subscriptions', value: dashboard.totalSubscriptions, icon: Users, color: 'from-blue-500/20 to-blue-600/5' },
            { label: 'Active Subscriptions', value: dashboard.activeSubscriptions, icon: Activity, color: 'from-purple-500/20 to-purple-600/5' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`rounded-lg bg-gradient-to-br ${stat.color} p-3`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Licenses */}
      {tab === 'licenses' && (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background/95 backdrop-blur">
                  <tr className="border-b border-white/10">
                    <th className="p-4 text-left font-medium text-muted-foreground">User</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">MT5</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Expires</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Last Check</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((lic) => (
                    <tr key={lic.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 font-mono text-xs">{lic.userId.slice(0, 8)}...</td>
                      <td className="p-4">{lic.mt5Account ?? '—'}</td>
                      <td className="p-4">
                        <Badge variant={lic.status === 'active' ? 'default' : 'destructive'}>
                          {lic.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(lic.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {lic.lastCheckedAt ? new Date(lic.lastCheckedAt).toLocaleString() : '—'}
                      </td>
                      <td className="flex items-center gap-2 p-4">
                        {lic.status === 'active' && (
                          <Button variant="destructive" size="sm" onClick={() => handleRevoke(lic.id)}>
                            <Ban className="mr-1 h-3 w-3" /> Revoke
                          </Button>
                        )}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={extendDays[lic.id] ?? 30}
                            onChange={(e) => setExtendDays({ ...extendDays, [lic.id]: parseInt(e.target.value) || 30 })}
                            className="h-8 w-16 rounded border border-input bg-background px-2 text-xs"
                          />
                          <Button variant="outline" size="sm" onClick={() => handleExtend(lic.id)}>
                            <CalendarPlus className="mr-1 h-3 w-3" /> Extend
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {licenses.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No licenses yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscriptions */}
      {tab === 'subscriptions' && (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background/95 backdrop-blur">
                  <tr className="border-b border-white/10">
                    <th className="p-4 text-left font-medium text-muted-foreground">User</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Period End</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 font-mono text-xs">{sub.userId.slice(0, 8)}...</td>
                      <td className="p-4">
                        <Badge variant={sub.status === 'active' ? 'default' : sub.status === 'cancelled' ? 'destructive' : 'secondary'}>
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {subscriptions.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No subscriptions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Logs */}
      {tab === 'audit' && (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background/95 backdrop-blur">
                  <tr className="border-b border-white/10">
                    <th className="p-4 text-left font-medium text-muted-foreground">Event</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">License</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">IP</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Time</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <Badge variant={log.event.includes('reject') || log.event.includes('revoke') ? 'destructive' : 'secondary'}>
                          {log.event}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-xs">{log.licenseId?.slice(0, 8) ?? '—'}</td>
                      <td className="p-4 text-xs text-muted-foreground">{log.ipAddress ?? '—'}</td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="max-w-[200px] truncate p-4 font-mono text-xs text-muted-foreground">
                        {JSON.stringify(log.meta)}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No audit logs yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trades */}
      {tab === 'trades' && (
        <Card>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background/95 backdrop-blur">
                  <tr className="border-b border-white/10">
                    <th className="p-4 text-left font-medium text-muted-foreground">Symbol</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Direction</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Mode</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Entry</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">SL</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">TP</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Lots</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Outcome</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">P/L</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 font-medium">{t.symbol}</td>
                      <td className="p-4">
                        <Badge variant={t.direction === 'buy' ? 'default' : 'destructive'}>
                          {t.direction.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs">{t.mode}</td>
                      <td className="p-4 text-xs">{t.entryPrice?.toFixed(2) ?? '—'}</td>
                      <td className="p-4 text-xs text-red-400">{t.slPrice?.toFixed(2) ?? '—'}</td>
                      <td className="p-4 text-xs text-green-400">{t.tpPrice?.toFixed(2) ?? '—'}</td>
                      <td className="p-4 text-xs">{t.lotSize ?? '—'}</td>
                      <td className="p-4">
                        {t.outcome ? (
                          <Badge variant={t.outcome === 'tp' ? 'default' : t.outcome === 'be' ? 'secondary' : 'destructive'}>
                            {t.outcome.toUpperCase()}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Open</span>
                        )}
                      </td>
                      <td className={`p-4 text-xs font-medium ${(t.profit ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {t.profit != null ? `$${t.profit.toFixed(2)}` : '—'}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(t.openedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {trades.length === 0 && (
                    <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No trades yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      {tab === 'settings' && settings && (
        <div className="space-y-4">
          {Object.entries(settings).map(([key, value]) => (
            <Card key={key}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    {key}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditSettingKey(key);
                      setEditSettingValue(JSON.stringify(value, null, 2));
                    }}
                  >
                    <Settings className="mr-1 h-3 w-3" /> Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="max-h-40 overflow-auto rounded-lg border border-white/10 bg-white/5 p-4 font-mono text-xs">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}

          {/* Edit Modal */}
          {editSettingKey && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
                <h3 className="mb-4 text-lg font-bold">Edit: {editSettingKey}</h3>
                <textarea
                  value={editSettingValue}
                  onChange={(e) => setEditSettingValue(e.target.value)}
                  className="mb-4 h-64 w-full rounded-lg border border-input bg-background p-4 font-mono text-xs"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditSettingKey(null)}>Cancel</Button>
                  <Button onClick={handleUpdateSettings}>Save</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
