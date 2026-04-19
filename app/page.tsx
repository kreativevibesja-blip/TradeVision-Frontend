'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Script from 'next/script';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Upload,
  Brain,
  FileText,
  Zap,
  Eye,
  Target,
  TrendingUp,
  Radar,
  Shield,
  ArrowRight,
  ChevronDown,
  Star,
  CheckCircle2,
} from 'lucide-react';

const StrategyShowcase = dynamic(() => import('@/components/StrategyShowcase'), {
  ssr: false,
  loading: () => <div className="page-shell py-12"><div className="mobile-card h-72 animate-pulse" /></div>,
});

// Floating candlestick animation component
function FloatingCandlesticks() {
  const candles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    height: 20 + Math.random() * 60,
    delay: Math.random() * 5,
    duration: 4 + Math.random() * 4,
    isGreen: Math.random() > 0.5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {candles.map((c) => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.1, 0.3, 0.1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: c.duration,
            repeat: Infinity,
            delay: c.delay,
            ease: 'easeInOut',
          }}
        >
          {/* Wick */}
          <div
            className={`w-[2px] mx-auto ${c.isGreen ? 'bg-green-500/30' : 'bg-red-500/30'}`}
            style={{ height: c.height * 0.3 }}
          />
          {/* Body */}
          <div
            className={`w-3 rounded-sm ${c.isGreen ? 'bg-green-500/20' : 'bg-red-500/20'}`}
            style={{ height: c.height * 0.4 }}
          />
          {/* Wick bottom */}
          <div
            className={`w-[2px] mx-auto ${c.isGreen ? 'bg-green-500/30' : 'bg-red-500/30'}`}
            style={{ height: c.height * 0.3 }}
          />
        </motion.div>
      ))}
    </div>
  );
}

