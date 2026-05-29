'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Script from 'next/script';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Activity,
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

const heroCandles = [
  { left: '8%', bottom: '16%', height: 56, body: 18, bullish: true, delay: 0 },
  { left: '18%', bottom: '24%', height: 88, body: 28, bullish: false, delay: 0.18 },
  { left: '31%', bottom: '18%', height: 68, body: 22, bullish: true, delay: 0.32 },
  { left: '46%', bottom: '28%', height: 112, body: 34, bullish: true, delay: 0.08 },
  { left: '61%', bottom: '18%', height: 78, body: 24, bullish: false, delay: 0.26 },
  { left: '74%', bottom: '26%', height: 96, body: 30, bullish: true, delay: 0.14 },
  { left: '87%', bottom: '14%', height: 62, body: 20, bullish: false, delay: 0.38 },
];

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div {...reveal} transition={{ ...reveal.transition, delay }} className={className}>
      {children}
    </motion.div>
  );
}

function BullSilhouette() {
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="bull-fill" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(74,222,128,0.95)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0.38)" />
        </linearGradient>
      </defs>
      <path
        d="M19 72 C29 56, 47 49, 63 48 C75 33, 94 28, 116 30 C128 24, 142 22, 158 26 C166 19, 177 14, 194 12 C186 22, 184 31, 188 39 C197 46, 201 58, 197 71 C189 66, 183 66, 177 69 C170 74, 162 78, 149 79 C145 91, 138 102, 126 108 L118 108 C122 97, 122 88, 118 79 L96 79 C93 92, 87 102, 77 109 L68 109 C71 97, 71 87, 68 79 C51 78, 38 78, 27 84 C23 82, 20 77, 19 72 Z"
        fill="url(#bull-fill)"
        stroke="rgba(187,247,208,0.42)"
        strokeWidth="2"
      />
      <path d="M176 27 C184 22, 191 21, 198 24" fill="none" stroke="rgba(220,252,231,0.85)" strokeWidth="3" strokeLinecap="round" />
      <path d="M176 28 C181 15, 191 10, 205 8" fill="none" stroke="rgba(220,252,231,0.85)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="162" cy="40" r="3.5" fill="rgba(236,253,245,0.95)" />
    </svg>
  );
}

function BearSilhouette() {
  return (
    <svg viewBox="0 0 220 120" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="bear-fill" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(251,113,133,0.95)" />
          <stop offset="100%" stopColor="rgba(244,63,94,0.34)" />
        </linearGradient>
      </defs>
      <path
        d="M202 74 C195 58, 182 49, 166 46 C155 32, 137 27, 116 30 C103 24, 88 24, 76 28 C67 20, 55 16, 41 16 C48 25, 50 34, 47 42 C37 47, 31 57, 30 70 C38 66, 45 67, 52 71 C59 77, 69 80, 83 81 C86 93, 94 102, 107 108 L116 108 C111 95, 111 86, 116 79 L138 79 C141 92, 148 102, 159 109 L169 109 C165 96, 165 86, 168 78 C182 77, 193 78, 202 74 Z"
        fill="url(#bear-fill)"
        stroke="rgba(254,205,211,0.4)"
        strokeWidth="2"
      />
      <circle cx="60" cy="30" r="8" fill="rgba(251,191,202,0.28)" stroke="rgba(255,228,230,0.5)" strokeWidth="2" />
      <circle cx="42" cy="29" r="7" fill="rgba(251,191,202,0.24)" stroke="rgba(255,228,230,0.5)" strokeWidth="2" />
      <circle cx="73" cy="42" r="3.5" fill="rgba(255,241,242,0.95)" />
    </svg>
  );
}

