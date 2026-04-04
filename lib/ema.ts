export interface EmaInputPoint {
  time: number;
  close: number;
}

export interface EmaPoint {
  time: number;
  value: number;
}

export function calculateEmaSeries<T extends EmaInputPoint>(candles: T[], period: number): EmaPoint[] {
  if (period <= 0 || candles.length < period) {
    return [];
  }

  const smoothing = 2 / (period + 1);
  const seed = candles.slice(0, period).reduce((sum, candle) => sum + candle.close, 0) / period;
  const points: EmaPoint[] = [{ time: candles[period - 1].time, value: seed }];

  let ema = seed;
  for (let index = period; index < candles.length; index++) {
    ema = (candles[index].close - ema) * smoothing + ema;
    points.push({ time: candles[index].time, value: ema });
  }

  return points;
}