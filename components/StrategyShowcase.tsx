'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown } from 'lucide-react';

/* ─── strategy data ─── */
interface Strategy {
  name: string;
  type: 'BUY' | 'SELL';
  pair: string;
  bias: string;
  entry: string;
  sl: string;
  tp1: string;
  tp2: string;
  tp3: string;
  confidence: number;
  annotations: { label: string; color: string }[];
  /** Candle heights (0-100). Later candles animate toward TP. */
  candles: number[];
  /** Which candles are green (true) vs red (false) */
  colors: boolean[];
  /** TP target as pixel-% from bottom (controls the TP line position) */
  tpY: number;
  /** Entry zone as pixel-% from bottom */
  entryY: number;
  /** SL as pixel-% from bottom */
  slY: number;
}

const strategies: Strategy[] = [
  {
    name: 'Smart Money Buy',
    type: 'BUY',
    pair: 'EUR/USD',
    bias: 'BULLISH',
    entry: '1.0850 – 1.0860',
    sl: '1.0820',
    tp1: '1.0900',
    tp2: '1.0940',
    tp3: '1.0980',
    confidence: 87,
    annotations: [
      { label: 'BOS ↑', color: 'blue' },
      { label: 'Order Block', color: 'purple' },
    ],
    candles: [30, 38, 25, 42, 50, 35, 55, 60, 48, 65, 72, 80, 75, 85, 82, 92, 88, 95],
    colors:  [false, true, false, true, true, false, true, true, false, true, true, true, true, true, true, true, true, true],
    tpY: 18,
    entryY: 56,
    slY: 72,
  },
  {
    name: 'Order Block Sell',
    type: 'SELL',
    pair: 'GBP/JPY',
    bias: 'BEARISH',
    entry: '191.40 – 191.55',
    sl: '191.80',
    tp1: '190.90',
    tp2: '190.40',
    tp3: '189.80',
    confidence: 82,
    annotations: [
      { label: 'CHOCH', color: 'purple' },
      { label: 'Supply Zone', color: 'red' },
    ],
    candles: [88, 80, 92, 78, 72, 85, 65, 60, 68, 52, 45, 38, 42, 30, 35, 22, 28, 18],
    colors:  [true, false, true, false, false, true, false, false, true, false, false, false, true, false, false, false, true, false],
    tpY: 80,
    entryY: 30,
    slY: 15,
  },
  {
    name: 'Liquidity Sweep Buy',
    type: 'BUY',
    pair: 'BTC/USD',
    bias: 'BULLISH',
    entry: '68,250 – 68,400',
    sl: '67,800',
    tp1: '69,200',
    tp2: '70,000',
    tp3: '71,500',
    confidence: 79,
    annotations: [
      { label: 'Sweep ↓', color: 'yellow' },
      { label: 'FVG', color: 'cyan' },
    ],
    candles: [55, 48, 60, 42, 35, 22, 18, 25, 38, 50, 58, 68, 72, 80, 78, 88, 85, 94],
    colors:  [true, false, true, false, false, false, false, true, true, true, true, true, true, true, false, true, true, true],
    tpY: 14,
    entryY: 52,
    slY: 68,
  },
  {
    name: 'Break & Retest Sell',
    type: 'SELL',
    pair: 'NAS100',
    bias: 'BEARISH',
    entry: '18,320 – 18,380',
    sl: '18,500',
    tp1: '18,100',
    tp2: '17,850',
    tp3: '17,600',
    confidence: 84,
    annotations: [
      { label: 'BOS ↓', color: 'blue' },
      { label: 'Retest', color: 'orange' },
    ],
    candles: [85, 78, 90, 82, 75, 88, 70, 62, 68, 55, 48, 42, 50, 35, 40, 28, 32, 20],
    colors:  [false, false, true, false, false, true, false, false, true, false, false, false, true, false, true, false, false, false],
    tpY: 78,
    entryY: 28,
    slY: 12,
  },
];

