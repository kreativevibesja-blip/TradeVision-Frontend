'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, Rabbit, GaugeCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TradeReplayData } from '@/lib/api';

interface Props {
  open: boolean;
  data: TradeReplayData | null;
  pair: string;
  onClose: () => void;
}

const formatPrice = (value: number | null | undefined, pair: string) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  const normalized = pair.toUpperCase();
  if (normalized.includes('BTC') || normalized.includes('ETH') || normalized.includes('US30') || normalized.includes('NAS100') || normalized.includes('SPX500')) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (normalized.includes('JPY')) return value.toFixed(3);
  if (normalized.includes('XAU')) return value.toFixed(1);
  return value.toFixed(4);
};

const buildPath = (prices: number[]) => {
  if (!prices.length) return '';
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(max - min, 1e-6);

  return prices.map((price, index) => {
    const x = (index / Math.max(prices.length - 1, 1)) * 100;
    const y = 92 - ((price - min) / range) * 78;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
};

export function TradeReplayModal({ open, data, pair, onClose }: Props) {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [playing, setPlaying] = useState(true);
  const scenario = data?.scenarios?.[scenarioIndex] ?? null;
  const path = useMemo(() => buildPath(scenario?.frames.map((frame) => frame.price) ?? []), [scenario]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="w-full max-w-5xl rounded-[30px] border border-amber-400/15 bg-[#0c0b10] text-white shadow-[0_30px_100px_rgba(0,0,0,0.52)]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-amber-200/55">Trade Replay Mode</p>
                <h3 className="mt-1 text-2xl font-semibold">Scenario engine</h3>
                <p className="mt-2 text-sm text-white/60">Simulated pathing from the model’s preferred entry through expansion or invalidation.</p>
              </div>
              <Button variant="outline" className="border-white/15 bg-transparent text-white hover:bg-white/5" onClick={onClose}>Close</Button>
            </div>
            <div className="grid gap-6 p-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4">
                {data?.scenarios.map((item, index) => (
                  <button key={item.id} onClick={() => setScenarioIndex(index)} className={`w-full rounded-3xl border p-4 text-left transition-all ${index === scenarioIndex ? 'border-amber-400/35 bg-amber-400/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-white/55">{item.narrative}</p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm font-medium text-amber-200">{item.probability}%</div>
                    </div>
                  </button>
                ))}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
                    <GaugeCircle className="h-4 w-4" />
                    Replay controls
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={() => setPlaying((current) => !current)} className="bg-cyan-400 text-black hover:bg-cyan-300">
                      {playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {playing ? 'Pause' : 'Play'}
                    </Button>
                    {[1, 2, 4].map((option) => (
                      <Button key={option} variant={speed === option ? 'default' : 'outline'} className={speed === option ? 'bg-amber-500 text-black hover:bg-amber-400' : 'border-white/15 bg-transparent text-white hover:bg-white/5'} onClick={() => setSpeed(option as 1 | 2 | 4)}>
                        <Rabbit className="mr-2 h-4 w-4" />
                        {option}x
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,190,92,0.14),_transparent_45%),rgba(255,255,255,0.03)] p-5">
                  <svg viewBox="0 0 100 100" className="h-[320px] w-full overflow-visible">
                    <defs>
                      <linearGradient id="replay-line" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                    <path d="M 0 18 L 100 18" stroke="rgba(255,255,255,0.1)" strokeDasharray="2 3" />
                    <path d="M 0 50 L 100 50" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 3" />
                    <path d="M 0 82 L 100 82" stroke="rgba(255,255,255,0.1)" strokeDasharray="2 3" />
                    {path ? (
                      <motion.path
                        key={`${scenario?.id}-${speed}-${playing}`}
                        d={path}
                        fill="none"
                        stroke="url(#replay-line)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0.35 }}
                        animate={{ pathLength: playing ? 1 : 0.55, opacity: 1 }}
                        transition={{ duration: 3 / speed, ease: 'easeInOut' }}
                      />
                    ) : null}
                  </svg>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">Entry</p>
                    <p className="mt-1 font-semibold text-white">{formatPrice(data?.referenceEntry, pair)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">Stop</p>
                    <p className="mt-1 font-semibold text-white">{formatPrice(data?.stopLoss, pair)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">TP1</p>
                    <p className="mt-1 font-semibold text-white">{formatPrice(data?.takeProfit1, pair)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">TP2</p>
                    <p className="mt-1 font-semibold text-white">{formatPrice(data?.takeProfit2, pair)}</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm leading-relaxed text-white/70">{scenario?.narrative || data?.summary}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}