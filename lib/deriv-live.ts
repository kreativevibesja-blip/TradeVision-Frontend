import type { AnalysisResult } from '@/lib/api';

export type DerivSymbol = 'R_75' | 'R_100' | 'BOOM1000' | 'CRASH1000';
export type DerivTimeframe = '1m' | '5m' | '15m' | '1H';

export interface DerivSymbolOption {
  value: DerivSymbol;
  label: string;
  description: string;
}

export interface DerivTimeframeOption {
  value: DerivTimeframe;
  label: string;
  granularity: number;
}

export interface DerivCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface DerivZone {
  type: 'demand' | 'supply';
  start: number;
  end: number;
  fromTime?: number;
  toTime?: number;
}

export interface DerivAnalysisResult {
  analysisId?: string;
  bias: 'buy' | 'sell' | 'none';
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  confidence: number;
  setupRating: 'A+' | 'B' | 'avoid';
  marketCondition: string;
  verdict: 'enter' | 'wait' | 'avoid';
  reasoning: string;
  zones: DerivZone[];
}

export const DERIV_SYMBOLS: DerivSymbolOption[] = [
  { value: 'R_75', label: 'Volatility 75', description: 'Synthetic index with high volatility' },
  { value: 'R_100', label: 'Volatility 100', description: 'Synthetic index with higher volatility' },
  { value: 'BOOM1000', label: 'Boom 1000', description: 'Upward spikes on a synthetic index' },
  { value: 'CRASH1000', label: 'Crash 1000', description: 'Downward spikes on a synthetic index' },
];

export const DERIV_TIMEFRAMES: DerivTimeframeOption[] = [
  { value: '1m', label: '1m', granularity: 60 },
  { value: '5m', label: '5m', granularity: 300 },
  { value: '15m', label: '15m', granularity: 900 },
  { value: '1H', label: '1H', granularity: 3600 },
];

export const getDerivTimeframe = (value: string) =>
  DERIV_TIMEFRAMES.find((item) => item.value === value) ?? DERIV_TIMEFRAMES[2];

export const getDerivSymbol = (value: string) =>
  DERIV_SYMBOLS.find((item) => item.value === value) ?? DERIV_SYMBOLS[0];

export const getDerivCacheKey = (symbol: string, granularity: number) =>
  `deriv_live_chart_cache:${symbol}:${granularity}`;

const deriveZoneWindow = (start: number, end: number, candles: DerivCandle[]) => {
  const low = Math.min(start, end);
  const high = Math.max(start, end);
  const matching = candles.filter((candle) => candle.low <= high && candle.high >= low);
  const relevant = matching.length > 0 ? matching.slice(-40) : candles.slice(-40);

  return {
    fromTime: relevant[0]?.time ?? candles[Math.max(0, candles.length - 40)]?.time ?? candles[0]?.time,
    toTime: relevant[relevant.length - 1]?.time ?? candles[candles.length - 1]?.time,
  };
};

export const mapPersistedAnalysisToDerivResult = (
  analysis: AnalysisResult,
  candles: DerivCandle[]
): DerivAnalysisResult => {
  const zones: DerivZone[] = [];

  if (analysis.zones?.demandZone?.min != null && analysis.zones?.demandZone?.max != null) {
    zones.push({
      type: 'demand',
      start: analysis.zones.demandZone.min,
      end: analysis.zones.demandZone.max,
      ...deriveZoneWindow(analysis.zones.demandZone.min, analysis.zones.demandZone.max, candles),
    });
  }

  if (analysis.zones?.supplyZone?.min != null && analysis.zones?.supplyZone?.max != null) {
    zones.push({
      type: 'supply',
      start: analysis.zones.supplyZone.min,
      end: analysis.zones.supplyZone.max,
      ...deriveZoneWindow(analysis.zones.supplyZone.min, analysis.zones.supplyZone.max, candles),
    });
  }

  const entryFromZone = analysis.entryPlan?.entryZone?.min != null && analysis.entryPlan?.entryZone?.max != null
    ? (analysis.entryPlan.entryZone.min + analysis.entryPlan.entryZone.max) / 2
    : analysis.entryZone?.min != null && analysis.entryZone?.max != null
      ? (analysis.entryZone.min + analysis.entryZone.max) / 2
      : null;

  return {
    analysisId: analysis.id,
    bias: analysis.entryPlan?.bias ?? 'none',
    entry: entryFromZone,
    stopLoss: analysis.stopLoss ?? null,
    takeProfit: analysis.takeProfit1 ?? null,
    confidence: analysis.quality?.confidence ?? analysis.confidence ?? 50,
    setupRating: analysis.quality?.setupRating ?? 'avoid',
    marketCondition: analysis.marketCondition || 'unclear',
    verdict: analysis.finalVerdict?.action ?? 'wait',
    reasoning: analysis.reasoning || analysis.message || 'No high-probability setup found.',
    zones,
  };
};
