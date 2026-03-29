import type { AnalysisResult, SignalConfidence, SignalDirection, SignalMarketState } from '@/lib/api';
import type { DerivAnalysisResult } from '@/lib/deriv-live';

export interface AutoTraderSignalDraft {
  symbol: string;
  direction: SignalDirection;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: SignalConfidence;
  analysisId?: string;
  label?: string;
  marketState?: SignalMarketState;
  strategy?: string;
  score?: number;
  confirmations?: string[];
  explanation?: string;
  isOpportunistic: boolean;
}

const normalizeSymbol = (value: string) => value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

interface PriceZone {
  min: number;
  max: number;
}

interface ScoredConfirmation {
  label: string;
  weight: number;
}

interface EvaluatedCandidate {
  direction: SignalDirection;
  activeZone: PriceZone;
  targetZone: PriceZone;
  marketState: SignalMarketState;
  strategy: string;
  score: number;
  confirmations: ScoredConfirmation[];
}

const fallbackDistance = (price: number) => {
  if (!Number.isFinite(price) || price === 0) {
    return 1;
  }

  if (Math.abs(price) >= 1000) return Math.abs(price) * 0.003;
  if (Math.abs(price) >= 100) return Math.abs(price) * 0.002;
  if (Math.abs(price) >= 1) return Math.abs(price) * 0.0015;
  return 0.0015;
};

