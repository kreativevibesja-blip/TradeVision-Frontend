'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, type PricingPlan } from '@/lib/api';
import { CheckCircle2, Crown, Radar, Shield, Sparkles, TrendingUp, X, Zap } from 'lucide-react';

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
  'Advanced execution planning',
  'Advanced entry precision',
  'Higher-priority AI processing',
  'Faster response time',
  'Smart Session Scanner',
];

const fallbackPlanDetails: Record<'FREE' | 'PRO' | 'TOP_TIER', Omit<DisplayPlan, 'id' | 'name' | 'tier' | 'price' | 'features' | 'dailyLimit' | 'isActive' | 'createdAt' | 'updatedAt'>> = {
  FREE: {
    period: '/month',
    description: 'Perfect for trying out AI chart analysis',
    icon: Zap,
    color: 'from-stone-500 to-stone-700',
    cta: 'Subscribe Now',
    ctaLink: '/checkout?plan=FREE',
    popular: false,
    badge: null,
  },
  PRO: {
    period: '/month',
    description: 'For serious traders who want deeper AI chart analysis',
    icon: Crown,
    color: 'from-amber-300 to-yellow-600',
    cta: 'Subscribe Now',
    ctaLink: '/checkout?plan=PRO',
    popular: false,
    badge: null,
  },
  TOP_TIER: {
    period: '/month',
    description: 'Advanced execution planning with Smart Session Scanner, stronger entry precision, and faster response time.',
    icon: Crown,
    color: 'from-[#ffe38a] via-[#d4af37] to-[#8a6712]',
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
    'Realtime execution logic',
    'License-based MT5 access',
  ],
};

