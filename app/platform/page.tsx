'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Brain,
  Compass,
  Crown,
  Eye,
  Layers3,
  Radar,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const coreFlow = [
  {
    step: 'Step 1',
    title: 'Upload A Chart Or Open A Live Workspace',
    detail: 'Start with a screenshot from MT5, TradingView, or Deriv, or move directly into the live tools if you already know the market you want to track.',
    icon: Upload,
  },
  {
    step: 'Step 2',
    title: 'Receive Structured AI Analysis',
    detail: 'TradeVision reads market structure, direction, zones, bias, confirmations, invalidation, and trade narrative instead of giving you a vague prediction.',
    icon: Brain,
  },
  {
    step: 'Step 3',
    title: 'Turn Analysis Into A Trade Plan',
    detail: 'Use the output to decide whether to enter instantly, wait for confirmation, avoid the setup, or track it inside the command tools.',
    icon: Target,
  },
  {
    step: 'Step 4',
    title: 'Refine, Monitor, And Execute',
    detail: 'Use command-center style workflows, Trade Radar, scanners, live chart spaces, and GoldX when you want tighter execution support or automation.',
    icon: TrendingUp,
  },
];

const featureGuide = [
  {
    title: 'AI Chart Analysis',
    icon: Brain,
    tone: 'from-cyan-500/20 to-sky-500/5',
    audience: 'Available now, expanded with paid plans',
    description: 'The foundation of the platform. Upload a chart and get structured trade context instead of random commentary.',
    steps: [
      'Open Analyze and upload a clear chart screenshot.',
      'Review bias, confidence, zones, structure, confirmations, and invalidation levels.',
      'Use the entry guidance to decide whether the setup is instant, pending, or better skipped.',
    ],
  },
  {
    title: 'Trade Command Center',
    icon: Compass,
    tone: 'from-emerald-500/20 to-teal-500/5',
    audience: 'Best for active setup management',
    description: 'This gives a more operational view of a trade idea: timing, confidence reasons, live state, SL/TP guidance, and invalidation logic.',
    steps: [
      'Open a tracked or analyzed trade inside the command center.',
      'Read the readiness state, timing cues, and current market status before entering.',
      'Use it as the bridge between analysis and disciplined execution.',
    ],
  },
  {
    title: 'Trade Radar',
    icon: Radar,
    tone: 'from-fuchsia-500/20 to-violet-500/5',
    audience: 'Built for traders who want monitoring after analysis',
    description: 'Radar helps you keep watch on setups that are not ready yet so you do not have to re-analyze the same idea manually every few minutes.',
    steps: [
      'Add a promising setup to Trade Radar.',
      'Monitor its state as price approaches the entry zone or loses validity.',
      'Open the trade again from Radar when conditions improve or trigger.',
    ],
  },
  {
    title: 'Live Chart Workspaces',
    icon: Eye,
    tone: 'from-amber-500/20 to-orange-500/5',
    audience: 'Useful when you want live context instead of static screenshots',
    description: 'The live workspaces help you follow the market while keeping TradeVision decision support close to the chart.',
    steps: [
      'Open TradingView or Deriv live workspaces from the dashboard.',
      'Watch price action while comparing it against your active setups and analysis logic.',
      'Use it as your live execution desk after the AI has done the structural reading.',
    ],
  },
  {
    title: 'Smart Session Scanner',
    icon: Zap,
    tone: 'from-rose-500/20 to-red-500/5',
    audience: 'Premium scanning workflow',
    description: 'The scanner searches for higher-quality opportunities during the key trading windows so you spend less time hunting and more time filtering.',
    steps: [
      'Choose the scanner session that fits your market routine.',
      'Review ranked setups with context, confirmations, and trigger logic.',
      'Open the best ideas in chart, replay, or command-center views before committing capital.',
    ],
  },
  {
    title: 'GoldX',
    icon: Shield,
    tone: 'from-yellow-500/20 to-amber-500/5',
    audience: 'Dedicated paid execution product',
    description: 'GoldX is the specialized Gold trading workspace and EA flow for traders who want structured automation, account-linked configuration, and platform-controlled execution support.',
    steps: [
      'Subscribe to GoldX and access the GoldX dashboard.',
      'Configure mode, lot behavior, and operational settings from the dashboard.',
      'Connect the EA, sync settings in real time, and manage the full workflow from the platform.',
    ],
  },
];

const paidPlans = [
  {
    name: 'PRO',
    href: '/checkout?plan=PRO',
    icon: Crown,
    color: 'from-blue-500 to-purple-600',
    description: 'For traders who want deeper AI chart analysis without staying on the free tier.',
    features: [
      '300 analyses per month',
      'Advanced Smart Money Concepts',
      'Priority AI processing',
    ],
  },
  {
    name: 'PRO+',
    href: '/checkout?plan=TOP_TIER',
    icon: Zap,
    color: 'from-fuchsia-500 via-violet-500 to-cyan-500',
    description: 'For traders who want the strongest decision workflow with faster tools and premium setup support.',
    features: [
      '500 analyses per month',
      'Smart Session Scanner',
      'Instant trade setups',
      'Advanced entry precision',
      'Faster response time',
    ],
  },
  {
    name: 'GoldX',
    href: '/goldx/checkout',
    icon: Shield,
    color: 'from-amber-500 to-yellow-600',
    description: 'For users who want the dedicated Gold execution ecosystem and EA workflow.',
    features: [
      'XAUUSD-focused trading system',
      'License-protected MT5 access',
      'Dashboard-controlled configuration',
      'Realtime EA sync and trading workspace',
    ],
  },
];