const toPriceZone = (zone?: { min: number | null; max: number | null } | null): PriceZone | null => {
  if (!zone) {
    return null;
  }

  const values = [zone.min, zone.max].filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (values.length === 0) {
    return null;
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
};

const zoneWidth = (zone: PriceZone) => Math.abs(zone.max - zone.min);

const distanceToZone = (price: number, zone: PriceZone) => {
  if (price < zone.min) {
    return zone.min - price;
  }

  if (price > zone.max) {
    return price - zone.max;
  }

  return 0;
};

const isNearZone = (price: number, zone: PriceZone) => {
  const proximityBuffer = Math.max(zoneWidth(zone) * 0.35, fallbackDistance(price));
  return distanceToZone(price, zone) <= proximityBuffer;
};

const midpoint = (min?: number | null, max?: number | null) => {
  if (typeof min !== 'number' && typeof max !== 'number') {
    return null;
  }

  if (typeof min === 'number' && typeof max === 'number') {
    return (min + max) / 2;
  }

  return typeof min === 'number' ? min : max ?? null;
};

const normalizeText = (...values: Array<string | undefined | null>) =>
  values
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();

const zoneOverlap = (left: PriceZone | null, right: PriceZone | null) => {
  if (!left || !right) {
    return false;
  }

  return left.min <= right.max && right.min <= left.max;
};

const hasDirectionalEntryConfirmation = (
  analysis: AnalysisResult,
  direction: SignalDirection,
  confirmation: 'BOS' | 'CHoCH',
) => analysis.entryPlan?.bias === direction && analysis.entryPlan.confirmation === confirmation;

const directionMatchesTrend = (direction: SignalDirection, trend: AnalysisResult['trend']) =>
  (direction === 'buy' && trend === 'bullish') || (direction === 'sell' && trend === 'bearish');

const directionMatchesShift = (direction: SignalDirection, analysis: AnalysisResult) => {
  if (direction === 'buy') {
    return analysis.structure.choch === 'bullish'
      || analysis.structure.bos === 'bullish'
      || hasDirectionalEntryConfirmation(analysis, direction, 'CHoCH')
      || hasDirectionalEntryConfirmation(analysis, direction, 'BOS');
  }

  return analysis.structure.choch === 'bearish'
    || analysis.structure.bos === 'bearish'
    || hasDirectionalEntryConfirmation(analysis, direction, 'CHoCH')
    || hasDirectionalEntryConfirmation(analysis, direction, 'BOS');
};

const mapStrategyLabel = (marketState: SignalMarketState) => {
  if (marketState === 'trending') return 'continuation entries';
  if (marketState === 'ranging') return 'support/resistance + sweeps';
  if (marketState === 'reversal') return 'liquidity sweep + confirmation';
  return 'stand aside';
};

const detectMarketState = (analysis: AnalysisResult): SignalMarketState => {
  const condition = analysis.marketCondition;
  const trend = analysis.trend;
  const reversalSignal = ((trend === 'bullish' && analysis.structure.choch === 'bearish')
    || (trend === 'bearish' && analysis.structure.choch === 'bullish')
    || analysis.entryLogic.type === 'reversal'
    || /reversal|shift in structure|change of character/i.test(normalizeText(analysis.strategy, analysis.reasoning, analysis.message)));

  if (trend === 'ranging' || condition === 'ranging' || condition === 'consolidation') {
    return 'ranging';
  }

  if (reversalSignal) {
    return 'reversal';
  }

  if (condition === 'trending' || condition === 'breakout' || (trend === 'bullish' && analysis.structure.bos === 'bullish') || (trend === 'bearish' && analysis.structure.bos === 'bearish')) {
    return 'trending';
  }

  return 'choppy';
};

const collectConfirmations = (
  analysis: AnalysisResult,
  direction: SignalDirection,
  activeZone: PriceZone,
): ScoredConfirmation[] => {
  const textCorpus = normalizeText(
    analysis.reasoning,
    analysis.message,
    ...(analysis.confirmations ?? []),
    analysis.entryPlan?.reason,
    analysis.counterTrendPlan?.reason,
    analysis.invalidationReason,
  );
  const confirmations: ScoredConfirmation[] = [];
  const seen = new Set<string>();

  const pushConfirmation = (key: string, label: string, weight: number) => {
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    confirmations.push({ label, weight });
  };

  const sweepMatchesDirection = direction === 'buy'
    ? analysis.liquidity.sweep === 'below lows' || analysis.liquidity.type === 'sell-side'
    : analysis.liquidity.sweep === 'above highs' || analysis.liquidity.type === 'buy-side';
  if (sweepMatchesDirection) {
    pushConfirmation('liquidity', 'Liquidity sweep', 2);
  }

  if (/engulf/i.test(textCorpus)) {
    pushConfirmation('engulfing', 'Engulfing candle', 2);
  }

  if (/rejection|rejecting|wick|pin bar|pinbar/i.test(textCorpus)) {
    pushConfirmation('wick', 'Rejection wick', 1);
  }

  const microStructureConfirmed = direction === 'buy'
    ? analysis.structure.bos === 'bullish'
      || analysis.structure.choch === 'bullish'
      || hasDirectionalEntryConfirmation(analysis, direction, 'BOS')
      || hasDirectionalEntryConfirmation(analysis, direction, 'CHoCH')
    : analysis.structure.bos === 'bearish'
      || analysis.structure.choch === 'bearish'
      || hasDirectionalEntryConfirmation(analysis, direction, 'BOS')
      || hasDirectionalEntryConfirmation(analysis, direction, 'CHoCH');
  if (microStructureConfirmed) {
    pushConfirmation('micro-structure', 'Micro BOS/CHoCH', 2);
  }

  const entryZone = toPriceZone(analysis.entryPlan?.entryZone ?? analysis.entryZone ?? null);
  const zoneReaction = zoneOverlap(activeZone, entryZone)
    || /support|resistance|reaction|bounce|retest|reclaim|respect|zone/i.test(textCorpus);
  if (zoneReaction) {
    pushConfirmation('zone-reaction', 'Lower timeframe support/resistance reaction', 1);
  }

  return confirmations;
};

const evaluateCandidate = (
  analysis: AnalysisResult,
  marketState: SignalMarketState,
  direction: SignalDirection,
  activeZone: PriceZone,
  targetZone: PriceZone,
): EvaluatedCandidate | null => {
  if (!isNearZone(analysis.currentPrice, activeZone) || marketState === 'choppy') {
    return null;
  }

  if (marketState === 'trending' && !directionMatchesTrend(direction, analysis.trend)) {
    return null;
  }

  if (marketState === 'reversal' && !directionMatchesShift(direction, analysis)) {
    return null;
  }

  const confirmations = collectConfirmations(analysis, direction, activeZone);
  const confirmationLabels = new Set(confirmations.map((item) => item.label));

  if ((marketState === 'ranging' || marketState === 'reversal') && !confirmationLabels.has('Liquidity sweep')) {
    return null;
  }

  if (confirmations.length < 2) {
    return null;
  }

  const score = 3 + confirmations.reduce((total, item) => total + item.weight, 0);
  if (score < 5) {
    return null;
  }

  return {
    direction,
    activeZone,
    targetZone,
    marketState,
    strategy: mapStrategyLabel(marketState),
    score,
    confirmations,
  };
};

export const mapConfidenceScoreToGrade = (score: number, fallback?: AnalysisResult['setupQuality']): SignalConfidence => {
  if (!Number.isFinite(score)) {
    return fallback === 'low' ? 'avoid' : 'B';
  }

  if (score >= 90) return 'A+';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  return fallback === 'low' ? 'avoid' : 'B';
};

export const buildAutoTraderSignalFromAnalysis = (analysis: AnalysisResult): AutoTraderSignalDraft | null => {
  if (!Number.isFinite(analysis.currentPrice)) {
    return null;
  }

  const currentPrice = analysis.currentPrice;
  const supportZone = toPriceZone(analysis.zones?.demandZone ?? null);
  const resistanceZone = toPriceZone(analysis.zones?.supplyZone ?? null);

  if (!supportZone || !resistanceZone) {
    return null;
  }

  const marketState = detectMarketState(analysis);
  if (marketState === 'choppy') {
    return null;
  }

  const nearSupport = isNearZone(currentPrice, supportZone);
  const nearResistance = isNearZone(currentPrice, resistanceZone);
  if (!nearSupport && !nearResistance) {
    return null;
  }

  const candidates = [
    evaluateCandidate(analysis, marketState, 'buy', supportZone, resistanceZone),
    evaluateCandidate(analysis, marketState, 'sell', resistanceZone, supportZone),
  ].filter((candidate): candidate is EvaluatedCandidate => Boolean(candidate));

  if (candidates.length === 0) {
    return null;
  }

  const selected = candidates.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return distanceToZone(currentPrice, left.activeZone) - distanceToZone(currentPrice, right.activeZone);
  })[0];

  const entryPrice = midpoint(selected.activeZone.min, selected.activeZone.max);
  const takeProfit = midpoint(selected.targetZone.min, selected.targetZone.max);
  if (entryPrice == null || takeProfit == null) {
    return null;
  }

  const stopPadding = Math.max(zoneWidth(selected.activeZone) * 0.2, fallbackDistance(entryPrice) * 0.5);
  const stopLoss = selected.direction === 'buy'
    ? selected.activeZone.min - stopPadding
    : selected.activeZone.max + stopPadding;

  if ((selected.direction === 'buy' && takeProfit <= entryPrice) || (selected.direction === 'sell' && takeProfit >= entryPrice)) {
    return null;
  }

  const confirmations = selected.confirmations.map((item) => item.label);
  const zoneLabel = selected.direction === 'buy' ? 'support' : 'resistance';
  const explanation = `Opportunistic Setup: ${selected.marketState} market using ${selected.strategy}. Score ${selected.score} with confirmations: ${confirmations.join(', ')}. Price is reacting at ${zoneLabel}, so entry is mapped from the active zone, stop sits beyond it, and target reaches for the opposite zone.`;

  return {
    symbol: normalizeSymbol(analysis.pair),
    direction: selected.direction,
    entryPrice,
    stopLoss,
    takeProfit,
    confidence: 'B',
    analysisId: analysis.id,
    label: 'Opportunistic Setup',
    marketState: selected.marketState,
    strategy: selected.strategy,
    score: selected.score,
    confirmations,
    explanation,
    isOpportunistic: true,
  };
};

