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

interface PriceZone {
  min: number;
  max: number;
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

  const nearSupport = isNearZone(currentPrice, supportZone);
  const nearResistance = isNearZone(currentPrice, resistanceZone);

  if (!nearSupport && !nearResistance) {
    return null;
  }

  let direction: SignalDirection;
  let activeZone: PriceZone;
  let targetZone: PriceZone;

  if (nearSupport && !nearResistance) {
    direction = 'buy';
    activeZone = supportZone;
    targetZone = resistanceZone;
  } else if (nearResistance && !nearSupport) {
    direction = 'sell';
    activeZone = resistanceZone;
    targetZone = supportZone;
  } else if (distanceToZone(currentPrice, supportZone) <= distanceToZone(currentPrice, resistanceZone)) {
    direction = 'buy';
    activeZone = supportZone;
    targetZone = resistanceZone;
  } else {
    direction = 'sell';
    activeZone = resistanceZone;
    targetZone = supportZone;
  }

  const entryPrice = midpoint(activeZone.min, activeZone.max);
  const takeProfit = midpoint(targetZone.min, targetZone.max);

  if (entryPrice == null || takeProfit == null) {
    return null;
  }

  const stopPadding = Math.max(zoneWidth(activeZone) * 0.2, fallbackDistance(entryPrice) * 0.5);
  const stopLoss = direction === 'buy'
    ? activeZone.min - stopPadding
    : activeZone.max + stopPadding;

  if ((direction === 'buy' && takeProfit <= entryPrice) || (direction === 'sell' && takeProfit >= entryPrice)) {
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