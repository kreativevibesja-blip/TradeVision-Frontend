'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, Activity, BarChart3, CandlestickChart, CheckSquare, Flame, Loader2, Lock, Power, RadioTower, ShieldAlert, Sparkles, Square, Trash2, Wallet, X, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  api,
  openGoldxPulseStream,
  type BillingSummary,
  type GoldxPulseAccess,
  type GoldxPulseSnapshot,
  type GoldxPulseSymbol,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type WorkspaceMode = 'digit-pulse' | 'range-pressure';
type RecommendationStage = 'No Trade' | 'Wait' | 'Enter';

const strategyCards: Array<{
  mode: WorkspaceMode;
  name: string;
  description: string;
}> = [
  {
    mode: 'digit-pulse',
    name: 'Z Trade',
    description: 'Matches and differs control room with a live digit board, reversion bias, and fast digit selection.',
  },
  {
    mode: 'range-pressure',
    name: 'Strike Pro',
    description: 'GoldX U/O remapped as Strike Pro so over and under pressure stays in one execution lane.',
  },
];

const strategyDisplay: Record<WorkspaceMode, {
  name: string;
  subtitle: string;
  engine: string;
  biasLabel: string;
  feedTitle: string;
  metricsTitle: string;
}> = {
  'digit-pulse': {
    name: 'Z Trade',
    subtitle: 'Matches / Differs',
    engine: 'Z Trade Engine',
    biasLabel: 'Matches / Differs bias',
    feedTitle: 'Z Trade Market Feed',
    metricsTitle: 'Z Trade Strategy Metrics',
  },
  'range-pressure': {
    name: 'Strike Pro',
    subtitle: 'GoldX U/O',
    engine: 'Strike Pro Engine',
    biasLabel: 'Strike Pro bias',
    feedTitle: 'Strike Pro Market Feed',
    metricsTitle: 'Strike Pro Strategy Metrics',
  },
};

const defaultSnapshot: GoldxPulseSnapshot = {
  connected: false,
  connectionState: 'disconnected',
  account: null,
  settings: {
    symbol: 'R_75',
    stake: 1,
    duration: 5,
    strategyMode: 'digit-pulse',
    selectedDigit: 7,
    maxDailyLoss: null,
    cooldownMs: 15000,
  },
  ticks: [],
  totalTickCount: 0,
  analytics: {
    frequencyMap: Array.from({ length: 10 }, () => 0),
    digitProbabilities: Array.from({ length: 10 }, (_, digit) => ({
      digit,
      count: 0,
      probability: 0,
      deviation: 0,
      bias: 'neutral' as const,
    })),
    mostFrequentDigit: null,
    leastFrequentDigit: null,
    currentStreakDigit: null,
    currentStreakLength: 0,
    longestStreakDigit: null,
    longestStreakLength: 0,
    aboveFivePct: 0,
    belowFivePct: 0,
    bias: 'neutral',
    overUnder: {
      selectedDigit: 7,
      overProbability: 0,
      underProbability: 0,
      difference: 0,
      confidence: 0,
      bias: 'neutral',
      strength: 'neutral',
    },
    matchDiffer: {
      selectedDigit: 7,
      matchProbability: 0,
      differProbability: 0,
      matchDeviation: 0,
      differDeviation: 0,
    },
    warmup: {
      minTicksRequired: 70,
      currentTicks: 0,
      remainingTicks: 70,
      progressPct: 0,
      ready: false,
      message: 'Collecting data... (0 / 70 ticks)',
    },
  },
  trades: [],
  cooldownRemainingMs: 0,
  dailyLoss: 0,
  error: null,
  updatedAt: new Date(0).toISOString(),
};

const categoryLabels: Record<GoldxPulseSymbol['category'], string> = {
  volatility: 'Volatility',
  'volatility-1s': 'Volatility (1s)',
  jump: 'Jump',
  step: 'Step',
  'boom-crash': 'Boom & Crash',
};

const PROBABILITY_DISCLAIMER = 'Probabilities are based on recent ticks and do not guarantee outcomes.';
const WORKSPACE_CARD_CLASS = 'overflow-hidden rounded-[10px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,24,34,0.98),rgba(27,31,46,0.96))] shadow-none';
const GLOSS_PANEL_CLASS = 'rounded-[10px] border border-white/10 bg-black/25 shadow-none';
const MICRO_STAT_CLASS = 'rounded-[10px] border border-white/10 bg-black/25 px-3 py-3 shadow-none';
const SECTION_KICKER_CLASS = 'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-[0.63rem] font-semibold uppercase tracking-[0.2em] text-slate-300';
const ANALYTICS_TILE_CLASS = 'rounded-[10px] border border-white/10 bg-black/25 p-3 shadow-none';
const CONTROL_SURFACE_CLASS = 'rounded-[10px] border border-white/10 bg-black/25 p-3 shadow-none';
const QUANTIX_PAGE_CLASS = 'mx-auto grid w-full gap-4 px-1 pb-16 text-slate-100 sm:px-2 2xl:grid-cols-[minmax(18rem,0.86fr)_minmax(24rem,1.14fr)]';
const QUANTIX_PANEL_CLASS = 'rounded-[10px] border border-white/10 bg-[linear-gradient(180deg,rgba(21,24,34,0.98),rgba(27,31,46,0.96))] p-3 shadow-none';
const QUANTIX_TITLE_CLASS = 'text-[15px] font-semibold text-rose-400';
const QUANTIX_STAT_CLASS = 'rounded-[10px] border border-white/10 bg-black/25 px-3 py-3';

function getEtSessionContext(date = new Date()) {
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    weekday: 'short',
  });
  const parts = etFormatter.formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  const dayPeriod = parts.find((part) => part.type === 'dayPeriod')?.value ?? 'AM';
  const twentyFourHour = dayPeriod.toLowerCase() === 'pm' && hour !== 12 ? hour + 12 : dayPeriod.toLowerCase() === 'am' && hour === 12 ? 0 : hour;

  let sessionName = 'Overnight';
  let sessionNote = 'Liquidity is thinner and edge confirmation matters more.';

  if (twentyFourHour >= 7 && twentyFourHour < 12) {
    sessionName = 'NY Morning';
    sessionNote = 'Best for sharper reactions and faster digit flow.';
  } else if (twentyFourHour >= 12 && twentyFourHour < 17) {
    sessionName = 'NY Midday';
    sessionNote = 'Momentum can flatten, so wait for cleaner confirmation.';
  } else if (twentyFourHour >= 17 && twentyFourHour < 22) {
    sessionName = 'NY Evening';
    sessionNote = 'Good for controlled re-entry and lower-noise setups.';
  }

  return {
    label: `${weekday} ${hour}:${minute} ${dayPeriod} ET`,
    sessionName,
    sessionNote,
  };
}

