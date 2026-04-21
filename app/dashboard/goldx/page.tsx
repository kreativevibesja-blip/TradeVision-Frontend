'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { GoldxPlan, GoldxUserStatus } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Key,
  Shield,
  Activity,
  Clock,
  TrendingUp,
  Zap,
  Target,
  RotateCw,
  Check,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

const MODE_DETAILS: Record<string, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  fast: {
    label: 'Fast Mode',
    description: 'Higher risk, more trades, looser filters — for funded/aggressive accounts.',
    icon: <Zap className="h-5 w-5" />,
    color: 'from-amber-500/20 to-amber-600/5',
  },
  prop: {
    label: 'Prop Mode',
    description: 'Conservative risk, strict filters — optimized for prop firm challenges.',
    icon: <Shield className="h-5 w-5" />,
    color: 'from-blue-500/20 to-blue-600/5',
  },
  hybrid: {
    label: 'Hybrid Mode',
    description: 'Balanced risk and filter settings — recommended for most traders.',
    icon: <Target className="h-5 w-5" />,
    color: 'from-emerald-500/20 to-emerald-600/5',
  },
};

export default function GoldxDashboardPage() {
  const { token } = useAuth();
  const [plan, setPlan] = useState<GoldxPlan | null>(null);
  const [status, setStatus] = useState<GoldxUserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingMode, setChangingMode] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        api.goldx.getPlan(),
        api.goldx.getMyStatus(token),
      ]);
      if (process.env.NEXT_PUBLIC_DEBUG_LICENSE === 'true') {
        console.log('DASHBOARD LICENSE:', s.license);
      }
      setPlan(p);
      setStatus(s);
    } catch (err) {
      console.error('Failed to load GoldX status:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleModeChange = async (mode: string) => {
    if (!token || changingMode) return;
    setChangingMode(true);
    try {
      await api.goldx.setMode(mode, token);
      load();
    } catch (err) {
      console.error('Failed to set mode:', err);
    } finally {
      setChangingMode(false);
    }
  };

  const handleCancel = async () => {
    if (!token || cancelling) return;
    setCancelling(true);
    try {
      await api.goldx.cancelSubscription(token);
      setCancelConfirm(false);
      load();
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RotateCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const now = Date.now();
  const subscription = status?.subscription ?? null;
  const license = status?.license ?? null;
  const accountState = status?.accountState ?? null;
  const latestGrant = status?.latestGrant ?? null;
  const hasLicenseAccess = Boolean(
    license
      && license.status === 'active'
      && new Date(license.expiresAt).getTime() > now,
  );
  const canCancelSubscription = subscription?.status === 'active';
  const accessEndsAt = subscription?.currentPeriodEnd ?? license?.expiresAt ?? null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">GoldX</h1>
          <p className="text-muted-foreground">XAUUSD Night Scalping Expert Advisor</p>
        </div>
        {hasLicenseAccess ? (
          <Badge variant="default" className="w-fit bg-amber-500/20 text-amber-300">
            <Shield className="mr-1 h-3 w-3" /> {subscription?.status === 'cancelled' ? 'Access Active Until Expiry' : 'Active'}
          </Badge>
        ) : null}
      </div>

      {/* Not Subscribed */}
      {!hasLicenseAccess && plan && (
        <Card className="bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_30%)]">
          <CardContent className="p-8">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-amber-200">
                  <TrendingUp className="h-3.5 w-3.5" />
                  GoldX EA Access
                </div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/10 p-3">
                    <TrendingUp className="h-8 w-8 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{plan.name}</h2>
                    <p className="text-muted-foreground">${plan.price}/{plan.billingCycle}</p>
                  </div>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  GoldX gives you a dedicated XAUUSD night-scalping expert advisor with a managed license workflow, MT5 account binding, and mode controls designed for different account styles.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4 rounded-[28px] border border-white/10 bg-black/20 p-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">How Access Works</p>
                  <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="font-medium text-white">Subscribe</p>
                      <p className="mt-1">Choose the GoldX plan from pricing and complete checkout.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="font-medium text-white">Activate</p>
                      <p className="mt-1">Return here to view your license, connect your MT5 account, and confirm entitlement.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="font-medium text-white">Operate</p>
                      <p className="mt-1">Manage execution mode and account status from your GoldX workspace.</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Link href="/pricing#goldx" className="w-full">
                    <Button size="lg" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                      Review GoldX Plans
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/" className="w-full">
                    <Button variant="outline" size="lg" className="w-full">
                      View Product Overview
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscribed */}
      {hasLicenseAccess && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left — Status */}
          <div className="space-y-6">
            {latestGrant && (
              <Card className="border-emerald-500/20 bg-emerald-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-emerald-100">
                    <Key className="h-4 w-4" /> New GoldX License Issued
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-emerald-50">
                  <div className="rounded-xl border border-emerald-400/20 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">License Key</p>
                    <p className="mt-2 break-all font-mono text-base text-white">{latestGrant.licenseKey}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-400/20 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Started</p>
                      <p className="mt-2 font-medium text-white">{new Date(latestGrant.issuedAt).toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-400/20 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Expires</p>
                      <p className="mt-2 font-medium text-white">{new Date(latestGrant.expiresAt).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {subscription?.status === 'cancelled' && accessEndsAt && (
              <Card className="border-amber-500/20 bg-amber-500/10">
                <CardContent className="p-4 text-sm text-amber-100">
                  Your GoldX subscription has been cancelled, but your license remains active until {new Date(accessEndsAt).toLocaleDateString()}. After that date, access will expire automatically.
                </CardContent>
              </Card>
            )}
            {/* Subscription Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                  <Key className="h-4 w-4" /> Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="default" className={`mt-1 ${subscription?.status === 'cancelled' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {subscription?.status ?? 'active'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Started</p>
                    <p className="mt-1 text-sm font-medium">
                      {subscription?.currentPeriodStart
                        ? new Date(subscription.currentPeriodStart).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{subscription?.status === 'cancelled' ? 'Access Until' : 'Renews'}</p>
                    <p className="mt-1 text-sm font-medium">
                      {subscription?.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* License */}
                {license && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">License</p>
                      <Badge variant={license.status === 'active' ? 'default' : 'destructive'}>
                        {license.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">MT5 Account</p>
                        <p className="font-mono text-sm">{license.mt5Account ?? 'Not yet bound'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Issued</p>
                        <p className="text-sm">{new Date(license.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Expires</p>
                        <p className="text-sm">{new Date(license.expiresAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                )}

                {canCancelSubscription ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => setCancelConfirm(true)}
                  >
                    Cancel Subscription
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            {/* Trading Stats */}
            {accountState && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
                    <Activity className="h-4 w-4" /> Today&apos;s Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: 'Trades', value: accountState.tradesToday, color: 'text-blue-400' },
                      { label: 'Profit', value: `${accountState.profitToday.toFixed(2)}%`, color: 'text-emerald-400' },
                      { label: 'Drawdown', value: `${accountState.drawdownToday.toFixed(2)}%`, color: 'text-red-400' },
                      {
                        label: 'Last Trade',
                        value: accountState.lastTradeAt
                          ? new Date(accountState.lastTradeAt).toLocaleTimeString()
                          : '—',
                        color: 'text-muted-foreground',
                      },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className={`mt-1 text-lg font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right — Mode Selector */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              <Zap className="h-4 w-4" /> Trading Mode
            </h3>
            {Object.entries(MODE_DETAILS).map(([key, mode]) => {
              const isActive = accountState?.mode === key;
              return (
                <button
                  key={key}
                  disabled={changingMode}
                  onClick={() => handleModeChange(key)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    isActive
                      ? 'border-primary/30 bg-primary/10 ring-1 ring-primary/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg bg-gradient-to-br ${mode.color} p-2`}>
                      {mode.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{mode.label}</p>
                        {isActive && (
                          <Badge variant="default" className="bg-primary/20 text-primary text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{mode.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancel Confirm Modal */}
      {cancelConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-[24px] border border-white/10 bg-background p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h3 className="text-lg font-bold">Cancel GoldX?</h3>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Your EA license will be revoked and the expert advisor will stop trading.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCancelConfirm(false)}>Keep Subscription</Button>
              <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
