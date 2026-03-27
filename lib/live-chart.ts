export interface LiveChartSymbolOption {
  value: string;
  label: string;
  tvSymbol: string;
  category: 'forex-major' | 'forex-minor' | 'commodities' | 'indices' | 'crypto';
}

export const LIVE_CHART_SYMBOLS: LiveChartSymbolOption[] = [
  { value: 'EURUSD', label: 'EUR/USD', tvSymbol: 'OANDA:EURUSD', category: 'forex-major' },
  { value: 'GBPUSD', label: 'GBP/USD', tvSymbol: 'OANDA:GBPUSD', category: 'forex-major' },
  { value: 'USDJPY', label: 'USD/JPY', tvSymbol: 'OANDA:USDJPY', category: 'forex-major' },
  { value: 'USDCHF', label: 'USD/CHF', tvSymbol: 'OANDA:USDCHF', category: 'forex-major' },
  { value: 'USDCAD', label: 'USD/CAD', tvSymbol: 'OANDA:USDCAD', category: 'forex-major' },
  { value: 'AUDUSD', label: 'AUD/USD', tvSymbol: 'OANDA:AUDUSD', category: 'forex-major' },
  { value: 'NZDUSD', label: 'NZD/USD', tvSymbol: 'OANDA:NZDUSD', category: 'forex-major' },
  { value: 'EURGBP', label: 'EUR/GBP', tvSymbol: 'OANDA:EURGBP', category: 'forex-minor' },
  { value: 'EURJPY', label: 'EUR/JPY', tvSymbol: 'OANDA:EURJPY', category: 'forex-minor' },
  { value: 'EURCHF', label: 'EUR/CHF', tvSymbol: 'OANDA:EURCHF', category: 'forex-minor' },
  { value: 'EURAUD', label: 'EUR/AUD', tvSymbol: 'OANDA:EURAUD', category: 'forex-minor' },
  { value: 'EURNZD', label: 'EUR/NZD', tvSymbol: 'OANDA:EURNZD', category: 'forex-minor' },
  { value: 'GBPJPY', label: 'GBP/JPY', tvSymbol: 'OANDA:GBPJPY', category: 'forex-minor' },
  { value: 'GBPCHF', label: 'GBP/CHF', tvSymbol: 'OANDA:GBPCHF', category: 'forex-minor' },
  { value: 'GBPAUD', label: 'GBP/AUD', tvSymbol: 'OANDA:GBPAUD', category: 'forex-minor' },
  { value: 'AUDJPY', label: 'AUD/JPY', tvSymbol: 'OANDA:AUDJPY', category: 'forex-minor' },
  { value: 'AUDNZD', label: 'AUD/NZD', tvSymbol: 'OANDA:AUDNZD', category: 'forex-minor' },
  { value: 'AUDCAD', label: 'AUD/CAD', tvSymbol: 'OANDA:AUDCAD', category: 'forex-minor' },
  { value: 'CADJPY', label: 'CAD/JPY', tvSymbol: 'OANDA:CADJPY', category: 'forex-minor' },
  { value: 'CHFJPY', label: 'CHF/JPY', tvSymbol: 'OANDA:CHFJPY', category: 'forex-minor' },
  { value: 'NZDJPY', label: 'NZD/JPY', tvSymbol: 'OANDA:NZDJPY', category: 'forex-minor' },
  { value: 'XAUUSD', label: 'Gold', tvSymbol: 'OANDA:XAUUSD', category: 'commodities' },
  { value: 'XAGUSD', label: 'Silver', tvSymbol: 'OANDA:XAGUSD', category: 'commodities' },
  { value: 'USOIL', label: 'WTI Oil', tvSymbol: 'TVC:USOIL', category: 'commodities' },
  { value: 'BRENT', label: 'Brent Oil', tvSymbol: 'TVC:UKOIL', category: 'commodities' },
  { value: 'NATGAS', label: 'Natural Gas', tvSymbol: 'TVC:NATGAS', category: 'commodities' },
  { value: 'NAS100', label: 'NAS100', tvSymbol: 'CAPITALCOM:US100', category: 'indices' },
  { value: 'US30', label: 'US30', tvSymbol: 'CAPITALCOM:US30', category: 'indices' },
  { value: 'SPX500', label: 'SPX500', tvSymbol: 'CAPITALCOM:US500', category: 'indices' },
  { value: 'GER40', label: 'GER40', tvSymbol: 'CAPITALCOM:DE40', category: 'indices' },
  { value: 'UK100', label: 'UK100', tvSymbol: 'CAPITALCOM:UK100', category: 'indices' },
  { value: 'JP225', label: 'JP225', tvSymbol: 'CAPITALCOM:JPN225', category: 'indices' },
  { value: 'BTCUSD', label: 'BTC/USD', tvSymbol: 'BITSTAMP:BTCUSD', category: 'crypto' },
  { value: 'ETHUSD', label: 'ETH/USD', tvSymbol: 'BITSTAMP:ETHUSD', category: 'crypto' },
  { value: 'SOLUSD', label: 'SOL/USD', tvSymbol: 'BINANCE:SOLUSDT', category: 'crypto' },
  { value: 'XRPUSD', label: 'XRP/USD', tvSymbol: 'BITSTAMP:XRPUSD', category: 'crypto' },
  { value: 'ADAUSD', label: 'ADA/USD', tvSymbol: 'BINANCE:ADAUSDT', category: 'crypto' },
  { value: 'LTCUSD', label: 'LTC/USD', tvSymbol: 'BITSTAMP:LTCUSD', category: 'crypto' },
];

export const LIVE_CHART_SYMBOL_GROUPS = [
  { label: 'Forex Majors', value: 'forex-major' },
  { label: 'Forex Minors', value: 'forex-minor' },
  { label: 'Commodities', value: 'commodities' },
  { label: 'Stock Indices', value: 'indices' },
  { label: 'Crypto Currencies', value: 'crypto' },
] as const;

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