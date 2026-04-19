'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, type PricingPlan } from '@/lib/api';
import { CheckCircle2, X, Zap, Crown, TrendingUp, Shield } from 'lucide-react';

type DisplayPlan = PricingPlan & {
  period: string;
  description: string;
  icon: typeof Zap;
  color: string;
  cta: string;
  ctaLink: string;
  popular: boolean;
  badge: string | null;
};

const proPlusFeatures = [
  '500 analyses per month',
  'Instant trade setups',
  'Advanced entry precision',
  'Priority signal generation',
  'Faster response time',
  'Smart Session Scanner',
];

const fallbackPlanDetails: Record<'FREE' | 'PRO' | 'TOP_TIER', Omit<DisplayPlan, 'id' | 'name' | 'tier' | 'price' | 'features' | 'dailyLimit' | 'isActive' | 'createdAt' | 'updatedAt'>> = {
  FREE: {
    period: '/month',
    description: 'Perfect for trying out AI chart analysis',
    icon: Zap,
    color: 'from-gray-500 to-gray-600',
    cta: 'Subscribe Now',
    ctaLink: '/checkout?plan=FREE',
    popular: false,
    badge: null,
  },
  PRO: {
    period: '/month',
    description: 'For serious traders who want premium AI analysis',
    icon: Crown,
    color: 'from-blue-500 to-purple-600',
    cta: 'Subscribe Now',
    ctaLink: '/checkout?plan=PRO',
    popular: false,
    badge: null,
  },
  TOP_TIER: {
    period: '/month',
    description: 'Instant trade setups with Smart Session Scanner, advanced entry precision, and faster response time.',
    icon: Crown,
    color: 'from-fuchsia-500 via-violet-500 to-cyan-500',
    cta: 'Upgrade to PRO+',
    ctaLink: '/checkout?plan=TOP_TIER',
    popular: true,
    badge: 'PRO+',
  },
};

const defaultFallbackPlans: DisplayPlan[] = [
  {
    id: 'fallback-free',
    name: 'TradeVision AI Free',
    tier: 'FREE',
    price: 0,
    features: ['2 analyses per day', 'Basic AI detection', 'Standard processing'],
    dailyLimit: 2,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    ...fallbackPlanDetails.FREE,
  },
  {
    id: 'fallback-pro',
    name: 'TradeVision AI Pro',
    tier: 'PRO',
    price: 19.95,
    features: ['300 analyses per month', 'Advanced Smart Money Concepts', 'Priority AI processing'],
    dailyLimit: 999999,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    ...fallbackPlanDetails.PRO,
  },
  {
    id: 'fallback-top-tier',
    name: 'PRO+',
    tier: 'TOP_TIER',
    price: 39.95,
    features: proPlusFeatures,
    dailyLimit: 999999,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    ...fallbackPlanDetails.TOP_TIER,
  },
];

const goldxFallbackPlan = {
  id: 'goldx-fallback',
  name: 'GoldX',
  price: 129.95,
  billingCycle: 'monthly',
  features: [
    'XAUUSD Night Scalping EA',
    'Fast / Prop / Hybrid modes',
    'Server-side strategy engine',
    'Real-time signal delivery',
    'License-based MT5 access',
  ],
};

const toDisplayPlan = (plan: PricingPlan): DisplayPlan | null => {
  if (plan.tier === 'VIP_AUTO_TRADER') {
    return null;
  }

  return {
    ...plan,
    ...(plan.tier === 'TOP_TIER'
      ? {
          name: 'PRO+',
          features: proPlusFeatures,
        }
      : plan.tier !== 'FREE'
        ? {
            features: plan.features.map((feature) =>
              /unlimited|fair use|300 analyses per month/i.test(feature) ? '300 analyses per month' : feature
            ),
          }
        : {}),
    ...fallbackPlanDetails[plan.tier],
  };
};

