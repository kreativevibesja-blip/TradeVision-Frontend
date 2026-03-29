'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Brain, CheckCircle2, Layers3, ShieldAlert, Sparkles, TrendingUp, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type ExampleType = 'good' | 'bad';
type MarketType = 'trending' | 'ranging' | 'choppy';

interface TradeExample {
  id: string;
  type: ExampleType;
  market: MarketType;
  strategy: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry: string;
  stopLoss: string;
  takeProfit: string;
  confirmations?: string[];
  issues?: string[];
  score: number;
  footer: string;
}

const tabs = [
  { id: 'good', label: 'Good Trades', icon: CheckCircle2 },
  { id: 'bad', label: 'Bad Trades', icon: XCircle },
  { id: 'breakdown', label: 'Breakdown', icon: Brain },
] as const;

const examples: TradeExample[] = [
  {
    id: 'good-eurusd-range-sell',
    type: 'good',
    market: 'ranging',
    strategy: 'liquidity sweep reversal',
    symbol: 'EURUSD',
    direction: 'SELL',
    entry: '1.0850',
    stopLoss: '1.0820',
    takeProfit: '1.0920',
    confirmations: ['Liquidity Sweep', 'Engulfing Candle', 'Structure Break', 'Resistance Zone'],
    score: 7,
    footer: 'Clear liquidity trap followed by strong confirmation.',
  },
  {
    id: 'good-gbpusd-trend-buy',
    type: 'good',
    market: 'trending',
    strategy: 'continuation pullback',
    symbol: 'GBPUSD',
    direction: 'BUY',
    entry: '1.2735',
    stopLoss: '1.2704',
    takeProfit: '1.2808',
    confirmations: ['Bullish BOS', 'Rejection Wick', 'Demand Zone Reaction', 'Trend Continuation'],
    score: 8,
    footer: 'Trend alignment plus structure confirmation keeps the risk clean.',
  },
  {
    id: 'bad-eurusd-chop-buy',
    type: 'bad',
    market: 'choppy',
    strategy: 'none',
    symbol: 'EURUSD',
    direction: 'BUY',
    entry: '1.0850',
    stopLoss: '1.0820',
    takeProfit: '1.0920',
    issues: ['No liquidity sweep', 'No confirmation', 'Choppy market', 'No clear zone'],
    score: 2,
    footer: 'No clear reason for price to move.',
  },
  {
    id: 'bad-usdjpy-random-sell',
    type: 'bad',
    market: 'ranging',
    strategy: 'impulse click',
    symbol: 'USDJPY',
    direction: 'SELL',
    entry: '149.220',
    stopLoss: '149.540',
    takeProfit: '148.980',
    issues: ['Late entry in the middle', 'No structure shift', 'Weak reward profile', 'Random zone selection'],
    score: 3,
    footer: 'The entry is emotional, not evidence-based.',
  },
];

const marketCopy: Record<MarketType, string> = {
  trending: 'Trending',
  ranging: 'Ranging',
  choppy: 'Choppy',
};

const typeBadgeCopy: Record<ExampleType, string> = {
  good: 'High Probability Setup',
  bad: 'Low Quality Setup',
};

const typeBadgeClassName: Record<ExampleType, string> = {
  good: 'border-emerald-400/30 bg-emerald-400/12 text-emerald-100',
  bad: 'border-rose-400/30 bg-rose-400/12 text-rose-100',
};

const typeGlowClassName: Record<ExampleType, string> = {
  good: 'border-emerald-400/25 shadow-[0_0_45px_rgba(16,185,129,0.16)]',
  bad: 'border-rose-400/25 shadow-[0_0_45px_rgba(244,63,94,0.16)]',
};

const progressClassName = (score: number, type: ExampleType) => {
  if (type === 'good') {
    return 'bg-gradient-to-r from-emerald-500 to-green-300';
  }

  if (score >= 4) {
    return 'bg-gradient-to-r from-amber-500 to-yellow-300';
  }

  return 'bg-gradient-to-r from-rose-500 to-red-300';
};

const listToneClassName: Record<ExampleType, string> = {
  good: 'border-emerald-400/15 bg-emerald-400/6 text-emerald-50',
  bad: 'border-rose-400/15 bg-rose-400/6 text-rose-50',
};

const MarketPill = ({ market }: { market: MarketType }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-slate-200">
    <Layers3 className="h-3.5 w-3.5 text-cyan-300" />
    {marketCopy[market]}
  </div>
);

