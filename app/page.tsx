'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Script from 'next/script';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bot,
  BrainCircuit,
  CandlestickChart,
  CheckCircle2,
  ChevronRight,
  Crown,
  Eye,
  Layers3,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Waves,
  Zap,
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const StrategyShowcase = dynamic(() => import('@/components/StrategyShowcase'), {
  ssr: false,
  loading: () => <div className="page-shell py-12"><div className="mobile-card h-72 animate-pulse" /></div>,
});

declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (element: Element, forceReload?: boolean) => void;
    };
  }
}

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.4, ease: 'easeOut' },
};

const marketMetrics = [
  { label: 'ORION models online', value: '14', tone: 'text-white' },
  { label: 'Mentor confidence', value: '98.2%', tone: 'text-[var(--gold-light)]' },
  { label: 'Worker latency', value: '132ms', tone: 'text-cyan-300' },
  { label: 'Charts analyzed', value: '28,491', tone: 'text-white' },
];

const featureColumns = [
  {
    title: 'Institutional AI chart analysis',
    description: 'Upload a chart and get BOS, CHOCH, FVG, liquidity sweeps, supply and demand zones, premium and discount context, and directional bias built for disciplined decision-making.',
    icon: BrainCircuit,
  },
  {
    title: 'Trade intelligence and market understanding',
    description: 'Use the same workflow on desktop or mobile when you need clearer session context, stronger invalidation logic, and better execution planning.',
    icon: Radar,
  },
  {
    title: 'Mentorship, tracking, and development',
    description: 'Move from analysis into execution planning and review loops that help you become more consistent over time.',
    icon: Crown,
  },
];

const platformSurfaces = [
  {
    title: 'AI Analysis',
    subtitle: 'Upload charts, read structure, and review directional bias, volatility, and execution context in one flow.',
    icon: Eye,
  },
  {
    title: 'Institutional Dashboard',
    subtitle: 'Track market pulse, active tools, opportunity quality, and workspace intelligence from one platform.',
    icon: Layers3,
  },
  {
    title: 'Live Analysis',
    subtitle: 'Follow live chart structure with key zones, liquidity behavior, and execution timing context.',
    icon: CandlestickChart,
  },
  {
    title: 'Trader Operating System',
    subtitle: 'Move between command center, journaling, support, and operational controls without clutter.',
    icon: ShieldCheck,
  },
];

const goldxModes = [
  { mode: 'Day', summary: 'Focus on active intraday gold conditions when you want sharper session-based filtering.' },
  { mode: 'Night', summary: 'Reduce noise during quieter hours with behavior tuned for overnight market conditions.' },
  { mode: 'Hybrid', summary: 'Balance speed and protection when you want one mode that can adapt across changing conditions.' },
  { mode: 'All Session', summary: 'Keep GoldX operating across the full trading day when you want continuous coverage.' },
];

const pricing = [
  {
    name: 'Free',
    price: '$0',
    detail: 'For validation before committing capital',
    cta: 'Start Free',
    href: '/analyze',
    variant: 'outline' as const,
    features: ['Daily chart analyses', 'Core structure reading', 'Mobile analysis flow'],
  },
  {
    name: 'Pro',
    price: '$19.95',
    detail: 'For serious discretionary traders',
    cta: 'Upgrade to Pro',
    href: '/checkout?plan=PRO',
    variant: 'gradient' as const,
    featured: true,
    features: ['Advanced SMC detection', 'Priority analysis queue', 'Confidence-led trade plans'],
  },
  {
    name: 'GoldX',
    price: '$129.95',
    detail: 'For elite XAUUSD automation',
    cta: 'Explore GoldX',
    href: '/pricing#goldx',
    variant: 'glow' as const,
    features: ['Mode switching', 'Live execution metrics', 'Server-side strategy engine'],
  },
];

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div {...reveal} transition={{ ...reveal.transition, delay }} className={className}>
      {children}
    </motion.div>
  );
}

