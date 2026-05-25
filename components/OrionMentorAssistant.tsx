'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CandlestickChart,
  ChevronUp,
  CreditCard,
  Eye,
  Layers3,
  Radar,
  Shield,
  Sparkles,
  Target,
  Upload,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ORION_CONTEXT_EVENT, type OrionFocusContext } from '@/lib/orion-context';

type MentorAction = {
  href: string;
  label: string;
  icon: typeof BrainCircuit;
  variant?: 'outline' | 'ghost';
};

type MentorPageState = {
  label: string;
  description: string;
  insights: string[];
  actions: MentorAction[];
  summary: string;
};

type MentorFocusState = {
  label: string;
  description: string;
  actions: MentorAction[];
  insight: string;
};

const PUBLIC_MENTOR_PATHS = new Set(['/', '/platform', '/pricing', '/checkout', '/trade-examples']);
const CHECKOUT_PLAN_LABELS: Record<string, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  TOP_TIER: 'PRO+',
  GOLDX: 'GoldX',
  GOLDX_PULSE: 'GoldX Pulse',
};

const STATUS_LABELS: Record<Extract<OrionFocusContext, { kind: 'live-signal' }>['status'], string> = {
  active: 'Active',
  running_profit: 'Running profit',
  tp_hit: 'Take profit hit',
  sl_hit: 'Stop loss hit',
  expired: 'Expired',
};

