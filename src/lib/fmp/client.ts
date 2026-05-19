import type {
  FMPQuote,
  FMPForexRate,
  FMPStockNews,
  FMPEconomicCalendarEvent,
  FMPEarningsCalendarEvent,
  FMPMarketMover,
  FMPHistoricalPrice,
  FMPTechnicalIndicator,
  FMPPressRelease,
  FMPSocialSentiment,
  FMPInsiderTrade,
} from "./types";

const MAX_RETRIES = 2;
const DEFAULT_BASE_URL = "https://financialmodelingprep.com";

/** Minimal shape returned by /stable/batch-*-quotes endpoints */
interface BatchQuoteRaw {
  symbol: string;
  price: number;
  change: number;
  volume: number;
}

export class FMPClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(opts: { apiKey: string; baseUrl?: string }) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE_URL;
  }

  // ── Core request with retry ──────────────────────────────────────────

  private async request<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    url.searchParams.set("apikey", this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(url.toString());

        if (!res.ok) {
          throw new Error(`FMP ${res.status}: ${res.statusText}`);
        }

        return (await res.json()) as T;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) {
          console.log(
            `[fmp-client] Retry ${attempt + 1} for ${path}: ${lastError.message}`,
          );
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Normalize the minimal batch-quote shape into a full FMPQuote.
   * Computes changesPercentage from change/price; fields not available
   * from the batch endpoint get sensible defaults.
   */
  private normalizeBatchQuote(raw: BatchQuoteRaw): FMPQuote {
    const previousClose = raw.price - raw.change;
    return {
      symbol: raw.symbol,
      name: raw.symbol,
      price: raw.price,
      change: raw.change,
      changesPercentage:
        previousClose !== 0 ? (raw.change / previousClose) * 100 : 0,
      volume: raw.volume,
      dayLow: 0,
      dayHigh: 0,
      yearHigh: 0,
      yearLow: 0,
      marketCap: null,
      priceAvg50: 0,
      priceAvg200: 0,
      exchange: "",
      avgVolume: 0,
      open: 0,
      previousClose,
      eps: null,
      pe: null,
      earningsAnnouncement: null,
      sharesOutstanding: null,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  // ── Quotes ───────────────────────────────────────────────────────────

  async getQuotes(symbols: string[]): Promise<FMPQuote[]> {
    // Individual symbol quote still uses v3 (no confirmed stable equivalent)
    return this.request<FMPQuote[]>(
      `/api/v3/quote/${symbols.join(",")}`,
    );
  }

  async getForexRates(): Promise<FMPForexRate[]> {
    return this.request<FMPForexRate[]>("/api/v3/fx");
  }

  async getForexQuotes(): Promise<FMPQuote[]> {
    const raw = await this.request<BatchQuoteRaw[]>("/stable/batch-forex-quotes");
    return raw.map((q) => this.normalizeBatchQuote(q));
  }

  async getCryptoQuotes(): Promise<FMPQuote[]> {
    const raw = await this.request<BatchQuoteRaw[]>("/stable/batch-crypto-quotes");
    return raw.map((q) => this.normalizeBatchQuote(q));
  }

  async getCommodityQuotes(): Promise<FMPQuote[]> {
    const raw = await this.request<BatchQuoteRaw[]>("/stable/batch-commodity-quotes");
    return raw.map((q) => this.normalizeBatchQuote(q));
  }

  async getIndexQuotes(): Promise<FMPQuote[]> {
    const raw = await this.request<BatchQuoteRaw[]>("/stable/batch-index-quotes");
    return raw.map((q) => this.normalizeBatchQuote(q));
  }

  // ── Market movers ────────────────────────────────────────────────────

  async getGainers(): Promise<FMPMarketMover[]> {
    return this.request<FMPMarketMover[]>("/stable/biggest-gainers");
  }

  async getLosers(): Promise<FMPMarketMover[]> {
    return this.request<FMPMarketMover[]>("/stable/biggest-losers");
  }

  async getMostActive(): Promise<FMPMarketMover[]> {
    return this.request<FMPMarketMover[]>("/stable/most-actives");
  }

  // ── News ─────────────────────────────────────────────────────────────

  async getStockNews(opts: {
    tickers?: string[];
    limit?: number;
  }): Promise<FMPStockNews[]> {
    const params: Record<string, string> = {
      page: "0",
      limit: String(opts.limit ?? 20),
    };
    const news = await this.request<FMPStockNews[]>(
      "/stable/news/stock-latest",
      params,
    );
    // Stable endpoint has no tickers param — filter client-side
    if (opts.tickers?.length) {
      const upper = new Set(opts.tickers.map((t) => t.toUpperCase()));
      return news.filter((n) => upper.has(n.symbol?.toUpperCase()));
    }
    return news;
  }

  async getPressReleases(
    symbol: string,
    limit = 10,
  ): Promise<FMPPressRelease[]> {
    return this.request<FMPPressRelease[]>(
      `/api/v3/press-releases/${symbol}`,
      { limit: String(limit) },
    );
  }

  // ── Calendars ────────────────────────────────────────────────────────

  async getEconomicCalendar(
    from: string,
    to: string,
  ): Promise<FMPEconomicCalendarEvent[]> {
    return this.request<FMPEconomicCalendarEvent[]>(
      "/stable/economic-calendar",
      { from, to },
    );
  }

  async getEarningsCalendar(
    from: string,
    to: string,
  ): Promise<FMPEarningsCalendarEvent[]> {
    const raw = await this.request<
      Array<{
        symbol: string;
        date: string;
        epsActual: number | null;
        epsEstimated: number | null;
        revenueActual: number | null;
        revenueEstimated: number | null;
        lastUpdated: string;
      }>
    >("/stable/earnings-calendar", { from, to });

    return raw.map((e) => ({
      date: e.date,
      symbol: e.symbol,
      eps: e.epsActual,
      epsEstimated: e.epsEstimated,
      time: "",
      revenue: e.revenueActual,
      revenueEstimated: e.revenueEstimated,
      fiscalDateEnding: e.date,
      updatedFromDate: e.lastUpdated,
    }));
  }

  // ── Insider Trading ──────────────────────────────────────────────────

  async getLatestInsiderTrades(limit = 100): Promise<FMPInsiderTrade[]> {
    return this.request<FMPInsiderTrade[]>(
      "/stable/insider-trading/latest",
      { page: "0", limit: String(limit) },
    );
  }

  // ── Historical & Technical ───────────────────────────────────────────

  async getHistoricalPrices(
    symbol: string,
    timeseries = 30,
  ): Promise<{ symbol: string; historical: FMPHistoricalPrice[] }> {
    return this.request<{
      symbol: string;
      historical: FMPHistoricalPrice[];
    }>(`/api/v3/historical-price-full/${symbol}`, {
      timeseries: String(timeseries),
    });
  }

  async getTechnicalIndicator(
    symbol: string,
    type: string,
    period = 14,
  ): Promise<FMPTechnicalIndicator[]> {
    return this.request<FMPTechnicalIndicator[]>(
      `/api/v3/technical_indicator/daily/${symbol}`,
      { period: String(period), type },
    );
  }

  // ── Social Sentiment ─────────────────────────────────────────────────

  async getSocialSentiment(
    symbol: string,
    limit = 100,
  ): Promise<FMPSocialSentiment[]> {
    return this.request<FMPSocialSentiment[]>("/api/v4/social-sentiment", {
      symbol,
      limit: String(limit),
    });
  }
}