const ACOLOR: Record<string, { bg: string; border: string; text: string }> = {
  blue:   { bg: 'bg-blue-500/20',   border: 'border-blue-500/40',   text: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400' },
  red:    { bg: 'bg-red-500/20',    border: 'border-red-500/40',    text: 'text-red-400' },
  yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400' },
  cyan:   { bg: 'bg-cyan-500/20',   border: 'border-cyan-500/40',   text: 'text-cyan-400' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400' },
};

const CYCLE_MS = 6000;

/* ─── component ─── */
export default function StrategyShowcase() {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const advance = useCallback(() => setIdx((i) => (i + 1) % strategies.length), []);

  useEffect(() => {
    const start = Date.now();
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / CYCLE_MS);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    const timer = setTimeout(() => { advance(); }, CYCLE_MS);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [idx, advance]);

  const s = strategies[idx];
  const isBuy = s.type === 'BUY';

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="mb-4" variant="outline">AI Strategies</Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Buy &amp; Sell Setups in <span className="text-gradient">Real Time</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Our AI detects and places trades across multiple strategy types. Watch candles move to target.
          </p>
        </motion.div>

        {/* Strategy pill selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {strategies.map((st, i) => (
            <button
              key={st.name}
              onClick={() => setIdx(i)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                i === idx
                  ? st.type === 'BUY'
                    ? 'bg-green-500/20 border-green-500/60 text-green-400'
                    : 'bg-red-500/20 border-red-500/60 text-red-400'
                  : 'border-white/10 text-muted-foreground hover:border-white/30'
              }`}
            >
              {st.type === 'BUY' ? <ArrowUp className="inline h-3 w-3 mr-1" /> : <ArrowDown className="inline h-3 w-3 mr-1" />}
              {st.name}
            </button>
          ))}
        </div>

        {/* Main card */}
        <Card className="max-w-5xl mx-auto overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* ── Chart panel ── */}
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-6 md:p-8 min-h-[420px] overflow-hidden select-none">
                {/* grid */}
                <div className="absolute inset-6 md:inset-8 grid grid-cols-9 grid-rows-7 gap-0 pointer-events-none">
                  {Array.from({ length: 63 }).map((_, i) => (
                    <div key={i} className="border border-white/[0.04]" />
                  ))}
                </div>

                {/* ── Trade placement lines ── */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`lines-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-6 md:inset-8 z-20 pointer-events-none"
                  >
                    {/* Entry zone band */}
                    <motion.div
                      className={`absolute left-0 right-0 ${isBuy ? 'bg-blue-500/10 border-y border-blue-500/30' : 'bg-blue-500/10 border-y border-blue-500/30'}`}
                      style={{ top: `${s.entryY}%`, height: '8%' }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-blue-400 font-medium">
                        Entry Zone
                      </span>
                    </motion.div>

                    {/* Stop loss line */}
                    <motion.div
                      className="absolute left-0 right-0 border-t-2 border-dashed border-red-500/60"
                      style={{ top: `${s.slY}%` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.9, duration: 0.4 }}
                    >
                      <span className="absolute left-2 -top-5 text-[10px] text-red-400 font-medium">SL {s.sl}</span>
                    </motion.div>

                    {/* TP1 */}
                    <motion.div
                      className="absolute left-0 right-0 border-t-2 border-dashed border-green-400/60"
                      style={{ top: `${s.tpY + (isBuy ? 12 : -12)}%` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 1.2, duration: 0.4 }}
                    >
                      <span className="absolute right-2 -top-5 text-[10px] text-green-400 font-medium">TP1</span>
                    </motion.div>

                    {/* TP2 */}
                    <motion.div
                      className="absolute left-0 right-0 border-t-2 border-dashed border-green-400/50"
                      style={{ top: `${s.tpY + (isBuy ? 4 : -4)}%` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 1.4, duration: 0.4 }}
                    >
                      <span className="absolute right-2 -top-5 text-[10px] text-green-400 font-medium">TP2</span>
                    </motion.div>

                    {/* TP3 */}
                    <motion.div
                      className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-400/40"
                      style={{ top: `${s.tpY}%` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 1.6, duration: 0.4 }}
                    >
                      <span className="absolute right-2 -top-5 text-[10px] text-emerald-400 font-medium">TP3</span>
                    </motion.div>

                    {/* Buy / Sell placement arrow */}
                    <motion.div
                      className={`absolute flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                        isBuy ? 'bg-green-500/30 border border-green-500/60 text-green-400' : 'bg-red-500/30 border border-red-500/60 text-red-400'
                      }`}
                      style={{ top: `${s.entryY + 2}%`, left: '4px' }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                    >
                      {isBuy ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {s.type}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>

                {/* ── Candles ── */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`candles-${idx}`}
                    className="relative z-10 flex items-end gap-[3px] md:gap-1 h-full pt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    {s.candles.map((h, i) => {
                      const isGreen = s.colors[i];
                      const isLast3 = i >= s.candles.length - 3;
                      return (
                        <motion.div
                          key={i}
                          className="flex-1 flex flex-col items-center"
                          style={{ originY: isBuy ? 1 : 0 }}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: i * 0.04, duration: 0.4, ease: 'easeOut' }}
                        >
                          <div
                            className={`w-[2px] ${isGreen ? 'bg-green-500' : 'bg-red-500'} ${isLast3 ? 'animate-pulse' : ''}`}
                            style={{ height: `${h * 0.2}%` }}
                          />
                          <div
                            className={`w-full rounded-sm ${isGreen ? 'bg-green-500' : 'bg-red-500'} ${isLast3 ? 'animate-pulse' : ''}`}
                            style={{ height: `${h * 0.55}%` }}
                          />
                          <div
                            className={`w-[2px] ${isGreen ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ height: `${h * 0.15}%` }}
                          />
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>

                {/* ── Annotations ── */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`ann-${idx}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="pointer-events-none"
                  >
                    {s.annotations.map((a, ai) => {
                      const c = ACOLOR[a.color] ?? ACOLOR.blue;
                      const posStyle = ai === 0
                        ? { top: '14%', left: '10%' }
                        : { top: '36%', right: '12%' };
                      return (
                        <motion.div
                          key={a.label}
                          className={`absolute px-2 py-1 ${c.bg} border ${c.border} rounded text-xs ${c.text} font-medium`}
                          style={posStyle}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1 + ai * 0.25, duration: 0.35 }}
                        >
                          {a.label}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>

                {/* Pair badge */}
                <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-black/40 px-2 py-0.5 rounded">{s.pair}</span>
                </div>
              </div>

              {/* ── Results panel ── */}
              <div className="p-6 md:p-8 flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`results-${idx}`}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-1"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-5">
                      <div className={`h-3 w-3 rounded-full ${isBuy ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                      <span className={`text-sm font-medium ${isBuy ? 'text-green-400' : 'text-red-400'}`}>{s.name}</span>
                    </div>

                    {[
                      { label: 'Market Bias', value: s.bias, color: isBuy ? 'text-green-400' : 'text-red-400' },
                      { label: 'Trade Type', value: s.type, color: isBuy ? 'text-green-400' : 'text-red-400' },
                      { label: 'Entry Zone', value: s.entry, color: 'text-blue-400' },
                      { label: 'Stop Loss', value: s.sl, color: 'text-red-400' },
                      { label: 'Take Profit 1', value: s.tp1, color: 'text-green-400' },
                      { label: 'Take Profit 2', value: s.tp2, color: 'text-green-400' },
                      { label: 'Take Profit 3', value: s.tp3, color: 'text-green-400' },
                      { label: 'Strategy', value: s.name, color: 'text-purple-400' },
                      { label: 'Confidence', value: `${s.confidence}/100`, color: 'text-yellow-400' },
                    ].map((row, ri) => (
                      <motion.div
                        key={row.label}
                        className="flex justify-between items-center py-2 border-b border-white/5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + ri * 0.06 }}
                      >
                        <span className="text-sm text-muted-foreground">{row.label}</span>
                        <span className={`font-semibold text-sm ${row.color}`}>{row.value}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>

                {/* Timer / progress bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Next strategy</span>
                    <span>{Math.max(0, Math.ceil((1 - progress) * CYCLE_MS / 1000))}s</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
