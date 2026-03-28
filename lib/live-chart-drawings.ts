import type { AnalysisResult } from '@/lib/api';
import type { DerivAnalysisResult, DerivCandle } from '@/lib/deriv-live';

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChartOverlayZone {
  key: string;
  kind: 'supply' | 'demand' | 'entry';
  start: number;
  end: number;
  fromTime: number;
  toTime: number;
  label: string;
  color: string;
  borderColor: string;
}

export interface ChartOverlayLevel {
  key: string;
  price: number;
  label: string;
  color: string;
  style?: 'solid' | 'dashed';
}

export interface ChartOverlayLegendItem {
  key: string;
  label: string;
  color: string;
}

export interface ChartOverlaySet {
  zones: ChartOverlayZone[];
  levels: ChartOverlayLevel[];
  legendItems: ChartOverlayLegendItem[];
}

const DEFAULT_ZONE_WINDOW = 48;

const deriveZoneWindow = (start: number, end: number, candles: ChartCandle[]) => {
  const low = Math.min(start, end);
  const high = Math.max(start, end);
  const matching = candles.filter((candle) => candle.low <= high && candle.high >= low);
  const relevant = matching.length > 0 ? matching.slice(-DEFAULT_ZONE_WINDOW) : candles.slice(-DEFAULT_ZONE_WINDOW);
  const fallbackStart = candles[Math.max(0, candles.length - DEFAULT_ZONE_WINDOW)]?.time ?? candles[0]?.time ?? 0;
  const fallbackEnd = candles[candles.length - 1]?.time ?? fallbackStart;

  return {
    fromTime: relevant[0]?.time ?? fallbackStart,
    toTime: relevant[relevant.length - 1]?.time ?? fallbackEnd,
  };
};

const midpoint = (min: number | null | undefined, max: number | null | undefined) => {
  if (min == null || max == null) {
    return null;
  }

  return (min + max) / 2;
};

const addLegendItem = (items: ChartOverlayLegendItem[], key: string, label: string, color: string) => {
  if (!items.some((item) => item.key === key)) {
    items.push({ key, label, color });
  }
};

const toLowerBound = (first: number, second: number) => Math.min(first, second);
const toUpperBound = (first: number, second: number) => Math.max(first, second);

const findNearestLevel = (prices: number[], referencePrice: number, direction: 'support' | 'resistance') => {
  if (prices.length === 0) {
    return null;
  }

  const directional = prices.filter((price) => (direction === 'support' ? price <= referencePrice : price >= referencePrice));
  const source = directional.length > 0 ? directional : prices;

  return source.sort((left, right) => Math.abs(left - referencePrice) - Math.abs(right - referencePrice))[0] ?? null;
};

export const toChartCandles = (candles: DerivCandle[]): ChartCandle[] => candles;

export const mapAnalysisResultToChartOverlay = (analysis: AnalysisResult | null, candles: ChartCandle[]): ChartOverlaySet | null => {
  if (!analysis || candles.length === 0) {
    return null;
  }

  const zones: ChartOverlayZone[] = [];
  const levels: ChartOverlayLevel[] = [];
  const legendItems: ChartOverlayLegendItem[] = [];

  const pushLevel = (
    key: string,
    label: string,
    price: number | null | undefined,
    color: string,
    style: ChartOverlayLevel['style'] = 'solid'
  ) => {
    if (price == null || !Number.isFinite(price)) {
      return;
    }

    levels.push({ key, label, price, color, style });
    addLegendItem(legendItems, key, label, color);
  };

  const entryZone = analysis.entryPlan?.entryZone ?? analysis.entryZone ?? analysis.entryLogic?.entryZone ?? null;

  if (analysis.zones?.demandZone?.min != null && analysis.zones?.demandZone?.max != null) {
    pushLevel('support', 'Support', toUpperBound(analysis.zones.demandZone.min, analysis.zones.demandZone.max), '#4ade80');
  }

  if (analysis.zones?.supplyZone?.min != null && analysis.zones?.supplyZone?.max != null) {
    pushLevel('resistance', 'Resistance', toLowerBound(analysis.zones.supplyZone.min, analysis.zones.supplyZone.max), '#f59e0b');
  }

  pushLevel('entry', 'Entry', midpoint(entryZone?.min, entryZone?.max), '#60a5fa');
  pushLevel('stop-loss', 'Stop Loss', analysis.stopLoss ?? analysis.invalidationLevel, '#f87171');
  pushLevel('tp1', 'TP1', analysis.takeProfit1, '#4ade80');
  pushLevel('tp2', 'TP2', analysis.takeProfit2, '#34d399');
  pushLevel('tp3', 'TP3', analysis.takeProfit3, '#a3e635');
  pushLevel('current-price', 'Current Price', analysis.currentPrice, '#cbd5e1', 'dashed');

  if (zones.length === 0 && levels.length === 0) {
    return null;
  }

  return { zones, levels, legendItems };
};

export const mapDerivAnalysisToChartOverlay = (analysis: DerivAnalysisResult | null, candles: ChartCandle[]): ChartOverlaySet | null => {
  if (!analysis || candles.length === 0) {
    return null;
  }

  const zones: ChartOverlayZone[] = [];
  const currentPrice = candles[candles.length - 1]?.close ?? 0;
  const supportCandidates = analysis.zones
    .filter((zone) => zone.type === 'demand' && Number.isFinite(zone.start) && Number.isFinite(zone.end))
    .map((zone) => toUpperBound(zone.start, zone.end));
  const resistanceCandidates = analysis.zones
    .filter((zone) => zone.type === 'supply' && Number.isFinite(zone.start) && Number.isFinite(zone.end))
    .map((zone) => toLowerBound(zone.start, zone.end));
  const support = findNearestLevel(supportCandidates, currentPrice, 'support');
  const resistance = findNearestLevel(resistanceCandidates, currentPrice, 'resistance');

  const levels: ChartOverlayLevel[] = [
    support != null ? { key: 'support', label: 'Support', price: support, color: '#4ade80' } : null,
    resistance != null ? { key: 'resistance', label: 'Resistance', price: resistance, color: '#f59e0b' } : null,
    analysis.entry != null ? { key: 'entry', label: 'Entry', price: analysis.entry, color: '#60a5fa' } : null,
    analysis.stopLoss != null ? { key: 'stop-loss', label: 'Stop Loss', price: analysis.stopLoss, color: '#f87171' } : null,
    analysis.takeProfit != null ? { key: 'tp1', label: 'TP1', price: analysis.takeProfit, color: '#4ade80' } : null,
  ].filter((level): level is ChartOverlayLevel => level !== null);

  const legendItems: ChartOverlayLegendItem[] = [];
  for (const zone of zones) {
    addLegendItem(legendItems, zone.kind, zone.label, zone.borderColor);
  }
  for (const level of levels) {
    addLegendItem(legendItems, level.key, level.label, level.color);
  }

  if (zones.length === 0 && levels.length === 0) {
    return null;
  }

  return { zones, levels, legendItems };
};