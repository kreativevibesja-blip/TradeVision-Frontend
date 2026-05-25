'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BrainCircuit, Check, ChevronLeft, Loader2, Orbit, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { api, type OnboardingResponses } from '@/lib/api';

type TraderLevel = NonNullable<OnboardingResponses['traderLevel']>;

type Option = {
  value: string;
  title: string;
  description: string;
};

const traderLevels: Array<Option & { value: TraderLevel }> = [
  { value: 'beginner', title: 'Beginner', description: 'Less than 6 months experience.' },
  { value: 'intermediate', title: 'Intermediate', description: 'Actively trading for over 1 year.' },
  { value: 'experienced', title: 'Experienced', description: 'Confident with structure, execution and risk management.' },
];

const markets: Option[] = [
  { value: 'forex', title: 'Forex', description: 'Major and cross-currency structure.' },
  { value: 'gold_and_commodities', title: 'Gold & Commodities', description: 'XAUUSD, oil, and macro-sensitive flows.' },
  { value: 'crypto', title: 'Crypto', description: 'Momentum, liquidity, and structured weekend market analysis.' },
  { value: 'stocks', title: 'Stocks', description: 'Single-name technical structure and rotation.' },
  { value: 'indices', title: 'Indices', description: 'Institutional risk-on and risk-off environments.' },
  { value: 'synthetic_indices', title: 'Synthetic Indices', description: 'Structured synthetic market monitoring.' },
  { value: 'volatility_indices', title: 'Volatility Indices', description: 'Higher-velocity conditions and reactive planning.' },
];

const challenges: Option[] = [
  { value: 'finding_quality_entries', title: 'Finding quality entries', description: 'Wait for higher-quality triggers and cleaner locations.' },
  { value: 'risk_management', title: 'Risk management', description: 'Keep losses controlled and sizing consistent.' },
  { value: 'emotional_trading', title: 'Emotional trading', description: 'Reduce impulsive decisions under pressure.' },
  { value: 'overtrading', title: 'Overtrading', description: 'Avoid forcing setups when conditions are weak.' },
  { value: 'understanding_structure', title: 'Understanding structure', description: 'Read BOS, CHOCH, bias, and delivery more clearly.' },
  { value: 'holding_trades', title: 'Holding trades', description: 'Stay aligned with the plan once the trade is active.' },
  { value: 'exiting_too_early', title: 'Exiting too early', description: 'Let winners develop without cutting them short.' },
  { value: 'lack_of_consistency', title: 'Lack of consistency', description: 'Build a repeatable workflow and review process.' },
];

const goals: Option[] = [
  { value: 'learn_profitability', title: 'Learn to trade profitably', description: 'Build a structured foundation.' },
  { value: 'become_consistent', title: 'Become more consistent', description: 'Improve process and execution quality.' },
  { value: 'pass_funded_challenges', title: 'Pass funded challenges', description: 'Trade with tighter discipline and rules.' },
  { value: 'build_second_income', title: 'Build a second income', description: 'Focus on repeatable, high-quality opportunities.' },
  { value: 'trade_professionally', title: 'Trade professionally', description: 'Operate with institutional structure and review.' },
  { value: 'automate_execution', title: 'Automate execution', description: 'Prepare for more systemized trade handling.' },
];

const assistanceModes: Option[] = [
  { value: 'smarter_chart_analysis', title: 'Smarter chart analysis', description: 'Sharper readouts across uploaded and live charts.' },
  { value: 'market_structure_guidance', title: 'Market structure guidance', description: 'Bias, BOS, CHOCH, and premium/discount guidance.' },
  { value: 'trade_opportunity_tracking', title: 'Execution planning', description: 'Turn strong structure into a disciplined trade plan.' },
  { value: 'strategy_refinement', title: 'Strategy refinement', description: 'Improve confluence and execution decision rules.' },
  { value: 'risk_management_coaching', title: 'Risk management coaching', description: 'Tighter invalidation and position discipline.' },
  { value: 'trade_journaling_insights', title: 'Trade journaling insights', description: 'Review habits, patterns, and session performance.' },
  { value: 'session_analysis', title: 'Session analysis', description: 'Understand volatility and session quality.' },
  { value: 'ai_mentor_feedback', title: 'AI mentor feedback', description: 'Receive direct Orion guidance across the workspace.' },
];

const initialResponses: OnboardingResponses = {
  traderLevel: null,
  markets: [],
  biggestChallenge: null,
  primaryGoal: null,
  assistanceModes: [],
};

