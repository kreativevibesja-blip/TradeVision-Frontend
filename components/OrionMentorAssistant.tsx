'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, ChevronUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const pathInsights: Record<string, string[]> = {
  '/dashboard': [
    'Momentum is strongest when structure, liquidity, and session quality align.',
    'Review recent analyses before promoting any setup into execution planning.',
    'The command center is best used after a chart has a defined invalidation level.',
  ],
  '/analyze': [
    'Upload clean charts with visible structure so ORION can score the setup accurately.',
    'Use the invalidation area as the first filter, not the last.',
    'Wait for confirmation when momentum and liquidity are not aligned.',
  ],
  '/dashboard/command-center': [
    'Promote only structured setups into execution planning.',
    'A strong invalidation level matters more than a fast entry.',
    'If volatility is unstable, protect capital before chasing RR.',
  ],
};

export function OrionMentorAssistant() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [insightIndex, setInsightIndex] = useState(0);

  const shouldRender = Boolean(user) && (pathname.startsWith('/dashboard') || pathname.startsWith('/analyze'));

  useEffect(() => {
    if (!shouldRender) {
      setOpen(false);
    }
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    const timer = window.setInterval(() => {
      setInsightIndex((current) => current + 1);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [shouldRender]);

  if (!shouldRender) {
    return null;
  }

  const baseInsights = pathInsights[pathname] ?? pathInsights['/dashboard'];
  const challenge = user?.onboarding?.responses?.biggestChallenge;
  const personalizedInsight = challenge === 'emotional_trading'
    ? 'ORION AI is watching for early entries and elevated emotional risk.'
    : challenge === 'overtrading'
      ? 'Weak sessions should be filtered out before they become forced trades.'
      : challenge === 'risk_management'
        ? 'Risk consistency is a higher priority than chasing more activity.'
        : 'Higher timeframe structure should lead execution timing.';
  const insights = [personalizedInsight, ...baseInsights];
  const insight = insights[insightIndex % insights.length];
  const summary = user?.onboarding?.summary ?? 'ORION AI is active and adapting the workspace around your trading profile.';

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex max-w-[min(24rem,calc(100vw-2rem))] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="pointer-events-auto w-full rounded-[28px] border border-[rgba(92,163,255,0.26)] bg-[linear-gradient(180deg,rgba(10,18,35,0.95),rgba(3,7,18,0.96))] p-5 shadow-[0_30px_90px_rgba(2,6,23,0.62),0_0_0_1px_rgba(59,130,246,0.1)] backdrop-blur-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-blue-100/72">ORION AI</div>
                <div className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">Institutional Trading Mentor</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-white/10 p-2 text-white/54 transition hover:border-blue-300/24 hover:text-white">
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-[22px] border border-blue-300/14 bg-blue-400/8 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-blue-100/72">Live mentor feedback</div>
              <p className="mt-2 text-sm leading-7 text-white/78">{insight}</p>
            </div>

            <p className="mt-4 text-sm leading-7 text-white/54">{summary}</p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Link href="/analyze" className="block">
                <Button variant="outline" size="sm" className="w-full justify-between gap-2 border-blue-300/18 hover:border-blue-300/34">
                  Analyze a chart
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/command-center" className="block">
                <Button variant="ghost" size="sm" className="w-full justify-between gap-2 text-white/72 hover:text-white">
                  Open command center
                  <Target className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard/tradingview" className="block">
                <Button variant="ghost" size="sm" className="w-full justify-between gap-2 text-white/72 hover:text-white">
                  Open live analysis
                  <BrainCircuit className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard" className="block">
                <Button variant="ghost" size="sm" className="w-full justify-between gap-2 text-white/72 hover:text-white">
                  View workspace pulse
                  <BrainCircuit className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="pointer-events-auto hidden h-16 w-16 items-center justify-center rounded-full border border-[rgba(92,163,255,0.36)] bg-[radial-gradient(circle_at_top,rgba(147,197,253,0.4),rgba(30,64,175,0.94))] text-white shadow-[0_0_0_1px_rgba(96,165,250,0.12),0_22px_55px_rgba(2,6,23,0.58),0_0_34px_rgba(59,130,246,0.24)] sm:flex"
      >
        <span className="absolute h-16 w-16 animate-ping rounded-full border border-blue-300/18" />
        <BrainCircuit className="relative h-7 w-7" />
      </button>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="pointer-events-auto flex min-h-12 items-center gap-3 rounded-full border border-[rgba(92,163,255,0.32)] bg-[linear-gradient(135deg,rgba(30,41,59,0.94),rgba(15,23,42,0.96))] px-4 py-3 text-left shadow-[0_18px_45px_rgba(2,6,23,0.55)] sm:hidden"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/18 text-blue-100">
          <BrainCircuit className="h-4 w-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-blue-100/72">ORION AI</div>
          <div className="text-sm text-white">Mentor active</div>
        </div>
      </button>
    </div>
  );
}