function MarketPulseScene() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.18 }}
      className="relative mx-auto w-full max-w-[32rem] lg:mx-0"
    >
      <div className="ambient-orb left-[8%] top-[10%] h-36 w-36 animate-glow-drift" />
      <div className="ambient-orb right-[2%] top-[30%] h-44 w-44 animate-float-slow" />

      <div className="relative overflow-hidden rounded-[34px] border border-[rgba(255,223,112,0.16)] bg-[radial-gradient(circle_at_top,rgba(255,223,112,0.14),transparent_34%),radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.16),transparent_28%),linear-gradient(180deg,rgba(10,16,30,0.96),rgba(8,13,26,0.88))] p-5 shadow-[0_28px_80px_rgba(2,6,23,0.48)] sm:p-6">
        <div className="hero-grid absolute inset-3 rounded-[28px] border border-white/6 opacity-30" />
        <div className="absolute inset-x-5 top-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/42">Market pressure theater</div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.06em] text-white">Bull vs Bear tug-of-war</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] uppercase tracking-[0.28em] text-[var(--gold-light)]">
            Live bias
          </div>
        </div>

        <div className="relative mt-24 h-[25rem] overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]">
          <div className="absolute inset-x-0 top-[28%] border-t border-dashed border-white/10" />
          <div className="absolute inset-x-0 top-[58%] border-t border-dashed border-white/10" />
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.18),rgba(255,255,255,0.04))]" />

          <motion.div
            animate={{ x: [0, 22, 0], y: [0, -6, 0], rotate: [-3, 1, -3], scale: [1.02, 1.08, 1.02] }}
            transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            className="absolute left-[-1.5rem] top-3 h-36 w-56"
          >
            <BullSilhouette />
            <div className="absolute -bottom-2 left-10 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-100 backdrop-blur">
              Bulls 61%
            </div>
          </motion.div>

          <motion.div
            animate={{ x: [0, -22, 0], y: [0, 6, 0], rotate: [3, -1, 3], scale: [1.02, 1.08, 1.02] }}
            transition={{ duration: 5.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut', delay: 0.25 }}
            className="absolute right-[-1.5rem] top-6 h-36 w-56"
          >
            <BearSilhouette />
            <div className="absolute -bottom-2 right-10 rounded-full border border-rose-300/25 bg-rose-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-100 backdrop-blur">
              Bears 39%
            </div>
          </motion.div>

          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            className="absolute left-[23%] top-[25.5%] h-[2px] w-[25%]"
          >
            <div className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,rgba(74,222,128,0.12),rgba(255,223,112,0.9))] shadow-[0_0_18px_rgba(255,223,112,0.28)]" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.18)_0_10px,transparent_10px_18px)] opacity-60" />
          </motion.div>

          <motion.div
            animate={{ x: [0, -10, 0] }}
            transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            className="absolute right-[23%] top-[27%] h-[2px] w-[25%]"
          >
            <div className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,rgba(255,223,112,0.9),rgba(251,113,133,0.12))] shadow-[0_0_18px_rgba(255,223,112,0.28)]" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.18)_0_10px,transparent_10px_18px)] opacity-60" />
          </motion.div>

          <motion.div
            animate={{ rotate: [-8, 8, -8], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            className="absolute left-1/2 top-[24.6%] h-5 w-5 -translate-x-1/2 rounded-full border border-[rgba(255,223,112,0.42)] bg-[radial-gradient(circle,rgba(255,223,112,0.95),rgba(255,223,112,0.35))] shadow-[0_0_22px_rgba(255,223,112,0.45)]"
          />

          <motion.div
            animate={{ x: ['-4%', '4%', '-4%'] }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            className="absolute bottom-8 left-[12%] right-[12%] h-3 rounded-full bg-white/6"
          >
            <div className="absolute left-0 top-0 h-full w-[56%] rounded-full bg-[linear-gradient(90deg,rgba(16,185,129,0.75),rgba(255,223,112,0.9),rgba(244,63,94,0.72))]" />
          </motion.div>

          <motion.div
            animate={{ y: [0, -10, 0], scaleY: [1, 1.06, 0.96, 1], boxShadow: ['0 0 0 rgba(52,211,153,0.0)', '0 0 30px rgba(52,211,153,0.28)', '0 0 18px rgba(248,113,113,0.24)', '0 0 0 rgba(52,211,153,0.0)'] }}
            transition={{ duration: 3.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            className="absolute left-1/2 top-[18%] h-[13.5rem] w-12 -translate-x-1/2"
          >
            <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgba(248,113,113,0.95),rgba(250,204,21,0.95),rgba(52,211,153,0.95))]" />
            <motion.div
              animate={{ background: ['linear-gradient(180deg,rgba(52,211,153,0.92),rgba(16,185,129,0.72))', 'linear-gradient(180deg,rgba(248,113,113,0.92),rgba(244,63,94,0.72))', 'linear-gradient(180deg,rgba(52,211,153,0.92),rgba(16,185,129,0.72))'] }}
              transition={{ duration: 3.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              className="absolute left-1/2 top-[26%] h-[6.75rem] w-12 -translate-x-1/2 rounded-[18px] border border-white/10"
            />
          </motion.div>

          {heroCandles.map((candle) => (
            <motion.div
              key={`${candle.left}-${candle.height}`}
              animate={{ y: [0, candle.bullish ? -16 : 12, 0], rotate: candle.bullish ? [-1, 1, -1] : [1, -1, 1] }}
              transition={{ duration: candle.bullish ? 4.2 : 4.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut', delay: candle.delay }}
              className="absolute"
              style={{ left: candle.left, bottom: candle.bottom }}
            >
              <div className="relative flex w-6 justify-center" style={{ height: `${candle.height}px` }}>
                <div className={`absolute left-1/2 top-0 h-full w-px -translate-x-1/2 ${candle.bullish ? 'bg-emerald-300/90' : 'bg-rose-300/90'}`} />
                <div
                  className={`absolute left-1/2 top-1/2 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border ${candle.bullish ? 'border-emerald-300/30 bg-[linear-gradient(180deg,rgba(16,185,129,0.88),rgba(74,222,128,0.48))]' : 'border-rose-300/30 bg-[linear-gradient(180deg,rgba(251,113,133,0.88),rgba(244,63,94,0.48))]'}`}
                  style={{ height: `${candle.body}px` }}
                />
              </div>
            </motion.div>
          ))}

          <motion.div
            animate={{ pathLength: [0.25, 0.95, 0.35], opacity: [0.35, 0.9, 0.45] }}
            transition={{ duration: 4.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            className="absolute inset-x-8 bottom-20 top-24"
          >
            <svg viewBox="0 0 420 220" className="h-full w-full">
              <defs>
                <linearGradient id="hero-flow" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="rgba(96,165,250,0.2)" />
                  <stop offset="45%" stopColor="rgba(255,223,112,0.95)" />
                  <stop offset="100%" stopColor="rgba(52,211,153,0.25)" />
                </linearGradient>
              </defs>
              <motion.path
                d="M10 150 C60 170, 110 70, 165 98 S270 188, 320 124 S380 44, 410 72"
                fill="none"
                stroke="url(#hero-flow)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>

          <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-3">
            {[
              { icon: CandlestickChart, label: 'Structure', value: 'BOS + sweep' },
              { icon: Activity, label: 'Momentum', value: 'Volatility rising' },
              { icon: Target, label: 'Bias', value: 'Buyers in control' },
            ].map((item) => (
              <div key={item.label} className="rounded-[20px] border border-white/10 bg-black/20 p-3 backdrop-blur">
                <div className="flex items-center gap-2 text-[var(--gold-light)]">
                  <item.icon className="h-4 w-4" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/48">{item.label}</span>
                </div>
                <div className="mt-2 text-sm font-medium text-white/88">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
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

            <MarketPulseScene />
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