const goldxPulseFallbackPlan = {
  id: 'goldx-pulse-fallback',
  name: 'GoldX Pulse',
  price: 79.95,
  billingCycle: 'month',
  features: [
    'Live Deriv tick stream',
    'Digit analytics and streak detection',
    'Matches / Differs assisted trades',
    'Over / Under range pressure panel',
    'Dedicated Pulse access control',
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
  const [goldxPulsePlan] = useState(goldxPulseFallbackPlan);
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
        <motion.section
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="relative mb-12 overflow-hidden rounded-[36px] border border-[rgba(255,223,112,0.14)] bg-[linear-gradient(145deg,rgba(255,223,112,0.08),rgba(255,255,255,0.02),rgba(0,0,0,0.24))] p-6 sm:mb-16 sm:p-8 lg:p-10"
        >
          <div className="ambient-orb left-[8%] top-[12%] h-44 w-44" />
          <div className="ambient-orb right-[5%] top-[0%] h-56 w-56" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <Badge className="mb-4" variant="default">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Platform plans
              </Badge>
              <h1 className="text-3xl font-bold tracking-[-0.08em] text-white sm:text-5xl lg:text-6xl">
                Pricing built around how you trade.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                Choose the plan that fits your workflow, whether you need core chart analysis, deeper execution planning, or the dedicated GoldX execution stack.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                ['Core plans', 'Free, Pro, PRO+'],
                ['GoldX suite', 'EA + Pulse add-ons'],
                ['Cancel control', 'Upgrade or downgrade anytime'],
              ].map(([label, value]) => (
                <div key={label} className="mobile-card rounded-[24px] p-4">
                  <div className="metric-label">{label}</div>
                  <div className="mt-2 text-sm font-semibold text-white sm:text-base">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="mb-16 grid gap-4 lg:grid-cols-3">
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
              <Card className={`relative h-full min-h-[34rem] overflow-hidden transition-all duration-300 xl:min-h-[36rem] ${plan.popular ? 'border-[rgba(255,223,112,0.34)] shadow-luxe-strong' : 'hover:border-[rgba(255,223,112,0.18)]'}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ffe38a] via-[#d4af37] to-[#8a6712]" />
                )}
                <CardContent className="flex h-full flex-col p-5 sm:p-6 lg:p-8">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <div className={`rounded-2xl bg-gradient-to-br p-3 ${plan.color}`}>
                      <plan.icon className="h-5 w-5 text-white" />
                    </div>
                    {plan.badge ? <Badge variant="default">{plan.badge}</Badge> : <Badge variant="outline">{plan.tier}</Badge>}
                  </div>

                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.05em] text-white">{plan.name}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/62">{plan.description}</p>
                  </div>

                  <div className="mb-6 mt-8 flex items-end gap-2">
                    <span className="font-mono text-5xl font-bold tracking-[-0.08em] text-white">${plan.price}</span>
                    <span className="pb-1 text-sm uppercase tracking-[0.24em] text-muted-foreground">{plan.period}</span>
                  </div>

                  <div className="mb-6 luxury-divider" />

                  <ul className="mb-6 space-y-3 text-sm">
                    {previewFeatures.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-white/76">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {remainingFeatures > 0 ? (
                    <p className="mb-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
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
        </section>

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
          <Card className="overflow-hidden border-[rgba(255,223,112,0.24)] bg-[radial-gradient(circle_at_top_left,_rgba(255,223,112,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(212,175,55,0.14),_transparent_30%)]">
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
                  GoldX is the standalone GoldX SMC EA for traders who want a license-protected MT5 execution system.
                  Subscribe here, then use the platform to manage access, onboarding, and MT5 account binding while the EA handles live execution from the terminal.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Modes', 'Fast, Prop, Hybrid'],
                    ['Execution style', 'Terminal-first automation'],
                    ['Best fit', 'Elite gold operators'],
                  ].map(([label, value]) => (
                    <div key={label} className="mobile-card rounded-[22px] p-4">
                      <div className="metric-label">{label}</div>
                      <div className="mt-2 text-sm text-white">{value}</div>
                    </div>
                  ))}
                </div>

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
                    Best for traders who want a dedicated Gold execution product instead of a chart-only workflow.
                  </p>
                </div>

                <div className="mt-8 space-y-3">
                  <Link href="/checkout?plan=GOLDX" className="block">
                    <Button size="lg" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                      Subscribe to GoldX
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    After checkout, use the platform to manage your license, setup flow, and MT5 account binding. Execution settings stay inside MT5.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          id="goldx-pulse"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mt-10 max-w-6xl sm:mt-12"
        >
          <Card className="overflow-hidden border-[rgba(88,235,255,0.18)] bg-[radial-gradient(circle_at_top_left,_rgba(255,223,112,0.15),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_30%)]">
            <CardContent className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3 text-cyan-300">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2 border-cyan-400/20 text-cyan-300">GoldX Pulse</Badge>
                    <h2 className="text-2xl font-bold sm:text-3xl">Deriv Options Add-On</h2>
                  </div>
                </div>

                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  GoldX Pulse is the live Deriv options workspace for digit analytics, assisted execution, and streaming tick intelligence. It runs as a dedicated add-on alongside your main platform plan.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Workspace', 'Dedicated Pulse dashboard'],
                    ['Execution style', 'Digits and assisted execution'],
                    ['Best fit', 'Deriv-focused options traders'],
                  ].map(([label, value]) => (
                    <div key={label} className="mobile-card rounded-[22px] p-4">
                      <div className="metric-label">{label}</div>
                      <div className="mt-2 text-sm text-white">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {goldxPulsePlan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-black/20 p-6">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                    <Shield className="h-3.5 w-3.5" />
                    Subscription-gated dashboard access
                  </div>
                  <div className="mb-2 text-5xl font-bold">
                    ${goldxPulsePlan.price}
                    <span className="ml-1 text-lg font-normal text-muted-foreground">/{goldxPulsePlan.billingCycle}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Best for traders who want a dedicated binary and digits workflow with live market-state analytics inside the ChartMind dashboard.
                  </p>
                </div>

                <div className="mt-8 space-y-3">
                  <Link href="/checkout?plan=GOLDX_PULSE" className="block">
                    <Button size="lg" className="w-full bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-600 hover:to-fuchsia-700">
                      Subscribe to GoldX Pulse
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    After checkout, use the billing page or Pulse workspace to manage expiry, cancellation, and live Deriv connectivity.
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
          <div className="mb-8 text-center">
            <Badge variant="outline">Comparison</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white">Pick the right operating tier</h2>
          </div>
          <Card className="terminal-table overflow-hidden">
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
                    { feature: 'Advanced Execution Planning', free: false, pro: false, top: true },
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
          <div className="mb-8 text-center">
            <Badge variant="outline">FAQ</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white">Questions traders ask before upgrading</h2>
          </div>
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
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-xl border border-[rgba(255,223,112,0.14)] bg-[rgba(255,223,112,0.08)] p-2 text-[var(--gold-light)]">
                      <Radar className="h-4 w-4" />
                    </div>
                    <h4 className="font-semibold text-white">{faq.q}</h4>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