export function OrionOnboardingExperience() {
  const { user, token, loading, refreshUser } = useAuth();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState<OnboardingResponses>(initialResponses);
  const [summary, setSummary] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) {
      setVisible(false);
      return;
    }

    const onboardingCompleted = user.onboarding?.completed ?? false;
    setVisible(Boolean(token) && !onboardingCompleted);
  }, [loading, token, user]);

  useEffect(() => {
    if (!visible) {
      setStep(0);
      setError(null);
      setSubmitting(false);
      setSummary(null);
      setResponses(initialResponses);
    }
  }, [visible]);

  const completion = useMemo(() => {
    if (step === 0) {
      return 0;
    }

    return Math.min(100, (step / 6) * 100);
  }, [step]);

  const canContinue = () => {
    if (step === 1) return Boolean(responses.traderLevel);
    if (step === 2) return responses.markets.length > 0;
    if (step === 3) return Boolean(responses.biggestChallenge);
    if (step === 4) return Boolean(responses.primaryGoal);
    if (step === 5) return responses.assistanceModes.length > 0;
    return true;
  };

  const toggleMultiValue = (key: 'markets' | 'assistanceModes', value: string) => {
    setResponses((current) => {
      const nextValues = current[key].includes(value)
        ? current[key].filter((entry) => entry !== value)
        : [...current[key], value];

      return {
        ...current,
        [key]: nextValues,
      };
    });
  };

  const handleSubmit = async () => {
    if (!token || !responses.traderLevel) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await api.saveOnboardingProfile(
        {
          traderLevel: responses.traderLevel,
          markets: responses.markets,
          biggestChallenge: responses.biggestChallenge,
          primaryGoal: responses.primaryGoal,
          assistanceModes: responses.assistanceModes,
        },
        token,
      );

      setSummary(result.onboarding.summary);
      setStep(6);
      await refreshUser();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save your Orion profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) {
    return null;
  }

  const renderSingleSelect = (items: Option[], selectedValue: string | null, onSelect: (value: string) => void) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const selected = selectedValue === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect(item.value)}
            className={`group rounded-[28px] border p-5 text-left transition-all duration-200 ${selected ? 'border-[rgba(92,163,255,0.65)] bg-[linear-gradient(180deg,rgba(35,87,184,0.36),rgba(6,14,30,0.92))] shadow-[0_0_0_1px_rgba(92,163,255,0.18),0_30px_80px_rgba(2,6,23,0.55)]' : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] hover:border-[rgba(92,163,255,0.36)] hover:bg-[rgba(17,24,39,0.9)]'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold tracking-[-0.04em] text-white">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-white/64">{item.description}</p>
              </div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${selected ? 'border-blue-300/70 bg-blue-400/18 text-blue-200' : 'border-white/12 text-white/30'}`}>
                <Check className="h-4 w-4" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderMultiSelect = (items: Option[], selectedValues: string[], onToggle: (value: string) => void) => (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const selected = selectedValues.includes(item.value);
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onToggle(item.value)}
            className={`rounded-[28px] border p-5 text-left transition-all duration-200 ${selected ? 'border-[rgba(92,163,255,0.65)] bg-[linear-gradient(180deg,rgba(31,76,165,0.34),rgba(8,15,31,0.94))] shadow-[0_24px_70px_rgba(2,6,23,0.48)]' : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] hover:border-[rgba(92,163,255,0.3)] hover:bg-[rgba(17,24,39,0.9)]'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold tracking-[-0.03em] text-white">{item.title}</div>
                <p className="mt-2 text-sm leading-6 text-white/62">{item.description}</p>
              </div>
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-blue-300/70 bg-blue-400/16 text-blue-100' : 'border-white/10 text-white/30'}`}>
                <Check className="h-4 w-4" />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(29,78,216,0.26),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(3,7,18,0.98))]"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(92,163,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(92,163,255,0.08)_1px,transparent_1px)] bg-[size:42px_42px] opacity-40" />
          {Array.from({ length: 18 }).map((_, index) => (
            <motion.div
              key={index}
              className="absolute h-10 w-1 rounded-full bg-[linear-gradient(180deg,rgba(34,211,238,0.12),rgba(96,165,250,0.85),rgba(34,211,238,0.12))] shadow-[0_0_18px_rgba(96,165,250,0.35)]"
              style={{ left: `${(index + 1) * 6}%`, top: `${12 + (index % 5) * 14}%` }}
              animate={{ y: [0, -12, 0], opacity: [0.45, 0.9, 0.45], scaleY: [0.85, 1.25, 0.85] }}
              transition={{ duration: 3 + (index % 4), repeat: Infinity, delay: index * 0.14 }}
            />
          ))}
          <motion.div className="absolute left-[8%] top-[12%] h-52 w-52 rounded-full bg-blue-500/20 blur-[100px]" animate={{ x: [0, 18, 0], y: [0, 24, 0] }} transition={{ duration: 10, repeat: Infinity }} />
          <motion.div className="absolute right-[10%] top-[20%] h-64 w-64 rounded-full bg-cyan-400/10 blur-[120px]" animate={{ x: [0, -20, 0], y: [0, -24, 0] }} transition={{ duration: 12, repeat: Infinity }} />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
          <Card className="mx-auto w-full max-w-6xl overflow-hidden border-[rgba(92,163,255,0.22)] bg-[linear-gradient(180deg,rgba(9,16,30,0.92),rgba(2,6,23,0.96))]">
            <CardContent className="p-0">
              <div className="grid min-h-[80vh] lg:grid-cols-[0.92fr_1.08fr]">
                <div className="relative overflow-hidden border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
                  <div className="premium-kicker mb-5 border-[rgba(96,165,250,0.28)] bg-[rgba(59,130,246,0.12)] text-blue-200">First Login Sequence</div>
                  <div className="max-w-md">
                    <h1 className="text-4xl font-bold tracking-[-0.08em] text-white sm:text-5xl">Welcome to TradeVision AI</h1>
                    <p className="mt-4 text-base leading-8 text-white/68 sm:text-lg">Your AI-powered trading mentor has been activated.</p>
                    <div className="mt-8 space-y-4">
                      {[
                        { icon: Orbit, title: 'Institutional trading intelligence', copy: 'A premium operating system for chart analysis, execution planning, and trader development.' },
                        { icon: BrainCircuit, title: 'Personalized by ORION AI', copy: 'Your mentor profile adapts the workspace to your markets, weaknesses, and trading goals.' },
                        { icon: Target, title: 'Built for disciplined execution', copy: 'Structure-first guidance, execution planning, and professional review workflows.' },
                      ].map((item) => (
                        <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-300/20 bg-blue-400/10 text-blue-200">
                              <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold uppercase tracking-[0.16em] text-white">{item.title}</div>
                              <p className="mt-2 text-sm leading-6 text-white/62">{item.copy}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative p-6 sm:p-8 lg:p-10">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.32em] text-blue-200/72">ORION AI Personalization</div>
                      <div className="mt-2 text-sm text-white/54">Calibrate your mentor workflow and institutional dashboard.</div>
                    </div>
                    {step > 0 && step < 6 ? (
                      <div className="w-36">
                        <Progress value={completion} className="h-2 bg-white/10" indicatorClassName="bg-[linear-gradient(90deg,#38bdf8,#60a5fa,#93c5fd)]" />
                        <div className="mt-2 text-right text-[11px] uppercase tracking-[0.22em] text-white/40">Step {step} of 5</div>
                      </div>
                    ) : null}
                  </div>

                  <div className="min-h-[30rem]">
                    {step === 0 ? (
                      <div className="flex h-full flex-col justify-center">
                        <div className="max-w-2xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
                          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/18 bg-blue-400/10 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-blue-100">
                            <Sparkles className="h-4 w-4" />
                            Begin Personalization
                          </div>
                          <h2 className="mt-6 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">ORION AI will tailor your platform for analysis, execution planning, and trader development.</h2>
                          <p className="mt-4 max-w-xl text-sm leading-7 text-white/64 sm:text-base">This short onboarding calibrates the mentor, analysis guidance, and dashboard intelligence around how you actually trade.</p>
                          <Button variant="gradient" size="xl" className="mt-8 gap-2" onClick={() => setStep(1)}>
                            Begin Personalization
                            <ArrowRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {step === 1 ? (
                      <div>
                        <div className="mb-6">
                          <h2 className="text-3xl font-semibold tracking-[-0.06em] text-white">What level trader are you?</h2>
                          <p className="mt-3 text-sm leading-7 text-white/62">This helps ORION AI decide how much guidance, context, and execution coaching to surface.</p>
                        </div>
                        {renderSingleSelect(traderLevels, responses.traderLevel, (value) => setResponses((current) => ({ ...current, traderLevel: value as TraderLevel })))}
                      </div>
                    ) : null}

                    {step === 2 ? (
                      <div>
                        <div className="mb-6">
                          <h2 className="text-3xl font-semibold tracking-[-0.06em] text-white">What markets are you interested in?</h2>
                          <p className="mt-3 text-sm leading-7 text-white/62">Select every market you want ORION AI to prioritize across analysis and execution planning.</p>
                        </div>
                        {renderMultiSelect(markets, responses.markets, (value) => toggleMultiValue('markets', value))}
                      </div>
                    ) : null}

                    {step === 3 ? (
                      <div>
                        <div className="mb-6">
                          <h2 className="text-3xl font-semibold tracking-[-0.06em] text-white">What is your biggest challenge in trading?</h2>
                          <p className="mt-3 text-sm leading-7 text-white/62">ORION uses this to sharpen its warnings, review patterns, and execution coaching.</p>
                        </div>
                        {renderSingleSelect(challenges, responses.biggestChallenge, (value) => setResponses((current) => ({ ...current, biggestChallenge: value })))}
                      </div>
                    ) : null}

                    {step === 4 ? (
                      <div>
                        <div className="mb-6">
                          <h2 className="text-3xl font-semibold tracking-[-0.06em] text-white">What is your primary trading goal?</h2>
                          <p className="mt-3 text-sm leading-7 text-white/62">This steers which workflows, scorecards, and mentor nudges show up first.</p>
                        </div>
                        {renderSingleSelect(goals, responses.primaryGoal, (value) => setResponses((current) => ({ ...current, primaryGoal: value })))}
                      </div>
                    ) : null}

                    {step === 5 ? (
                      <div>
                        <div className="mb-6">
                          <h2 className="text-3xl font-semibold tracking-[-0.06em] text-white">How should ORION AI assist you?</h2>
                          <p className="mt-3 text-sm leading-7 text-white/62">Choose the guidance layers you want prioritized across the workspace.</p>
                        </div>
                        {renderMultiSelect(assistanceModes, responses.assistanceModes, (value) => toggleMultiValue('assistanceModes', value))}
                      </div>
                    ) : null}

                    {step === 6 ? (
                      <div className="flex h-full flex-col justify-center">
                        <div className="rounded-[32px] border border-[rgba(96,165,250,0.24)] bg-[linear-gradient(180deg,rgba(37,99,235,0.18),rgba(15,23,42,0.92))] p-6 sm:p-8">
                          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/24 bg-blue-400/10 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-blue-100">
                            <TrendingUp className="h-4 w-4" />
                            Workspace Optimized
                          </div>
                          <h2 className="mt-6 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">ORION AI configured your platform.</h2>
                          <p className="mt-4 text-base leading-8 text-white/72">{summary || 'Your mentor system is now tuned for structure-led market understanding and disciplined execution planning.'}</p>
                          <div className="mt-8 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                              <div className="text-[10px] uppercase tracking-[0.24em] text-blue-100/72">AI Chart Analysis</div>
                              <div className="mt-2 text-sm text-white/78">Bias, structure, liquidity, and premium/discount zones will be surfaced first.</div>
                            </div>
                            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                              <div className="text-[10px] uppercase tracking-[0.24em] text-blue-100/72">Execution Planning</div>
                              <div className="mt-2 text-sm text-white/78">Command workflows stay focused on strong structure, clear invalidation, and disciplined entries.</div>
                            </div>
                            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                              <div className="text-[10px] uppercase tracking-[0.24em] text-blue-100/72">Trader Development</div>
                              <div className="mt-2 text-sm text-white/78">The journal and mentor surfaces will coach consistency and execution quality.</div>
                            </div>
                          </div>
                          <Button variant="gradient" size="xl" className="mt-8 gap-2" onClick={() => setVisible(false)}>
                            Enter TradeVision AI
                            <ArrowRight className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {step > 0 && step < 6 ? (
                    <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        {error ? <div className="text-sm text-rose-300">{error}</div> : <div className="text-sm text-white/42">Your responses are stored to personalize the platform experience.</div>}
                      </div>
                      <div className="flex gap-3 self-end sm:self-auto">
                        <Button variant="ghost" size="lg" onClick={() => setStep((current) => Math.max(0, current - 1))}>
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        {step < 5 ? (
                          <Button variant="gradient" size="lg" className="gap-2" onClick={() => setStep((current) => current + 1)} disabled={!canContinue()}>
                            Continue
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="gradient" size="lg" className="gap-2" onClick={handleSubmit} disabled={!canContinue() || submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Activate Workspace
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}