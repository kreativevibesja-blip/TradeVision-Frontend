'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  Compass,
  Flag,
  Layers3,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type ExampleType = 'good' | 'bad';
type MarketType = 'trending' | 'ranging' | 'choppy' | 'reversal';
type MainTab = 'roadmap' | 'examples' | 'strategies' | 'playbook';
type ExampleTab = 'good' | 'bad' | 'breakdown';
type SkillLevel = 'beginner' | 'developing' | 'advanced';

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

interface LearningCard {
  title: string;
  summary: string;
  bullets: string[];
  icon: typeof BookOpen;
  tone: string;
}

interface StrategyCard {
  title: string;
  level: SkillLevel;
  market: string;
  concept: string;
  checklist: string[];
  avoidWhen: string[];
}

interface LearningStage {
  level: SkillLevel;
  title: string;
  goal: string;
  lessons: string[];
  outcome: string;
}

const mainTabs: Array<{ id: MainTab; label: string; icon: typeof Compass }> = [
  { id: 'roadmap', label: 'Learn the Basics', icon: Compass },
  { id: 'examples', label: 'Trade Examples', icon: Search },
  { id: 'strategies', label: 'Strategy Lab', icon: Target },
  { id: 'playbook', label: 'Execution Playbook', icon: Flag },
];

const exampleTabs: Array<{ id: ExampleTab; label: string; icon: typeof CheckCircle2 }> = [
  { id: 'good', label: 'Good Trades', icon: CheckCircle2 },
  { id: 'bad', label: 'Bad Trades', icon: XCircle },
  { id: 'breakdown', label: 'Breakdown', icon: Brain },
];

const examples: TradeExample[] = [
  {
    id: 'good-gbpusd-trend-buy',
    type: 'good',
    market: 'trending',
    strategy: 'trend pullback continuation',
    symbol: 'GBPUSD',
    direction: 'BUY',
    entry: '1.2735',
    stopLoss: '1.2704',
    takeProfit: '1.2808',
    confirmations: ['Bullish break of structure', 'Demand zone reaction', 'Rejection wick', 'Trend aligned with momentum'],
    score: 8,
    footer: 'The trade works because structure, zone, and confirmation all say the same thing.',
  },
  {
    id: 'good-eurusd-range-reversal',
    type: 'good',
    market: 'ranging',
    strategy: 'liquidity sweep reversal',
    symbol: 'EURUSD',
    direction: 'SELL',
    entry: '1.0850',
    stopLoss: '1.0884',
    takeProfit: '1.0788',
    confirmations: ['Liquidity taken above range high', 'Bearish engulfing candle', 'Shift in short-term structure', 'Reaction from resistance'],
    score: 7,
    footer: 'A reversal setup becomes stronger when the sweep, reaction zone, and structure shift appear together.',
  },
  {
    id: 'good-usdjpy-breakout-retest',
    type: 'good',
    market: 'reversal',
    strategy: 'breakout and retest',
    symbol: 'USDJPY',
    direction: 'BUY',
    entry: '149.220',
    stopLoss: '148.860',
    takeProfit: '149.980',
    confirmations: ['Previous resistance flips to support', 'Retest holds cleanly', 'Momentum returns after pullback', 'Reward remains larger than risk'],
    score: 8,
    footer: 'The retest gives structure to the trade and keeps the invalidation level logical.',
  },
  {
    id: 'bad-eurusd-choppy-buy',
    type: 'bad',
    market: 'choppy',
    strategy: 'random click',
    symbol: 'EURUSD',
    direction: 'BUY',
    entry: '1.0850',
    stopLoss: '1.0820',
    takeProfit: '1.0870',
    issues: ['No clean market structure', 'No zone-based reason to enter', 'Poor reward compared with risk', 'Decision made in noisy price action'],
    score: 2,
    footer: 'If the chart is messy and your reasoning is vague, you do not have a trade plan.',
  },
  {
    id: 'bad-nas100-midrange-sell',
    type: 'bad',
    market: 'ranging',
    strategy: 'impulse fade',
    symbol: 'NAS100',
    direction: 'SELL',
    entry: '18492',
    stopLoss: '18544',
    takeProfit: '18461',
    issues: ['Entry taken in the middle of the range', 'No failed breakout', 'Weak confirmation candle', 'Target is too close to justify the risk'],
    score: 3,
    footer: 'Middle-of-range entries often leave you exposed to noise with no real edge.',
  },
  {
    id: 'bad-xauusd-late-breakout-buy',
    type: 'bad',
    market: 'trending',
    strategy: 'late breakout chase',
    symbol: 'XAUUSD',
    direction: 'BUY',
    entry: '2198.4',
    stopLoss: '2188.2',
    takeProfit: '2202.0',
    issues: ['Entry is too extended from the base', 'Stop has to be wide while target is tight', 'No retrace to reduce risk', 'Emotion is driving the execution'],
    score: 3,
    footer: 'A good trend does not automatically make a late entry a good trade.',
  },
];

