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