function TradeExampleCard({ example, unlabeled = false }: { example: TradeExample; unlabeled?: boolean }) {
  const isGood = example.type === 'good';
  const items = isGood ? example.confirmations ?? [] : example.issues ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <Card className={`relative overflow-hidden bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))] ${typeGlowClassName[example.type]}`}>
        <div className={`absolute inset-x-0 top-0 h-px ${isGood ? 'bg-gradient-to-r from-transparent via-emerald-300 to-transparent' : 'bg-gradient-to-r from-transparent via-rose-300 to-transparent'}`} />
        <div className={`absolute -right-24 top-8 h-36 w-36 rounded-full blur-3xl ${isGood ? 'bg-emerald-500/16' : 'bg-rose-500/16'}`} />
        <CardContent className="relative p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-3">
              {!unlabeled ? (
                <Badge className={typeBadgeClassName[example.type]}>
                  {typeBadgeCopy[example.type]} {isGood ? '✅' : '❌'}
                </Badge>
              ) : (
                <Badge className="border-white/10 bg-white/5 text-slate-200">Hidden Label</Badge>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <MarketPill market={example.market} />
                <Badge className="border-white/10 bg-white/5 text-slate-300">{example.strategy}</Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Score</p>
              <p className={`mt-2 text-2xl font-semibold ${isGood ? 'text-emerald-100' : example.score >= 4 ? 'text-amber-100' : 'text-rose-100'}`}>{example.score}/10</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-semibold tracking-tight text-white">{example.symbol} {example.direction}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isGood ? 'bg-emerald-400/12 text-emerald-100' : 'bg-rose-400/12 text-rose-100'}`}>
                {isGood ? 'Quality setup' : 'Weak setup'}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Entry</p>
                <p className="mt-2 text-xl font-semibold text-white">{example.entry}</p>
              </div>
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-200/80">SL</p>
                <p className="mt-2 text-xl font-semibold text-rose-100">{example.stopLoss}</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200/80">TP</p>
                <p className="mt-2 text-xl font-semibold text-emerald-100">{example.takeProfit}</p>
              </div>
            </div>
          </div>

          <div className={`mt-5 rounded-[1.5rem] border p-5 ${listToneClassName[example.type]}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{isGood ? 'Confirmation checklist' : 'Issues'}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {items.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/15 p-3 text-sm leading-6">
                  {isGood ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />}
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-500">
              <span>Trade quality</span>
              <span>{example.score}/10</span>
            </div>
            <Progress value={example.score * 10} className="h-3 bg-white/8" indicatorClassName={progressClassName(example.score, example.type)} />
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-300">
            <span className="font-medium text-white">Why it matters:</span> {example.footer}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BreakdownPanel({ goodExample, badExample }: { goodExample: TradeExample; badExample: TradeExample }) {
  const comparisonRows = [
    {
      label: 'Confirmations',
      good: 'Multiple confirmations align before entry.',
      bad: 'No confirmation stack before clicking in.',
    },
    {
      label: 'Structure',
      good: 'Price reacts after a clean structure shift.',
      bad: 'Noise and overlap dominate the chart.',
    },
    {
      label: 'Zones',
      good: 'Entry is anchored to a clear zone.',
      bad: 'Entry is floating in the middle of nowhere.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-[2rem] border border-emerald-400/25 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_35%),linear-gradient(180deg,rgba(6,24,18,0.96),rgba(2,6,23,0.94))] p-5 shadow-[0_0_45px_rgba(16,185,129,0.14)]">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">THIS is what you want</p>
              <h3 className="mt-1 text-xl font-semibold text-white">Good Trade</h3>
            </div>
          </div>
          <TradeExampleCard example={goodExample} />
        </div>

        <div className="space-y-4 rounded-[2rem] border border-rose-400/25 bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.14),_transparent_35%),linear-gradient(180deg,rgba(30,8,14,0.96),rgba(2,6,23,0.94))] p-5 shadow-[0_0_45px_rgba(244,63,94,0.14)]">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-400/12 text-rose-200">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200/70">AVOID this setup</p>
              <h3 className="mt-1 text-xl font-semibold text-white">Bad Trade</h3>
            </div>
          </div>
          <TradeExampleCard example={badExample} />
        </div>
      </div>

      <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.96))]">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-200">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Why the difference matters</p>
              <h3 className="mt-1 text-xl font-semibold text-white">Breakdown</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {comparisonRows.map((row) => (
              <div key={row.label} className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 md:grid-cols-[180px_1fr_1fr] md:items-center">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">{row.label}</p>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4 text-sm leading-6 text-emerald-50">{row.good}</div>
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/8 p-4 text-sm leading-6 text-rose-50">{row.bad}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TradeQualityExamples() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('good');
  const [testMode, setTestMode] = useState(false);
  const [selectedGuess, setSelectedGuess] = useState<ExampleType | null>(null);
  const [revealed, setRevealed] = useState(false);

  const goodExamples = useMemo(() => examples.filter((example) => example.type === 'good'), []);
  const badExamples = useMemo(() => examples.filter((example) => example.type === 'bad'), []);
  const quizExample = examples[1];
  const quizCorrect = selectedGuess === quizExample.type;

  return (
    <div className="page-stack min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.08),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(248,113,113,0.08),_transparent_26%),linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,0.98))]">
      <section className="relative overflow-hidden py-14 sm:py-18 lg:py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[8%] top-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute right-[8%] top-24 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
        </div>

        <div className="page-shell relative">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="mx-auto max-w-4xl text-center">
            <Badge className="border-cyan-400/25 bg-cyan-400/10 text-cyan-100">Trade Quality Examples</Badge>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Learn What Makes a <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-rose-300 bg-clip-text text-transparent">Good Trade</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              See the difference between high-probability setups and risky entries.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.06 }} className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-full flex-wrap gap-2 rounded-[1.5rem] border border-white/10 bg-white/5 p-2 backdrop-blur-xl sm:w-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] px-4 py-3 text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-slate-950 shadow-[0_12px_30px_rgba(255,255,255,0.14)]' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <Button
              variant={testMode ? 'gradient' : 'outline'}
              onClick={() => {
                setTestMode((current) => !current);
                setSelectedGuess(null);
                setRevealed(false);
              }}
              className={`rounded-2xl ${testMode ? 'border-transparent' : 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'}`}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Test Yourself
            </Button>
          </motion.div>

          {testMode ? (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="mt-8">
              <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))]">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1.15fr_0.85fr]">
                    <TradeExampleCard example={quizExample} unlabeled />

                    <div className="space-y-5 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Quiz mode</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">Would you classify this as good or bad?</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-300">Look at the market structure, confirmations, and zone quality before you decide.</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button variant={selectedGuess === 'good' ? 'gradient' : 'outline'} className={`rounded-2xl ${selectedGuess === 'good' ? '' : 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'}`} onClick={() => setSelectedGuess('good')}>
                          GOOD
                        </Button>
                        <Button variant={selectedGuess === 'bad' ? 'gradient' : 'outline'} className={`rounded-2xl ${selectedGuess === 'bad' ? '' : 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'}`} onClick={() => setSelectedGuess('bad')}>
                          BAD
                        </Button>
                      </div>

                      <Button variant="ghost" className="w-full rounded-2xl text-slate-200 hover:bg-white/10 hover:text-white" onClick={() => setRevealed(true)} disabled={!selectedGuess}>
                        Reveal Answer
                      </Button>

                      {revealed ? (
                        <div className={`rounded-[1.5rem] border p-5 text-sm leading-7 ${quizCorrect ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-50' : 'border-rose-400/30 bg-rose-400/10 text-rose-50'}`}>
                          <p className="font-semibold text-white">{quizCorrect ? 'Correct.' : 'Not quite.'}</p>
                          <p className="mt-2">This example is a <span className="font-semibold">{quizExample.type.toUpperCase()}</span> trade because it {quizExample.type === 'good' ? 'stacks confirmations and aligns with structure.' : 'lacks enough evidence to justify the entry.'}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
        </div>
      </section>

      <section className="pb-14 sm:pb-18 lg:pb-24">
        <div className="page-shell">
          <AnimatePresence mode="wait">
            {activeTab === 'good' ? (
              <motion.div key="good" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.24 }} className="grid gap-6 lg:grid-cols-2">
                {goodExamples.map((example) => <TradeExampleCard key={example.id} example={example} />)}
              </motion.div>
            ) : null}

            {activeTab === 'bad' ? (
              <motion.div key="bad" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.24 }} className="grid gap-6 lg:grid-cols-2">
                {badExamples.map((example) => <TradeExampleCard key={example.id} example={example} />)}
              </motion.div>
            ) : null}

            {activeTab === 'breakdown' ? (
              <motion.div key="breakdown" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.24 }}>
                <BreakdownPanel goodExample={goodExamples[0]} badExample={badExamples[0]} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </section>

      <section className="pb-14 sm:pb-18 lg:pb-24">
        <div className="page-shell">
          <Card className="overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.95))]">
            <CardContent className="flex flex-col gap-4 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Educational edge</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Build pattern recognition before you risk capital</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Use these examples to train your eye for confluence, avoid random entries, and trust the trade system for the right reasons.</p>
              </div>
              <div className="inline-flex items-center gap-3 rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-50">
                <TrendingUp className="h-5 w-5 text-cyan-200" />
                Good trades are built, not guessed.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}