const marketCopy: Record<MarketType, string> = {
  trending: 'Trending',
  ranging: 'Ranging',
  choppy: 'Choppy',
  reversal: 'Reversal',
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

const listToneClassName: Record<ExampleType, string> = {
  good: 'border-emerald-400/15 bg-emerald-400/6 text-emerald-50',
  bad: 'border-rose-400/15 bg-rose-400/6 text-rose-50',
};

const levelBadgeClassName: Record<SkillLevel, string> = {
  beginner: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-100',
  developing: 'border-amber-400/25 bg-amber-400/10 text-amber-100',
  advanced: 'border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-100',
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

const learningCards: LearningCard[] = [
  {
    title: 'What is a trade?',
    summary: 'A trade is not a guess. It is a planned idea with an entry, an invalidation point, and a target.',
    bullets: ['Know why you want in', 'Know where you are wrong', 'Know where the idea should pay'],
    icon: BookOpen,
    tone: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-50',
  },
  {
    title: 'Trend first, entry second',
    summary: 'Beginners improve faster when they first identify whether price is trending, ranging, or messy.',
    bullets: ['Trend: follow pullbacks', 'Range: focus on edges', 'Chop: protect capital'],
    icon: TrendingUp,
    tone: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-50',
  },
  {
    title: 'Zones beat random prices',
    summary: 'Support, resistance, supply, and demand are not magic lines. They are areas where price has reacted before.',
    bullets: ['Use reaction areas', 'Look for clean context', 'Avoid middle-of-range entries'],
    icon: Layers3,
    tone: 'border-violet-400/20 bg-violet-400/10 text-violet-50',
  },
  {
    title: 'Confirmation matters',
    summary: 'A level alone is not enough. Price should show evidence such as a rejection, sweep, or structure shift.',
    bullets: ['Wait for reaction', 'Do not predict too early', 'Stack reasons before entry'],
    icon: Brain,
    tone: 'border-amber-400/20 bg-amber-400/10 text-amber-50',
  },
  {
    title: 'Risk before reward',
    summary: 'A common teaching principle is to think in terms of risk compared with potential reward before placing the trade.',
    bullets: ['Keep losses defined', 'Prefer asymmetric setups', 'A good idea can still have a bad entry'],
    icon: Scale,
    tone: 'border-rose-400/20 bg-rose-400/10 text-rose-50',
  },
  {
    title: 'Psychology is execution',
    summary: 'Most traders know what to do after they see the chart. The hard part is staying disciplined before, during, and after the trade.',
    bullets: ['Do not chase', 'Do not revenge trade', 'Review behavior, not just results'],
    icon: ShieldAlert,
    tone: 'border-slate-400/20 bg-white/5 text-slate-100',
  },
];

const learningStages: LearningStage[] = [
  {
    level: 'beginner',
    title: 'Foundation Stage',
    goal: 'Learn what price is doing before trying to predict where it will go.',
    lessons: ['Trend vs range vs chop', 'Support and resistance as zones', 'Candles, wicks, and momentum', 'How to place a stop logically'],
    outcome: 'You stop taking random trades and start reading structure with a plan.',
  },
  {
    level: 'developing',
    title: 'Confluence Stage',
    goal: 'Move from single-signals to confirmation stacking.',
    lessons: ['Break of structure and shift in bias', 'Liquidity sweeps and failed moves', 'Retests, pullbacks, and timing', 'Reward-to-risk planning'],
    outcome: 'You begin filtering for cleaner entries instead of clicking every move.',
  },
  {
    level: 'advanced',
    title: 'Execution Stage',
    goal: 'Build a repeatable process for different market conditions.',
    lessons: ['Context before setup', 'When to pass on good-looking charts', 'How to adapt strategy to market state', 'Reviewing your journal for recurring mistakes'],
    outcome: 'You trade fewer ideas, but the quality of each decision improves.',
  },
];

const strategyCards: StrategyCard[] = [
  {
    title: 'Trend Pullback Continuation',
    level: 'beginner',
    market: 'Best in clean trends',
    concept: 'Wait for price to pull back into an area of interest, then only enter when the trend resumes with confirmation.',
    checklist: ['Clear trend direction', 'Pullback into demand or supply', 'Momentum returns after reaction', 'Stop goes beyond the pullback failure point'],
    avoidWhen: ['Price is ranging', 'Pullback is too deep and damages structure', 'You are buying after a large extended candle'],
  },
  {
    title: 'Range Edge Reversal',
    level: 'beginner',
    market: 'Best in balanced ranges',
    concept: 'A range works best when you are patient enough to wait for the edges instead of trading the middle.',
    checklist: ['Range boundaries are obvious', 'Entry is near support or resistance', 'A rejection or sweep appears', 'Target makes sense before the opposite edge'],
    avoidWhen: ['You are trading in the center of the range', 'A breakout is already underway', 'The range is becoming choppy and unclear'],
  },
  {
    title: 'Breakout and Retest',
    level: 'developing',
    market: 'Best when momentum expands from structure',
    concept: 'The breakout becomes more reliable when the market retests the broken level and holds it.',
    checklist: ['Breakout from a meaningful level', 'Retest respects the new support or resistance', 'Momentum resumes after the retest', 'Reward remains attractive'],
    avoidWhen: ['The breakout candle is exhausted and extended', 'There is no retest and you are chasing', 'The higher timeframe is against the move'],
  },
  {
    title: 'Liquidity Sweep Reversal',
    level: 'advanced',
    market: 'Best when price grabs liquidity then fails',
    concept: 'A sweep above highs or below lows is more useful when the move quickly rejects and structure shifts back the other way.',
    checklist: ['Liquidity level is clear', 'Sweep takes place at a meaningful zone', 'Fast rejection shows intent', 'Lower timeframe structure flips after the sweep'],
    avoidWhen: ['You call every wick a sweep', 'There is no real rejection', 'The broader context is still strongly trending against the reversal'],
  },
];

const playbookSteps = [
  {
    title: '1. Start with context',
    body: 'Ask what kind of market you are in. A good setup in a trend is not managed the same way as a setup inside a range.',
  },
  {
    title: '2. Mark your zone',
    body: 'Choose the area that matters before price gets there. If you only become interested after the move starts, you are already late.',
  },
  {
    title: '3. Wait for confirmation',
    body: 'Reactions, sweeps, breaks in structure, and rejection candles help turn an area into an actual setup.',
  },
  {
    title: '4. Define the invalidation',
    body: 'A stop belongs where the idea is proven wrong, not wherever feels comfortable.',
  },
  {
    title: '5. Check reward against risk',
    body: 'If the target is too close or the stop has to be too wide, the idea may not be worth taking even if the direction is right.',
  },
  {
    title: '6. Review the decision',
    body: 'After the trade, score the process: context, timing, discipline, and whether the setup matched your playbook.',
  },
];

const glossary = [
  { term: 'Trend', meaning: 'A sustained directional move where the market keeps making higher highs and higher lows, or the opposite.' },
  { term: 'Range', meaning: 'A sideways market where price rotates between support and resistance without sustained expansion.' },
  { term: 'Support / Resistance', meaning: 'Reaction zones where price has previously stalled, rejected, or reversed.' },
  { term: 'Break of Structure', meaning: 'A meaningful violation of a recent swing that suggests momentum may be shifting.' },
  { term: 'Liquidity Sweep', meaning: 'A quick push through obvious highs or lows that traps traders before price reverses.' },
  { term: 'Risk-to-Reward', meaning: 'The relationship between what you may lose if wrong and what you may gain if right.' },
];

const strategyMatrix = [
  {
    market: 'Clean trend',
    best: 'Trend pullback continuation',
    focus: 'Stay aligned with momentum and avoid late entries.',
  },
  {
    market: 'Well-defined range',
    best: 'Range edge reversal',
    focus: 'Only engage near boundaries and skip the middle.',
  },
  {
    market: 'Fresh expansion',
    best: 'Breakout and retest',
    focus: 'Let the market prove the breakout before committing.',
  },
  {
    market: 'Trap and rejection',
    best: 'Liquidity sweep reversal',
    focus: 'Wait for failure after the sweep, not just the sweep itself.',
  },
];

const quizNotes = {
  good: 'The setup stacks context, zone quality, and confirmation instead of relying on hope.',
  bad: 'The trade lacks enough evidence to justify the risk, even if price might still move in that direction.',
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
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <Card className={`relative h-full overflow-hidden bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))] ${typeGlowClassName[example.type]}`}>
        <div className={`absolute inset-x-0 top-0 h-px ${isGood ? 'bg-gradient-to-r from-transparent via-emerald-300 to-transparent' : 'bg-gradient-to-r from-transparent via-rose-300 to-transparent'}`} />
        <div className={`absolute -right-24 top-8 h-36 w-36 rounded-full blur-3xl ${isGood ? 'bg-emerald-500/16' : 'bg-rose-500/16'}`} />
        <CardContent className="relative p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-3">
              {!unlabeled ? (
                <Badge className={typeBadgeClassName[example.type]}>
                  {typeBadgeCopy[example.type]}
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-200/80">Stop</p>
                <p className="mt-2 text-xl font-semibold text-rose-100">{example.stopLoss}</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200/80">Target</p>
                <p className="mt-2 text-xl font-semibold text-emerald-100">{example.takeProfit}</p>
              </div>
            </div>
          </div>

          <div className={`mt-5 rounded-[1.5rem] border p-5 ${listToneClassName[example.type]}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{isGood ? 'Confirmation checklist' : 'Why this trade is weak'}</p>
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
      label: 'Context',
      good: 'The setup matches the market condition and the trade idea fits what price is doing.',
      bad: 'The setup ignores context and forces an idea onto a chart that does not support it.',
    },
    {
      label: 'Confirmation',
      good: 'Several pieces of evidence line up before the trigger is taken.',
      bad: 'The trade is entered before the market proves anything meaningful.',
    },
    {
      label: 'Location',
      good: 'The entry sits near a logical reaction zone.',
      bad: 'The entry is floating in noise or in the middle of a range.',
    },
    {
      label: 'Risk profile',
      good: 'The stop placement is logical and the target pays enough for the risk taken.',
      bad: 'The trade either risks too much or aims for too little.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4 rounded-[2rem] border border-emerald-400/25 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_35%),linear-gradient(180deg,rgba(6,24,18,0.96),rgba(2,6,23,0.94))] p-5 shadow-[0_0_45px_rgba(16,185,129,0.14)]">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">Model setup</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200/70">Trap setup</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Decision quality</p>
              <h3 className="mt-1 text-xl font-semibold text-white">How pros separate a setup from a temptation</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {comparisonRows.map((row) => (
              <div key={row.label} className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 lg:grid-cols-[180px_1fr_1fr] lg:items-center">
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

function RoadmapSection() {
  return (
    <div className="space-y-8">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {learningCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.94))]">
              <CardContent className="p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{card.summary}</p>
                <div className="mt-5 space-y-2">
                  {card.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/5 p-3 text-sm text-slate-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {learningStages.map((stage) => (
          <Card key={stage.title} className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))]">
            <CardContent className="p-6 sm:p-7">
              <Badge className={levelBadgeClassName[stage.level]}>{stage.level}</Badge>
              <h3 className="mt-4 text-2xl font-semibold text-white">{stage.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{stage.goal}</p>
              <div className="mt-5 space-y-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                {stage.lessons.map((lesson) => (
                  <div key={lesson} className="flex items-start gap-3 text-sm text-slate-200">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{lesson}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-[1.5rem] border border-cyan-400/15 bg-cyan-400/8 p-4 text-sm leading-7 text-cyan-50">
                <span className="font-medium text-white">Result:</span> {stage.outcome}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))]">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Quick glossary</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">Core language every trader should understand</h3>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {glossary.map((item) => (
              <div key={item.term} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">{item.term}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{item.meaning}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StrategySection() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-2">
        {strategyCards.map((strategy) => (
          <Card key={strategy.title} className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))]">
            <CardContent className="p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={levelBadgeClassName[strategy.level]}>{strategy.level}</Badge>
                <Badge className="border-white/10 bg-white/5 text-slate-300">{strategy.market}</Badge>
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-white">{strategy.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{strategy.concept}</p>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/70">Checklist</p>
                  <div className="mt-3 space-y-2">
                    {strategy.checklist.map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm text-emerald-50">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-rose-400/20 bg-rose-400/8 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200/70">Avoid when</p>
                  <div className="mt-3 space-y-2">
                    {strategy.avoidWhen.map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm text-rose-50">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))]">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-400/10 text-fuchsia-100">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Choose the right tool</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">Strategy selection by market condition</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {strategyMatrix.map((row) => (
              <div key={row.market} className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 lg:grid-cols-[180px_220px_1fr] lg:items-center">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">{row.market}</p>
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-50">{row.best}</div>
                <p className="text-sm leading-7 text-slate-300">{row.focus}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlaybookSection() {
  return (
    <div className="space-y-8">
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))]">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-100">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Execution routine</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">A simple process from chart to decision</h3>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {playbookSteps.map((step) => (
                <div key={step.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">{step.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{step.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))]">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-100">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Risk model</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">Think in trade quality, not excitement</h3>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
                <p>Many trading education sources teach that the relationship between potential loss and potential gain should be evaluated before the order is placed, not after.</p>
                <p>A strong-looking chart can still be a poor trade if the stop must be too wide, the target is too small, or the entry comes too late.</p>
                <p>The better habit is to reject trades that do not pay enough for the risk, even if the direction seems correct.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))]">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-100">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Psychology checkpoints</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">Mistakes that ruin good analysis</h3>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  'Chasing after price has already moved away from your zone.',
                  'Moving the stop because you want the idea to stay alive.',
                  'Taking low-quality setups after a loss to get even quickly.',
                  'Confusing frequent trades with progress.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-rose-400/15 bg-rose-400/8 p-3 text-sm leading-6 text-rose-50">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))]">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-100">
                  <Flag className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Weekly practice</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">How to improve without overtrading</h3>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  'Screenshot five charts and classify each market as trend, range, or chop.',
                  'Pick one strategy for the week and ignore every setup outside that playbook.',
                  'Journal one trade idea you skipped and explain why skipping was correct or incorrect.',
                  'Score your entries based on context, confirmation, and discipline, not profit alone.',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-amber-400/15 bg-amber-400/8 p-3 text-sm leading-6 text-amber-50">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function TradeQualityExamples() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('roadmap');
  const [activeExampleTab, setActiveExampleTab] = useState<ExampleTab>('good');
  const [testMode, setTestMode] = useState(false);
  const [selectedGuess, setSelectedGuess] = useState<ExampleType | null>(null);
  const [revealed, setRevealed] = useState(false);

  const goodExamples = useMemo(() => examples.filter((example) => example.type === 'good'), []);
  const badExamples = useMemo(() => examples.filter((example) => example.type === 'bad'), []);
  const quizExample = goodExamples[1];
  const quizCorrect = selectedGuess === quizExample.type;

  return (
    <div className="page-stack min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.08),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(244,63,94,0.08),_transparent_26%),linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,0.98))]">
      <section className="relative overflow-hidden py-14 sm:py-18 lg:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[8%] top-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute right-[8%] top-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-[30%] h-56 w-56 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
        </div>

        <div className="page-shell relative">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="mx-auto max-w-5xl text-center">
            <Badge className="border-cyan-400/25 bg-cyan-400/10 text-cyan-100">Education Hub</Badge>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              From <span className="bg-gradient-to-r from-cyan-300 via-white to-emerald-300 bg-clip-text text-transparent">What Is This?</span> to
              <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-rose-300 bg-clip-text text-transparent"> Refined Trade Execution</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Learn trading concepts in layers: understand the basics, study what good and bad setups look like, explore strategy frameworks, and build an execution routine that grows with you.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.06 }} className="mt-10 grid gap-4 md:grid-cols-3">
            <Card className="overflow-hidden border-cyan-400/20 bg-cyan-400/10">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">Beginner</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Understand the chart</h2>
                <p className="mt-3 text-sm leading-7 text-cyan-50/90">Start with structure, zones, confirmations, and what makes a trade idea valid.</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-amber-400/20 bg-amber-400/10">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/80">Developing</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Build confluence</h2>
                <p className="mt-3 text-sm leading-7 text-amber-50/90">Learn how different concepts combine so you stop taking isolated signals.</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-fuchsia-400/20 bg-fuchsia-400/10">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200/80">Advanced</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Refine execution</h2>
                <p className="mt-3 text-sm leading-7 text-fuchsia-50/90">Adapt strategies to market condition and tighten discipline, timing, and review.</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.1 }} className="mt-10 flex flex-wrap gap-2 rounded-[1.75rem] border border-white/10 bg-white/5 p-2 backdrop-blur-xl">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMainTab(tab.id)}
                  className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[1rem] px-4 py-3 text-sm font-medium transition-all ${activeMainTab === tab.id ? 'bg-white text-slate-950 shadow-[0_12px_30px_rgba(255,255,255,0.14)]' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="pb-14 sm:pb-18 lg:pb-24">
        <div className="page-shell">
          <AnimatePresence mode="wait">
            {activeMainTab === 'roadmap' ? (
              <motion.div key="roadmap" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.24 }}>
                <RoadmapSection />
              </motion.div>
            ) : null}

            {activeMainTab === 'examples' ? (
              <motion.div key="examples" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.24 }} className="space-y-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="inline-flex w-full flex-wrap gap-2 rounded-[1.5rem] border border-white/10 bg-white/5 p-2 backdrop-blur-xl lg:w-auto">
                    {exampleTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveExampleTab(tab.id)}
                          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-[1rem] px-4 py-3 text-sm font-medium transition-all ${activeExampleTab === tab.id ? 'bg-white text-slate-950 shadow-[0_12px_30px_rgba(255,255,255,0.14)]' : 'text-slate-300 hover:bg-white/8 hover:text-white'}`}
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
                </div>

                {testMode ? (
                  <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
                    <Card className="overflow-hidden border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))]">
                      <CardContent className="p-6 sm:p-8">
                        <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[1.15fr_0.85fr]">
                          <TradeExampleCard example={quizExample} unlabeled />

                          <div className="space-y-5 rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Quiz mode</p>
                              <h2 className="mt-2 text-2xl font-semibold text-white">Would you classify this as good or bad?</h2>
                              <p className="mt-3 text-sm leading-7 text-slate-300">Use context, confirmation, location, and reward-to-risk to make the decision.</p>
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
                                <p className="mt-2">This example is a <span className="font-semibold">{quizExample.type.toUpperCase()}</span> trade because {quizNotes[quizExample.type].toLowerCase()}</p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : null}

                <AnimatePresence mode="wait">
                  {activeExampleTab === 'good' ? (
                    <motion.div key="good" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.24 }} className="grid gap-6 xl:grid-cols-2">
                      {goodExamples.map((example) => <TradeExampleCard key={example.id} example={example} />)}
                    </motion.div>
                  ) : null}

                  {activeExampleTab === 'bad' ? (
                    <motion.div key="bad" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.24 }} className="grid gap-6 xl:grid-cols-2">
                      {badExamples.map((example) => <TradeExampleCard key={example.id} example={example} />)}
                    </motion.div>
                  ) : null}

                  {activeExampleTab === 'breakdown' ? (
                    <motion.div key="breakdown" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.24 }}>
                      <BreakdownPanel goodExample={goodExamples[0]} badExample={badExamples[0]} />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            ) : null}

            {activeMainTab === 'strategies' ? (
              <motion.div key="strategies" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.24 }}>
                <StrategySection />
              </motion.div>
            ) : null}

            {activeMainTab === 'playbook' ? (
              <motion.div key="playbook" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.24 }}>
                <PlaybookSection />
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
                <h2 className="mt-2 text-2xl font-semibold text-white">Train your eye before you trust your click</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">This hub is designed to help a first-time learner understand charts and help an experienced trader sharpen execution. The more consistently you can identify context, confirmation, and risk, the less random your trading decisions become.</p>
              </div>
              <div className="inline-flex items-center gap-3 rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-50">
                <TrendingUp className="h-5 w-5 text-cyan-200" />
                Better trades come from better filtering.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}