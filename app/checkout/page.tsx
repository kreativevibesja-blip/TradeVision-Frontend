'use client';

import { Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { FUNDING, PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { AuthModal } from '@/components/AuthModal';
import {
  CreditCard,
  CheckCircle2,
  Shield,
  Loader2,
  Crown,
  MapPin,
  Wallet,
  Zap,
  Mail,
  User,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

type PlanKey = 'FREE' | 'PRO';
type CheckoutMethod = 'paypal' | 'card';

type AddressForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const emptyAddress = (): AddressForm => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
});

const planCatalog: Record<PlanKey, {
  name: string;
  price: number;
  period: string;
  description: string;
  icon: typeof Zap;
  color: string;
  features: string[];
}> = {
  FREE: {
    name: 'TradeVision AI Free',
    price: 0,
    period: '/month',
    description: 'Good for trying the app before you upgrade.',
    icon: Zap,
    color: 'from-slate-500 to-slate-600',
    features: ['2 analyses per day', 'Basic AI detection', 'Standard processing'],
  },
  PRO: {
    name: 'TradeVision AI Pro',
    price: 19,
    period: '/month',
    description: 'Unlimited chart analysis and premium structure logic.',
    icon: Crown,
    color: 'from-blue-500 to-purple-600',
    features: ['Unlimited daily analyses', 'Advanced Smart Money Concepts', 'Priority AI processing'],
  },
};

const requiredAddressFields: Array<keyof AddressForm> = ['firstName', 'lastName', 'email', 'address1', 'city', 'state', 'postalCode', 'country'];
const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const hasValidPayPalClientId = (() => {
  const trimmed = paypalClientId.trim();

  if (!trimmed) {
    return false;
  }

  const invalidValues = new Set(['.', 'your-paypal-client-id', 'your_client_id', 'placeholder']);
  return !invalidValues.has(trimmed.toLowerCase());
})();

const isAddressComplete = (address: AddressForm) =>
  requiredAddressFields.every((field) => address[field].trim().length > 0);

function PayPalButtonStack({
  token,
  planKey,
  formReady,
  couponCode,
  onRequireAuth,
  onRequireForm,
  onCapture,
  onFreeActivation,
  onError,
  onLoadingChange,
}: {
  token: string;
  planKey: PlanKey;
  formReady: boolean;
  couponCode: string;
  onRequireAuth: () => void;
  onRequireForm: () => void;
  onCapture: (orderId: string, method: CheckoutMethod) => Promise<void>;
  onFreeActivation: () => void;
  onError: (message: string) => void;
  onLoadingChange: (method: CheckoutMethod | null) => void;
}) {
  const createOrder = async (method: CheckoutMethod) => {
    if (!token) {
      onRequireAuth();
      throw new Error('Please sign in to continue.');
    }

    if (!formReady) {
      onRequireForm();
      throw new Error('Please complete your shipping and billing details before continuing.');
    }

    onLoadingChange(method);
    sessionStorage.setItem('tradevision_checkout_method', method);
    const result = await api.createPayment(planKey, token, couponCode || undefined);

    if (result.freeActivation) {
      onFreeActivation();
      throw new Error('__FREE_ACTIVATION__');
    }

    sessionStorage.setItem('tradevision_order_id', result.orderId);
    sessionStorage.removeItem('chartmind_order_id');
    return result.orderId;
  };

  const handleApprove = async (orderId: string, method: CheckoutMethod) => {
    await onCapture(orderId, method);
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        components: 'buttons',
        currency: 'USD',
        intent: 'capture',
      }}
    >
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
        <div className="space-y-3">
          <PayPalButtons
            fundingSource={FUNDING.PAYPAL}
            style={{
              layout: 'vertical',
              shape: 'rect',
              height: 42,
              label: 'paypal',
            }}
            disabled={!formReady}
            createOrder={() => createOrder('paypal')}
            onApprove={async (data) => {
              if (!data.orderID) {
                throw new Error('PayPal did not return an order ID.');
              }

              await handleApprove(data.orderID, 'paypal');
            }}
            onCancel={() => {
              onLoadingChange(null);
              onError('PayPal checkout was canceled. Please try again.');
            }}
            onError={(err) => {
              onLoadingChange(null);
              onError((err as { message?: string })?.message || 'Unable to start PayPal checkout right now.');
            }}
          />

          <PayPalButtons
            fundingSource={FUNDING.CARD}
            style={{
              layout: 'vertical',
              shape: 'rect',
              height: 42,
            }}
            disabled={!formReady}
            createOrder={() => createOrder('card')}
            onApprove={async (data) => {
              if (!data.orderID) {
                throw new Error('PayPal did not return an order ID.');
              }

              await handleApprove(data.orderID, 'card');
            }}
            onCancel={() => {
              onLoadingChange(null);
              onError('Card checkout was canceled. Please try again.');
            }}
            onError={(err) => {
              onLoadingChange(null);
              onError((err as { message?: string })?.message || 'Unable to start card checkout right now.');
            }}
          >
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
              Debit or credit card checkout is unavailable for this PayPal account or region.
            </div>
          </PayPalButtons>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}

