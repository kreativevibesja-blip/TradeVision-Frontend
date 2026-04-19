'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { GoldxPlan } from '@/lib/api';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Shield,
  Check,
  Copy,
  AlertTriangle,
  RotateCw,
  Key,
} from 'lucide-react';

export default function GoldxCheckoutPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<GoldxPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => {
    api.goldx.getPlan()
      .then((p) => { setPlan(p); setPlanId(p.id); })
      .catch(() => setError('Failed to load plan'))
      .finally(() => setLoading(false));
  }, []);

  const handleCopyKey = () => {
    if (!licenseKey) return;
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <RotateCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !licenseKey) {
    return (
      <div className="mx-auto max-w-lg py-20">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center gap-3 p-6">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success — show license key
  if (licenseKey) {
    return (
      <div className="mx-auto max-w-lg py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%)]">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                <Check className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">Welcome to GoldX!</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Your subscription is active. Copy your license key below — it will only be shown once.
              </p>

              <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <Key className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-medium uppercase tracking-wider text-amber-400">License Key</span>
                </div>
                <p className="mb-3 break-all font-mono text-lg font-bold tracking-wider">{licenseKey}</p>
                <Button variant="outline" size="sm" onClick={handleCopyKey}>
                  {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                  {copied ? 'Copied!' : 'Copy Key'}
                </Button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm">
                <p className="mb-2 font-medium">Next Steps:</p>
                <ol className="list-inside list-decimal space-y-1 text-muted-foreground">
                  <li>Open MetaTrader 5</li>
                  <li>Install the GoldX EA on a XAUUSD M5 chart</li>
                  <li>Paste your license key in the EA input settings</li>
                  <li>Select your preferred mode (Fast / Prop / Hybrid)</li>
                  <li>Enable AutoTrading and let GoldX trade for you</li>
                </ol>
              </div>

              <Button
                className="mt-6"
                onClick={() => router.push('/dashboard/goldx')}
              >
                Go to GoldX Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Checkout form
  return (
    <div className="mx-auto max-w-2xl py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/10">
            <TrendingUp className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold">Subscribe to GoldX</h1>
          <p className="mt-2 text-muted-foreground">XAUUSD Night Scalping EA — Server-Powered</p>
        </div>

        {plan && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            {/* Plan Summary */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-bold">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.billingCycle}</span>
                </div>
                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* PayPal */}
            <Card>
              <CardContent className="p-6">
                <h3 className="mb-4 text-lg font-bold">Payment</h3>
                {!user ? (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center text-sm">
                    <p className="mb-2">You need to be signed in to subscribe.</p>
                    <Button onClick={() => router.push('/auth')}>Sign In</Button>
                  </div>
                ) : (
                  <PayPalScriptProvider options={{
                    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
                    currency: 'USD',
                  }}>
                    <PayPalButtons
                      style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'subscribe' }}
                      disabled={processing}
                      createOrder={async () => {
                        if (!token) throw new Error('Not authenticated');
                        setError(null);
                        setProcessing(true);
                        try {
                          const result = await api.goldx.createPayment(token);
                          setPlanId(result.planId);
                          return result.orderId;
                        } catch (err: any) {
                          setError(err.message || 'Failed to create order');
                          setProcessing(false);
                          throw err;
                        }
                      }}
                      onApprove={async (data) => {
                        if (!token || !planId) return;
                        try {
                          const result = await api.goldx.capturePayment(data.orderID, planId, token);
                          setLicenseKey(result.licenseKey);
                        } catch (err: any) {
                          setError(err.message || 'Payment failed');
                        } finally {
                          setProcessing(false);
                        }
                      }}
                      onError={(err) => {
                        setError('PayPal error — please try again');
                        setProcessing(false);
                      }}
                      onCancel={() => {
                        setProcessing(false);
                      }}
                    />
                  </PayPalScriptProvider>
                )}

                {error && (
                  <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
                    <AlertTriangle className="mr-1 inline h-4 w-4" />
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </div>
  );
}
