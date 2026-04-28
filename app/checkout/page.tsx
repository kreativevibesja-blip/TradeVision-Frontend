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
import { formatJamaicaDateTime } from '@/lib/jamaica-time';
import { AuthModal } from '@/components/AuthModal';
import {
  ArrowRight,
  Building2,
  CreditCard,
  CheckCircle2,
  Shield,
  Loader2,
  Crown,
  Landmark,
  MapPin,
  Wallet,
  Zap,
  TrendingUp,
  Mail,
  User,
  Tag,
  Gift,
  X,
} from 'lucide-react';
import Link from 'next/link';

type PlanKey = 'FREE' | 'PRO' | 'TOP_TIER' | 'GOLDX' | 'GOLDX_PULSE';
type CheckoutMethod = 'paypal' | 'card' | 'bank-transfer';
type BankTransferBank = 'SCOTIABANK' | 'NCB';

const BANK_TRANSFER_JMD_RATE = 158;
const formatJmdCurrency = new Intl.NumberFormat('en-JM', {
  style: 'currency',
  currency: 'JMD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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
    price: 19.95,
    period: '/month',
    description: '300 analyses per month with premium structure logic.',
    icon: Crown,
    color: 'from-blue-500 to-purple-600',
    features: ['300 analyses per month', 'Advanced Smart Money Concepts', 'Priority AI processing'],
  },
  TOP_TIER: {
    name: 'PRO+',
    price: 39.95,
    period: '/month',
    description: '500 analyses per month plus instant trade setups and Smart Session Scanner access.',
    icon: Crown,
    color: 'from-fuchsia-500 via-violet-500 to-cyan-500',
    features: ['500 analyses per month', 'Instant trade setups', 'Priority signal generation', 'Advanced entry precision', 'Smart Session Scanner'],
  },
  GOLDX: {
    name: 'GoldX',
    price: 129.95,
    period: '/month',
    description: 'XAUUSD night scalping EA with a server-side strategy engine and license-based MT5 access.',
    icon: TrendingUp,
    color: 'from-amber-500 to-orange-500',
    features: ['XAUUSD Night Scalping EA', 'Fast / Prop / Hybrid Modes', 'Server-Side Strategy Engine', 'Real-Time Signals', 'License-Based MT5 Access'],
  },
  GOLDX_PULSE: {
    name: 'GoldX Pulse',
    price: 79.95,
    period: '/month',
    description: 'Deriv options workspace with live digit analytics, assisted execution panels, and server-side access control.',
    icon: Zap,
    color: 'from-cyan-500 via-sky-500 to-fuchsia-500',
    features: ['Live Deriv tick stream', 'Digit analytics and streak detection', 'Matches / Differs trade panel', 'Over / Under range pressure panel', 'Dedicated GoldX Pulse access'],
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

const bankTransferOptions: Record<BankTransferBank, {
  name: string;
  shortName: string;
  accentClass: string;
  cardClass: string;
  accountType: string;
  accountNumber: string;
  branch: string;
}> = {
  SCOTIABANK: {
    name: 'ScotiaBank',
    shortName: 'ScotiaBank',
    accentClass: 'border-red-500/40 bg-gradient-to-br from-red-600 via-red-500 to-white text-white',
    cardClass: 'border-red-500/20 bg-red-500/10',
    accountType: 'Chequing',
    accountNumber: '303306',
    branch: 'Junction',
  },
  NCB: {
    name: 'National Commercial Bank (N.C.B)',
    shortName: 'N.C.B',
    accentClass: 'border-blue-500/40 bg-gradient-to-br from-blue-700 via-blue-600 to-amber-400 text-white',
    cardClass: 'border-blue-500/20 bg-blue-500/10',
    accountType: 'Savings',
    accountNumber: '884291801',
    branch: 'Junction',
  },
};

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
  onGoldxPlanId,
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
  onGoldxPlanId: (planId: string | null) => void;
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

    if (planKey === 'GOLDX') {
      const result = await api.goldx.createPayment(token);
      onGoldxPlanId(result.planId);
      sessionStorage.setItem('goldx_plan_id', result.planId);
      sessionStorage.setItem('tradevision_order_id', result.orderId);
      sessionStorage.removeItem('chartmind_order_id');
      return result.orderId;
    }

    const result = await api.createPayment(planKey, token, couponCode || undefined, method === 'card' ? 'CARD' : 'PAYPAL');

    if (result.freeActivation) {
      sessionStorage.removeItem('tradevision_order_id');
      sessionStorage.removeItem('chartmind_order_id');
      onFreeActivation();
      throw new Error('__FREE_ACTIVATION__');
    }

    if (!result.orderId) {
      throw new Error('PayPal did not return an order ID.');
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
  const [bankTransferOpen, setBankTransferOpen] = useState(false);
  const [bankTransferConfirmOpen, setBankTransferConfirmOpen] = useState(false);
  const [selectedTransferBank, setSelectedTransferBank] = useState<BankTransferBank | null>(null);
  const [bankTransferSubmitting, setBankTransferSubmitting] = useState(false);
  const [submittedTransfer, setSubmittedTransfer] = useState<{
    id: string;
    referenceId: string;
    bankTransferBank: BankTransferBank;
    createdAt: string;
    amount: number;
    currency: string;
  } | null>(null);

  // Referral discount state
  const [referralDiscount, setReferralDiscount] = useState<number>(0);
  const [goldxPlanId, setGoldxPlanId] = useState<string | null>(null);
  const [goldxLicenseKey, setGoldxLicenseKey] = useState<string | null>(null);

  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';
  const requestedPlan = searchParams.get('plan')?.toUpperCase();
  const requestedCoupon = searchParams.get('coupon') || '';
  const planKey: PlanKey = requestedPlan === 'FREE' || requestedPlan === 'TOP_TIER' || requestedPlan === 'PRO' || requestedPlan === 'GOLDX' || requestedPlan === 'GOLDX_PULSE' ? requestedPlan : 'PRO';
  const plan = planCatalog[planKey];
  const activeBillingAddress = sameAsShipping ? shippingAddress : billingAddress;
  const formReady = isAddressComplete(shippingAddress) && isAddressComplete(activeBillingAddress);

  const referralDiscountAmount = plan.price * referralDiscount / 100;
  const priceAfterReferral = Math.max(0, plan.price - referralDiscountAmount);
  const discountAmount = couponApplied
    ? couponApplied.type === 'percentage'
      ? priceAfterReferral * couponApplied.value / 100
      : couponApplied.value
    : 0;
  const finalPrice = Math.max(0, priceAfterReferral - discountAmount);
  const bankTransferAmountJmd = finalPrice * BANK_TRANSFER_JMD_RATE;

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
    if (!token || planKey === 'FREE' || planKey === 'GOLDX') return;
    api.referral.getMyDiscount(token)
      .then((data) => {
        if (data.discountPercent > 0) setReferralDiscount(data.discountPercent);
      })
      .catch(() => {});
  }, [token, planKey]);

  // Auto-apply coupon from URL query param (?coupon=CODE)
  useEffect(() => {
    if (!requestedCoupon || !token || couponApplied || planKey === 'GOLDX') return;
    setCouponCode(requestedCoupon.toUpperCase());
    setCouponLoading(true);
    api.validateCoupon(requestedCoupon.trim(), token)
      .then((result) => {
        if (result.valid && result.discount) {
          setCouponApplied({ type: result.discount.type, value: result.discount.value, message: result.message || 'Coupon applied!' });
        } else {
          setCouponError(result.message || 'Invalid coupon code');
        }
      })
      .catch((err: any) => {
        setCouponError(err.message || 'Failed to validate coupon');
      })
      .finally(() => setCouponLoading(false));
  }, [requestedCoupon, token, couponApplied, planKey]);

  useEffect(() => {
    if (planKey !== 'GOLDX' || !token) {
      return;
    }

    let cancelled = false;
    api.goldx.getPlan()
      .then((goldxPlan) => {
        if (!cancelled) {
          setGoldxPlanId(goldxPlan.id);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [planKey, token]);

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
      if (planKey === 'GOLDX') {
        const planId = goldxPlanId || sessionStorage.getItem('goldx_plan_id');
        if (!planId) {
          throw new Error('GoldX plan information is missing. Please restart checkout.');
        }

        const result = await api.goldx.capturePayment(orderId, planId, token!);
        setGoldxLicenseKey(result.licenseKey);
        sessionStorage.removeItem('goldx_plan_id');
      } else {
        await api.paymentSuccess(orderId, token!);
      }

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

  const openBankTransferFlow = () => {
    if (!user || !token) {
      setAuthOpen(true);
      return;
    }

    if (planKey === 'GOLDX') {
      setError('Bank transfer is not available for GoldX. Please use PayPal or card checkout.');
      return;
    }

    if ((planKey === 'TOP_TIER' && user.subscription === 'TOP_TIER') || (planKey === 'PRO' && (user.subscription === 'PRO' || user.subscription === 'TOP_TIER'))) {
      setError(planKey === 'TOP_TIER' ? 'You already have PRO+' : 'You already have this plan or higher');
      return;
    }

    if (!formReady) {
      setError('Please complete your shipping and billing details before continuing.');
      return;
    }

    setError('');
    setSelectedTransferBank(null);
    setBankTransferOpen(true);
  };

  const submitBankTransferRequest = async () => {
    if (!token || !selectedTransferBank) {
      return;
    }

    try {
      setBankTransferSubmitting(true);
      const result = await api.createBankTransferRequest(planKey, selectedTransferBank, token, couponApplied ? couponCode : undefined);
      setSubmittedTransfer(result.payment);
      setBankTransferOpen(false);
      setBankTransferConfirmOpen(true);
    } catch (err: any) {
      setError(err.message || 'Unable to submit your bank transfer request right now.');
    } finally {
      setBankTransferSubmitting(false);
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

    if ((planKey === 'TOP_TIER' && user.subscription === 'TOP_TIER') || (planKey === 'PRO' && (user.subscription === 'PRO' || user.subscription === 'TOP_TIER'))) {
      setError(planKey === 'TOP_TIER' ? 'You already have PRO+' : 'You already have this plan or higher');
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

    if (planKey === 'GOLDX') {
      setError('Use the PayPal or card buttons below to complete GoldX checkout.');
      return;
    }

    try {
      setLoadingMethod(method);
      setError('');
      sessionStorage.setItem('tradevision_checkout_method', method);
      const result = await api.createPayment(planKey, token, couponApplied ? couponCode : undefined, method === 'card' ? 'CARD' : 'PAYPAL');

      if (result.freeActivation) {
        sessionStorage.removeItem('tradevision_order_id');
        sessionStorage.removeItem('chartmind_order_id');
        await handleFreeActivation();
        return;
      }

      if (result.orderId) {
        sessionStorage.setItem('tradevision_order_id', result.orderId);
        sessionStorage.removeItem('chartmind_order_id');
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
              {planKey === 'GOLDX' ? (
                <>
                  <p className="text-muted-foreground mb-6">
                    Your GoldX subscription is active. Save your license key now because it is only shown once.
                  </p>
                  {goldxLicenseKey ? (
                    <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-left">
                      <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-amber-300">License Key</div>
                      <div className="break-all font-mono text-sm text-white">{goldxLicenseKey}</div>
                    </div>
                  ) : null}
                  <Link href="/dashboard/goldx">
                    <Button variant="gradient" size="lg">Open GoldX Dashboard</Button>
                  </Link>
                </>
              ) : requestedPlan === 'GOLDX_PULSE' ? (
                <>
                  <p className="text-muted-foreground mb-6">
                    Your GoldX Pulse add-on is active. Open the workspace to connect Deriv and start using the live options dashboard.
                  </p>
                  <Link href="/dashboard/goldx-pulse">
                    <Button variant="gradient" size="lg">Open GoldX Pulse</Button>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-6">
                    Your {plan.name} plan is now active. Enjoy the app.
                  </p>
                  <Link href="/analyze">
                    <Button variant="gradient" size="lg">Start Analyzing</Button>
                  </Link>
                </>
              )}
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
                          {planKey === 'TOP_TIER' ? <Badge variant="default">Includes Smart Session Scanner</Badge> : planKey === 'PRO' ? <Badge variant="outline">Premium</Badge> : planKey === 'GOLDX' ? <Badge variant="outline">EA Subscription</Badge> : planKey === 'GOLDX_PULSE' ? <Badge variant="outline">Add-On</Badge> : <Badge variant="secondary">Starter</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold">
                      ${(couponApplied || referralDiscount > 0) ? finalPrice.toFixed(2) : plan.price}
                      <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                      {(couponApplied || referralDiscount > 0) && (
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
                      <p className="text-sm text-muted-foreground">{planKey === 'GOLDX' ? 'GoldX license management stays available in your dashboard.' : planKey === 'GOLDX_PULSE' ? 'GoldX Pulse access is granted automatically after successful payment capture.' : 'Cancel anytime from your account.'}</p>
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
              {planKey !== 'FREE' && planKey !== 'GOLDX' && (
                <Card className="mobile-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Tag className="h-5 w-5 text-primary" />
                      Coupon Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {referralDiscount > 0 && (
                      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4 mb-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-purple-300">
                          <Gift className="h-4 w-4" />
                          Referral discount of {referralDiscount}% will be applied automatically
                        </div>
                      </div>
                    )}
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
                          {referralDiscount > 0 && (
                            <div className="flex justify-between text-purple-300">
                              <span>Referral ({referralDiscount}%)</span>
                              <span>-${referralDiscountAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-green-400">
                            <span>Coupon ({couponApplied.type === 'percentage' ? `${couponApplied.value}%` : `$${couponApplied.value.toFixed(2)}`})</span>
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
                  {planKey === 'GOLDX'
                    ? 'Choose PayPal or card checkout to activate GoldX automatically and receive your license key right after payment.'
                    : 'Choose the payment route that works best for you. PayPal and card payments activate automatically, while bank transfers are reviewed by the team after you send your receipt.'}
                </p>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    {error}
                  </div>
                )}

                {planKey !== 'FREE' ? (
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
                        onGoldxPlanId={setGoldxPlanId}
                      />

                      {planKey !== 'GOLDX' ? (
                        <button
                          type="button"
                          onClick={openBankTransferFlow}
                          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:border-primary/40 hover:bg-white/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-2.5 text-emerald-300">
                              <Landmark className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium">Bank Transfer</div>
                              <div className="text-sm text-muted-foreground">Submit a manual transfer and send your receipt to WhatsApp for verification.</div>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ) : null}

                      {!formReady ? (
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                          Complete your shipping and billing details above to enable checkout.
                        </div>
                      ) : null}

                      {submittedTransfer ? (
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                          Bank transfer request submitted for {bankTransferOptions[submittedTransfer.bankTransferBank].name}. Reference: <span className="font-mono">{submittedTransfer.referenceId}</span>.
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
                  {planKey === 'GOLDX' ? 'Secure checkout with PayPal. GoldX license delivery happens after successful payment capture.' : 'Secure checkout with PayPal or manual verification for bank transfers.'}
                </div>
              </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>

      {bankTransferOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => !bankTransferSubmitting && setBankTransferOpen(false)}>
          <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold">Bank Transfer</h3>
                <p className="text-sm text-muted-foreground">Select your bank, review the transfer instructions, then confirm after you have completed the payment.</p>
              </div>
              <button type="button" onClick={() => !bankTransferSubmitting && setBankTransferOpen(false)} className="rounded-full p-2 transition hover:bg-white/10" aria-label="Close bank transfer modal">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(bankTransferOptions).map(([bankKey, bank]) => {
                  const isSelected = selectedTransferBank === bankKey;

                  return (
                    <button
                      key={bankKey}
                      type="button"
                      onClick={() => setSelectedTransferBank(bankKey as BankTransferBank)}
                      className={`rounded-[24px] border p-5 text-left transition ${isSelected ? bank.accentClass : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="rounded-2xl border border-current/20 bg-black/10 p-2">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <Badge variant={isSelected ? 'secondary' : 'outline'}>{isSelected ? 'Selected' : 'Choose'}</Badge>
                      </div>
                      <div className="text-lg font-semibold">{bank.name}</div>
                      <div className={`mt-2 text-sm ${isSelected ? 'text-white/85' : 'text-muted-foreground'}`}>
                        Manual transfer verified by the TradeVision AI billing team.
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedTransferBank ? (
                <div className={`mt-6 rounded-[28px] border p-6 ${bankTransferOptions[selectedTransferBank].cardClass}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Transfer destination</div>
                      <h4 className="mt-2 text-xl font-semibold">{bankTransferOptions[selectedTransferBank].name}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">Send the exact subscription amount, then share your receipt for review.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
                      <div className="text-xs uppercase tracking-[0.2em] text-white/60">Amount due</div>
                      <div className="mt-1 text-2xl font-semibold">${finalPrice.toFixed(2)}</div>
                      <div className="mt-1 text-sm font-medium text-emerald-200">{formatJmdCurrency.format(bankTransferAmountJmd)}</div>
                      <div className="text-xs text-white/70">{plan.period.replace('/', 'per ')}</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-emerald-100/80">Local transfer amount</span>
                      <span className="text-lg font-semibold text-emerald-100">{formatJmdCurrency.format(bankTransferAmountJmd)}</span>
                    </div>
                    <p className="mt-2 text-xs text-emerald-100/75">
                      Based on the current internal conversion rate of J${BANK_TRANSFER_JMD_RATE.toFixed(2)} per US$1.00.
                    </p>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Account Name</div>
                      <div className="mt-1 font-medium">Jadyne Stephenson</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Account Number</div>
                      <div className="mt-1 font-medium">{bankTransferOptions[selectedTransferBank].accountNumber}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Bank Branch</div>
                      <div className="mt-1 font-medium">{bankTransferOptions[selectedTransferBank].branch}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Account Type</div>
                      <div className="mt-1 font-medium">{bankTransferOptions[selectedTransferBank].accountType}</div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-slate-200">
                    After making payment, please share an image of the transfer receipt to our WhatsApp <a href="https://wa.me/18762797956" target="_blank" rel="noreferrer" className="font-semibold text-white underline underline-offset-4">+1-876-2797956</a> along with your registered email address.
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-5">
              <Button variant="outline" onClick={() => setBankTransferOpen(false)} disabled={bankTransferSubmitting}>Cancel</Button>
              <Button variant="gradient" onClick={submitBankTransferRequest} disabled={!selectedTransferBank || bankTransferSubmitting}>
                {bankTransferSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {bankTransferConfirmOpen && submittedTransfer ? (
        <div className="fixed inset-0 z-[121] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setBankTransferConfirmOpen(false)}>
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-slate-950 p-8 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mt-6 text-center text-2xl font-semibold">Thank you. Your transfer is under review.</h3>
            <p className="mt-3 text-center text-sm leading-6 text-muted-foreground">
              We have recorded your {bankTransferOptions[submittedTransfer.bankTransferBank].shortName} bank transfer request. Once the payment is verified, your account will be upgraded to {plan.name} immediately.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs text-white">{submittedTransfer.referenceId}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Submitted</span>
                <span>{formatJamaicaDateTime(submittedTransfer.createdAt)}</span>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <Button variant="gradient" onClick={() => setBankTransferConfirmOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      ) : null}

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