function AddressFields({
  title,
  address,
  onChange,
}: {
  title: string;
  address: AddressForm;
  onChange: (field: keyof AddressForm, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">Used for your subscription record and payment details.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input placeholder="First name" value={address.firstName} onChange={(event) => onChange('firstName', event.target.value)} />
        <Input placeholder="Last name" value={address.lastName} onChange={(event) => onChange('lastName', event.target.value)} />
        <Input placeholder="Email" type="email" value={address.email} onChange={(event) => onChange('email', event.target.value)} className="sm:col-span-2" />
        <Input placeholder="Phone" value={address.phone} onChange={(event) => onChange('phone', event.target.value)} className="sm:col-span-2" />
        <Input placeholder="Address line 1" value={address.address1} onChange={(event) => onChange('address1', event.target.value)} className="sm:col-span-2" />
        <Input placeholder="Address line 2 (optional)" value={address.address2} onChange={(event) => onChange('address2', event.target.value)} className="sm:col-span-2" />
        <Input placeholder="City" value={address.city} onChange={(event) => onChange('city', event.target.value)} />
        <Input placeholder="State / Parish" value={address.state} onChange={(event) => onChange('state', event.target.value)} />
        <Input placeholder="Postal code" value={address.postalCode} onChange={(event) => onChange('postalCode', event.target.value)} />
        <Input placeholder="Country" value={address.country} onChange={(event) => onChange('country', event.target.value)} />
      </div>
    </div>
  );
}

function CheckoutPageContent() {
  const { user, token, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const [loadingMethod, setLoadingMethod] = useState<CheckoutMethod | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [shippingAddress, setShippingAddress] = useState<AddressForm>(emptyAddress);
  const [billingAddress, setBillingAddress] = useState<AddressForm>(emptyAddress);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ type: string; value: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';
  const planKey = (searchParams.get('plan')?.toUpperCase() === 'FREE' ? 'FREE' : 'PRO') as PlanKey;
  const plan = planCatalog[planKey];
  const activeBillingAddress = sameAsShipping ? shippingAddress : billingAddress;
  const formReady = isAddressComplete(shippingAddress) && isAddressComplete(activeBillingAddress);

  const discountAmount = couponApplied
    ? couponApplied.type === 'percentage'
      ? plan.price * couponApplied.value / 100
      : couponApplied.value
    : 0;
  const finalPrice = Math.max(0, plan.price - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!token) { setAuthOpen(true); return; }
    setCouponError('');
    setCouponApplied(null);
    setCouponLoading(true);
    try {
      const result = await api.validateCoupon(couponCode.trim(), token);
      if (result.valid && result.discount) {
        setCouponApplied({ type: result.discount.type, value: result.discount.value, message: result.message || 'Coupon applied!' });
      } else {
        setCouponError(result.message || 'Invalid coupon code');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponApplied(null);
    setCouponError('');
  };

  const handleFreeActivation = async () => {
    await refreshUser();
    setSuccess(true);
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    const [firstName, ...rest] = (user.name || '').split(' ').filter(Boolean);
    const lastName = rest.join(' ');

    setShippingAddress((current) => ({
      ...current,
      firstName: current.firstName || firstName || '',
      lastName: current.lastName || lastName || '',
      email: current.email || user.email || '',
    }));
    setBillingAddress((current) => ({
      ...current,
      firstName: current.firstName || firstName || '',
      lastName: current.lastName || lastName || '',
      email: current.email || user.email || '',
    }));
  }, [user]);

  useEffect(() => {
    if (isSuccess && token) {
      const orderId = sessionStorage.getItem('tradevision_order_id') || sessionStorage.getItem('chartmind_order_id');
      if (orderId) {
        handlePaymentCapture(orderId);
      }
    }
  }, [isSuccess, token]);

  const handlePaymentCapture = async (orderId: string, method: CheckoutMethod = 'paypal') => {
    try {
      setLoadingMethod(method);
      await api.paymentSuccess(orderId, token!);
      sessionStorage.removeItem('tradevision_order_id');
      sessionStorage.removeItem('chartmind_order_id');
      sessionStorage.removeItem('tradevision_checkout_method');
      await refreshUser();
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Payment verification failed');
    } finally {
      setLoadingMethod(null);
    }
  };

  const updateShipping = (field: keyof AddressForm, value: string) => {
    setShippingAddress((current) => ({ ...current, [field]: value }));
  };

  const updateBilling = (field: keyof AddressForm, value: string) => {
    setBillingAddress((current) => ({ ...current, [field]: value }));
  };

  const handleCheckout = async (method: CheckoutMethod) => {
    if (!user || !token) {
      setAuthOpen(true);
      return;
    }

    if (planKey === 'PRO' && user.subscription === 'PRO') {
      setError('You already have a Pro subscription');
      return;
    }

    if (!formReady) {
      setError('Please complete your shipping and billing details before continuing.');
      return;
    }

    if (planKey === 'FREE') {
      window.location.href = '/analyze';
      return;
    }

    try {
      setLoadingMethod(method);
      setError('');
      sessionStorage.setItem('tradevision_checkout_method', method);
      const result = await api.createPayment(planKey, token, couponApplied ? couponCode : undefined);
      sessionStorage.setItem('tradevision_order_id', result.orderId);
      sessionStorage.removeItem('chartmind_order_id');

      if (result.freeActivation) {
        await handleFreeActivation();
        return;
      }

      if (result.approveUrl) {
        window.location.href = result.approveUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Payment creation failed');
      setLoadingMethod(null);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 sm:py-16">
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
              <h2 className="text-2xl font-bold mb-2">Subscription Active!</h2>
              <p className="text-muted-foreground mb-6">
                Your {plan.name} plan is now active. Enjoy the app.
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
    <div className="page-stack min-h-screen">
      <div className="page-shell max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
          <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Checkout</h1>
          <p className="mb-8 text-muted-foreground">Review your subscription, address details, and payment method.</p>

          {isCanceled ? (
            <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              Checkout was canceled. You can review your details and try again.
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
            <div className="space-y-4 sm:space-y-6">
              <Card className="mobile-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="h-5 w-5 text-primary" />
                    Account Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-4 rounded-2xl bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl bg-gradient-to-br ${plan.color} p-2.5`}>
                        <plan.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{plan.name}</p>
                          {planKey === 'PRO' ? <Badge variant="default">Most Popular</Badge> : <Badge variant="secondary">Starter</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">
                      ${couponApplied ? finalPrice.toFixed(2) : plan.price}
                      <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                      {couponApplied && (
                        <span className="block text-sm font-normal text-muted-foreground line-through">
                          ${plan.price.toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <User className="h-4 w-4" />
                        Subscriber
                      </div>
                      <p className="font-medium">{user?.name || 'Your account'}</p>
                      <p className="text-sm text-muted-foreground">{user?.email || shippingAddress.email || 'Sign in to continue'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        Billing Cycle
                      </div>
                      <p className="font-medium">Monthly subscription</p>
                      <p className="text-sm text-muted-foreground">Cancel anytime from your account.</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="mobile-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AddressFields title="Shipping Details" address={shippingAddress} onChange={updateShipping} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <Card className="mobile-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                    <input
                      type="checkbox"
                      checked={sameAsShipping}
                      onChange={(event) => setSameAsShipping(event.target.checked)}
                      className="h-4 w-4 rounded border-white/20 bg-transparent"
                    />
                    <span>Billing address same as shipping</span>
                  </label>

                  {sameAsShipping ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                      Your billing details will use the same address information shown in the shipping section.
                    </div>
                  ) : (
                    <AddressFields title="Billing Details" address={billingAddress} onChange={updateBilling} />
                  )}
                </CardContent>
              </Card>

              {/* Coupon Code Section */}
              {planKey === 'PRO' && (
                <Card className="mobile-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Tag className="h-5 w-5 text-primary" />
                      Coupon Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {couponApplied ? (
                      <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                            <span className="text-sm font-medium text-green-400">{couponApplied.message}</span>
                          </div>
                          <button onClick={handleRemoveCoupon} className="text-xs text-muted-foreground hover:text-foreground">
                            Remove
                          </button>
                        </div>
                        <div className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Original Price</span>
                            <span>${plan.price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-green-400">
                            <span>Discount ({couponApplied.type === 'percentage' ? `${couponApplied.value}%` : `$${couponApplied.value.toFixed(2)}`})</span>
                            <span>-${discountAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-semibold pt-1 border-t border-white/10">
                            <span>Total</span>
                            <span>${finalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                            className="uppercase"
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          />
                          <Button
                            variant="outline"
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponCode.trim()}
                          >
                            {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                          </Button>
                        </div>
                        {couponError && (
                          <p className="text-sm text-red-400">{couponError}</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="mobile-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Complete your purchase securely through PayPal using PayPal's official checkout buttons.
                </p>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {error}
                  </div>
                )}

                {planKey === 'PRO' ? (
                  hasValidPayPalClientId ? (
                    <div className="space-y-3">
                      <PayPalButtonStack
                        token={token || ''}
                        planKey={planKey}
                        formReady={formReady}
                        couponCode={couponApplied ? couponCode : ''}
                        onRequireAuth={() => setAuthOpen(true)}
                        onRequireForm={() => setError('Please complete your shipping and billing details before continuing.')}
                        onCapture={handlePaymentCapture}
                        onFreeActivation={handleFreeActivation}
                        onError={setError}
                        onLoadingChange={setLoadingMethod}
                      />

                      {!formReady ? (
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                          Complete your shipping and billing details above to enable checkout.
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                      PayPal checkout is not configured correctly. Set NEXT_PUBLIC_PAYPAL_CLIENT_ID in the frontend environment to your real PayPal client ID, then restart the frontend.
                    </div>
                  )
                ) : (
                  <Button
                    variant="gradient"
                    size="xl"
                    className="w-full gap-2"
                    onClick={() => handleCheckout('paypal')}
                  >
                    <Zap className="h-5 w-5" />
                    Continue with Free Plan
                  </Button>
                )}

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  Secured by PayPal. Cancel anytime.
                </div>
              </CardContent>
              </Card>
            </div>
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
