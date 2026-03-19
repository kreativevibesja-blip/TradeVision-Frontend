'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { api, type BillingSummary } from '@/lib/api';
import { AlertTriangle, CalendarClock, CheckCircle2, CreditCard, Crown, Loader2, RefreshCcw, ShieldAlert, X, Zap } from 'lucide-react';

const statusTone = {
  free: {
    label: 'Free Plan',
    icon: Zap,
    className: 'secondary' as const,
    text: 'You are currently on the free plan.',
  },
  active: {
    label: 'Pro Active',
    icon: Crown,
    className: 'default' as const,
    text: 'Your Pro plan is active.',
  },
  expired: {
    label: 'Pro Expired',
    icon: ShieldAlert,
    className: 'warning' as const,
    text: 'Your Pro access has expired and can be renewed.',
  },
  cancelled: {
    label: 'Pro Cancelled',
    icon: X,
    className: 'secondary' as const,
    text: 'Your Pro plan was cancelled and can be reactivated.',
  },
};

export default function BillingPage() {
  const { user, token, loading: authLoading, refreshUser } = useAuth();
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const loadBilling = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      const data = await api.getBillingSummary(token);
      setBilling(data.billing);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      void loadBilling();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [token, authLoading]);

  const handleCancel = async () => {
    if (!token) {
      return;
    }

    try {
      setCancelling(true);
      setError('');
      const data = await api.cancelSubscription(token);
      setBilling(data.billing);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const tone = useMemo(() => statusTone[billing?.status || 'free'], [billing?.status]);
  const ToneIcon = tone.icon;

  if (authLoading || loading) {
    return (
      <div className="page-stack min-h-screen">
        <div className="page-shell max-w-4xl">
          <Card className="mobile-card">
            <CardContent className="p-8 text-center text-muted-foreground">Loading billing details...</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-stack min-h-screen">
        <div className="page-shell max-w-4xl">
          <Card className="mobile-card">
            <CardContent className="p-8 text-center text-muted-foreground">Please sign in to manage billing.</CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Billing</h1>
              <p className="text-muted-foreground">See your current plan, expiry date, and subscription actions.</p>
            </div>
            <div />
          </div>

          {error && (
            <Card className="mb-6 border-red-500/20 bg-red-500/5">
              <CardContent className="flex items-center gap-3 p-4 text-sm text-red-200">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="mobile-card overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Plan Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={tone.className} className="px-3 py-1 text-sm">
                    <ToneIcon className="mr-1 h-4 w-4" />
                    {tone.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{tone.text}</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-muted-foreground mb-2">Current Plan</p>
                    <p className="text-2xl font-semibold">{billing?.currentPlan || user.subscription}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-muted-foreground mb-2">Plan Expiry</p>
                    <p className="text-lg font-semibold">
                      {billing?.expiresAt ? new Date(billing.expiresAt).toLocaleString() : 'No active billing period'}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <CalendarClock className="h-4 w-4 text-cyan-300" />
                    Billing Cycle
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pro access currently runs on a 30-day billing window from the date of your latest successful Pro payment.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {billing?.canCancel && (
                    <Button variant="destructive" onClick={() => setConfirmCancelOpen(true)} disabled={cancelling}>
                      Cancel Pro Plan
                    </Button>
                  )}
                  {(billing?.canRenew || billing?.status === 'free') && (
                    <Link href="/checkout?plan=PRO">
                      <Button variant="gradient">
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {billing?.status === 'expired' || billing?.status === 'cancelled' ? 'Renew Pro' : 'Upgrade to Pro'}
                      </Button>
                    </Link>
                  )}
                </div>

                {billing?.canCancel && (
                  <p className="text-xs text-muted-foreground">
                    Canceling here downgrades the account to Free immediately and stores the cancellation state in billing.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  Recent Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!billing || billing.recentPayments.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No payment records yet.</div>
                ) : (
                  <div className="space-y-3">
                    {billing.recentPayments.map((payment) => (
                      <div key={payment.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <Badge variant={payment.status === 'COMPLETED' ? 'success' : payment.status === 'FAILED' ? 'destructive' : 'secondary'}>
                            {payment.status}
                          </Badge>
                          <span className="text-sm font-medium">${payment.amount} {payment.currency}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{payment.plan} plan</p>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {confirmCancelOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setConfirmCancelOpen(false)}>
              <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-background p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Cancel Pro access?</h2>
                    <p className="mt-2 text-sm text-muted-foreground">This will switch your account back to Free immediately. You can renew Pro later from this billing page.</p>
                  </div>
                  <button onClick={() => setConfirmCancelOpen(false)} className="rounded-full border border-white/10 p-2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setConfirmCancelOpen(false)}>Keep Pro</Button>
                  <Button variant="destructive" onClick={async () => { setConfirmCancelOpen(false); await handleCancel(); }} disabled={cancelling}>
                    {cancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirm Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
    </div>
  );
}