const resolvePageState = (pathname: string, checkoutPlanLabel: string | null): MentorPageState => {
  if (pathname === '/') {
    return {
      label: 'Home',
      description: 'Introduce the platform, understand the workflow, and choose whether to start with analysis or compare plans.',
      insights: [
        'TradeVision is strongest when you move from chart reading into structured decisions instead of impulse entries.',
        'Start with chart analysis if you want to see how ORION reads structure before you pay for more workflow depth.',
        'Use the platform page when you want to understand how each workspace fits into an actual trading routine.',
      ],
      actions: [
        { href: '/analyze', label: 'Start chart analysis', icon: Upload, variant: 'outline' },
        { href: '/platform', label: 'Explore the platform', icon: Layers3 },
        { href: '/pricing', label: 'Compare plans', icon: CreditCard },
        { href: '/trade-examples', label: 'Review trade examples', icon: Eye },
      ],
      summary: 'ORION AI is guiding the platform entry flow so users can move from discovery into a structured trading workflow.',
    };
  }

  if (pathname === '/platform') {
    return {
      label: 'Platform Guide',
      description: 'Explain how analysis, command workflows, live workspaces, and GoldX fit together as one operating system.',
      insights: [
        'The platform flow should make the next step obvious: analyze, plan, track, or refine.',
        'Users understand value faster when each workspace is tied to a concrete trading job instead of a feature list.',
        'ORION should keep the emphasis on process quality, not on promising outcomes.',
      ],
      actions: [
        { href: '/analyze', label: 'Start with Analyze', icon: Upload, variant: 'outline' },
        { href: '/pricing', label: 'Compare plans', icon: CreditCard },
        { href: '/', label: 'Return home', icon: BrainCircuit },
        { href: '/trade-examples', label: 'Review examples', icon: Eye },
      ],
      summary: 'ORION AI is framing the platform as a trader operating system so users know what each workspace is for before they subscribe.',
    };
  }

  if (pathname === '/pricing') {
    return {
      label: 'Pricing',
      description: 'Help users choose the plan that matches how they trade rather than pushing them into the wrong tier.',
      insights: [
        'Pricing works best when each plan is tied to a workflow depth, not just a feature count.',
        'Users comparing plans usually need clarity on usage, speed, and which workspace unlocks matter to them.',
        'GoldX should stay clearly separated from the core analysis subscriptions so the offer remains understandable.',
      ],
      actions: [
        { href: '/checkout?plan=PRO', label: 'Choose Pro', icon: CreditCard, variant: 'outline' },
        { href: '/checkout?plan=TOP_TIER', label: 'Choose PRO+', icon: Zap },
        { href: '/goldx/checkout', label: 'Explore GoldX', icon: Shield },
        { href: '/platform', label: 'Open platform guide', icon: Layers3 },
      ],
      summary: 'ORION AI is helping users map plan choice to their trading workflow so upgrades feel intentional.',
    };
  }

  if (pathname === '/checkout') {
    return {
      label: checkoutPlanLabel ? `${checkoutPlanLabel} Checkout` : 'Checkout',
      description: checkoutPlanLabel
        ? `Guide the user through completing the ${checkoutPlanLabel} purchase with a clear view of what they are unlocking.`
        : 'Complete payment with a clear understanding of the selected plan, access level, and next step after checkout.',
      insights: [
        'Checkout friction drops when the user remembers exactly what workflow they are buying into.',
        'Keep the focus on access continuity, platform fit, and operational clarity while payment is in progress.',
        'If a user hesitates at checkout, compare the plan again rather than forcing the conversion.',
      ],
      actions: [
        { href: '/pricing', label: 'Review plans again', icon: CreditCard, variant: 'outline' },
        { href: '/platform', label: 'Revisit platform guide', icon: Layers3 },
        { href: '/analyze', label: 'Try chart analysis first', icon: Upload },
        { href: '/', label: 'Return home', icon: BrainCircuit },
      ],
      summary: checkoutPlanLabel
        ? `ORION AI is reinforcing the ${checkoutPlanLabel} workflow so the checkout decision stays tied to platform value.`
        : 'ORION AI is helping the user complete checkout with clear expectations about platform access and next steps.',
    };
  }

  if (pathname === '/trade-examples') {
    return {
      label: 'Trade Examples',
      description: 'Use examples to teach how the platform reads structure, invalidation, and execution quality in practice.',
      insights: [
        'Examples are strongest when they show why a setup was valid, not just what happened after entry.',
        'Trade education should reinforce process quality and invalidation discipline before outcomes.',
        'Move users from examples into real analysis so they can apply the framework to their own charts.',
      ],
      actions: [
        { href: '/analyze', label: 'Analyze your own chart', icon: Upload, variant: 'outline' },
        { href: '/platform', label: 'Open platform guide', icon: Layers3 },
        { href: '/pricing', label: 'Compare plans', icon: CreditCard },
        { href: '/', label: 'Return home', icon: BrainCircuit },
      ],
      summary: 'ORION AI is using trade examples to teach disciplined analysis before a user moves into live workflows.',
    };
  }

  if (pathname === '/analyze/queue') {
    return {
      label: 'Analysis Queue',
      description: 'Track live job progress and move completed analyses into execution review.',
      insights: [
        'Queued analysis is only useful if you review the invalidation and not just the headline verdict.',
        'Use completed queue items as the handoff point into Command Center or Trade Radar.',
        'If a setup is still processing, keep the market context stable before acting on it.',
      ],
      actions: [
        { href: '/analyze', label: 'Upload another chart', icon: Upload, variant: 'outline' },
        { href: '/dashboard/command-center', label: 'Open command center', icon: Target },
        { href: '/dashboard/radar', label: 'Review Trade Radar', icon: Radar },
        { href: '/dashboard', label: 'Back to intelligence', icon: BarChart3 },
      ],
      summary: 'ORION AI is monitoring queued analysis so completed results can be promoted into execution review.',
    };
  }

  if (pathname === '/analyze') {
    return {
      label: 'Chart Analysis',
      description: 'Upload a chart, get structured analysis, then promote only clean setups forward.',
      insights: [
        'Upload clean charts with visible structure so ORION can score the setup accurately.',
        'Use the invalidation area as the first filter, not the last.',
        'Wait for confirmation when momentum and liquidity are not aligned.',
      ],
      actions: [
        { href: '/analyze/queue', label: 'View analysis queue', icon: BarChart3, variant: 'outline' },
        { href: '/dashboard/command-center', label: 'Open command center', icon: Target },
        { href: '/dashboard/tradingview', label: 'Open live analysis', icon: CandlestickChart },
        { href: '/dashboard', label: 'View workspace pulse', icon: BrainCircuit },
      ],
      summary: 'ORION AI is active and adapting the workspace around your trading profile.',
    };
  }

  if (pathname === '/dashboard/tradingview' || pathname === '/dashboard/signals' || pathname === '/dashboard/scanner') {
    return {
      label: 'TradingView Live Analysis',
      description: 'Monitor live market structure, select a setup, then promote only confirmed conditions into tracking or execution planning.',
      insights: [
        'Live signals should be promoted only after structure, liquidity, and RR still agree at the moment of review.',
        'Use Radar for persistent monitoring, not for replacing trade judgment.',
        'If confidence is falling while price approaches entry, let the setup degrade instead of forcing execution.',
      ],
      actions: [
        { href: '/dashboard/radar', label: 'Open Trade Radar', icon: Radar, variant: 'outline' },
        { href: '/dashboard/command-center', label: 'Open command center', icon: Target },
        { href: '/analyze', label: 'Analyze a chart', icon: Upload },
        { href: '/dashboard', label: 'View workspace pulse', icon: BrainCircuit },
      ],
      summary: 'ORION AI is watching the live terminal so selected TradingView setups can move into tracking or execution planning with more structure.',
    };
  }

  if (pathname === '/dashboard/deriv') {
    return {
      label: 'Deriv Flow',
      description: 'Work the Deriv live terminal, confirm structure quality, then carry valid setups into tracking.',
      insights: [
        'Fast instruments punish hesitation and poor invalidation more than slower markets do.',
        'Keep session quality and volatility regime aligned before you trust the entry zone.',
        'Use the live workspace to filter, not to manufacture trades out of noise.',
      ],
      actions: [
        { href: '/dashboard/radar', label: 'Open Trade Radar', icon: Radar, variant: 'outline' },
        { href: '/dashboard/command-center', label: 'Open command center', icon: Target },
        { href: '/dashboard/tradingview', label: 'Switch to TradingView', icon: CandlestickChart },
        { href: '/dashboard', label: 'View workspace pulse', icon: BrainCircuit },
      ],
      summary: 'ORION AI is filtering fast Deriv conditions so only structured live setups move into the next workflow.',
    };
  }

  if (pathname === '/dashboard/command-center') {
    return {
      label: 'Command Center',
      description: 'Translate analysis into a disciplined execution plan with explicit invalidation and management logic.',
      insights: [
        'Promote only structured setups into execution planning.',
        'A strong invalidation level matters more than a fast entry.',
        'If volatility is unstable, protect capital before chasing RR.',
      ],
      actions: [
        { href: '/dashboard/radar', label: 'Open Trade Radar', icon: Radar, variant: 'outline' },
        { href: '/dashboard/tradingview', label: 'Open live analysis', icon: CandlestickChart },
        { href: '/analyze', label: 'Analyze another chart', icon: Upload },
        { href: '/dashboard', label: 'View workspace pulse', icon: BrainCircuit },
      ],
      summary: 'ORION AI is framing execution planning around invalidation, structure, and readiness instead of speed alone.',
    };
  }

  if (pathname === '/dashboard/radar') {
    return {
      label: 'Trade Radar',
      description: 'Monitor tracked setups, review state changes, and decide whether execution conditions still hold.',
      insights: [
        'Tracked setups still need judgment when price reaches the decision zone.',
        'Radar is strongest when each tracked trade has clear invalidation and a known execution thesis.',
        'If structure changes before entry, remove the setup instead of defending the original idea.',
      ],
      actions: [
        { href: '/dashboard/tradingview', label: 'Find new live setups', icon: CandlestickChart, variant: 'outline' },
        { href: '/dashboard/command-center', label: 'Open command center', icon: Target },
        { href: '/analyze', label: 'Analyze a chart', icon: Upload },
        { href: '/dashboard', label: 'View workspace pulse', icon: BrainCircuit },
      ],
      summary: 'ORION AI is monitoring tracked trades so execution quality can stay aligned with the original thesis.',
    };
  }

  if (pathname === '/dashboard/billing') {
    return {
      label: 'Billing',
      description: 'Manage platform access, keep your plan aligned with the tools you actually use, and avoid workflow interruptions.',
      insights: [
        'Your plan should match your execution workflow, not just feature curiosity.',
        'Keep billing current so analysis, alerts, and tracking do not break mid-routine.',
        'Review which workspace actually produces your edge before changing plans.',
      ],
      actions: [
        { href: '/pricing', label: 'Review plans', icon: CreditCard, variant: 'outline' },
        { href: '/dashboard', label: 'Return to dashboard', icon: BrainCircuit },
        { href: '/dashboard/tradingview', label: 'Open live analysis', icon: CandlestickChart },
        { href: '/dashboard/radar', label: 'Open Trade Radar', icon: Radar },
      ],
      summary: 'ORION AI is keeping access management tied to the workflows you actually use, not to random feature switching.',
    };
  }

  if (pathname === '/dashboard/referrals') {
    return {
      label: 'Referrals',
      description: 'Track referral performance while keeping the main focus on platform usage and trading outcomes.',
      insights: [
        'Referral growth should not distract from the quality of your own workflow.',
        'The best referral story is a platform routine that is visibly structured and repeatable.',
        'Measure referral performance alongside actual platform engagement, not in isolation.',
      ],
      actions: [
        { href: '/dashboard', label: 'Return to dashboard', icon: BrainCircuit, variant: 'outline' },
        { href: '/dashboard/billing', label: 'Open billing', icon: CreditCard },
        { href: '/dashboard/tradingview', label: 'Open live analysis', icon: CandlestickChart },
        { href: '/dashboard/radar', label: 'Open Trade Radar', icon: Radar },
      ],
      summary: 'ORION AI is keeping referrals in context so growth does not overtake trading process quality.',
    };
  }

  if (pathname === '/dashboard/goldx-pulse') {
    return {
      label: 'GoldX Pulse',
      description: 'Review GoldX operating intelligence, then decide whether conditions support continuation or capital preservation.',
      insights: [
        'Pulse is strongest when you use it to read regime changes, not to force constant activity.',
        'Continuation quality matters more than raw momentum if structure is deteriorating.',
        'Let the engine confirm market state before you widen risk exposure.',
      ],
      actions: [
        { href: '/dashboard/goldx', label: 'Open GoldX workspace', icon: Sparkles, variant: 'outline' },
        { href: '/dashboard/tradingview', label: 'Open live analysis', icon: CandlestickChart },
        { href: '/dashboard/radar', label: 'Open Trade Radar', icon: Radar },
        { href: '/dashboard', label: 'View workspace pulse', icon: BrainCircuit },
      ],
      summary: 'ORION AI is using Pulse to keep regime detection ahead of risk expansion.',
    };
  }

  if (pathname === '/dashboard/goldx') {
    return {
      label: 'GoldX',
      description: 'Manage the GoldX workspace, review system conditions, and move only confirmed market states into action.',
      insights: [
        'System confidence matters only if the market state still supports the model assumptions.',
        'Use GoldX as an operating system, not as permission to ignore invalidation.',
        'Keep execution discipline consistent even when the engine bias is strong.',
      ],
      actions: [
        { href: '/dashboard/goldx-pulse', label: 'Open GoldX Pulse', icon: Sparkles, variant: 'outline' },
        { href: '/dashboard/tradingview', label: 'Open live analysis', icon: CandlestickChart },
        { href: '/dashboard/radar', label: 'Open Trade Radar', icon: Radar },
        { href: '/dashboard', label: 'View workspace pulse', icon: BrainCircuit },
      ],
      summary: 'ORION AI is keeping GoldX tied to confirmed market state rather than automation for its own sake.',
    };
  }

  return {
    label: 'Intelligence Dashboard',
    description: 'Review platform activity, recent analyses, and route the next best workflow from the main operating surface.',
    insights: [
      'Momentum is strongest when structure, liquidity, and session quality align.',
      'Review recent analyses before promoting any setup into execution planning.',
      'The command center is best used after a chart has a defined invalidation level.',
    ],
    actions: [
      { href: '/dashboard/tradingview', label: 'Open live analysis', icon: CandlestickChart, variant: 'outline' },
      { href: '/analyze', label: 'Analyze a chart', icon: Upload },
      { href: '/dashboard/command-center', label: 'Open command center', icon: Target },
      { href: '/dashboard/radar', label: 'Open Trade Radar', icon: Radar },
    ],
    summary: 'ORION AI is active and adapting the workspace around your trading profile.',
  };
};

