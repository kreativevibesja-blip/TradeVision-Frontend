export interface LiveChartSymbolOption {
  value: string;
  label: string;
  tvSymbol: string;
}

export const LIVE_CHART_SYMBOLS: LiveChartSymbolOption[] = [
  { value: 'EURUSD', label: 'EUR/USD', tvSymbol: 'OANDA:EURUSD' },
  { value: 'GBPUSD', label: 'GBP/USD', tvSymbol: 'OANDA:GBPUSD' },
  { value: 'USDJPY', label: 'USD/JPY', tvSymbol: 'OANDA:USDJPY' },
  { value: 'AUDUSD', label: 'AUD/USD', tvSymbol: 'OANDA:AUDUSD' },
  { value: 'USDCAD', label: 'USD/CAD', tvSymbol: 'OANDA:USDCAD' },
  { value: 'XAUUSD', label: 'XAU/USD', tvSymbol: 'OANDA:XAUUSD' },
  { value: 'BTCUSD', label: 'BTC/USD', tvSymbol: 'BITSTAMP:BTCUSD' },
  { value: 'ETHUSD', label: 'ETH/USD', tvSymbol: 'BITSTAMP:ETHUSD' },
  { value: 'NAS100', label: 'NAS100', tvSymbol: 'CAPITALCOM:US100' },
  { value: 'US30', label: 'US30', tvSymbol: 'CAPITALCOM:US30' },
  { value: 'SPX500', label: 'SPX500', tvSymbol: 'CAPITALCOM:US500' },
];

export const LIVE_CHART_TIMEFRAMES = [
  { value: 'M1', label: '1m', tvInterval: '1' },
  { value: 'M5', label: '5m', tvInterval: '5' },
  { value: 'M15', label: '15m', tvInterval: '15' },
  { value: 'M30', label: '30m', tvInterval: '30' },
  { value: 'H1', label: '1h', tvInterval: '60' },
  { value: 'H4', label: '4h', tvInterval: '240' },
  { value: 'D1', label: '1D', tvInterval: 'D' },
];

export const getLiveChartSymbol = (value: string) =>
  LIVE_CHART_SYMBOLS.find((item) => item.value === value) ?? LIVE_CHART_SYMBOLS[0];

export const getLiveChartTimeframe = (value: string) =>
  LIVE_CHART_TIMEFRAMES.find((item) => item.value === value) ?? LIVE_CHART_TIMEFRAMES[2];