export const buildAutoTraderSignalFromDerivAnalysis = (analysis: DerivAnalysisResult, symbol: string): AutoTraderSignalDraft | null => {
  const direction: SignalDirection = analysis.bias === 'sell' ? 'sell' : 'buy';
  const entryPrice = analysis.entry ?? analysis.stopLoss ?? analysis.takeProfit;
  if (entryPrice == null) {
    return null;
  }

  const distance = analysis.stopLoss != null
    ? Math.abs(entryPrice - analysis.stopLoss)
    : fallbackDistance(entryPrice);
  const stopLoss = analysis.stopLoss ?? (direction === 'buy' ? entryPrice - distance : entryPrice + distance);
  const takeProfit = analysis.takeProfit ?? (direction === 'buy' ? entryPrice + distance * 2.4 : entryPrice - distance * 2.4);

  return {
    symbol: normalizeSymbol(symbol),
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    confidence: analysis.setupRating === 'A+'
      ? 'A+'
      : analysis.setupRating === 'avoid'
        ? 'avoid'
        : mapConfidenceScoreToGrade(analysis.confidence),
    analysisId: analysis.analysisId,
    label: 'Opportunistic Setup',
    explanation: analysis.reasoning,
    isOpportunistic: analysis.verdict !== 'enter',
  };
};