const resolveFocusState = (pathname: string, focusContext: OrionFocusContext | null): MentorFocusState | null => {
  if (!focusContext) {
    return null;
  }

  if (focusContext.kind === 'analysis' && pathname === '/analyze') {
    return {
      label: 'Focused analysis',
      description: `${focusContext.market} ${focusContext.timeframe} is loaded with ${focusContext.confidence}% confidence, ${focusContext.trend} structure, and a ${focusContext.signalType} setup profile.`,
      actions: [
        { href: `/analyze?analysisId=${encodeURIComponent(focusContext.id)}`, label: `Review ${focusContext.market}`, icon: Upload, variant: 'outline' },
        { href: '/dashboard/command-center', label: 'Open command center', icon: Target },
        { href: '/dashboard/radar', label: 'Open Trade Radar', icon: Radar },
        { href: '/analyze', label: 'Run a new chart', icon: BarChart3 },
      ],
      insight: focusContext.entryBias !== 'none'
        ? `ORION is focused on a ${focusContext.entryBias} bias with ${focusContext.trend} structure on ${focusContext.market}.`
        : `ORION is focused on a ${focusContext.trend} ${focusContext.signalType} setup on ${focusContext.market}.`,
    };
  }

  if (
    focusContext.kind === 'live-signal'
    && (pathname === '/dashboard/tradingview' || pathname === '/dashboard/signals' || pathname === '/dashboard/scanner' || pathname === '/dashboard/deriv')
  ) {
    return {
      label: 'Focused live setup',
      description: `${focusContext.market} ${focusContext.direction.toUpperCase()} is selected on ${focusContext.timeframe} with ${focusContext.confidence}% confidence, ${focusContext.grade} quality, and ${STATUS_LABELS[focusContext.status].toLowerCase()} status.`,
      actions: focusContext.source === 'tradingview'
        ? [
            { href: '/dashboard/radar', label: 'Open Trade Radar', icon: Radar, variant: 'outline' },
            { href: '/dashboard/command-center', label: 'Open command center', icon: Target },
            { href: '/analyze', label: 'Analyze a chart', icon: Upload },
            { href: '/dashboard', label: 'View workspace pulse', icon: BrainCircuit },
          ]
        : [
            { href: '/dashboard/command-center', label: 'Open command center', icon: Target, variant: 'outline' },
            { href: '/dashboard/radar', label: 'Open Trade Radar', icon: Radar },
            { href: '/dashboard/tradingview', label: 'Switch to TradingView', icon: CandlestickChart },
            { href: '/dashboard', label: 'View workspace pulse', icon: BrainCircuit },
          ],
      insight: `ORION is focused on ${focusContext.market} ${focusContext.direction.toUpperCase()} and is prioritizing structure quality over activity.`,
    };
  }

  return null;
};

