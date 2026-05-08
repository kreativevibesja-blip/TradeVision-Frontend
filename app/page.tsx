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
  { label: 'AI models online', value: '14', tone: 'text-white' },
  { label: 'Confidence engine', value: '98.2%', tone: 'text-[var(--gold-light)]' },
  { label: 'Live scanner latency', value: '132ms', tone: 'text-emerald-300' },
  { label: 'GoldX executions', value: '28,491', tone: 'text-white' },
];

const featureColumns = [
  {
    title: 'Institutional chart intelligence',
    description: 'BOS, CHOCH, FVG, liquidity sweeps, supply-demand zones, and scenario context appear like a trading desk tool, not a marketing widget.',
    icon: BrainCircuit,
  },
  {
    title: 'Mobile-first command center',
    description: 'Every core surface collapses into tactile, swipe-friendly modules with dense metrics, fast thumb actions, and clean hierarchy on iPhone-sized screens.',
    icon: Radar,
  },
  {
    title: 'Premium GoldX ecosystem',
    description: 'GoldX modes, bot activity, execution counters, and performance surfaces are framed like an elite quant product with cinematic depth.',
    icon: Crown,
  },
];

const platformSurfaces = [
  {
    title: 'AI Analysis',
    subtitle: 'Staged reveal, replay, confidence, reaction challenge',
    icon: Eye,
  },
  {
    title: 'Dashboard',
    subtitle: 'Portfolio, sentiment, scanners, models online, signals',
    icon: Layers3,
  },
  {
    title: 'Live Charts',
    subtitle: 'Cinematic overlays for BOS, CHOCH, liquidity, FVG',
    icon: CandlestickChart,
  },
  {
    title: 'Admin Command',
    subtitle: 'Subscriptions, errors, licenses, system health, GoldX bots',
    icon: ShieldCheck,
  },
];

const goldxModes = [
  { mode: 'Day', summary: 'Sharp intraday filtering with aggressive session bias.' },
  { mode: 'Night', summary: 'Low-noise gold flow tuned for overnight execution windows.' },
  { mode: 'Hybrid', summary: 'Balanced control layer blending speed, protection, and confluence.' },
  { mode: 'All Session', summary: 'Persistent orchestration for prop-style, round-the-clock coverage.' },
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
              <div className="metric-label">TradeVision premium stack</div>
              <div className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-white">Institutional AI cockpit</div>
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
                  Premium 3D trading intelligence
                </Badge>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08 }}>
                <h1 className="max-w-3xl text-[2.6rem] font-bold leading-[0.95] tracking-[-0.08em] text-white sm:text-[3.6rem] lg:text-[5.4rem]">
                  The trading platform that looks and feels
                  <span className="text-gradient"> institutional.</span>
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base sm:leading-8 lg:text-lg">
                  TradeVision is rebuilt as a cinematic AI command surface: live chart analysis, GoldX automation, premium dashboards, and admin controls wrapped in deep glass layers, sharp metrics, and luxury motion.
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
                    View Pricing
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
                {['Bloomberg-grade hierarchy', 'GoldX automation', 'AI confidence engine', 'Live session scanner', 'Mobile-first command center', 'Admin control surface'].map((item) => (
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
          <Badge variant="outline">Design language</Badge>
          <h2 className="premium-heading mt-4">A premium stack for every core surface</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
            The redesign is structured like a luxury fintech product system: disciplined typography, terminal density, cinematic surfaces, and motion with control rather than noise.
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
                    <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">Every screen rebuilt as a luxury command layer</h2>
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
                        <div className="metric-label">Premium</div>
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
                    ['01', 'Upload or snap a chart', 'Fast mobile-first ingestion for MT5, TradingView, and Deriv screenshots.'],
                    ['02', 'AI stages the readout', 'Confidence, structure, liquidity, and scenarios reveal in sequence instead of dumping a wall of text.'],
                    ['03', 'Act with context', 'Replay, reaction challenge, and scenario simulator keep execution disciplined.'],
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
                <Badge variant="default">GoldX elite layer</Badge>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">GoldX now reads like an elite execution product</h2>
                <p className="mt-4 text-sm leading-7 text-white/66 sm:text-base">
                  Mode switching, bot activity, performance telemetry, and licensing context are framed with dramatic depth, restrained gold lighting, and tactile controls instead of flat promo cards.
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
                      <div className="rounded-full border border-[rgba(255,223,112,0.16)] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[var(--gold-light)]">3D mode</div>
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
          <h2 className="premium-heading mt-4">Luxury pricing, clear conversion</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
            The pricing experience is rebuilt to feel expensive and decisive: strong hierarchy, strong plan separation, and action surfaces that read like premium fintech.
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
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">Built to convert with proof, not noise</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/66 sm:text-base">
                  Strong visuals are paired with live metrics, premium hierarchy, and public social proof so the platform sells like a category leader rather than a tool bundle.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    ['Signal quality', 'Institutional context first'],
                    ['Mobile UX', 'Thumb-driven actions'],
                    ['Realtime theme control', 'Admin and user-level switching'],
                    ['Performance target', 'Lighthouse-oriented surface design'],
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
                  <p className="mt-4 text-sm leading-7 text-white/66">If TradeVision has improved your execution discipline, leave a public review so other traders can evaluate the product with real signal.</p>
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
              <Badge variant="default">TradeVision premium</Badge>
              <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl lg:text-5xl">
                A luxury trading experience should look expensive before it earns trust. Now it does both.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                Enter through analysis, pricing, GoldX, or the dashboard and the platform keeps the same premium visual logic across every surface.
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
