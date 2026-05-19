// ─── FMP API Response Types ─────────────────────────────────────────────────

/** GET /api/v3/quote/{SYMBOL} */
export interface FMPQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number | null;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number | null;
  pe: number | null;
  earningsAnnouncement: string | null;
  sharesOutstanding: number | null;
  timestamp: number;
}

/** GET /api/v3/stock_news */
export interface FMPStockNews {
  symbol: string;
  publishedDate: string;
  title: string;
  image: string | null;
  site: string;
  text: string;
  url: string;
}

/** GET /api/v3/economic_calendar */
export interface FMPEconomicCalendarEvent {
  date: string;
  country: string;
  event: string;
  currency: string;
  previous: number | null;
  estimate: number | null;
  actual: number | null;
  change: number | null;
  impact: string; // "Low" | "Medium" | "High"
  changePercentage: number | null;
}

/** GET /api/v3/earning_calendar */
export interface FMPEarningsCalendarEvent {
  date: string;
  symbol: string;
  eps: number | null;
  epsEstimated: number | null;
  time: string;
  revenue: number | null;
  revenueEstimated: number | null;
  fiscalDateEnding: string;
  updatedFromDate: string;
}

/** GET /api/v3/gainers, /losers, /actives (same shape as quote) */
export interface FMPMarketMover {
  symbol: string;
  name: string;
  change: number;
  price: number;
  changesPercentage: number;
}

/** GET /api/v3/historical-price-full/{SYMBOL} */
export interface FMPHistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
  unadjustedVolume: number;
  change: number;
  changePercent: number;
  vwap: number;
  label: string;
  changeOverTime: number;
}

/** GET /api/v3/technical_indicator/daily/{SYMBOL} */
export interface FMPTechnicalIndicator {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma?: number;
  ema?: number;
  wma?: number;
  dema?: number;
  tema?: number;
  williams?: number;
  rsi?: number;
  adx?: number;
  standardDeviation?: number;
}

/** GET /api/v3/press-releases/{SYMBOL} */
export interface FMPPressRelease {
  symbol: string;
  date: string;
  title: string;
  text: string;
}

/** GET /api/v4/social-sentiment */
export interface FMPSocialSentiment {
  date: string;
  symbol: string;
  stocktwitsPosts: number;
  twitterPosts: number;
  stocktwitsComments: number;
  twitterComments: number;
  stocktwitsLikes: number;
  twitterLikes: number;
  stocktwitsImpressions: number;
  twitterImpressions: number;
  stocktwitsSentiment: number;
  twitterSentiment: number;
}

/** GET /stable/insider-trading/latest */
export interface FMPInsiderTrade {
  symbol: string;
  filingDate: string;
  transactionDate: string;
  reportingCik: string;
  companyCik: string;
  transactionType: string;
  securitiesOwned: number;
  reportingName: string;
  typeOfOwner: string;
  acquisitionOrDisposition: string;
  directOrIndirect: string;
  formType: string;
  securitiesTransacted: number;
  price: number;
  securityName: string;
  url: string;
}

/** GET /api/v3/fx — simplified forex rate */
export interface FMPForexRate {
  ticker: string;
  bid: string;
  ask: string;
  open: string;
  low: string;
  high: string;
  changes: number;
  date: string;
}