export default function PricingPage() {
  const [plans, setPlans] = useState<DisplayPlan[]>(defaultFallbackPlans);
  const [goldxPlan, setGoldxPlan] = useState(goldxFallbackPlan);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPricingPlans = async () => {
      try {
        const [data, goldx] = await Promise.all([
          api.getPublicPricingPlans(),
          api.goldx.getPlan().catch(() => null),
        ]);
        if (Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans.map(toDisplayPlan).filter((plan): plan is DisplayPlan => plan !== null));
        }
        if (goldx) {
          setGoldxPlan(goldx);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    loadPricingPlans();
  }, []);

  return (
    <div className="page-stack min-h-screen">
      <div className="page-shell">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4" variant="outline">Pricing</Badge>
          <h1 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl">
            Simple, Transparent <span className="text-gradient">Pricing</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Choose the plan that fits your trading needs. Upgrade or downgrade anytime.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 md:gap-6 lg:gap-8">
          {plans.map((plan, i) => {
            const previewFeatures = plan.features.slice(0, 3);
            const remainingFeatures = plan.features.length - previewFeatures.length;
            return (
            <motion.div
              key={plan.id}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -8, scale: 1.015 }}
              className="h-full"
            >
              <Card className={`relative h-full min-h-[34rem] overflow-hidden transition-all duration-300 hover:shadow-[0_22px_80px_rgba(15,23,42,0.28)] xl:min-h-[36rem] ${plan.popular ? 'border-fuchsia-400/40 shadow-[0_0_50px_rgba(217,70,239,0.14)]' : 'hover:border-white/20'}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400" />
                )}
                <CardContent className="flex h-full flex-col p-5 sm:p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${plan.color}`}>
                      <plan.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">{plan.name}</h3>
                        {plan.badge ? <Badge variant="default">{plan.badge}</Badge> : null}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                  <ul className="space-y-3 mb-6 text-sm">
                    {previewFeatures.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        {true ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                        )}
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {remainingFeatures > 0 ? (
                    <p className="mb-6 text-xs text-muted-foreground">
                      +{remainingFeatures} more features in the comparison table below
                    </p>
                  ) : <div className="mb-6" />}

                  <Link href={plan.ctaLink} className="mt-auto">
                    <Button
                      variant={plan.popular ? 'gradient' : 'outline'}
                      size="lg"
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          );
          })}
        </div>

        {!loading && plans.length === 0 ? (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            No active pricing plans are available right now.
          </div>
        ) : null}

        <motion.div
          id="goldx"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mx-auto mt-16 max-w-6xl sm:mt-20"
        >
          <Card className="overflow-hidden border-amber-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_30%)]">
            <CardContent className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-amber-300">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2 border-amber-400/20 text-amber-300">GoldX</Badge>
                    <h2 className="text-2xl font-bold sm:text-3xl">GoldX EA Subscription</h2>
                  </div>
                </div>

                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  GoldX is the standalone XAUUSD night scalping system. Subscription starts from the public site,
                  then license management, MT5 binding, and mode switching stay available inside your dashboard.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {goldxPlan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-black/20 p-6">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                    <Shield className="h-3.5 w-3.5" />
                    License-protected MT5 access
                  </div>
                  <div className="mb-2 text-5xl font-bold">
                    ${goldxPlan.price}
                    <span className="ml-1 text-lg font-normal text-muted-foreground">/{goldxPlan.billingCycle}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Best for traders who want a dedicated execution system instead of chart-only analysis.
                  </p>
                </div>

                <div className="mt-8 space-y-3">
                  <Link href="/goldx/checkout" className="block">
                    <Button size="lg" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                      Subscribe to GoldX
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    After checkout, use the dashboard to manage your license, MT5 account binding, and trading mode.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature Comparison Table */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mx-auto mt-16 max-w-5xl sm:mt-20"
        >
          <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Free</th>
                    <th className="text-center p-4 font-semibold">Pro</th>
                    <th className="text-center p-4 font-semibold text-fuchsia-400">PRO+</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { feature: 'AI Chart Analysis', free: '2/day', pro: '300/mo', top: '500/mo' },
                    { feature: 'Smart Money Concepts', free: false, pro: true, top: true },
                    { feature: 'Priority Processing', free: false, pro: true, top: true },
                    { feature: 'Smart Session Scanner', free: false, pro: false, top: true },
                    { feature: 'Instant Trade Setups', free: false, pro: false, top: true },
                    { feature: 'Advanced Entry Precision', free: false, pro: false, top: true },
                    { feature: 'Faster Response Time', free: false, pro: false, top: true },
                  ].map((row) => (
                    <tr key={row.feature} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-medium">{row.feature}</td>
                      {[row.free, row.pro, row.top].map((val, i) => (
                        <td key={i} className="p-4 text-center">
                          {typeof val === 'string' ? (
                            <span className="text-muted-foreground">{val}</span>
                          ) : val ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24"
        >
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'What chart platforms are supported?',
                a: 'We support screenshots from TradingView, MetaTrader 5, Deriv (including Boom, Crash, and Volatility indices), and any other trading platform.',
              },
              {
                q: 'How accurate is the AI analysis?',
                a: 'Each analysis includes a confidence score based on market structure, liquidity behavior, and technical context identified from your chart. Treat the output as a decision-support tool to complement your own judgment, not as financial advice.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes, you can cancel any paid subscription at any time. Your access will remain active until the end of the billing period.',
              },
              {
                q: 'What payment methods are accepted?',
                a: 'We accept PayPal and all major debit/credit cards through PayPal checkout.',
              },
            ].map((faq) => (
              <Card key={faq.q}>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-2">{faq.q}</h4>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