function CommandDeck() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.18 }}
      className="relative mx-auto w-full max-w-[28rem] lg:mx-0"
    >
      <div className="ambient-orb left-[12%] top-[12%] h-40 w-40 animate-glow-drift" />
      <Card className="overflow-hidden rounded-[32px] border-[rgba(255,223,112,0.22)]">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="metric-label">TradeVision AI - Institutional Trading Intelligence</div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-white">ORION AI command cockpit</div>
            </div>
            <div className="rounded-2xl border border-[rgba(255,223,112,0.18)] bg-[rgba(255,223,112,0.08)] px-3 py-2 font-mono text-xs text-[var(--gold-light)]">
              LIVE
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {marketMetrics.map((metric) => (
              <div key={metric.label} className="mobile-card rounded-[24px] p-4">
                <div className="metric-label">{metric.label}</div>
                <div className={`mt-3 font-mono text-2xl font-semibold tracking-[-0.06em] ${metric.tone}`}>{metric.value}</div>
              </div>
            ))}
          </div>

          <div className="mobile-card rounded-[24px] p-4">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              <span>Live execution map</span>
              <span>GoldX hybrid</span>
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-4">
              <div className="space-y-3">
                {[
                  ['BOS confirmed', '0.91'],
                  ['Liquidity sweep', '0.84'],
                  ['Entry precision', '0.88'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between text-xs text-white/72">
                      <span>{label}</span>
                      <span className="font-mono">{value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/6">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,#7a5b14,#d4af37,#ffd700)]" style={{ width: `${Number(value) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex w-24 flex-col justify-between rounded-[22px] border border-white/10 bg-black/20 p-3 text-right">
                <div>
                  <div className="metric-label">Active bots</div>
                  <div className="mt-1 font-mono text-2xl text-white">24</div>
                </div>
                <div>
                  <div className="metric-label">Health</div>
                  <div className="mt-1 text-sm text-emerald-300">Nominal</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const trustpilotRef = useRef<HTMLDivElement | null>(null);
  const [isTrustpilotReady, setIsTrustpilotReady] = useState(false);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);

  useEffect(() => {
    if (!isTrustpilotReady || !trustpilotRef.current || !window.Trustpilot) {
      return;
    }

    window.Trustpilot.loadFromElement(trustpilotRef.current, true);
  }, [isTrustpilotReady]);

  return (
    <div className="relative overflow-x-hidden">
      <Script
        src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
        strategy="afterInteractive"
        onLoad={() => setIsTrustpilotReady(true)}
      />

      <section ref={heroRef} className="relative overflow-hidden pb-12 pt-6 sm:pb-16 lg:pb-24 lg:pt-10">
        <motion.div style={{ y: heroY }} className="absolute inset-0 pointer-events-none">
          <div className="ambient-orb left-[-8%] top-[10%] h-72 w-72 animate-glow-drift" />
          <div className="ambient-orb right-[-10%] top-[30%] h-96 w-96 animate-float-slow" />
          <div className="hero-grid absolute inset-x-4 top-10 h-[34rem] rounded-[36px] border border-[rgba(255,223,112,0.08)] opacity-40 sm:inset-x-8 lg:inset-x-16" />
        </motion.div>

        <div className="page-shell relative z-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div className="space-y-6 pt-6 sm:pt-10 lg:pt-16">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <BrandLogo className="mb-6" />
                <Badge className="px-4 py-2 text-[11px]" variant="default">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  AI analysis, GoldX automation, and live trader tools
                </Badge>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}>
                <h1 className="max-w-3xl text-[2.6rem] font-bold leading-[0.95] tracking-[-0.08em] text-white sm:text-[3.6rem] lg:text-[5.4rem]">
                  Read the chart,
                  <span className="text-gradient"> plan the trade,</span>
                  and execute with more clarity.
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base sm:leading-8 lg:text-lg">
                  TradeVision AI turns screenshots and market structure into institutional trading intelligence. Use ORION AI to understand trend, liquidity, opportunity quality, execution planning, and trader development without turning the platform into a signal feed.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.14 }} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/analyze" className="w-full sm:w-auto">
                  <Button variant="gradient" size="xl" className="w-full gap-2 sm:w-auto">
                    Analyze a Live Chart
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing" className="w-full sm:w-auto">
                  <Button variant="outline" size="xl" className="w-full gap-2 sm:w-auto">
                    Explore Platform
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {marketMetrics.map((metric) => (
                  <div key={metric.label} className="mobile-card rounded-[24px] p-4">
                    <div className="metric-label">{metric.label}</div>
                    <div className={`mt-2 font-mono text-xl font-semibold tracking-[-0.06em] sm:text-2xl ${metric.tone}`}>{metric.value}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            <CommandDeck />
          </div>
        </div>
      </section>

      <section className="border-y border-[rgba(255,223,112,0.08)] bg-[linear-gradient(90deg,rgba(255,223,112,0.04),rgba(255,255,255,0.02),rgba(255,223,112,0.04))] py-3">
        <div className="page-shell overflow-hidden">
          <div className="marquee-track flex min-w-max items-center gap-8 whitespace-nowrap text-xs uppercase tracking-[0.28em] text-white/56 sm:text-sm">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center gap-8 pr-8">
                {['AI chart analysis', 'ORION mentor guidance', 'Execution planning', 'Command center intelligence', 'Trade journaling', 'Session analysis'].map((item) => (
                  <span key={`${copy}-${item}`} className="inline-flex items-center gap-3">
                    <span>{item}</span>
                    <span className="text-[var(--gold-light)]">•</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell page-stack">
        <Reveal className="mb-10 text-center sm:mb-14">
          <Badge variant="outline">What You Get</Badge>
          <h2 className="premium-heading mt-4">One platform for analysis, execution planning, and trader development</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
            TradeVision AI is built to help you understand the setup, avoid impulsive entries, and operate with clearer structure whether you are analyzing charts, planning execution, or refining your process.
          </p>
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-3">
          {featureColumns.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.08}>
              <Card className="h-full">
                <CardContent className="p-6 sm:p-7">
                  <div className="mb-6 inline-flex rounded-[22px] border border-[rgba(255,223,112,0.18)] bg-[rgba(255,223,112,0.08)] p-4 text-[var(--gold-light)]">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-[-0.05em] text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/68">{feature.description}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="page-shell page-stack">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <Card className="h-full overflow-hidden">
              <CardContent className="p-6 sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Badge variant="default">Platform suite</Badge>
                    <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">Use the right workspace for each part of the trade</h2>
                  </div>
                  <div className="hidden rounded-[24px] border border-[rgba(255,223,112,0.16)] bg-[rgba(255,223,112,0.06)] p-4 text-[var(--gold-light)] md:block">
                    <Layers3 className="h-8 w-8" />
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {platformSurfaces.map((surface) => (
                    <div key={surface.title} className="mobile-card rounded-[26px] p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[var(--gold-light)]">
                          <surface.icon className="h-5 w-5" />
                        </div>
                        <div className="metric-label">Workspace</div>
                      </div>
                      <div className="mt-5 text-xl font-semibold tracking-[-0.05em] text-white">{surface.title}</div>
                      <p className="mt-2 text-sm leading-6 text-white/66">{surface.subtitle}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.08}>
            <Card className="h-full">
              <CardContent className="p-6 sm:p-7">
                <Badge variant="outline">Analysis journey</Badge>
                <div className="mt-5 space-y-4">
                  {[
                    ['01', 'Upload or snap a chart', 'Send charts from MT5, TradingView, Deriv, or your phone and start analysis without a complicated setup.'],
                    ['02', 'Get a structured trade read', 'Review trend, structure, zones, confirmation needs, invalidation, and scenario context without guessing what the chart is doing.'],
                    ['03', 'Execute with more discipline', 'Use replay, reaction challenge, and follow-up tools to slow down bad decisions and validate better entries.'],
                  ].map(([step, title, copy]) => (
                    <div key={step} className="mobile-card rounded-[24px] p-5">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl border border-[rgba(255,223,112,0.16)] bg-[rgba(255,223,112,0.08)] px-3 py-2 font-mono text-sm text-[var(--gold-light)]">{step}</div>
                        <div>
                          <div className="text-lg font-semibold tracking-[-0.04em] text-white">{title}</div>
                          <p className="mt-2 text-sm leading-6 text-white/66">{copy}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      <StrategyShowcase />

      <section className="page-shell page-stack">
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal>
            <Card className="h-full overflow-hidden border-[rgba(255,223,112,0.24)]">
              <CardContent className="p-6 sm:p-7">
                <Badge variant="default">GoldX</Badge>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">Automate XAUUSD with more control</h2>
                <p className="mt-4 text-sm leading-7 text-white/66 sm:text-base">
                  GoldX gives gold traders a dedicated automation workspace with mode switching, execution tracking, and account visibility so you can manage how the bot behaves instead of running it blind.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {[
                    ['Live bots', '24'],
                    ['Exec / hr', '183'],
                    ['Success', '92.4%'],
                    ['Mode shifts', '11'],
                  ].map(([label, value]) => (
                    <div key={label} className="mobile-card rounded-[24px] p-4">
                      <div className="metric-label">{label}</div>
                      <div className="mt-2 font-mono text-2xl text-white">{value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {goldxModes.map((item, index) => (
              <Reveal key={item.mode} delay={index * 0.08}>
                <Card className="h-full">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-xl font-semibold tracking-[-0.05em] text-white">{item.mode}</div>
                      <div className="rounded-full border border-[rgba(255,223,112,0.16)] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[var(--gold-light)]">Gold mode</div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-white/66">{item.summary}</p>
                    <div className="mt-6 h-32 rounded-[24px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(245,217,123,0.18),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]" />
                  </CardContent>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell page-stack">
        <Reveal className="mb-10 text-center sm:mb-14">
          <Badge variant="outline">Pricing</Badge>
          <h2 className="premium-heading mt-4">Choose the level that matches how you trade</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
            Start free to test chart analysis, move to Pro for deeper trade planning tools, or use GoldX when you want automated XAUUSD execution support.
          </p>
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-3">
          {pricing.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 0.08}>
              <Card className={plan.featured ? 'border-[rgba(255,223,112,0.34)] shadow-luxe-strong' : ''}>
                <CardContent className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-2xl font-semibold tracking-[-0.05em] text-white">{plan.name}</div>
                      <p className="mt-2 text-sm leading-6 text-white/62">{plan.detail}</p>
                    </div>
                    {plan.featured ? <Badge variant="default">Most popular</Badge> : null}
                  </div>
                  <div className="mt-8 flex items-end gap-2">
                    <div className="font-mono text-5xl font-semibold tracking-[-0.08em] text-white">{plan.price}</div>
                    <div className="pb-1 text-sm uppercase tracking-[0.24em] text-muted-foreground">/ month</div>
                  </div>
                  <div className="luxury-divider my-7" />
                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-sm text-white/76">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link href={plan.href} className="mt-8 block">
                    <Button variant={plan.variant} size="xl" className="w-full gap-2">
                      {plan.cta}
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="page-shell page-stack">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <Card className="h-full">
              <CardContent className="p-6 sm:p-7">
                <Badge variant="outline">Trust and proof</Badge>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">Built to help traders make better decisions</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/66 sm:text-base">
                  The goal is simple: help you read the chart faster, keep your execution disciplined, and give you enough context to avoid low-quality trades.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    ['Trade clarity', 'Trend, zones, confirmations, and invalidation in one readout'],
                    ['Execution discipline', 'Replay and reaction tools that slow down impulsive entries'],
                    ['Cross-device access', 'Analyze and manage trades from desktop or mobile'],
                    ['Operational depth', 'Admin, billing, GoldX, and trader workspaces under one platform'],
                  ].map(([title, copy]) => (
                    <div key={title} className="mobile-card rounded-[22px] p-4">
                      <div className="text-sm font-semibold text-white">{title}</div>
                      <div className="mt-2 text-sm text-white/62">{copy}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.08}>
            <Card className="h-full overflow-hidden bg-[linear-gradient(135deg,rgba(245,217,123,0.08),rgba(255,255,255,0.02),rgba(0,0,0,0.3))]">
              <CardContent className="grid h-full gap-8 p-6 sm:p-7">
                <div>
                  <Badge variant="default">Trustpilot</Badge>
                  <p className="mt-4 text-sm leading-7 text-white/66">If TradeVision has helped you read setups better or trade with more discipline, leave a public review so other traders can judge it from real user experience.</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/95 p-4 shadow-2xl shadow-black/25">
                  <div
                    ref={trustpilotRef}
                    className="trustpilot-widget"
                    data-locale="en-US"
                    data-template-id="56278e9abfbbba0bdcd568bc"
                    data-businessunit-id="69c7fb278c2ccae1dd2d6d52"
                    data-style-height="52px"
                    data-style-width="100%"
                    data-token="b44c0529-4e65-4de9-a545-e63c92140fe7"
                  >
                    <a href="https://www.trustpilot.com/review/mytradevision.online" target="_blank" rel="noopener noreferrer">
                      Trustpilot
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="page-shell pb-12 pt-2 sm:pb-16 lg:pb-24">
        <Reveal>
          <Card className="overflow-hidden border-[rgba(255,223,112,0.3)]">
            <CardContent className="relative p-6 text-center sm:p-10 lg:p-14">
              <div className="ambient-orb left-[10%] top-[20%] h-40 w-40" />
              <div className="ambient-orb right-[8%] top-[12%] h-52 w-52" />
                <Badge variant="default">TradeVision</Badge>
              <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl lg:text-5xl">
                Use AI to understand the chart faster and trade with a clearer plan.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                Start with a chart upload, explore the plan that fits your style, or move straight into GoldX if you want dedicated gold automation.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/analyze">
                  <Button variant="gradient" size="xl" className="w-full gap-2 sm:w-auto">
                    Enter the Platform
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/goldx/setup">
                  <Button variant="outline" size="xl" className="w-full gap-2 sm:w-auto">
                    Explore GoldX
                    <Zap className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </section>

      <style jsx>{`
        .marquee-track {
          animation: landing-marquee 30s linear infinite;
        }

        @keyframes landing-marquee {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