function formatCurrency(value: number | null | undefined, currency = 'USD') {
  if (value == null || Number.isNaN(value)) {
    return '-';
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleString();
}

function buildPolylinePoints(values: number[]) {
  if (values.length === 0) {
    return '';
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');
}

function formatSignedPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function buildBiasLabel(bias: 'over' | 'under' | 'neutral', strength: 'strong' | 'weak' | 'neutral') {
  if (bias === 'neutral' || strength === 'neutral') {
    return 'Neutral Flow';
  }

  return `${strength === 'strong' ? 'Strong' : 'Moderate'} ${bias === 'over' ? 'Over' : 'Under'} Bias`;
}

function getConfidenceStage(score: number, ready: boolean): RecommendationStage {
  if (!ready) {
    return 'No Trade';
  }

  if (score >= 66) {
    return 'Enter';
  }

  if (score >= 38) {
    return 'Wait';
  }

  return 'No Trade';
}

function getConfidenceTone(stage: RecommendationStage) {
  if (stage === 'Enter') {
    return {
      text: 'text-emerald-100',
      chip: 'border-emerald-400/20 bg-emerald-500/15 text-emerald-100',
      bar: 'from-amber-300 via-cyan-300 to-emerald-300',
      panel: 'border-emerald-400/20 bg-emerald-500/10',
    };
  }

  if (stage === 'Wait') {
    return {
      text: 'text-amber-100',
      chip: 'border-amber-400/20 bg-amber-500/15 text-amber-100',
      bar: 'from-rose-300 via-amber-300 to-cyan-300',
      panel: 'border-amber-400/20 bg-amber-500/10',
    };
  }

  return {
    text: 'text-rose-100',
    chip: 'border-rose-400/20 bg-rose-500/15 text-rose-100',
    bar: 'from-rose-300 via-rose-300 to-amber-300',
    panel: 'border-rose-400/20 bg-rose-500/10',
  };
}

  const digitOptions = Array.from({ length: 10 }, (_, digit) => String(digit));
  const durationOptions = Array.from({ length: 10 }, (_, index) => String(index + 1));
  const darkSelectClassName = 'h-11 w-full appearance-none rounded-xl border border-white/10 bg-slate-900/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/30 focus:ring-2 focus:ring-cyan-400/20';

export default function GoldxPulsePage() {
  const { user, token, loading: authLoading } = useAuth();
  const [access, setAccess] = useState<GoldxPulseAccess | null>(null);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [symbols, setSymbols] = useState<GoldxPulseSymbol[]>([]);
  const [snapshot, setSnapshot] = useState<GoldxPulseSnapshot>(defaultSnapshot);
  const [apiToken, setApiToken] = useState('');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('digit-pulse');
  const [activeStrategy, setActiveStrategy] = useState<WorkspaceMode | null>('digit-pulse');
  const [assistedPanelsOn, setAssistedPanelsOn] = useState(true);
  const [stake, setStake] = useState('1');
  const [duration, setDuration] = useState('5');
  const [selectedDigit, setSelectedDigit] = useState('7');
  const [selectedSymbol, setSelectedSymbol] = useState('R_75');
  const [maxDailyLoss, setMaxDailyLoss] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState('15');
  const [loading, setLoading] = useState(true);
  const [connectBusy, setConnectBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [placingTrade, setPlacingTrade] = useState<string | null>(null);
  const [clearingResults, setClearingResults] = useState(false);
  const [pulseRenewing, setPulseRenewing] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState<boolean | null>(null);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [agreementBusy, setAgreementBusy] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    void Promise.all([
      api.goldxPulse.getAccess(token),
      api.getBillingSummary(token),
    ])
      .then(async ([response, billingResponse]) => {
        if (!active) {
          return;
        }

        setAccess(response.access);
        setBilling(billingResponse.billing);
        setSymbols(response.symbols);

        if (response.access.active) {
          const [sessionResponse, agreementResponse] = await Promise.all([
            api.goldxPulse.getSession(token),
            api.goldxPulse.getAgreementStatus(token),
          ]);
          if (!active) {
            return;
          }
          setSnapshot(sessionResponse.snapshot);
          setAgreementAccepted(agreementResponse.accepted);
          setAgreementChecked(agreementResponse.accepted);
        } else {
          setAgreementAccepted(true);
        }
      })
      .catch((nextError) => {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to load GoldX Pulse.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const pulseStatus = billing?.goldxPulse;
  const showAgreementGate = access?.active && agreementAccepted === false;

  const handlePulseResume = async () => {
    if (!token) {
      return;
    }

    try {
      setPulseRenewing(true);
      setError('');
      const response = await api.renewGoldxPulseSubscription(token);
      setBilling(response.billing);
      const accessResponse = await api.goldxPulse.getAccess(token);
      setAccess(accessResponse.access);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to resume GoldX Pulse access.');
    } finally {
      setPulseRenewing(false);
    }
  };

  useEffect(() => {
    setStake(String(snapshot.settings.stake));
    setDuration(String(snapshot.settings.duration));
    setSelectedDigit(String(snapshot.settings.selectedDigit));
    setSelectedSymbol(snapshot.settings.symbol);
    setMaxDailyLoss(snapshot.settings.maxDailyLoss != null ? String(snapshot.settings.maxDailyLoss) : '');
    setCooldownSeconds(String(Math.round(snapshot.settings.cooldownMs / 1000)));
    setWorkspaceMode(snapshot.settings.strategyMode);
    setActiveStrategy(snapshot.settings.strategyMode);
  }, [
    snapshot.settings.stake,
    snapshot.settings.duration,
    snapshot.settings.selectedDigit,
    snapshot.settings.symbol,
    snapshot.settings.maxDailyLoss,
    snapshot.settings.cooldownMs,
    snapshot.settings.strategyMode,
  ]);

  useEffect(() => {
    if (!token || !access?.active) {
      return;
    }

    const controller = new AbortController();
    void openGoldxPulseStream(token, {
      signal: controller.signal,
      onSnapshot: (nextSnapshot) => {
        setSnapshot(nextSnapshot);
        setError('');
      },
      onError: (nextError) => {
        setError(nextError.message);
      },
    }).catch((nextError) => {
      if (!controller.signal.aborted) {
        setError(nextError instanceof Error ? nextError.message : 'GoldX Pulse stream unavailable.');
      }
    });

    return () => controller.abort();
  }, [token, access?.active]);

  const groupedSymbols = useMemo(() => {
    return symbols.reduce<Record<string, GoldxPulseSymbol[]>>((groups, symbol) => {
      const key = categoryLabels[symbol.category];
      groups[key] = groups[key] ? [...groups[key], symbol] : [symbol];
      return groups;
    }, {});
  }, [symbols]);

  const sparklinePoints = useMemo(() => buildPolylinePoints(snapshot.ticks.slice(-80).map((tick) => tick.quote)), [snapshot.ticks]);

  const streamedDigits = useMemo(() => {
    return snapshot.ticks.slice(-24).map((tick) => ({
      key: `${tick.epoch}-${tick.formattedQuote}`,
      digit: tick.digit,
    }));
  }, [snapshot.ticks]);

  const digitActionButtons = useMemo(() => {
    if (snapshot.analytics.digitProbabilities.length === 10) {
      return snapshot.analytics.digitProbabilities;
    }

    return Array.from({ length: 10 }, (_, digit) => ({
      digit,
      count: snapshot.analytics.frequencyMap[digit] ?? 0,
      probability: 0,
      deviation: 0,
      bias: 'neutral' as const,
    }));
  }, [snapshot.analytics.digitProbabilities, snapshot.analytics.frequencyMap]);

  const netProfit = useMemo(
    () => snapshot.trades.reduce((total, trade) => total + (trade.profit ?? 0), 0),
    [snapshot.trades],
  );

  const selectedDigitMetrics = useMemo(() => {
    const currentSelectedDigit = Number(selectedDigit);
    const selectedProfile = digitActionButtons.find((item) => item.digit === currentSelectedDigit) ?? {
      digit: currentSelectedDigit,
      count: 0,
      probability: 0,
      deviation: 0,
      bias: 'neutral' as const,
    };
    const underProbability = Number(
      digitActionButtons
        .filter((item) => item.digit < currentSelectedDigit)
        .reduce((total, item) => total + item.probability, 0)
        .toFixed(1),
    );
    const overProbability = Number(
      digitActionButtons
        .filter((item) => item.digit > currentSelectedDigit)
        .reduce((total, item) => total + item.probability, 0)
        .toFixed(1),
    );
    const difference = Number(Math.abs(overProbability - underProbability).toFixed(1));
    const strength: 'strong' | 'weak' | 'neutral' = difference > 10 ? 'strong' : difference > 5 ? 'weak' : 'neutral';
    const bias: 'over' | 'under' | 'neutral' = strength === 'neutral' ? 'neutral' : overProbability > underProbability ? 'over' : 'under';

    return {
      selectedDigit: currentSelectedDigit,
      profile: selectedProfile,
      matchProbability: selectedProfile.probability,
      differProbability: Number(Math.max(0, 100 - selectedProfile.probability).toFixed(1)),
      matchDeviation: selectedProfile.deviation,
      differDeviation: Number((-selectedProfile.deviation).toFixed(1)),
      underProbability,
      overProbability,
      difference,
      confidence: Math.max(0, Math.min(100, difference)),
      bias,
      strength,
    };
  }, [digitActionButtons, selectedDigit]);

  const warmup = snapshot.analytics.warmup;
  const biasLabel = buildBiasLabel(selectedDigitMetrics.bias, selectedDigitMetrics.strength);
  const tradeReady = snapshot.connected && warmup.ready;
  const tradeDisabled = placingTrade != null || !tradeReady;

  const bestDifferDigit = useMemo(() => {
    return [...digitActionButtons]
      .sort((left, right) => {
        if (left.probability === right.probability) {
          return left.deviation - right.deviation;
        }

        return left.probability - right.probability;
      })[0] ?? null;
  }, [digitActionButtons]);

  const strategyRecommendation = useMemo<{
    stage: RecommendationStage;
    confidence: number;
    title: string;
    action: string;
    detail: string;
  }>(() => {
    if (!warmup.ready) {
      return {
        stage: 'No Trade' as const,
        confidence: 0,
        title: 'Warm-up Running',
        action: `Collect ${warmup.remainingTicks} more ticks`,
        detail: 'The model needs more live samples before it can suggest an entry.',
      };
    }

    if (activeStrategy === 'digit-pulse') {
      if (!bestDifferDigit) {
        return {
          stage: 'No Trade' as const,
          confidence: 0,
          title: 'No Clean Digit Edge',
          action: 'Hold position',
          detail: 'Digit probabilities are too balanced for a clean differs setup.',
        };
      }

      const confidence = Math.max(0, Math.min(100, Number((Math.max(0, -bestDifferDigit.deviation) * 12 + Math.max(0, 10 - bestDifferDigit.probability) * 4).toFixed(1))));
      const stage = getConfidenceStage(confidence, warmup.ready);

      return {
        stage,
        confidence,
        title: stage === 'Enter' ? 'Differ Setup Ready' : stage === 'Wait' ? 'Differ Setup Forming' : 'No Trade Edge',
        action: stage === 'Enter' ? `Enter Differ on digit ${bestDifferDigit.digit}` : stage === 'Wait' ? `Watch digit ${bestDifferDigit.digit} for a cleaner differ edge` : `Avoid differ entries until digit ${bestDifferDigit.digit} separates more`,
        detail: `Digit ${bestDifferDigit.digit} is the least frequent print at ${bestDifferDigit.probability.toFixed(1)}% with ${formatSignedPercent(bestDifferDigit.deviation)} deviation.` ,
      };
    }

    const confidence = selectedDigitMetrics.confidence;
    const stage = getConfidenceStage(confidence, warmup.ready);
    const direction = selectedDigitMetrics.bias === 'neutral' ? null : selectedDigitMetrics.bias === 'over' ? 'Over' : 'Under';

    return {
      stage,
      confidence,
      title: direction ? `${direction} Bias ${stage === 'Enter' ? 'Ready' : stage === 'Wait' ? 'Building' : 'Muted'}` : 'Range Flow Neutral',
      action: direction ? stage === 'Enter' ? `Enter ${direction} ${selectedDigitMetrics.selectedDigit}` : stage === 'Wait' ? `Wait on ${direction} ${selectedDigitMetrics.selectedDigit}` : `No trade on ${selectedDigitMetrics.selectedDigit}` : `Wait for stronger movement around ${selectedDigitMetrics.selectedDigit}`,
      detail: direction ? `${biasLabel} with a ${selectedDigitMetrics.difference.toFixed(1)}% separation between over and under flow.` : 'Over and under probabilities are still too close together.',
    };
  }, [activeStrategy, bestDifferDigit, biasLabel, selectedDigitMetrics, warmup.ready, warmup.remainingTicks]);

  const recommendationTone = getConfidenceTone(strategyRecommendation.stage);
  const etSession = useMemo(() => getEtSessionContext(), []);
  const bestStrategyLabel = activeStrategy == null ? 'Standby' : `${strategyDisplay[activeStrategy].name}`;
  const recommendationBadgeClass = strategyRecommendation.stage === 'Enter'
    ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100'
    : strategyRecommendation.stage === 'Wait'
      ? 'border-amber-400/30 bg-amber-500/15 text-amber-100'
      : 'border-white/10 bg-white/10 text-slate-200';

  const displayedStrategy = activeStrategy ?? workspaceMode;

  const saveWorkspaceSettings = async () => {
    if (!token) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      const response = await api.goldxPulse.updateSettings({
        symbol: selectedSymbol,
        stake: Number(stake),
        duration: Number(duration),
        selectedDigit: Number(selectedDigit),
        strategyMode: displayedStrategy,
        maxDailyLoss: maxDailyLoss === '' ? null : Number(maxDailyLoss),
        cooldownMs: Number(cooldownSeconds) * 1000,
      }, token);
      setSnapshot(response.snapshot);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save GoldX Pulse settings.');
    } finally {
      setSaving(false);
    }
  };

  const connectAccount = async () => {
    if (!token) {
      return;
    }

    try {
      setConnectBusy(true);
      setError('');
      const response = await api.goldxPulse.connect({ apiToken, symbol: selectedSymbol }, token);
      setSnapshot(response.snapshot);
      setApiToken('');
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to connect Deriv account.');
    } finally {
      setConnectBusy(false);
    }
  };

  const disconnectAccount = async () => {
    if (!token) {
      return;
    }

    try {
      setConnectBusy(true);
      setError('');
      await api.goldxPulse.disconnect(token);
      setSnapshot(defaultSnapshot);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to disconnect Deriv account.');
    } finally {
      setConnectBusy(false);
    }
  };

  const placeTrade = async (action: 'OVER' | 'UNDER' | 'MATCH' | 'DIFFER', digit?: number) => {
    if (!token) {
      return;
    }

    try {
      setPlacingTrade(action);
      setError('');
      const response = await api.goldxPulse.placeTrade({
        action,
        symbol: selectedSymbol,
        stake: Number(stake),
        duration: Number(duration),
        digit: digit ?? Number(selectedDigit),
      }, token);
      setSnapshot(response.snapshot);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Trade request failed.');
    } finally {
      setPlacingTrade(null);
    }
  };

  const clearResults = async () => {
    if (!token || snapshot.trades.length === 0) {
      return;
    }

    try {
      setClearingResults(true);
      setError('');
      const response = await api.goldxPulse.clearResults(token);
      setSnapshot(response.snapshot);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to clear GoldX Pulse results.');
    } finally {
      setClearingResults(false);
    }
  };

  const acceptAgreement = async () => {
    if (!token || !agreementChecked) {
      return;
    }

    try {
      setAgreementBusy(true);
      setError('');
      const response = await api.goldxPulse.acceptAgreement(token);
      setAgreementAccepted(response.accepted);
      setLegalOpen(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to save GoldX Pulse agreement.');
    } finally {
      setAgreementBusy(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-xl border-cyan-400/20 bg-slate-950/80">
          <CardContent className="flex items-center justify-center gap-3 p-8 text-slate-200">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
            Loading GoldX Pulse...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-xl border-cyan-400/20 bg-slate-950/80">
          <CardHeader>
            <CardTitle className="text-slate-100">GoldX Pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-300">
            <p>Sign in to access the Deriv options workspace.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!access?.active) {
    return (
      <div className="relative isolate space-y-5 overflow-hidden text-slate-100 sm:space-y-6">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-0 h-56 w-56 rounded-full bg-cyan-400/12 blur-3xl"
          animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-24 h-64 w-64 rounded-full bg-fuchsia-400/10 blur-3xl"
          animate={{ opacity: [0.3, 0.55, 0.3], scale: [1.02, 0.96, 1.02] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="rounded-[30px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.2),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.14),_transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.96))] p-5 shadow-[0_28px_90px_rgba(8,145,178,0.16)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                GoldX Pulse
              </div>
              <h1 className="text-3xl font-semibold">Deriv Options Workspace</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Real-time tick intelligence, digit analytics, Matches/Differs and Over/Under execution, backed by live Deriv sessions through your secured dashboard.
              </p>
            </div>
            <Badge variant="warning" className="w-fit border-amber-300/30 bg-amber-400/10 px-3 py-1 text-amber-200">
              Subscription required
            </Badge>
          </div>
        </div>

        {pulseStatus && pulseStatus.status !== 'inactive' ? (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${pulseStatus.status === 'cancelled' ? 'border-amber-400/20 bg-amber-500/10 text-amber-100' : pulseStatus.status === 'expired' ? 'border-red-400/20 bg-red-500/10 text-red-100' : 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">
                  {pulseStatus.status === 'cancelled' ? 'GoldX Pulse is cancelled' : pulseStatus.status === 'expired' ? 'GoldX Pulse has expired' : `GoldX Pulse status: ${pulseStatus.status}`}
                </div>
                <div className="mt-1 text-xs opacity-85">
                  Expiry: {formatDateTime(pulseStatus.expiresAt)}
                  {pulseStatus.canRenew ? ' · You can resume access before this expiry passes.' : ''}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {pulseStatus.canRenew ? (
                  <Button variant="outline" onClick={handlePulseResume} disabled={pulseRenewing}>
                    {pulseRenewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Resume Pulse
                  </Button>
                ) : null}
                {pulseStatus.canPurchase ? (
                  <Link href="/checkout?plan=GOLDX_PULSE">
                    <Button variant="gradient">Renew Purchase</Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <Card className={`${WORKSPACE_CARD_CLASS} border-amber-400/20 text-slate-100`}>
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <Lock className="h-5 w-5 text-amber-300" />
                <h2 className="text-xl font-semibold">GoldX Pulse access is locked</h2>
              </div>
              <p className="text-sm text-slate-300">
                {access?.reason || 'An active GoldX Pulse subscription is required before this workspace can load.'}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                If access has already been granted, refresh the dashboard after the subscription record becomes active.
              </p>
            </div>
            <div className={`space-y-4 p-5 ${GLOSS_PANEL_CLASS}`}>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <ShieldAlert className="h-4 w-4 text-cyan-300" />
                Access source: {access?.source || 'none'}
              </div>
              <div className="text-sm text-slate-300">Plan: {access?.planName || 'GoldX Pulse'}</div>
              <div className="text-sm text-slate-300">Expiry: {formatDateTime(access?.expiresAt ?? null)}</div>
              <Link href="/dashboard/billing">
                <Button variant="gradient" className="w-full">Open Billing</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={QUANTIX_PAGE_CLASS}>
      <header className="col-span-1 flex items-center justify-between gap-3 rounded-[10px] border border-white/10 bg-[#0b0c11] px-3 py-3 xl:col-span-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[18px] font-semibold text-rose-400">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.7)]" />
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.7)]" />
            GoldX Pulse
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Deriv Strategy Dashboard · Quantix layout with Z Trade and Strike Pro</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge className={recommendationBadgeClass}>{strategyRecommendation.stage}</Badge>
          <Badge variant={snapshot.connected ? 'success' : 'outline'}>{snapshot.connected ? 'Connected' : 'Disconnected'}</Badge>
          <Link href="/dashboard/billing">
            <Button variant="outline" className="h-9 rounded-[8px] border-white/10 bg-black/25 px-3">Billing</Button>
          </Link>
        </div>
      </header>

      {error ? (
        <div className="col-span-1 rounded-[10px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 xl:col-span-2">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 2xl:grid-cols-[minmax(18rem,0.86fr)_minmax(24rem,1.14fr)]">
        <div className="min-w-0 space-y-4">
          <Card className={`${QUANTIX_PANEL_CLASS} border-cyan-400/20`}>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className={`flex items-center gap-2 ${QUANTIX_TITLE_CLASS}`}>
                  <Wallet className="h-5 w-5 text-cyan-300" />
                  Connection
                </CardTitle>
                <span className={SECTION_KICKER_CLASS}>Deriv API Connection</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {!snapshot.connected ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.22em] text-slate-400">Deriv API token</label>
                    <Input
                      value={apiToken}
                      onChange={(event) => setApiToken(event.target.value)}
                      placeholder="Paste your Deriv API token"
                      className="h-12 border-cyan-400/20 bg-slate-900/80 text-slate-100"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.22em] text-slate-400">Index</label>
                        <select value={selectedSymbol} onChange={(event) => setSelectedSymbol(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-cyan-400/20 bg-slate-900/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/30 focus:ring-2 focus:ring-cyan-400/20" style={{ colorScheme: 'dark' }}>
                        {Object.entries(groupedSymbols).map(([group, options]) => (
                            <optgroup key={group} label={group} className="bg-slate-950 text-slate-100">
                            {options.map((option) => (
                                <option key={option.symbol} value={option.symbol} className="bg-slate-950 text-slate-100">{option.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div className={`${GLOSS_PANEL_CLASS} p-4 text-sm text-slate-400`}>
                      Strategy controls now live in the dedicated panel below.
                    </div>
                  </div>
                  <Button variant="gradient" className="w-full gap-2" onClick={connectAccount} disabled={connectBusy || !apiToken.trim()}>
                    {connectBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    Connect Deriv Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className={`${GLOSS_PANEL_CLASS} p-4`}>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Balance</div>
                      <div className="mt-2 text-2xl font-semibold text-cyan-200">{formatCurrency(snapshot.account?.balance, snapshot.account?.currency)}</div>
                    </div>
                    <div className={`${GLOSS_PANEL_CLASS} p-4`}>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Account</div>
                      <div className="mt-2 space-y-2">
                        <div className="text-lg font-semibold text-slate-100">{snapshot.account?.accountType.toUpperCase()}</div>
                        <div className="break-all text-base font-medium text-slate-300">{snapshot.account?.loginId}</div>
                      </div>
                    </div>
                    <div className={`${GLOSS_PANEL_CLASS} p-4 md:col-span-2`}>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Session</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-100">
                        <Power className="h-4 w-4 text-emerald-300" />
                        {snapshot.connectionState}
                      </div>
                    </div>
                  </div>
                  <Button variant="destructive" className="w-full gap-2" onClick={disconnectAccount} disabled={connectBusy}>
                    {connectBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                    Disconnect Deriv Account
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={QUANTIX_PANEL_CLASS}>
            <CardHeader className="pb-4">
              <CardTitle className={QUANTIX_TITLE_CLASS}>Time &amp; Session Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={QUANTIX_STAT_CLASS}>
                  <div className="text-[11px] text-slate-500">ET Time</div>
                  <div className="mt-1 text-base font-semibold text-slate-100">{etSession.label}</div>
                </div>
                <div className={QUANTIX_STAT_CLASS}>
                  <div className="text-[11px] text-slate-500">Session</div>
                  <div className="mt-1 text-base font-semibold text-slate-100">{etSession.sessionName}</div>
                  <div className="mt-1 text-xs text-slate-400">{etSession.sessionNote}</div>
                </div>
                <div className={QUANTIX_STAT_CLASS}>
                  <div className="text-[11px] text-slate-500">Best Strategy</div>
                  <div className="mt-1 text-base font-semibold text-slate-100">{bestStrategyLabel}</div>
                </div>
                <div className={QUANTIX_STAT_CLASS}>
                  <div className="text-[11px] text-slate-500">Recommendation</div>
                  <div className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${recommendationBadgeClass}`}>{strategyRecommendation.stage}</div>
                </div>
              </div>
              <div className="text-xs text-slate-400">{strategyRecommendation.detail}</div>
            </CardContent>
          </Card>

          <Card className={QUANTIX_PANEL_CLASS}>
            <CardHeader className="pb-4">
              <CardTitle className={QUANTIX_TITLE_CLASS}>Advanced Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={CONTROL_SURFACE_CLASS}>
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Confidence Threshold</label>
                  <div className="mt-2 text-lg font-semibold text-slate-100">{strategyRecommendation.confidence.toFixed(1)}%</div>
                  <div className="mt-1 text-xs text-slate-400">Live recommendation confidence from the active engine.</div>
                </div>
                <div className={CONTROL_SURFACE_CLASS}>
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Warm-up Requirement</label>
                  <div className="mt-2 text-lg font-semibold text-slate-100">{warmup.currentTicks} / {warmup.minTicksRequired}</div>
                  <div className="mt-1 text-xs text-slate-400">Trading unlocks automatically once the sample threshold is reached.</div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={`${CONTROL_SURFACE_CLASS} space-y-2`}>
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Max daily loss</label>
                  <Input value={maxDailyLoss} onChange={(event) => setMaxDailyLoss(event.target.value)} placeholder="Optional" className="h-11 border-white/10 bg-white/5 text-slate-100" />
                </div>
                <div className={`${CONTROL_SURFACE_CLASS} space-y-2`}>
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Trade cooldown</label>
                  <Input value={cooldownSeconds} onChange={(event) => setCooldownSeconds(event.target.value)} className="h-11 border-white/10 bg-white/5 text-slate-100" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${QUANTIX_PANEL_CLASS} border-orange-400/20`}>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className={`flex items-center gap-2 ${QUANTIX_TITLE_CLASS}`}>
                  <Activity className="h-5 w-5 text-orange-300" />
                  Strategies
                </CardTitle>
                <span className={SECTION_KICKER_CLASS}>Matches / Differs and GoldX U/O</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {strategyCards.map((strategy) => {
                const isActive = activeStrategy === strategy.mode;
                const display = strategyDisplay[strategy.mode];

                return (
                  <div key={strategy.mode} className={`rounded-[10px] border p-3 transition ${isActive ? 'border-orange-300/30 bg-[linear-gradient(135deg,rgba(251,146,60,0.14),rgba(15,23,42,0.8))]' : 'border-white/10 bg-white/5'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-100">{strategy.name}</div>
                          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-300">{display.subtitle}</span>
                        </div>
                        <div className="mt-1 text-xs leading-5 text-slate-400">{strategy.description}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            setActiveStrategy(null);
                            return;
                          }

                          setWorkspaceMode(strategy.mode);
                          setActiveStrategy(strategy.mode);
                        }}
                        aria-pressed={isActive}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${isActive ? 'border-emerald-300/30 bg-emerald-400/15 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300 hover:border-orange-300/30 hover:text-orange-200'}`}
                      >
                        {isActive ? 'On' : 'Off'}
                      </button>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className={`${GLOSS_PANEL_CLASS} px-3 py-2`}>
                        <div className="text-[0.62rem] uppercase tracking-[0.18em] text-slate-400">Engine</div>
                        <div className="mt-1 text-sm font-semibold text-slate-100">{display.engine}</div>
                      </div>
                      <div className={`${GLOSS_PANEL_CLASS} px-3 py-2`}>
                        <div className="text-[0.62rem] uppercase tracking-[0.18em] text-slate-400">Execution</div>
                        <div className="mt-1 text-sm font-semibold text-slate-100">{strategy.mode === 'digit-pulse' ? 'Matches / Differs' : 'Over / Under'}</div>
                      </div>
                      <div className={`${GLOSS_PANEL_CLASS} px-3 py-2`}>
                        <div className="text-[0.62rem] uppercase tracking-[0.18em] text-slate-400">Panel flow</div>
                        <div className="mt-1 text-sm font-semibold text-slate-100">Feed, metrics, trade</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {activeStrategy == null ? (
            <Card className={`${QUANTIX_PANEL_CLASS} border-white/10 text-slate-100`}>
              <CardContent className="flex min-h-[18rem] flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-orange-200">
                  Strategy Idle
                </div>
                <div className="text-2xl font-semibold">No active strategy</div>
                <p className="max-w-md text-sm text-slate-400">Turn on a strategy to begin trading. The workspace follows the Quantix panel flow once Z Trade or Strike Pro is active.</p>
              </CardContent>
            </Card>
          ) : (
          <Card className={`${QUANTIX_PANEL_CLASS} border-fuchsia-400/20`}>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className={`flex items-center gap-2 ${QUANTIX_TITLE_CLASS}`}>
                  <CandlestickChart className="h-5 w-5 text-fuchsia-300" />
                  {strategyDisplay[activeStrategy].feedTitle}
                </CardTitle>
                <span className={SECTION_KICKER_CLASS}>Live ticks and digit flow</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`${GLOSS_PANEL_CLASS} bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.7))] p-3`}>
                <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span>Latest movement</span>
                  <span>{snapshot.ticks[snapshot.ticks.length - 1]?.formattedQuote || '-'}</span>
                </div>
                <div className="h-44 rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-3">
                  {sparklinePoints ? (
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                      <defs>
                        <linearGradient id="pulse-line" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      <polyline fill="none" stroke="url(#pulse-line)" strokeWidth="2.2" points={sparklinePoints} />
                    </svg>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">Ticks will appear here after connection.</div>
                  )}
                </div>
              </div>
              <div className={`${GLOSS_PANEL_CLASS} overflow-hidden bg-[linear-gradient(90deg,rgba(2,6,23,0.98),rgba(15,23,42,0.8)_18%,rgba(15,23,42,0.86)_82%,rgba(2,6,23,0.98))]`}>
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <span>Current digits</span>
                  <span>{snapshot.totalTickCount} ticks</span>
                </div>
                <div className="relative overflow-hidden px-4 py-4">
                  <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-slate-950 via-slate-950/70 to-transparent" />
                  {streamedDigits.length > 0 ? (
                    <div className="flex min-h-12 items-center justify-end gap-3 overflow-hidden">
                      {streamedDigits.map((tick, index) => (
                        <motion.div
                          key={tick.key}
                          initial={{ opacity: 0, x: 18, scale: 0.92 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`flex h-12 min-w-[3rem] items-center justify-center rounded-2xl border px-3 text-lg font-semibold shadow-[0_0_24px_rgba(34,211,238,0.08)] ${index === streamedDigits.length - 1 ? 'border-cyan-300/30 bg-cyan-400/14 text-cyan-100' : 'border-cyan-400/10 bg-white/[0.04] text-slate-100'}`}
                          style={{ minHeight: '5rem' }}
                        >
                          <span>{tick.digit}</span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-12 items-center justify-center text-sm text-slate-500">Digits will flow here after connection.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {activeStrategy != null && assistedPanelsOn ? (
            <Card className={`${QUANTIX_PANEL_CLASS} border-cyan-400/20`}>
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChart3 className="h-5 w-5 text-cyan-300" />
                    {strategyDisplay[activeStrategy].metricsTitle}
                  </CardTitle>
                  <span className={SECTION_KICKER_CLASS}>Strategy Metrics</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className={`rounded-2xl border p-4 ${warmup.ready ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-amber-400/20 bg-amber-500/10'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Probability warm-up</div>
                      <div className={`mt-1 text-sm font-medium ${warmup.ready ? 'text-emerald-100' : 'text-amber-100'}`}>{warmup.message}</div>
                    </div>
                    <Badge className={warmup.ready ? 'border-emerald-400/20 bg-emerald-500/15 text-emerald-100' : 'border-amber-400/20 bg-amber-500/15 text-amber-100'}>
                      {warmup.progressPct.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-900/70">
                    <div
                      className={`h-full rounded-full transition-all ${warmup.ready ? 'bg-emerald-300' : 'bg-amber-300'}`}
                      style={{ width: `${warmup.progressPct}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-slate-300">{PROBABILITY_DISCLAIMER}</p>
                </div>

                {activeStrategy === 'digit-pulse' ? (
                  <>
                    <div className={`${GLOSS_PANEL_CLASS} p-3 sm:p-4`}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-400">Z Trade digit board</div>
                          <div className="mt-1 text-sm text-slate-300">Select the live digit you want to use for matches and differs execution.</div>
                        </div>
                        <span className="rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-orange-100">
                          Active digit {selectedDigit}
                        </span>
                      </div>
                    <div className="grid grid-cols-5 gap-2 sm:gap-3">
                      {digitActionButtons.map((item) => (
                        <div
                          key={item.digit}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedDigit(String(item.digit))}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedDigit(String(item.digit));
                            }
                          }}
                          className={`relative overflow-hidden rounded-[20px] border p-2.5 text-center transition sm:p-3 ${item.digit === Number(selectedDigit) ? 'border-orange-300/50 bg-[linear-gradient(155deg,rgba(251,146,60,0.22),rgba(15,23,42,0.84))] shadow-[0_0_28px_rgba(251,146,60,0.22)]' : item.bias === 'underrepresented' ? 'border-emerald-400/30 bg-[linear-gradient(155deg,rgba(16,185,129,0.16),rgba(15,23,42,0.78))] hover:border-emerald-300/40' : item.bias === 'overrepresented' ? 'border-rose-400/30 bg-[linear-gradient(155deg,rgba(244,63,94,0.16),rgba(15,23,42,0.78))] hover:border-rose-300/40' : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] hover:border-cyan-400/30 hover:bg-cyan-400/8'}`}
                        >
                          {item.digit === Number(selectedDigit) ? (
                            <motion.div
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0 rounded-2xl border border-orange-300/70"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 3.2, ease: 'linear', repeat: Infinity }}
                              style={{ boxShadow: '0 0 0 1px rgba(253,186,116,0.35), 0 0 24px rgba(251,146,60,0.28)' }}
                            />
                          ) : null}
                          <div className="relative flex min-h-[5.8rem] items-center justify-center sm:min-h-[6.6rem]">
                            <span className={`absolute right-0 top-0 text-[0.58rem] font-medium sm:text-[0.68rem] ${item.bias === 'underrepresented' ? 'text-emerald-200' : item.bias === 'overrepresented' ? 'text-rose-200' : 'text-slate-500'}`}>
                              {formatSignedPercent(item.deviation)}
                            </span>
                            {item.digit === Number(selectedDigit) ? (
                              <span className="absolute left-0 top-0 rounded-full border border-orange-300/20 bg-orange-400/10 px-1.5 py-0.5 text-[0.52rem] font-semibold uppercase tracking-[0.14em] text-orange-100 sm:text-[0.58rem]">
                                Live
                              </span>
                            ) : null}
                            <span className={`text-2xl font-semibold sm:text-3xl ${item.digit === Number(selectedDigit) ? 'text-orange-100' : 'text-slate-100'}`}>
                              {item.digit}
                            </span>
                            <span className={`absolute bottom-0 left-0 text-[0.62rem] font-medium sm:text-[0.72rem] ${item.bias === 'underrepresented' ? 'text-emerald-200' : item.bias === 'overrepresented' ? 'text-rose-200' : 'text-slate-400'}`}>
                              {item.count}
                            </span>
                            <span className={`absolute bottom-0 right-0 text-[0.62rem] font-medium sm:text-[0.72rem] ${item.digit === Number(selectedDigit) ? 'text-orange-200' : item.bias === 'underrepresented' ? 'text-emerald-200' : item.bias === 'overrepresented' ? 'text-rose-200' : 'text-slate-400'}`}>
                              {item.probability.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Match {selectedDigitMetrics.selectedDigit}</div>
                        <div className="mt-2 text-2xl font-semibold text-fuchsia-100">{selectedDigitMetrics.matchProbability.toFixed(1)}%</div>
                      </div>
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Differ {selectedDigitMetrics.selectedDigit}</div>
                        <div className="mt-2 text-2xl font-semibold text-cyan-100">{selectedDigitMetrics.differProbability.toFixed(1)}%</div>
                      </div>
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Deviation</div>
                        <div className={`mt-2 text-2xl font-semibold ${selectedDigitMetrics.matchDeviation < 0 ? 'text-emerald-200' : selectedDigitMetrics.matchDeviation > 0 ? 'text-rose-200' : 'text-slate-100'}`}>
                          {formatSignedPercent(selectedDigitMetrics.matchDeviation)}
                        </div>
                      </div>
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Signal</div>
                        <div className={`mt-2 text-lg font-semibold ${selectedDigitMetrics.profile.bias === 'underrepresented' ? 'text-emerald-200' : selectedDigitMetrics.profile.bias === 'overrepresented' ? 'text-rose-200' : 'text-slate-100'}`}>
                          {selectedDigitMetrics.profile.bias === 'underrepresented' ? 'Reversion Edge' : selectedDigitMetrics.profile.bias === 'overrepresented' ? 'Cooling Off' : 'Balanced'}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Most frequent</div>
                        <div className="mt-2 text-xl font-semibold text-red-200">{snapshot.analytics.mostFrequentDigit ?? '-'}</div>
                      </div>
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Least frequent</div>
                        <div className="mt-2 text-xl font-semibold text-emerald-200">{snapshot.analytics.leastFrequentDigit ?? '-'}</div>
                      </div>
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Streak alert</div>
                        <div className="mt-2 flex items-center gap-2 text-xl font-semibold text-cyan-200">
                          <Flame className="h-5 w-5 text-amber-300" />
                          {snapshot.analytics.currentStreakDigit ?? '-'} × {snapshot.analytics.currentStreakLength}
                        </div>
                      </div>
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Longest streak</div>
                        <div className="mt-2 text-xl font-semibold text-violet-200">
                          {snapshot.analytics.longestStreakDigit ?? '-'} × {snapshot.analytics.longestStreakLength}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Over {selectedDigitMetrics.selectedDigit}</div>
                        <div className="mt-2 text-3xl font-semibold text-fuchsia-200">{selectedDigitMetrics.overProbability.toFixed(1)}%</div>
                      </div>
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Under {selectedDigitMetrics.selectedDigit}</div>
                        <div className="mt-2 text-3xl font-semibold text-cyan-200">{selectedDigitMetrics.underProbability.toFixed(1)}%</div>
                      </div>
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Match {selectedDigitMetrics.selectedDigit}</div>
                        <div className="mt-2 text-3xl font-semibold text-amber-100">{selectedDigitMetrics.matchProbability.toFixed(1)}%</div>
                      </div>
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Differ {selectedDigitMetrics.selectedDigit}</div>
                        <div className="mt-2 text-3xl font-semibold text-slate-100">{selectedDigitMetrics.differProbability.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="grid gap-3 xl:grid-cols-[1.3fr_0.9fr_0.8fr]">
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Bias signal</div>
                            <div className={`mt-2 text-2xl font-semibold ${selectedDigitMetrics.bias === 'over' ? 'text-fuchsia-200' : selectedDigitMetrics.bias === 'under' ? 'text-cyan-200' : 'text-slate-100'}`}>{biasLabel}</div>
                          </div>
                          <Badge className={selectedDigitMetrics.bias === 'over' ? 'border-fuchsia-400/20 bg-fuchsia-500/15 text-fuchsia-100' : selectedDigitMetrics.bias === 'under' ? 'border-cyan-400/20 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-white/10 text-slate-200'}>
                            {selectedDigitMetrics.difference.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900/70">
                          <div className={`h-full rounded-full transition-all ${selectedDigitMetrics.bias === 'over' ? 'bg-fuchsia-300' : selectedDigitMetrics.bias === 'under' ? 'bg-cyan-300' : 'bg-slate-400'}`} style={{ width: `${selectedDigitMetrics.confidence}%` }} />
                        </div>
                      </div>
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Confidence</div>
                        <div className="mt-2 text-3xl font-semibold text-emerald-100">{selectedDigitMetrics.confidence.toFixed(1)}%</div>
                      </div>
                      <div className={ANALYTICS_TILE_CLASS}>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Deviation</div>
                        <div className={`mt-2 text-3xl font-semibold ${selectedDigitMetrics.matchDeviation < 0 ? 'text-emerald-200' : selectedDigitMetrics.matchDeviation > 0 ? 'text-rose-200' : 'text-slate-100'}`}>{formatSignedPercent(selectedDigitMetrics.matchDeviation)}</div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="min-w-0 space-y-4">
          {activeStrategy != null && assistedPanelsOn ? (
          <Card className={`${QUANTIX_PANEL_CLASS} border-cyan-400/20`}>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className={`flex items-center gap-2 ${QUANTIX_TITLE_CLASS}`}>
                  <Sparkles className="h-5 w-5 text-cyan-300" />
                  Signal & Confidence
                </CardTitle>
                <span className={SECTION_KICKER_CLASS}>{strategyDisplay[activeStrategy].name} live recommendation</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`rounded-[24px] border p-4 ${recommendationTone.panel}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Confidence meter</div>
                    <div className={`mt-2 text-2xl font-semibold ${recommendationTone.text}`}>{strategyRecommendation.stage}</div>
                  </div>
                  <Badge className={recommendationTone.chip}>{strategyRecommendation.confidence.toFixed(1)}%</Badge>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:text-[0.7rem]">
                    <span>No Trade</span>
                    <span>Wait</span>
                    <span>Enter</span>
                  </div>
                  <div className="relative h-3 overflow-hidden rounded-full bg-slate-900/70">
                    <div className="absolute inset-y-0 left-1/3 w-px bg-white/10" />
                    <div className="absolute inset-y-0 left-2/3 w-px bg-white/10" />
                    <div className={`h-full rounded-full bg-gradient-to-r ${recommendationTone.bar} transition-all`} style={{ width: `${Math.max(6, strategyRecommendation.confidence)}%` }} />
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-200">{strategyRecommendation.detail}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1.1fr)_minmax(14rem,0.9fr)]">
                <div className={`${CONTROL_SURFACE_CLASS} flex flex-col justify-between`}>
                  <div>
                    <div className="text-[0.62rem] uppercase tracking-[0.2em] text-slate-400">Trade signal</div>
                    <div className={`mt-2 text-xl font-semibold ${recommendationTone.text}`}>{strategyRecommendation.title}</div>
                  </div>
                  <div className="mt-4 text-sm leading-6 text-slate-300">{strategyRecommendation.action}</div>
                </div>
                <div className="relative overflow-hidden rounded-[10px] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] p-4 shadow-none">
                  <div className="pointer-events-none absolute inset-x-4 top-0 h-20 rounded-b-[999px] bg-white/10 blur-2xl" />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_30%)]" />
                  <div className="relative flex h-full flex-col justify-between gap-6">
                    <div>
                      <div className="text-[0.62rem] uppercase tracking-[0.24em] text-slate-400">Signal card</div>
                      <div className={`mt-2 text-lg font-semibold ${recommendationTone.text}`}>{strategyRecommendation.title}</div>
                    </div>
                    <div className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] ${recommendationTone.chip}`}>
                      {strategyRecommendation.stage}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          ) : null}

          {activeStrategy == null ? null : (
          <Card className={`${QUANTIX_PANEL_CLASS} border-fuchsia-400/20`}>
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className={`flex items-center gap-2 ${QUANTIX_TITLE_CLASS}`}>
                  <Zap className="h-5 w-5 text-fuchsia-300" />
                  Trading Panel
                </CardTitle>
                <span className={SECTION_KICKER_CLASS}>{activeStrategy === 'digit-pulse' ? 'Z Trade execution' : 'Strike Pro execution'}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className={`${CONTROL_SURFACE_CLASS} min-w-0 space-y-2`}>
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Stake amount</label>
                  <Input value={stake} onChange={(event) => setStake(event.target.value)} className="h-11 border-white/10 bg-white/5 text-slate-100" />
                </div>
                <div className={`${CONTROL_SURFACE_CLASS} min-w-0 space-y-2`}>
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Tick duration</label>
                  <select value={duration} onChange={(event) => setDuration(event.target.value)} className={darkSelectClassName} style={{ colorScheme: 'dark' }}>
                    {durationOptions.map((value) => (
                      <option key={value} value={value} className="bg-slate-950 text-slate-100">{value} ticks</option>
                    ))}
                  </select>
                </div>
                <div className={`${CONTROL_SURFACE_CLASS} min-w-0 space-y-2`}>
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Selected digit</label>
                  <select value={selectedDigit} onChange={(event) => setSelectedDigit(event.target.value)} className={darkSelectClassName} style={{ colorScheme: 'dark' }}>
                    {digitOptions.map((value) => (
                      <option key={value} value={value} className="bg-slate-950 text-slate-100">Digit {value}</option>
                    ))}
                  </select>
                </div>
                <div className={`${CONTROL_SURFACE_CLASS} min-w-0 space-y-2`}>
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Index</label>
                  <select value={selectedSymbol} onChange={(event) => setSelectedSymbol(event.target.value)} className={darkSelectClassName} style={{ colorScheme: 'dark' }}>
                    {Object.entries(groupedSymbols).map(([group, options]) => (
                      <optgroup key={group} label={group} className="bg-slate-950 text-slate-100">
                        {options.map((option) => (
                          <option key={option.symbol} value={option.symbol} className="bg-slate-950 text-slate-100">{option.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className={`${CONTROL_SURFACE_CLASS} min-w-0 space-y-2`}>
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Max daily loss</label>
                  <Input value={maxDailyLoss} onChange={(event) => setMaxDailyLoss(event.target.value)} placeholder="Optional" className="h-11 border-white/10 bg-white/5 text-slate-100" />
                </div>
                <div className={`${CONTROL_SURFACE_CLASS} min-w-0 space-y-2`}>
                  <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Trade cooldown (seconds)</label>
                  <Input value={cooldownSeconds} onChange={(event) => setCooldownSeconds(event.target.value)} className="h-11 border-white/10 bg-white/5 text-slate-100" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant={assistedPanelsOn ? 'gradient' : 'outline'} className="h-12 justify-between rounded-[18px] border-white/10 px-4" onClick={() => setAssistedPanelsOn((value) => !value)}>
                  <span>{assistedPanelsOn ? 'Panels ON' : 'Panels OFF'}</span>
                  <span className="text-[0.62rem] uppercase tracking-[0.18em] text-current/75">Display</span>
                </Button>
                <Button variant="outline" className="h-12 justify-between rounded-[18px] border-white/10 bg-white/[0.04] px-4" onClick={saveWorkspaceSettings} disabled={saving}>
                  <span>{saving ? 'Saving…' : 'Save Controls'}</span>
                  <span className="text-[0.62rem] uppercase tracking-[0.18em] text-current/75">Sync</span>
                </Button>
              </div>

              <div className={`rounded-2xl border p-4 text-sm ${warmup.ready ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100' : 'border-amber-400/20 bg-amber-500/10 text-amber-100'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <div className="font-medium">{warmup.ready ? 'Trading unlocked' : 'Trading locked during warm-up'}</div>
                      <div className="mt-1 text-xs text-current/80">{warmup.ready ? 'Enough live ticks have been collected for the probability engine.' : `${warmup.message}. Trade buttons unlock automatically at ${warmup.minTicksRequired} ticks.`}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">{warmup.currentTicks}/{warmup.minTicksRequired}</span>
                </div>
              </div>

              {activeStrategy === 'range-pressure' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant="gradient" className="h-14 justify-between rounded-[20px] px-5 text-left" onClick={() => placeTrade('OVER')} disabled={tradeDisabled}>
                    <span className="flex flex-col items-start">
                      <span className="text-sm font-semibold">Strike Pro Over {selectedDigit}</span>
                      <span className="text-[0.68rem] uppercase tracking-[0.16em] text-current/70">GoldX U/O Long Bias</span>
                    </span>
                  </Button>
                  <Button variant="outline" className="h-14 justify-between rounded-[20px] border-cyan-400/20 bg-cyan-400/10 px-5 text-left text-cyan-100 hover:bg-cyan-400/20" onClick={() => placeTrade('UNDER')} disabled={tradeDisabled}>
                    <span className="flex flex-col items-start">
                      <span className="text-sm font-semibold">Strike Pro Under {selectedDigit}</span>
                      <span className="text-[0.68rem] uppercase tracking-[0.16em] text-current/70">GoldX U/O Short Bias</span>
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <Button variant="outline" className="h-14 justify-between rounded-[20px] border-fuchsia-400/20 bg-fuchsia-400/10 px-5 text-left text-fuchsia-100 hover:bg-fuchsia-400/20" onClick={() => placeTrade('DIFFER', Number(selectedDigit))} disabled={tradeDisabled}>
                    <span className="flex flex-col items-start">
                      <span className="text-sm font-semibold">Z Trade Differ {selectedDigit}</span>
                      <span className="text-[0.68rem] uppercase tracking-[0.16em] text-current/70">Primary execution</span>
                    </span>
                  </Button>
                  <div className={`${CONTROL_SURFACE_CLASS} flex flex-col justify-center gap-1 px-4`}>
                    <div className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Execution note</div>
                    <div className="text-sm text-slate-300">Matches stay visible in metrics while the trading lane stays focused on differ entries.</div>
                  </div>
                </div>
              )}

              <div className={`${CONTROL_SURFACE_CLASS} text-sm text-slate-300`}>
                <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/10 px-3 py-3">
                  <span>Daily loss guard</span>
                  <span>{formatCurrency(snapshot.dailyLoss, snapshot.account?.currency || 'USD')}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/10 px-3 py-3">
                  <span>Cooldown remaining</span>
                  <span>{Math.ceil(snapshot.cooldownRemainingMs / 1000)}s</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-black/10 px-3 py-3">
                  <span>Data readiness</span>
                  <span>{warmup.ready ? 'Ready' : `${warmup.remainingTicks} ticks left`}</span>
                </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">{PROBABILITY_DISCLAIMER}</p>
              </div>
            </CardContent>
          </Card>
          )}

          {activeStrategy == null ? null : (
          <Card className={`${QUANTIX_PANEL_CLASS} border-emerald-400/20`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                <CardTitle className={`flex items-center gap-2 ${QUANTIX_TITLE_CLASS}`}>
                  <Sparkles className="h-5 w-5 text-emerald-300" />
                  Trade History
                </CardTitle>
                <span className={`${SECTION_KICKER_CLASS} hidden sm:inline-flex`}>Performance and settlements</span>
                </div>
                <button
                  type="button"
                  onClick={() => void clearResults()}
                  disabled={clearingResults || snapshot.trades.length === 0}
                  aria-label="Clear live results"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-400/20 bg-red-500/10 text-red-300 transition hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {clearingResults ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(15,23,42,0.78),rgba(2,6,23,0.92))] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-emerald-200/80">Net profit</div>
                <div className={`mt-2 text-3xl font-semibold ${netProfit >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>
                  {formatCurrency(netProfit, snapshot.account?.currency || 'USD')}
                </div>
                <div className="mt-2 text-xs text-slate-400">Running total across the Quantix-style trade history feed.</div>
              </div>

              <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {snapshot.trades.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                    No trades yet. Connect your account, then use the trading panel to place the first Z Trade or Strike Pro contract.
                  </div>
                ) : snapshot.trades.map((trade) => (
                  <div key={trade.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-100">{trade.action} · {trade.symbol}</div>
                        <div className="mt-1 text-xs text-slate-400">{formatDateTime(trade.createdAt)}</div>
                      </div>
                      <Badge variant={trade.status === 'won' ? 'success' : trade.status === 'lost' ? 'destructive' : 'outline'}>
                        {trade.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300">
                      <div>Stake: {formatCurrency(trade.stake, snapshot.account?.currency || 'USD')}</div>
                      <div>Payout: {formatCurrency(trade.payout, snapshot.account?.currency || 'USD')}</div>
                      <div>Digit: {trade.digit ?? '-'}</div>
                      <div>Profit: {formatCurrency(trade.profit, snapshot.account?.currency || 'USD')}</div>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">{trade.displayMessage}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          )}

          {activeStrategy == null ? null : (
          <Card className={`${QUANTIX_PANEL_CLASS} border-amber-400/20`}>
            <CardContent className="p-5 text-sm text-amber-100/90">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
                <div>
                  <div className="font-medium text-amber-200">Risk notice</div>
                  <p className="mt-1 text-slate-300">This is a trading tool, not financial advice. Digit contracts can settle quickly. Use the daily loss guard and cooldown controls.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </div>

      {showAgreementGate ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-orange-300/20 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.16),_transparent_35%),linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))] p-6 shadow-[0_0_80px_rgba(251,146,60,0.12)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-orange-200">
              <ShieldAlert className="h-3.5 w-3.5" />
              GoldX Pulse Agreement
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-slate-100">Confirm the GoldX Pulse trading agreement</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Before you start using GoldX Pulse, you must acknowledge the trading risk notice, Deriv options disclosure, and the GoldX Pulse no-refund policy.
            </p>
            <button
              type="button"
              onClick={() => setLegalOpen(true)}
              className="mt-4 text-sm font-medium text-cyan-300 underline underline-offset-4 transition hover:text-cyan-200"
            >
              Read the GoldX Pulse legal agreement
            </button>

            <button
              type="button"
              onClick={() => setAgreementChecked((value) => !value)}
              className="mt-6 flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-orange-300/20 hover:bg-white/[0.07]"
            >
              {agreementChecked ? <CheckSquare className="mt-0.5 h-5 w-5 text-orange-200" /> : <Square className="mt-0.5 h-5 w-5 text-slate-400" />}
              <span className="text-sm leading-6 text-slate-300">
                I understand that trading Deriv options carries material risk, results are not guaranteed, and GoldX Pulse purchases are non-refundable once access is granted.
              </span>
            </button>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button variant="gradient" onClick={acceptAgreement} disabled={!agreementChecked || agreementBusy}>
                {agreementBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Agree And Continue
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {legalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-orange-200">Legal Agreement</div>
                <div className="mt-1 text-xl font-semibold text-slate-100">GoldX Pulse Trading, Risk, and Refund Terms</div>
              </div>
              <button
                type="button"
                onClick={() => setLegalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Close legal agreement"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] space-y-6 overflow-y-auto px-6 py-6 text-sm leading-7 text-slate-300">
              <section>
                <h3 className="text-base font-semibold text-slate-100">Trading Risk Notice</h3>
                <p className="mt-2">GoldX Pulse is a trading workspace and analytical tool. It does not provide investment, legal, tax, or financial advice. All market decisions remain your sole responsibility, and you should only trade capital you can afford to lose.</p>
              </section>
              <section>
                <h3 className="text-base font-semibold text-slate-100">Deriv Options Disclosure</h3>
                <p className="mt-2">Deriv options and short-duration contracts can settle rapidly and may lead to fast gains or losses. Execution conditions, contract availability, pricing, balance availability, and platform behavior are controlled by Deriv and remain outside the control of TradeVision AI and GoldX Pulse.</p>
              </section>
              <section>
                <h3 className="text-base font-semibold text-slate-100">No Guarantee Of Performance</h3>
                <p className="mt-2">Past digit behavior, streaks, percentages, and analytical indicators do not guarantee future outcomes. No representation is made that any strategy, setup, or signal will produce profit or avoid loss.</p>
              </section>
              <section>
                <h3 className="text-base font-semibold text-slate-100">No Refund Policy</h3>
                <p className="mt-2">GoldX Pulse is a digitally delivered access product. Once access has been granted, activated, or used, no refund, reversal, partial refund, or usage-based credit is provided for the GoldX Pulse add-on except where required by law.</p>
              </section>
              <section>
                <h3 className="text-base font-semibold text-slate-100">User Responsibility</h3>
                <p className="mt-2">By continuing, you confirm that you understand the risks of trading leveraged or short-term option products, that you will use the workspace at your own discretion, and that you accept full responsibility for all trades and account outcomes.</p>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
