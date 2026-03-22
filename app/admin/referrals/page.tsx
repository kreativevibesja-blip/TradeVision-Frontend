'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  api,
  type AdminReferralDashboard,
  type AdminReferral,
  type AdminCommission,
  type AdminPayout,
  type ReferralSettings,
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Gift,
  Users,
  DollarSign,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Save,
  Power,
  Wallet,
  TrendingUp,
} from 'lucide-react';

type Tab = 'overview' | 'referrals' | 'commissions' | 'payouts' | 'settings';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  qualified: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  approved: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  paid: 'bg-green-500/20 text-green-300 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
  processing: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export default function AdminReferralsPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [dashboardData, setDashboardData] = useState<AdminReferralDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  // Referrals tab
  const [referrals, setReferrals] = useState<AdminReferral[]>([]);
  const [referralPage, setReferralPage] = useState(1);
  const [referralPages, setReferralPages] = useState(1);
  const [referralTotal, setReferralTotal] = useState(0);

  // Commissions tab
  const [commissions, setCommissions] = useState<AdminCommission[]>([]);
  const [commissionPage, setCommissionPage] = useState(1);
  const [commissionPages, setCommissionPages] = useState(1);
  const [commissionTotal, setCommissionTotal] = useState(0);
  const [commissionFilter, setCommissionFilter] = useState('');

  // Payouts tab
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutPages, setPayoutPages] = useState(1);
  const [payoutTotal, setPayoutTotal] = useState(0);
  const [payoutFilter, setPayoutFilter] = useState('');

  // Settings
  const [settings, setSettings] = useState<ReferralSettings>({
    discountPercent: 20,
    commissionPercent: 25,
    minPayout: 10,
    enabled: true,
    commissionDelayDays: 7,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const result = await api.admin.getReferralDashboard(token);
      setDashboardData(result);
      setSettings(result.settings);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [token]);

  const loadReferrals = useCallback(async () => {
    if (!token) return;
    try {
      const result = await api.admin.getReferrals(token, referralPage);
      setReferrals(result.referrals);
      setReferralPages(result.pages);
      setReferralTotal(result.total);
    } catch { /* silent */ }
  }, [token, referralPage]);

  const loadCommissions = useCallback(async () => {
    if (!token) return;
    try {
      const result = await api.admin.getCommissions(token, commissionPage, commissionFilter || undefined);
      setCommissions(result.commissions);
      setCommissionPages(result.pages);
      setCommissionTotal(result.total);
    } catch { /* silent */ }
  }, [token, commissionPage, commissionFilter]);

  const loadPayouts = useCallback(async () => {
    if (!token) return;
    try {
      const result = await api.admin.getPayouts(token, payoutPage, payoutFilter || undefined);
      setPayouts(result.payouts);
      setPayoutPages(result.pages);
      setPayoutTotal(result.total);
    } catch { /* silent */ }
  }, [token, payoutPage, payoutFilter]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { if (tab === 'referrals') loadReferrals(); }, [tab, loadReferrals]);
  useEffect(() => { if (tab === 'commissions') loadCommissions(); }, [tab, loadCommissions]);
  useEffect(() => { if (tab === 'payouts') loadPayouts(); }, [tab, loadPayouts]);

  const handleCommissionAction = async (id: string, status: string) => {
    if (!token) return;
    setActionLoading(id);
    try {
      await api.admin.updateCommission(id, status, token);
      await loadCommissions();
      await loadDashboard();
    } catch { /* silent */ } finally {
      setActionLoading(null);
    }
  };

  const handlePayoutAction = async (id: string, status: string) => {
    if (!token) return;
    setActionLoading(id);
    try {
      await api.admin.updatePayout(id, status, token);
      await loadPayouts();
      await loadDashboard();
    } catch { /* silent */ } finally {
      setActionLoading(null);
    }
  };

  const handleSaveSettings = async (nextSettings?: ReferralSettings) => {
    if (!token) return;
    setSettingsLoading(true);
    setSettingsMessage('');
    try {
      const payload = nextSettings ?? settings;
      await api.admin.updateReferralSettings(payload, token);
      setSettings(payload);
      await loadDashboard();
      setSettingsMessage('Settings saved successfully');
      setTimeout(() => setSettingsMessage(''), 3000);
    } catch (err: any) {
      setSettingsMessage(err.message || 'Failed to save settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tabs: Array<{ key: Tab; label: string; icon: typeof Gift }> = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'referrals', label: 'Referrals', icon: Users },
    { key: 'commissions', label: 'Commissions', icon: DollarSign },
    { key: 'payouts', label: 'Payouts', icon: Wallet },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl flex items-center gap-2">
          <Gift className="h-7 w-7 text-primary" />
          Referral Management
        </h1>
        <p className="text-muted-foreground mt-1">Manage referrals, commissions, payouts, and settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && dashboardData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Card className="mobile-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-muted-foreground">Total Referrals</span>
                </div>
                <p className="text-2xl font-bold">{dashboardData.stats.totalReferrals}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <p className="text-2xl font-bold">{dashboardData.stats.pendingReferrals}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-red-400" />
                  <span className="text-xs text-muted-foreground">Owed</span>
                </div>
                <p className="text-2xl font-bold">${dashboardData.stats.commissionsOwed.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="mobile-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">Paid Out</span>
                </div>
                <p className="text-2xl font-bold">${dashboardData.stats.commissionsPaid.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mobile-card">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-sm">
                <div>
                  <span className="text-muted-foreground">System</span>
                  <div className="mt-1">
                    <Badge variant="outline" className={dashboardData.settings.enabled ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}>
                      {dashboardData.settings.enabled ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Discount</span>
                  <p className="font-medium mt-1">{dashboardData.settings.discountPercent}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Commission</span>
                  <p className="font-medium mt-1">{dashboardData.settings.commissionPercent}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Min Payout</span>
                  <p className="font-medium mt-1">${dashboardData.settings.minPayout}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Delay</span>
                  <p className="font-medium mt-1">{dashboardData.settings.commissionDelayDays} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Referrals Tab */}
      {tab === 'referrals' && (
        <Card className="mobile-card">
          <CardHeader>
            <CardTitle className="text-lg">All Referrals ({referralTotal})</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No referrals yet</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Referrer</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Referred User</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Code</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Plan</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((r) => (
                        <tr key={r.id} className="border-b border-white/5">
                          <td className="py-3 px-2">
                            <div className="max-w-[160px] truncate">{r.referrer?.email || 'Unknown'}</div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="max-w-[160px] truncate">{r.referredUser?.email || 'Unknown'}</div>
                          </td>
                          <td className="py-3 px-2 font-mono text-xs">{r.referralCode}</td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className={statusColors[r.status] || ''}>{r.status}</Badge>
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant="outline">{r.referredUser?.subscription || '-'}</Badge>
                          </td>
                          <td className="py-3 px-2 text-right text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {referralPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" disabled={referralPage <= 1} onClick={() => setReferralPage(referralPage - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">{referralPage} / {referralPages}</span>
                    <Button variant="outline" size="sm" disabled={referralPage >= referralPages} onClick={() => setReferralPage(referralPage + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Commissions Tab */}
      {tab === 'commissions' && (
        <Card className="mobile-card">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">Commissions ({commissionTotal})</CardTitle>
              <select
                value={commissionFilter}
                onChange={(e) => { setCommissionFilter(e.target.value); setCommissionPage(1); }}
                className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {commissions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No commissions found</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Referrer</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Referred</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">Amount</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((c) => (
                        <tr key={c.id} className="border-b border-white/5">
                          <td className="py-3 px-2">
                            <div className="max-w-[140px] truncate">{c.referrer?.email || 'Unknown'}</div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="max-w-[140px] truncate">{c.referredUser?.email || 'Unknown'}</div>
                          </td>
                          <td className="py-3 px-2 text-right font-medium">${Number(c.amount).toFixed(2)}</td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className={statusColors[c.status] || ''}>{c.status}</Badge>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex gap-1 justify-end">
                              {c.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={actionLoading === c.id}
                                    onClick={() => handleCommissionAction(c.id, 'approved')}
                                    className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                                  >
                                    {actionLoading === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={actionLoading === c.id}
                                    onClick={() => handleCommissionAction(c.id, 'rejected')}
                                    className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {c.status === 'approved' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actionLoading === c.id}
                                  onClick={() => handleCommissionAction(c.id, 'paid')}
                                  className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                                >
                                  {actionLoading === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mark Paid'}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {commissionPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" disabled={commissionPage <= 1} onClick={() => setCommissionPage(commissionPage - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">{commissionPage} / {commissionPages}</span>
                    <Button variant="outline" size="sm" disabled={commissionPage >= commissionPages} onClick={() => setCommissionPage(commissionPage + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payouts Tab */}
      {tab === 'payouts' && (
        <Card className="mobile-card">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg">Payout Requests ({payoutTotal})</CardTitle>
              <select
                value={payoutFilter}
                onChange={(e) => { setPayoutFilter(e.target.value); setPayoutPage(1); }}
                className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No payout requests</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">User</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">PayPal</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">Amount</th>
                        <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">Date</th>
                        <th className="text-right py-3 px-2 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p) => (
                        <tr key={p.id} className="border-b border-white/5">
                          <td className="py-3 px-2">
                            <div className="max-w-[140px] truncate">{p.user?.email || 'Unknown'}</div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="max-w-[160px] truncate text-muted-foreground">{p.paypalEmail}</div>
                          </td>
                          <td className="py-3 px-2 text-right font-medium">${Number(p.amount).toFixed(2)}</td>
                          <td className="py-3 px-2">
                            <Badge variant="outline" className={statusColors[p.status] || ''}>{p.status}</Badge>
                          </td>
                          <td className="py-3 px-2 text-right text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex gap-1 justify-end">
                              {(p.status === 'pending' || p.status === 'processing') && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={actionLoading === p.id}
                                    onClick={() => handlePayoutAction(p.id, p.status === 'pending' ? 'processing' : 'paid')}
                                    className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                                  >
                                    {actionLoading === p.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : p.status === 'pending' ? (
                                      'Process'
                                    ) : (
                                      'Mark Paid'
                                    )}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={actionLoading === p.id}
                                    onClick={() => handlePayoutAction(p.id, 'rejected')}
                                    className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {payoutPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" disabled={payoutPage <= 1} onClick={() => setPayoutPage(payoutPage - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">{payoutPage} / {payoutPages}</span>
                    <Button variant="outline" size="sm" disabled={payoutPage >= payoutPages} onClick={() => setPayoutPage(payoutPage + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <Card className="mobile-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary" />
              Referral Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
              <div>
                <h4 className="font-medium">Referral System</h4>
                <p className="text-sm text-muted-foreground">Enable or disable the entire referral program</p>
              </div>
              <Button
                variant={settings.enabled ? 'default' : 'outline'}
                disabled={settingsLoading}
                onClick={() => {
                  const nextSettings = { ...settings, enabled: !settings.enabled };
                  setSettings(nextSettings);
                  void handleSaveSettings(nextSettings);
                }}
              >
                <Power className="h-4 w-4 mr-2" />
                {settings.enabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount for Referred Users (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={settings.discountPercent}
                  onChange={(e) => setSettings({ ...settings, discountPercent: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">How much discount the new user gets</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Commission for Referrer (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={settings.commissionPercent}
                  onChange={(e) => setSettings({ ...settings, commissionPercent: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">How much the referrer earns per conversion</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Payout ($)</label>
                <Input
                  type="number"
                  min={1}
                  value={settings.minPayout}
                  onChange={(e) => setSettings({ ...settings, minPayout: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Commission Delay (days)</label>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={settings.commissionDelayDays}
                  onChange={(e) => setSettings({ ...settings, commissionDelayDays: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Days to wait before commission can be approved</p>
              </div>
            </div>

            {settings.discountPercent + settings.commissionPercent > 40 && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
                Warning: Discount + Commission exceeds 40%. This may not be profit-safe.
              </div>
            )}

            <div className="rounded-xl bg-white/5 p-4">
              <h4 className="text-sm font-medium mb-2">Profit Calculator</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Plan price: $19.00</p>
                <p>After {settings.discountPercent}% discount: ${(19 * (1 - settings.discountPercent / 100)).toFixed(2)}</p>
                <p>Commission ({settings.commissionPercent}% of paid): ${(19 * (1 - settings.discountPercent / 100) * settings.commissionPercent / 100).toFixed(2)}</p>
                <p className="font-medium text-foreground pt-1 border-t border-white/10">
                  Your revenue: ${(19 * (1 - settings.discountPercent / 100) - 19 * (1 - settings.discountPercent / 100) * settings.commissionPercent / 100).toFixed(2)}
                </p>
              </div>
            </div>

            {settingsMessage && (
              <div className={`rounded-xl p-3 text-sm ${settingsMessage.includes('success') ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
                {settingsMessage}
              </div>
            )}

            <Button onClick={() => void handleSaveSettings()} disabled={settingsLoading}>
              {settingsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Settings
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
