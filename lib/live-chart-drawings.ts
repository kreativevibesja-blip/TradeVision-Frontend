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

export const toChartCandles = (candles: DerivCandle[]): ChartCandle[] => candles;

export const mapAnalysisResultToChartOverlay = (analysis: AnalysisResult | null, candles: ChartCandle[]): ChartOverlaySet | null => {
  if (!analysis || candles.length === 0) {
    return null;
  }

  const zones: ChartOverlayZone[] = [];
  const levels: ChartOverlayLevel[] = [];
  const legendItems: ChartOverlayLegendItem[] = [];

  const pushZone = (
    kind: ChartOverlayZone['kind'],
    label: string,
    start: number | null | undefined,
    end: number | null | undefined,
    color: string,
    borderColor: string
  ) => {
    if (start == null || end == null) {
      return;
    }

    const window = deriveZoneWindow(start, end, candles);
    zones.push({
      key: `${kind}-${start}-${end}`,
      kind,
      start,
      end,
      label,
      color,
      borderColor,
      ...window,
    });
    addLegendItem(legendItems, kind, label, borderColor);
  };

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

  pushZone('supply', 'Supply zone', analysis.zones?.supplyZone?.min, analysis.zones?.supplyZone?.max, 'rgba(239, 68, 68, 0.16)', 'rgba(248, 113, 113, 0.72)');
  pushZone('demand', 'Demand zone', analysis.zones?.demandZone?.min, analysis.zones?.demandZone?.max, 'rgba(34, 197, 94, 0.16)', 'rgba(74, 222, 128, 0.72)');

  const entryZone = analysis.entryPlan?.entryZone ?? analysis.entryZone ?? analysis.entryLogic?.entryZone ?? null;
  pushZone('entry', 'Entry zone', entryZone?.min, entryZone?.max, 'rgba(59, 130, 246, 0.14)', 'rgba(96, 165, 250, 0.78)');

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

  const zones: ChartOverlayZone[] = analysis.zones
    .filter((zone) => Number.isFinite(zone.start) && Number.isFinite(zone.end))
    .map((zone, index) => {
      const window = zone.fromTime != null && zone.toTime != null
        ? { fromTime: zone.fromTime, toTime: zone.toTime }
        : deriveZoneWindow(zone.start, zone.end, candles);

      return {
        key: `${zone.type}-${zone.start}-${zone.end}-${index}`,
        kind: zone.type,
        start: zone.start,
        end: zone.end,
        label: zone.type === 'demand' ? 'Demand zone' : 'Supply zone',
        color: zone.type === 'demand' ? 'rgba(34, 197, 94, 0.16)' : 'rgba(239, 68, 68, 0.16)',
        borderColor: zone.type === 'demand' ? 'rgba(74, 222, 128, 0.72)' : 'rgba(248, 113, 113, 0.72)',
        ...window,
      };
    });

  const levels: ChartOverlayLevel[] = [
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