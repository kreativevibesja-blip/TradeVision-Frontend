'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
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
  Shield,
  ArrowRight,
  ChevronDown,
  Star,
  CheckCircle2,
} from 'lucide-react';

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
    transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function HomePage() {
  return (
    <div className="relative">
      {/* ═══════ HERO SECTION ═══════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
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

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 px-4 py-1.5 text-sm" variant="outline">
              <Zap className="h-3 w-3 mr-1" />
              Powered by GPT-4 Vision AI
            </Badge>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            AI That Understands{' '}
            <span className="text-gradient">Your Trading Charts</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Upload any chart screenshot and get professional trading analysis instantly.
            Support for MT5, cTrader, TradingView, and Deriv charts including Boom, Crash, and Volatility indices.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Link href="/analyze">
              <Button variant="glow" size="xl" className="gap-2 group">
                Analyze Your Chart
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="xl" className="gap-2">
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
            transition={{ duration: 1, delay: 0.6 }}
          >
            <CandlestickLoader />
          </motion.div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how-it-works" className="py-24 relative">
        <div className="container mx-auto px-4">
          <FadeInSection className="text-center mb-16">
            <Badge className="mb-4" variant="outline">How It Works</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Three Steps to a <span className="text-gradient">Trade Plan</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get from chart screenshot to actionable trade plan in seconds.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Upload,
                title: 'Upload Chart',
                desc: 'Drag and drop any chart screenshot from MT5, TradingView, cTrader, or Deriv.',
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
                <Card className="relative group hover:border-white/20 transition-all duration-300 h-full">
                  <CardContent className="p-8 text-center">
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
      <section className="py-24 relative bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
        <div className="container mx-auto px-4">
          <FadeInSection className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Professional-Grade <span className="text-gradient">Analysis</span>
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Eye, title: 'AI Chart Reading', desc: 'Vision AI understands candlesticks, patterns, and indicators visually.' },
              { icon: BarChart3, title: 'Structure Detection', desc: 'Identifies BOS, CHOCH, and market structure shifts automatically.' },
              { icon: Target, title: 'Liquidity Analysis', desc: 'Detects liquidity pools, stop hunts, and sweep zones.' },
              { icon: TrendingUp, title: 'Auto Entry & TP', desc: 'Calculates optimal entry, stop loss, and multiple take profit levels.' },
            ].map((feature, i) => (
              <FadeInSection key={feature.title} delay={i * 0.1}>
                <Card className="group hover:border-primary/30 hover:glow-blue transition-all duration-300 h-full">
                  <CardContent className="p-6">
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

      {/* ═══════ EXAMPLE ANALYSIS ═══════ */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <FadeInSection className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Live Example</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              See AI Analysis in <span className="text-gradient">Action</span>
            </h2>
          </FadeInSection>

          <FadeInSection>
            <Card className="max-w-5xl mx-auto overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Mock Chart */}
                  <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-8 min-h-[400px]">
                    {/* Chart grid */}
                    <div className="absolute inset-8 grid grid-cols-8 grid-rows-6 gap-0">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div key={i} className="border border-white/5" />
                      ))}
                    </div>

                    {/* Candlesticks */}
                    <div className="relative z-10 flex items-end gap-2 h-full pt-8">
                      {[35, 45, 30, 50, 55, 40, 60, 65, 55, 70, 75, 80, 72, 85, 78, 90].map((h, i) => (
                        <motion.div
                          key={i}
                          className="flex-1 flex flex-col items-center"
                          initial={{ scaleY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05, duration: 0.5 }}
                          style={{ originY: 1 }}
                        >
                          <div className={`w-[2px] ${i > 10 ? 'bg-green-500' : i % 3 === 0 ? 'bg-red-500' : 'bg-green-500'}`} style={{ height: h * 0.2 }} />
                          <div className={`w-full rounded-sm ${i > 10 ? 'bg-green-500' : i % 3 === 0 ? 'bg-red-500' : 'bg-green-500'}`} style={{ height: h * 0.6 }} />
                          <div className={`w-[2px] ${i > 10 ? 'bg-green-500' : i % 3 === 0 ? 'bg-red-500' : 'bg-green-500'}`} style={{ height: h * 0.2 }} />
                        </motion.div>
                      ))}
                    </div>

                    {/* Overlay annotations */}
                    <motion.div
                      className="absolute top-16 left-12 px-2 py-1 bg-blue-500/20 border border-blue-500/40 rounded text-xs text-blue-400"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1 }}
                    >
                      BOS ↑
                    </motion.div>
                    <motion.div
                      className="absolute top-32 right-16 px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded text-xs text-purple-400"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.2 }}
                    >
                      CHOCH
                    </motion.div>
                    <motion.div
                      className="absolute bottom-24 left-1/3 right-1/4 h-8 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.4 }}
                    >
                      <span className="text-xs text-green-400">Entry Zone</span>
                    </motion.div>
                    <motion.div
                      className="absolute bottom-14 left-1/3 right-1/4 border-t-2 border-dashed border-red-500/50"
                      initial={{ opacity: 0, scaleX: 0 }}
                      whileInView={{ opacity: 1, scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.6 }}
                    >
                      <span className="text-xs text-red-400 absolute -top-5 left-0">Stop Loss</span>
                    </motion.div>
                    <motion.div
                      className="absolute top-24 left-1/2 right-8 border-t-2 border-dashed border-green-500/50"
                      initial={{ opacity: 0, scaleX: 0 }}
                      whileInView={{ opacity: 1, scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.8 }}
                    >
                      <span className="text-xs text-green-400 absolute -top-5 right-0">TP1</span>
                    </motion.div>
                  </div>

                  {/* Analysis Results */}
                  <div className="p-8 space-y-4">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm text-green-400 font-medium">Analysis Complete</span>
                    </div>

                    {[
                      { label: 'Market Bias', value: 'BULLISH', color: 'text-green-400' },
                      { label: 'Entry Zone', value: '1.0850 - 1.0860', color: 'text-blue-400' },
                      { label: 'Stop Loss', value: '1.0820', color: 'text-red-400' },
                      { label: 'Take Profit 1', value: '1.0900', color: 'text-green-400' },
                      { label: 'Take Profit 2', value: '1.0940', color: 'text-green-400' },
                      { label: 'Take Profit 3', value: '1.0980', color: 'text-green-400' },
                      { label: 'Strategy', value: 'Smart Money Concepts', color: 'text-purple-400' },
                      { label: 'Confidence', value: '87/100', color: 'text-yellow-400' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        className="flex justify-between items-center py-2 border-b border-white/5"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                      >
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className={`font-semibold ${item.color}`}>{item.value}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeInSection>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="py-24 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent">
        <div className="container mx-auto px-4">
          <FadeInSection className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Trusted by <span className="text-gradient">Traders</span>
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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

      {/* ═══════ PRICING PREVIEW ═══════ */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <FadeInSection className="text-center mb-16">
            <Badge className="mb-4" variant="outline">Pricing</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <FadeInSection>
              <Card className="h-full">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-2">Free</h3>
                  <div className="text-4xl font-bold mb-4">$0<span className="text-lg text-muted-foreground font-normal">/month</span></div>
                  <ul className="space-y-3 mb-8">
                    {['3 analyses per day', 'Basic AI detection', 'Standard processing'].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/analyze">
                    <Button variant="outline" size="lg" className="w-full">Get Started Free</Button>
                  </Link>
                </CardContent>
              </Card>
            </FadeInSection>

            <FadeInSection delay={0.15}>
              <Card className="h-full border-primary/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                <CardContent className="p-8">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">Pro</h3>
                    <Badge variant="default">Popular</Badge>
                  </div>
                  <div className="text-4xl font-bold mb-4">$19<span className="text-lg text-muted-foreground font-normal">/month</span></div>
                  <ul className="space-y-3 mb-8">
                    {[
                      'Unlimited analyses',
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
                  <Link href="/checkout">
                    <Button variant="gradient" size="lg" className="w-full">Upgrade to Pro</Button>
                  </Link>
                </CardContent>
              </Card>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <FadeInSection>
            <Card className="max-w-4xl mx-auto text-center overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
              <CardContent className="relative z-10 py-16 px-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Trade Smarter?
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-8">
                  Join thousands of traders who use AI to validate their chart analysis before entering trades.
                </p>
                <Link href="/analyze">
                  <Button variant="glow" size="xl" className="gap-2">
                    Start Analyzing Now
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
