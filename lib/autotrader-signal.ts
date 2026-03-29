import type { AnalysisResult, SignalConfidence, SignalDirection } from '@/lib/api';
import type { DerivAnalysisResult } from '@/lib/deriv-live';

export interface AutoTraderSignalDraft {
  symbol: string;
  direction: SignalDirection;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: SignalConfidence;
  analysisId?: string;
  isOpportunistic: boolean;
}

const normalizeSymbol = (value: string) => value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

const fallbackDistance = (price: number) => {
  if (!Number.isFinite(price) || price === 0) {
    return 1;
  }

  if (Math.abs(price) >= 1000) return Math.abs(price) * 0.003;
  if (Math.abs(price) >= 100) return Math.abs(price) * 0.002;
  if (Math.abs(price) >= 1) return Math.abs(price) * 0.0015;
  return 0.0015;
};

const inferDirection = (analysis: AnalysisResult): SignalDirection => {
  if (analysis.entryPlan?.bias === 'buy' || analysis.entryPlan?.bias === 'sell') {
    return analysis.entryPlan.bias;
  }

  if (analysis.bias === 'buy' || analysis.bias === 'sell') {
    return analysis.bias;
  }

  if (analysis.counterTrendPlan?.bias === 'buy' || analysis.counterTrendPlan?.bias === 'sell') {
    return analysis.counterTrendPlan.bias;
  }

  if (analysis.trend === 'bullish') return 'buy';
  if (analysis.trend === 'bearish') return 'sell';
  return analysis.currentPricePosition === 'premium' ? 'sell' : 'buy';
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
  const direction = inferDirection(analysis);
  const entryPrice = midpoint(analysis.entryPlan?.entryZone?.min, analysis.entryPlan?.entryZone?.max)
    ?? midpoint(analysis.entryZone?.min, analysis.entryZone?.max)
    ?? midpoint(analysis.counterTrendPlan?.entryZone?.min, analysis.counterTrendPlan?.entryZone?.max)
    ?? (typeof analysis.currentPrice === 'number' ? analysis.currentPrice : null);
  const basePrice = entryPrice ?? analysis.currentPrice;
  const rawStopLoss = analysis.stopLoss
    ?? analysis.counterTrendPlan?.stopLoss
    ?? analysis.invalidationLevel
    ?? null;
  const stopDistance = basePrice != null && rawStopLoss != null
    ? Math.abs(basePrice - rawStopLoss)
    : basePrice != null
      ? fallbackDistance(basePrice)
      : null;
  const stopLoss = rawStopLoss ?? (basePrice != null && stopDistance != null
    ? direction === 'buy'
      ? basePrice - stopDistance
      : basePrice + stopDistance
    : null);
  const takeProfit = analysis.takeProfit1
    ?? analysis.counterTrendPlan?.takeProfit1
    ?? (basePrice != null && stopDistance != null
      ? direction === 'buy'
        ? basePrice + stopDistance * 2.4
        : basePrice - stopDistance * 2.4
      : null);

  if (stopLoss == null || takeProfit == null || entryPrice == null) {
    return null;
  }

  const isOpportunistic = analysis.recommendation === 'wait'
    || analysis.finalVerdict?.action === 'wait'
    || analysis.signalType === 'wait';

  return {
    symbol: normalizeSymbol(analysis.pair),
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    confidence: analysis.quality?.setupRating === 'A+'
      ? 'A+'
      : analysis.quality?.setupRating === 'avoid'
        ? 'avoid'
        : mapConfidenceScoreToGrade(analysis.confidence, analysis.setupQuality),
    analysisId: analysis.id,
    isOpportunistic,
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
    isOpportunistic: analysis.verdict !== 'enter',
  };
};