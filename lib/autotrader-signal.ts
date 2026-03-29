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
}

const normalizeSymbol = (value: string) => value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

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
  const direction = analysis.entryPlan?.bias === 'buy' || analysis.entryPlan?.bias === 'sell'
    ? analysis.entryPlan.bias
    : analysis.bias === 'buy' || analysis.bias === 'sell'
      ? analysis.bias
      : null;
  const stopLoss = analysis.stopLoss;
  const takeProfit = analysis.takeProfit1;
  const entryPrice = midpoint(analysis.entryPlan?.entryZone?.min, analysis.entryPlan?.entryZone?.max)
    ?? midpoint(analysis.entryZone?.min, analysis.entryZone?.max)
    ?? (typeof analysis.currentPrice === 'number' ? analysis.currentPrice : null);

  if (!direction || stopLoss == null || takeProfit == null || entryPrice == null) {
    return null;
  }

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
  };
};

export const buildAutoTraderSignalFromDerivAnalysis = (analysis: DerivAnalysisResult, symbol: string): AutoTraderSignalDraft | null => {
  if (analysis.bias !== 'buy' && analysis.bias !== 'sell') {
    return null;
  }

  if (analysis.entry == null || analysis.stopLoss == null || analysis.takeProfit == null) {
    return null;
  }

  return {
    symbol: normalizeSymbol(symbol),
    direction: analysis.bias,
    entryPrice: analysis.entry,
    stopLoss: analysis.stopLoss,
    takeProfit: analysis.takeProfit,
    confidence: analysis.setupRating === 'A+'
      ? 'A+'
      : analysis.setupRating === 'avoid'
        ? 'avoid'
        : mapConfidenceScoreToGrade(analysis.confidence),
    analysisId: analysis.analysisId,
  };
};