const quickStart = [
  'Create an account or sign in.',
  'Start with Analyze to understand how the platform reads a chart.',
  'Move winning or watchlist ideas into Trade Radar or the Command Center.',
  'Upgrade to PRO if you want higher usage and stronger core AI analysis.',
  'Upgrade to PRO+ if you want scanner workflows and faster premium execution support.',
  'Choose GoldX separately if you want the dedicated Gold trading system and EA flow.',
];

export default function PlatformPage() {
  return (
    <div className="page-stack min-h-screen overflow-x-hidden">
      <div className="page-shell max-w-7xl py-10 sm:py-14">
        <motion.section
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] px-6 py-10 shadow-[0_28px_100px_rgba(15,23,42,0.28)] sm:px-10 sm:py-14"
        >
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />

          <div className="relative max-w-4xl space-y-6">
            <Badge variant="outline" className="border-cyan-300/20 bg-cyan-300/10 px-4 py-1.5 text-cyan-200">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Full Platform Guide
            </Badge>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
              A Clear Walkthrough Of <span className="text-gradient">How TradeVision Works</span>
            </h1>
            <p className="max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
              TradeVision is built to help traders move from raw chart screenshots to structured decisions, live monitoring, and premium workflows without guessing what to do next. This page shows what the platform does, how each feature fits into a trading routine, and which paid tools unlock the deeper workflow.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/analyze" className="w-full sm:w-auto">
                <Button size="xl" className="w-full gap-2 sm:w-auto">
                  Start With Analyze
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Compare Plans
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Structured, Not Generic',
              description: 'The platform breaks a trade down into zones, structure, momentum, invalidation, and decision quality instead of handing you shallow commentary.',
              icon: Layers3,
            },
            {
              title: 'Built Around Workflow',
              description: 'TradeVision is not only for chart uploads. It is built to support monitoring, scanning, trade review, and platform-guided execution decisions.',
              icon: Compass,
            },
            {
              title: 'Scales With Your Style',
              description: 'Stay on the core analysis flow, step into scanner and premium workflows, or move into GoldX when you want a dedicated execution product.',
              icon: Shield,
            },
          ].map((item) => (
            <Card key={item.title} className="border-white/10 bg-white/5">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-cyan-300 ring-1 ring-white/10">
                  <item.icon className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-16">
          <div className="mb-8 max-w-3xl">
            <Badge variant="outline">Step By Step</Badge>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">The Core Platform Flow</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              If you are new, follow this exact sequence. It gives you the fastest path from curiosity to confidence.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {coreFlow.map((item, index) => (
              <motion.div key={item.title} initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className="h-full border-white/10 bg-white/5">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">{item.step}</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">{item.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.detail}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-8 max-w-3xl">
            <Badge variant="outline">Feature Guide</Badge>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">How To Use Each Major Feature</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              Each feature exists for a specific job. The best results come from using them in the right sequence rather than treating every tool the same way.
            </p>
          </div>

          <div className="space-y-5">
            {featureGuide.map((feature) => (
              <Card key={feature.title} className="overflow-hidden border-white/10 bg-white/5">
                <CardContent className="p-0">
                  <div className={`grid gap-0 lg:grid-cols-[0.9fr_1.1fr]`}>
                    <div className={`border-b border-white/10 bg-gradient-to-br ${feature.tone} p-6 lg:border-b-0 lg:border-r`}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/20 text-white ring-1 ring-white/10">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{feature.audience}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">{feature.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-slate-200">{feature.description}</p>
                    </div>
                    <div className="p-6">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Step By Step</h4>
                      <div className="mt-4 space-y-3">
                        {feature.steps.map((step, index) => (
                          <div key={step} className="rounded-2xl border border-white/10 bg-background/40 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Step {index + 1}</p>
                            <p className="mt-2 text-sm leading-7 text-slate-200">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02))]">
            <CardContent className="p-6 sm:p-8">
              <Badge variant="outline">Quick Start</Badge>
              <h2 className="mt-4 text-2xl font-bold">If You Want A Simple Path</h2>
              <div className="mt-6 space-y-3">
                {quickStart.map((item, index) => (
                  <div key={item} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-[radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.12),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.02))]">
            <CardContent className="p-6 sm:p-8">
              <Badge variant="outline">What Paid Plans Unlock</Badge>
              <h2 className="mt-4 text-2xl font-bold">Premium Features And Checkout Paths</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Each plan expands the platform in a different way. Choose based on the workflow you want to operate, not only the price point.
              </p>
              <div className="mt-6 grid gap-4">
                {paidPlans.map((plan) => (
                  <div key={plan.name} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.color} text-white`}>
                          <plan.icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                          <p className="mt-2 text-sm leading-7 text-muted-foreground">{plan.description}</p>
                        </div>
                      </div>
                      <Link href={plan.href} className="w-full sm:w-auto">
                        <Button className="w-full gap-2 sm:w-auto">
                          Go To Checkout
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {plan.features.map((feature) => (
                        <div key={feature} className="rounded-xl border border-white/10 bg-background/40 px-4 py-3 text-sm text-slate-200">
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-16 overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.12),_transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-8 text-center shadow-[0_24px_90px_rgba(15,23,42,0.26)] sm:p-10">
          <div className="mx-auto max-w-3xl">
            <Badge variant="outline" className="border-white/15 bg-white/5">Ready To Use The Platform Properly?</Badge>
            <h2 className="mt-4 text-2xl font-bold sm:text-4xl">Start With The Right Workflow, Then Upgrade When The Workflow Demands It</h2>
            <p className="mt-4 text-sm leading-8 text-slate-200 sm:text-base">
              The strongest results usually come from understanding the free and core analysis flow first, then adding premium tools only when you want more speed, more structure, or more automation.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/analyze" className="w-full sm:w-auto">
                <Button size="xl" className="w-full gap-2 sm:w-auto">
                  Try The Analysis Flow
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  View Pricing And Plans
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}