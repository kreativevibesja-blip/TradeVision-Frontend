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

const pushZone = (
  zones: ChartOverlayZone[],
  legendItems: ChartOverlayLegendItem[],
  zone: {
    key: string;
    kind: ChartOverlayZone['kind'];
    start: number;
    end: number;
    fromTime?: number;
    toTime?: number;
    label: string;
    color: string;
    borderColor: string;
  },
  candles: ChartCandle[]
) => {
  if (!Number.isFinite(zone.start) || !Number.isFinite(zone.end)) {
    return;
  }

  const window =
    zone.fromTime != null && zone.toTime != null
      ? { fromTime: zone.fromTime, toTime: zone.toTime }
      : deriveZoneWindow(zone.start, zone.end, candles);

  zones.push({
    key: zone.key,
    kind: zone.kind,
    start: zone.start,
    end: zone.end,
    fromTime: window.fromTime,
    toTime: window.toTime,
    label: zone.label,
    color: zone.color,
    borderColor: zone.borderColor,
  });
  addLegendItem(legendItems, zone.key, zone.label, zone.borderColor);
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

export const mapAnalysisResultToChartOverlay = (
  analysis: AnalysisResult | null,
  candles: ChartCandle[],
  options?: { useZoneBoxes?: boolean }
): ChartOverlaySet | null => {
  if (!analysis || candles.length === 0) {
    return null;
  }

  const zones: ChartOverlayZone[] = [];
  const levels: ChartOverlayLevel[] = [];
  const legendItems: ChartOverlayLegendItem[] = [];
  const useZoneBoxes = options?.useZoneBoxes ?? false;

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
    if (useZoneBoxes) {
      pushZone(
        zones,
        legendItems,
        {
          key: 'demand-zone',
          kind: 'demand',
          start: analysis.zones.demandZone.min,
          end: analysis.zones.demandZone.max,
          label: 'Support Zone',
          color: 'rgba(74, 222, 128, 0.14)',
          borderColor: '#4ade80',
        },
        candles
      );
    } else {
      pushLevel('support', 'Support', toUpperBound(analysis.zones.demandZone.min, analysis.zones.demandZone.max), '#4ade80');
    }
  }

  if (analysis.zones?.supplyZone?.min != null && analysis.zones?.supplyZone?.max != null) {
    if (useZoneBoxes) {
      pushZone(
        zones,
        legendItems,
        {
          key: 'supply-zone',
          kind: 'supply',
          start: analysis.zones.supplyZone.min,
          end: analysis.zones.supplyZone.max,
          label: 'Resistance Zone',
          color: 'rgba(245, 158, 11, 0.14)',
          borderColor: '#f59e0b',
        },
        candles
      );
    } else {
      pushLevel('resistance', 'Resistance', toLowerBound(analysis.zones.supplyZone.min, analysis.zones.supplyZone.max), '#f59e0b');
    }
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
  const legendItems: ChartOverlayLegendItem[] = [];

  analysis.zones.forEach((zone, index) => {
    pushZone(
      zones,
      legendItems,
      {
        key: `${zone.type}-${index}`,
        kind: zone.type,
        start: zone.start,
        end: zone.end,
        fromTime: zone.fromTime,
        toTime: zone.toTime,
        label: zone.type === 'demand' ? 'Support Zone' : 'Resistance Zone',
        color: zone.type === 'demand' ? 'rgba(74, 222, 128, 0.14)' : 'rgba(245, 158, 11, 0.14)',
        borderColor: zone.type === 'demand' ? '#4ade80' : '#f59e0b',
      },
      candles
    );
  });

  const levels: ChartOverlayLevel[] = [
    analysis.entry != null ? { key: 'entry', label: 'Entry', price: analysis.entry, color: '#60a5fa' } : null,
    analysis.stopLoss != null ? { key: 'stop-loss', label: 'Stop Loss', price: analysis.stopLoss, color: '#f87171' } : null,
    analysis.takeProfit != null ? { key: 'tp1', label: 'TP1', price: analysis.takeProfit, color: '#4ade80' } : null,
  ].filter((level): level is ChartOverlayLevel => level !== null);

  for (const level of levels) {
    addLegendItem(legendItems, level.key, level.label, level.color);
  }

  if (zones.length === 0 && levels.length === 0) {
    return null;
  }

  return { zones, levels, legendItems };
};