function CandlestickLoader() {
  return (
    <div className="flex items-end gap-1 h-16">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <motion.div
          key={i}
          className={`w-3 rounded-sm ${i % 2 === 0 ? 'bg-green-500' : 'bg-red-500'}`}
          animate={{ height: [10, 30 + Math.random() * 30, 10] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// Scroll reveal wrapper
const FadeInSection = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.28, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

const strategyTags = [
  'Smart Money Concepts',
  'Supply & Demand',
  'Liquidity Sweeps',
  'Fair Value Gaps (FVG)',
  'Break of Structure (BOS)',
  'Change of Character (CHoCH)',
  'Market Structure',
  'Trend Continuation',
  'Reversals',
  'Support & Resistance',
  'Order Blocks',
  'Momentum Analysis',
  'Multi-Timeframe Confluence',
  'Entry Precision',
  'Risk Management',
  'Institutional Trading Concepts',
];

declare global {
  interface Window {
    Trustpilot?: {
      loadFromElement: (element: Element, forceReload?: boolean) => void;
    };
  }
}

export default function HomePage() {
  const trustpilotRef = useRef<HTMLDivElement | null>(null);
  const [isTrustpilotReady, setIsTrustpilotReady] = useState(false);

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

      {/* ═══════ HERO SECTION ═══════ */}
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden py-10 sm:py-12">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-background to-purple-950/80" />
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px]"
            animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px]"
            animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <FloatingCandlesticks />
        </div>

        <div className="page-shell relative z-10 text-center">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            <Badge className="mb-6 px-4 py-1.5 text-sm" variant="outline">
              <Zap className="h-3 w-3 mr-1" />
              Mobile-first AI chart analysis
            </Badge>
          </motion.div>

          <motion.h1
            className="mx-auto mb-5 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.06 }}
          >
            AI That Understands{' '}
            <span className="text-gradient">Your Trading Charts</span>
          </motion.h1>

          <motion.p
            className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.12 }}
          >
            Upload any chart screenshot and get professional trading analysis instantly.
            Support for MetaTrader 5, TradingView, and Deriv charts including Boom, Crash, and Volatility indices.
          </motion.p>

          <motion.div
            className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:justify-center"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.16 }}
          >
            <Link href="/analyze" className="w-full sm:w-auto">
              <Button variant="glow" size="xl" className="group w-full gap-2 sm:w-auto">
                Analyze Your Chart
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button variant="outline" size="xl" className="w-full gap-2 sm:w-auto">
                See How It Works
                <ChevronDown className="h-5 w-5" />
              </Button>
            </a>
          </motion.div>

          {/* Animated candlestick visualization */}
          <motion.div
            className="mt-16 flex justify-center"
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.28, delay: 0.2 }}
          >
            <CandlestickLoader />
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-slate-700 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-3">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-slate-950 to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-slate-950 to-transparent sm:w-24" />

        <div className="group relative flex w-full overflow-hidden">
          <div className="marquee-track flex w-max min-w-max items-center gap-8 whitespace-nowrap pr-8 text-sm tracking-wide text-slate-300 sm:gap-10 sm:pr-10 sm:text-base [will-change:transform] group-hover:[animation-play-state:paused]">
            {[0, 1].map((copyIndex) => (
              <div key={copyIndex} className="flex items-center gap-8 sm:gap-10">
                {strategyTags.map((tag) => (
                  <div key={`${copyIndex}-${tag}`} className="flex items-center gap-8 sm:gap-10">
                    <span className="transition-colors duration-200 hover:text-white">{tag}</span>
                    <span className="text-slate-500">•</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how-it-works" className="relative py-16 sm:py-20 lg:py-24">
        <div className="page-shell">
          <FadeInSection className="text-center mb-16">
            <Badge className="mb-4" variant="outline">How It Works</Badge>
            <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl mb-4">
              Three Steps to a <span className="text-gradient">Trade Plan</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get from chart screenshot to actionable trade plan in seconds.
            </p>
          </FadeInSection>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 lg:gap-8">
            {[
              {
                icon: Upload,
                title: 'Upload Chart',
                desc: 'Drag and drop any chart screenshot from TradingView, MetaTrader 5, or Deriv.',
                color: 'from-blue-500 to-cyan-500',
                step: '01',
              },
              {
                icon: Brain,
                title: 'AI Reads Structure',
                desc: 'Our AI analyzes price action, market structure, liquidity zones, and key levels.',
                color: 'from-purple-500 to-pink-500',
                step: '02',
              },
              {
                icon: FileText,
                title: 'Get Trade Plan',
                desc: 'Receive a complete trade plan with entry, stop loss, take profits, and confidence score.',
                color: 'from-green-500 to-emerald-500',
                step: '03',
              },
            ].map((item, i) => (
              <FadeInSection key={item.step} delay={i * 0.15}>
                  <Card className="relative h-full overflow-hidden transition-all duration-200 group hover:border-white/20">
                  <CardContent className="p-5 text-center sm:p-6 lg:p-8">
                    <div className="text-6xl font-bold text-white/5 absolute top-4 right-4">
                      {item.step}
                    </div>
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${item.color} mb-6`}>
                      <item.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section className="relative bg-gradient-to-b from-transparent via-blue-950/20 to-transparent py-16 sm:py-20 lg:py-24">
        <div className="page-shell">
          <FadeInSection className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Features</Badge>
            <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl mb-4">
              Professional-Grade <span className="text-gradient">Analysis</span>
            </h2>
          </FadeInSection>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Eye, title: 'AI Chart Reading', desc: 'Vision AI understands candlesticks, patterns, and indicators visually.' },
              { icon: BarChart3, title: 'Structure Detection', desc: 'Identifies BOS, CHOCH, and market structure shifts automatically.' },
              { icon: Target, title: 'Liquidity Analysis', desc: 'Detects liquidity pools, stop hunts, and sweep zones.' },
              { icon: TrendingUp, title: 'Auto Entry & TP', desc: 'Calculates optimal entry, stop loss, and multiple take profit levels.' },
              { icon: Radar, title: 'Smart Session Scanner', desc: 'Monitors London & NY sessions in real time and alerts you to high-probability setups.' },
            ].map((feature, i) => (
              <FadeInSection key={feature.title} delay={i * 0.1}>
                <Card className="group hover:border-primary/30 hover:glow-blue transition-all duration-300 h-full">
                  <CardContent className="p-5 sm:p-6">
                    <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STRATEGY SHOWCASE ═══════ */}
      <StrategyShowcase />

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="bg-gradient-to-b from-transparent via-purple-950/20 to-transparent py-16 sm:py-20 lg:py-24">
        <div className="page-shell">
          <FadeInSection className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Testimonials</Badge>
            <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl mb-4">
              Trusted by <span className="text-gradient">Traders</span>
            </h2>
          </FadeInSection>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {[
              {
                name: 'Alex M.',
                role: 'Forex Trader',
                text: 'TradeVision AI saved me hours of analysis. The Smart Money detection is incredibly accurate for EURUSD.',
              },
              {
                name: 'Sarah K.',
                role: 'Deriv Trader',
                text: 'Finally something that understands Boom and Crash charts. The entry zones are spot on most of the time.',
              },
              {
                name: 'David P.',
                role: 'Swing Trader',
                text: 'The confidence score helps me filter my trades. My win rate improved significantly since using this tool.',
              },
            ].map((t, i) => (
              <FadeInSection key={t.name} delay={i * 0.15}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TRUSTPILOT ═══════ */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="page-shell">
          <FadeInSection>
            <Card className="mx-auto max-w-4xl overflow-hidden border-white/10 bg-gradient-to-br from-[#0b1f3a] via-slate-950 to-[#133b2c]">
              <CardContent className="grid gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-10">
                <div>
                  <Badge className="mb-4" variant="outline">Trustpilot</Badge>
                  <h2 className="text-2xl font-bold sm:text-3xl">Review us on Trustpilot</h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/70 sm:text-base">
                    If TradeVision AI has helped your chart analysis, leave a public review so other traders can see your experience.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/95 p-4 shadow-2xl shadow-black/20">
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
          </FadeInSection>
        </div>
      </section>

      {/* ═══════ PRICING PREVIEW ═══════ */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="page-shell">
          <FadeInSection className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Pricing</Badge>
            <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl lg:text-5xl mb-4">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h2>
          </FadeInSection>

          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 md:gap-6 lg:gap-8">
            <FadeInSection>
              <Card className="h-full">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-2">Free</h3>
                  <div className="text-4xl font-bold mb-4">$0<span className="text-lg text-muted-foreground font-normal">/month</span></div>
                  <ul className="space-y-3 mb-8">
                    {['2 analyses per day', 'Basic AI detection', 'Standard processing'].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/analyze" className="block">
                    <Button variant="outline" size="lg" className="w-full">Get Started Free</Button>
                  </Link>
                </CardContent>
              </Card>
            </FadeInSection>

            <FadeInSection delay={0.15}>
              <Card className="h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                <CardContent className="p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">Pro</h3>
                    <Badge variant="outline">Premium</Badge>
                  </div>
                  <div className="text-4xl font-bold mb-4">$19.95<span className="text-lg text-muted-foreground font-normal">/month</span></div>
                  <ul className="space-y-3 mb-8">
                    {[
                      '300 analyses per month',
                      'Advanced AI detection',
                      'Priority processing',
                      'Smart Money Concepts',
                      'Detailed structure analysis',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/checkout?plan=PRO" className="block">
                    <Button variant="gradient" size="lg" className="w-full">Upgrade to Pro</Button>
                  </Link>
                </CardContent>
              </Card>
            </FadeInSection>

            <FadeInSection delay={0.3}>
              <Card className="h-full border-primary/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                <CardContent className="p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">PRO+</h3>
                    <Badge variant="default">Smart Scanner</Badge>
                  </div>
                  <div className="text-4xl font-bold mb-4">$39.95<span className="text-lg text-muted-foreground font-normal">/month</span></div>
                  <ul className="space-y-3 mb-8">
                    {[
                      '500 analyses per month',
                      'Instant trade setups',
                      'Priority signal generation',
                      'Advanced entry precision',
                      'Faster response time',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/checkout?plan=TOP_TIER" className="block">
                    <Button variant="gradient" size="lg" className="w-full">Upgrade to PRO+</Button>
                  </Link>
                </CardContent>
              </Card>
            </FadeInSection>

            <FadeInSection delay={0.45}>
              <Card className="h-full relative overflow-hidden border-amber-400/25 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_30%)]">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-cyan-400" />
                <CardContent className="p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">GoldX</h3>
                    <Badge variant="outline">EA</Badge>
                  </div>
                  <div className="text-4xl font-bold mb-4">$129.95<span className="text-lg text-muted-foreground font-normal">/month</span></div>
                  <ul className="space-y-3 mb-8">
                    {[
                      'XAUUSD night scalping EA',
                      'Fast, Prop, and Hybrid modes',
                      'Server-side strategy engine',
                      'Real-time signal delivery',
                      'License-based MT5 access',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/pricing#goldx" className="block">
                    <Button variant="outline" size="lg" className="w-full border-amber-400/30 text-amber-200 hover:bg-amber-500/10">
                      View GoldX
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="page-shell">
          <FadeInSection>
            <Card className="max-w-4xl mx-auto text-center overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
              <CardContent className="relative z-10 px-5 py-12 sm:px-8 sm:py-16">
                <h2 className="mb-4 text-2xl font-bold sm:text-3xl md:text-4xl">
                  Ready to Trade Smarter?
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                  Join thousands of traders who use AI to validate their chart analysis before entering trades.
                </p>
                <Link href="/analyze" className="inline-flex w-full sm:w-auto">
                  <Button variant="glow" size="xl" className="w-full gap-2 sm:w-auto">
                    Start Analyzing Now
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </FadeInSection>
        </div>
      </section>

      <style jsx>{`
        .marquee-track {
          animation: landing-marquee 26s linear infinite;
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
