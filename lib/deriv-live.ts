import type { AnalysisResult } from '@/lib/api';

export type DerivSymbol = string;
export type DerivTimeframe = '1m' | '5m' | '15m' | '1H';
export const DERIV_ANALYSIS_CANDLE_COUNT = 500;

export interface DerivSymbolOption {
  value: DerivSymbol;
  label: string;
  description: string;
  category: 'volatility' | 'volatility-1s' | 'jump' | 'step' | 'boom-crash';
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
  { value: 'R_10', label: 'Volatility 10', description: 'Lower-volatility synthetic index.', category: 'volatility' },
  { value: 'R_25', label: 'Volatility 25', description: 'Moderate-volatility synthetic index.', category: 'volatility' },
  { value: 'R_50', label: 'Volatility 50', description: 'Balanced synthetic volatility index.', category: 'volatility' },
  { value: 'R_75', label: 'Volatility 75', description: 'High-volatility synthetic index.', category: 'volatility' },
  { value: 'R_100', label: 'Volatility 100', description: 'Higher-volatility synthetic index.', category: 'volatility' },
  { value: '1HZ10V', label: 'Volatility 10 (1s)', description: '1-second synthetic volatility feed.', category: 'volatility-1s' },
  { value: '1HZ15V', label: 'Volatility 15 (1s)', description: '1-second synthetic volatility feed.', category: 'volatility-1s' },
  { value: '1HZ25V', label: 'Volatility 25 (1s)', description: '1-second synthetic volatility feed.', category: 'volatility-1s' },
  { value: '1HZ30V', label: 'Volatility 30 (1s)', description: '1-second synthetic volatility feed.', category: 'volatility-1s' },
  { value: '1HZ50V', label: 'Volatility 50 (1s)', description: '1-second synthetic volatility feed.', category: 'volatility-1s' },
  { value: '1HZ75V', label: 'Volatility 75 (1s)', description: '1-second synthetic volatility feed.', category: 'volatility-1s' },
  { value: '1HZ90V', label: 'Volatility 90 (1s)', description: '1-second synthetic volatility feed.', category: 'volatility-1s' },
  { value: '1HZ100V', label: 'Volatility 100 (1s)', description: '1-second synthetic volatility feed.', category: 'volatility-1s' },
  { value: 'JD10', label: 'Jump 10', description: 'Synthetic jump index with lower jump intensity.', category: 'jump' },
  { value: 'JD25', label: 'Jump 25', description: 'Synthetic jump index with moderate jump intensity.', category: 'jump' },
  { value: 'JD50', label: 'Jump 50', description: 'Synthetic jump index with balanced jump intensity.', category: 'jump' },
  { value: 'JD75', label: 'Jump 75', description: 'Synthetic jump index with high jump intensity.', category: 'jump' },
  { value: 'JD100', label: 'Jump 100', description: 'Synthetic jump index with higher jump intensity.', category: 'jump' },
  { value: 'stpRNG', label: 'Step Index 100', description: 'Step index with 100-step structure.', category: 'step' },
  { value: 'stpRNG2', label: 'Step Index 200', description: 'Step index with 200-step structure.', category: 'step' },
  { value: 'stpRNG3', label: 'Step Index 300', description: 'Step index with 300-step structure.', category: 'step' },
  { value: 'stpRNG4', label: 'Step Index 400', description: 'Step index with 400-step structure.', category: 'step' },
  { value: 'stpRNG5', label: 'Step Index 500', description: 'Step index with 500-step structure.', category: 'step' },
  { value: 'BOOM50', label: 'Boom 50', description: 'Frequent upward spike synthetic index.', category: 'boom-crash' },
  { value: 'BOOM150N', label: 'Boom 150', description: 'Upward spike synthetic index.', category: 'boom-crash' },
  { value: 'BOOM300N', label: 'Boom 300', description: 'Upward spike synthetic index.', category: 'boom-crash' },
  { value: 'BOOM500', label: 'Boom 500', description: 'Upward spike synthetic index.', category: 'boom-crash' },
  { value: 'BOOM600', label: 'Boom 600', description: 'Upward spike synthetic index.', category: 'boom-crash' },
  { value: 'BOOM900', label: 'Boom 900', description: 'Upward spike synthetic index.', category: 'boom-crash' },
  { value: 'BOOM1000', label: 'Boom 1000', description: 'Upward spike synthetic index.', category: 'boom-crash' },
  { value: 'CRASH50', label: 'Crash 50', description: 'Frequent downward spike synthetic index.', category: 'boom-crash' },
  { value: 'CRASH150N', label: 'Crash 150', description: 'Downward spike synthetic index.', category: 'boom-crash' },
  { value: 'CRASH300N', label: 'Crash 300', description: 'Downward spike synthetic index.', category: 'boom-crash' },
  { value: 'CRASH500', label: 'Crash 500', description: 'Downward spike synthetic index.', category: 'boom-crash' },
  { value: 'CRASH600', label: 'Crash 600', description: 'Downward spike synthetic index.', category: 'boom-crash' },
  { value: 'CRASH900', label: 'Crash 900', description: 'Downward spike synthetic index.', category: 'boom-crash' },
  { value: 'CRASH1000', label: 'Crash 1000', description: 'Downward spike synthetic index.', category: 'boom-crash' },
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