export function OrionMentorAssistant() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [insightIndex, setInsightIndex] = useState(0);
  const [focusContext, setFocusContext] = useState<OrionFocusContext | null>(null);

  const isWorkspaceSurface = pathname.startsWith('/dashboard') || pathname.startsWith('/analyze');
  const isPublicSurface = PUBLIC_MENTOR_PATHS.has(pathname);
  const shouldRender = isPublicSurface || (Boolean(user) && isWorkspaceSurface);
  const requestedPlan = searchParams.get('plan')?.toUpperCase() ?? null;
  const checkoutPlanLabel = requestedPlan ? CHECKOUT_PLAN_LABELS[requestedPlan] ?? null : null;

  useEffect(() => {
    if (!shouldRender) {
      setOpen(false);
    }
  }, [shouldRender]);

  useEffect(() => {
    setFocusContext(null);
  }, [pathname]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    const handleContextUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<OrionFocusContext | null>;
      setFocusContext(customEvent.detail ?? null);
    };

    window.addEventListener(ORION_CONTEXT_EVENT, handleContextUpdate as EventListener);
    return () => {
      window.removeEventListener(ORION_CONTEXT_EVENT, handleContextUpdate as EventListener);
    };
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

  useEffect(() => {
    setInsightIndex(0);
  }, [pathname, focusContext?.id]);

  const currentPage = useMemo(() => resolvePageState(pathname, checkoutPlanLabel), [pathname, checkoutPlanLabel]);
  const focusState = useMemo(() => resolveFocusState(pathname, focusContext), [pathname, focusContext]);

  if (!shouldRender) {
    return null;
  }

  const challenge = user?.onboarding?.responses?.biggestChallenge;
  const personalizedInsight = user
    ? challenge === 'emotional_trading'
      ? 'ORION AI is watching for early entries and elevated emotional risk.'
      : challenge === 'overtrading'
        ? 'Weak sessions should be filtered out before they become forced trades.'
        : challenge === 'risk_management'
          ? 'Risk consistency is a higher priority than chasing more activity.'
          : 'Higher timeframe structure should lead execution timing.'
    : currentPage.summary;
  const insights = [focusState?.insight ?? personalizedInsight, ...currentPage.insights];
  const insight = insights[insightIndex % insights.length];
  const summary = user?.onboarding?.summary ?? currentPage.summary;
  const actionSet = focusState?.actions ?? currentPage.actions;

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
              <div className="text-[11px] uppercase tracking-[0.24em] text-blue-100/72">Detected page</div>
              <div className="mt-2 text-sm font-semibold text-white">{currentPage.label}</div>
              <p className="mt-2 text-sm leading-7 text-white/62">{currentPage.description}</p>
            </div>

            {focusState ? (
              <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/58">Focused context</div>
                <div className="mt-2 text-sm font-semibold text-white">{focusState.label}</div>
                <p className="mt-2 text-sm leading-7 text-white/62">{focusState.description}</p>
              </div>
            ) : null}

            <div className="mt-4 rounded-[22px] border border-blue-300/14 bg-blue-400/8 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-blue-100/72">Live mentor feedback</div>
              <p className="mt-2 text-sm leading-7 text-white/78">{insight}</p>
            </div>

            <p className="mt-4 text-sm leading-7 text-white/54">{summary}</p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {actionSet.map((action) => {
                const Icon = action.icon;

                return (
                  <Link key={`${pathname}:${action.href}:${action.label}`} href={action.href} className="block">
                    <Button
                      variant={action.variant ?? 'ghost'}
                      size="sm"
                      className={`w-full justify-between gap-2 ${action.variant === 'outline' ? 'border-blue-300/18 hover:border-blue-300/34' : 'text-white/72 hover:text-white'}`}
                    >
                      {action.label}
                      {action.variant === 'outline' ? <ArrowRight className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </Button>
                  </Link>
                );
              })}
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