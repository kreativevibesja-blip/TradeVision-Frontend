'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, type PricingPlan } from '@/lib/api';
import { CheckCircle2, X, Zap, Crown } from 'lucide-react';

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

const oneTapProFeatures = [
  '300 analyses per month',
  'Instant trade setups',
  'One-tap execution',
  'Priority signal generation',
  'Advanced entry precision',
  'Faster response time',
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
    description: 'Instant trade setups with One-Tap Trade, advanced entry precision, and faster response time.',
    icon: Crown,
    color: 'from-fuchsia-500 via-violet-500 to-cyan-500',
    cta: 'Upgrade to One-Tap Pro+',
    ctaLink: '/checkout?plan=TOP_TIER',
    popular: true,
    badge: 'One-Tap Trade',
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
    name: 'One-Tap Pro+',
    tier: 'TOP_TIER',
    price: 39.95,
    features: oneTapProFeatures,
    dailyLimit: 999999,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    ...fallbackPlanDetails.TOP_TIER,
  },
];

const toDisplayPlan = (plan: PricingPlan): DisplayPlan => ({
  ...plan,
  ...(plan.tier === 'TOP_TIER'
    ? {
        name: 'One-Tap Pro+',
        features: oneTapProFeatures,
      }
    : plan.tier !== 'FREE'
      ? {
          features: plan.features.map((feature) =>
            /unlimited|fair use|300 analyses per month/i.test(feature) ? '300 analyses per month' : feature
          ),
        }
      : {}),
  ...fallbackPlanDetails[plan.tier],
});

export default function PricingPage() {
  const [plans, setPlans] = useState<DisplayPlan[]>(defaultFallbackPlans);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPricingPlans = async () => {
      try {
        const data = await api.getPublicPricingPlans();
        if (Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans.map(toDisplayPlan));
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
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -8, scale: 1.015 }}
            >
              <Card className={`relative h-full overflow-hidden transition-all duration-300 hover:shadow-[0_22px_80px_rgba(15,23,42,0.28)] ${plan.popular ? 'border-fuchsia-400/40 shadow-[0_0_50px_rgba(217,70,239,0.14)]' : 'hover:border-white/20'}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400" />
                )}
                <CardContent className="p-5 sm:p-6 lg:p-8">
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

                  <p className="text-sm text-muted-foreground mb-8">{plan.description}</p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
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

                  <Link href={plan.ctaLink}>
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
          ))}
        </div>

        {!loading && plans.length === 0 ? (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            No active pricing plans are available right now.
          </div>
        ) : null}

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
                a: 'We support screenshots from TradingView, cTrader, Deriv (including Boom, Crash, and Volatility indices), and any other trading platform.',
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
