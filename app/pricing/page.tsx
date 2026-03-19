'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, X, Zap, Crown } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: 0,
    period: '/month',
    description: 'Perfect for trying out AI chart analysis',
    icon: Zap,
    color: 'from-gray-500 to-gray-600',
    features: [
      { text: '3 analyses per day', included: true },
      { text: 'Basic AI detection', included: true },
      { text: 'Standard processing', included: true },
      { text: 'Advanced SMC analysis', included: false },
      { text: 'Priority processing', included: false },
      { text: 'Detailed structure breakdown', included: false },
    ],
    cta: 'Get Started Free',
    ctaLink: '/analyze',
    popular: false,
  },
  {
    name: 'Pro',
    price: 19,
    period: '/month',
    description: 'For serious traders who want the best analysis',
    icon: Crown,
    color: 'from-blue-500 to-purple-600',
    features: [
      { text: 'Unlimited analyses', included: true },
      { text: 'Advanced AI detection', included: true },
      { text: 'Priority processing', included: true },
      { text: 'Smart Money Concepts', included: true },
      { text: 'Detailed structure analysis', included: true },
      { text: 'Liquidity zone detection', included: true },
    ],
    cta: 'Upgrade to Pro',
    ctaLink: '/checkout',
    popular: true,
  },
];

export default function PricingPage() {
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

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
            >
              <Card className={`relative h-full overflow-hidden ${plan.popular ? 'border-primary/40' : ''}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                )}
                <CardContent className="p-5 sm:p-6 lg:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${plan.color}`}>
                      <plan.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">{plan.name}</h3>
                        {plan.popular && <Badge variant="default">Most Popular</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-8">{plan.description}</p>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-center gap-3 text-sm">
                        {f.included ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                        )}
                        <span className={f.included ? '' : 'text-muted-foreground/50'}>{f.text}</span>
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
                a: 'We support screenshots from TradingView, MetaTrader 5, cTrader, Deriv (including Boom, Crash, and Volatility indices), and any other trading platform.',
              },
              {
                q: 'How accurate is the AI analysis?',
                a: 'Our AI provides a confidence score with each analysis. It uses GPT-4 Vision to analyze price structure, but always use the analysis as one input in your trading decision, not as financial advice.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes, you can cancel your Pro subscription at any time. Your access will remain active until the end of the billing period.',
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
