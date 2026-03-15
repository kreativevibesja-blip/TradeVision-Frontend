'use client';

import { Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { AuthModal } from '@/components/AuthModal';
import {
  CreditCard,
  CheckCircle2,
  Shield,
  Loader2,
  Crown,
} from 'lucide-react';
import Link from 'next/link';

function CheckoutPageContent() {
  const { user, token, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const isSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    if (isSuccess && token) {
      const orderId = sessionStorage.getItem('tradevision_order_id') || sessionStorage.getItem('chartmind_order_id');
      if (orderId) {
        handlePaymentCapture(orderId);
      }
    }
  }, [isSuccess, token]);

  const handlePaymentCapture = async (orderId: string) => {
    try {
      setLoading(true);
      await api.paymentSuccess(orderId, token!);
      sessionStorage.removeItem('tradevision_order_id');
      sessionStorage.removeItem('chartmind_order_id');
      await refreshUser();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user || !token) {
      setAuthOpen(true);
      return;
    }

    if (user.subscription === 'PRO') {
      setError('You already have a Pro subscription');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await api.createPayment('PRO', token);
      sessionStorage.setItem('tradevision_order_id', result.orderId);
      sessionStorage.removeItem('chartmind_order_id');

      if (result.approveUrl) {
        window.location.href = result.approveUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Payment creation failed');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <Card className="max-w-md mx-auto">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="inline-flex p-4 rounded-full bg-green-500/20 mb-6"
              >
                <CheckCircle2 className="h-12 w-12 text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Welcome to Pro!</h2>
              <p className="text-muted-foreground mb-6">
                Your subscription is now active. Enjoy unlimited AI chart analysis.
              </p>
              <Link href="/analyze">
                <Button variant="gradient" size="lg">Start Analyzing</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground mb-8">Complete your Pro subscription</p>

          <div className="grid gap-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">TradeVision AI Pro</p>
                      <p className="text-sm text-muted-foreground">Monthly subscription</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">$19<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
                </div>

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Unlimited daily analyses
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Advanced Smart Money Concepts
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Priority AI processing
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Complete your purchase securely through PayPal. You can pay with your PayPal account or any debit/credit card.
                </p>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {error}
                  </div>
                )}

                <Button
                  variant="glow"
                  size="xl"
                  className="w-full gap-2"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Pay with PayPal
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  Secured by PayPal. Cancel anytime.
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} onModeChange={setAuthMode} />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-16" />}>
      <CheckoutPageContent />
    </Suspense>
  );
}
