import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getFMPClient } from "@/lib/fmp";

/**
 * Real-time quote lookup for any asset class.
 * DATA_DESK agents use this to check current prices, volume, and
 * percentage changes when evaluating signal-worthiness.
 */
export const marketQuote = tool(
  async ({ symbols, assetType }) => {
    const client = getFMPClient();

    try {
      let quotes;

      switch (assetType) {
        case "forex": {
          const all = await client.getForexQuotes();
          quotes = all.filter((q) =>
            symbols.some((s) => q.symbol.toUpperCase().includes(s.toUpperCase())),
          );
          break;
        }
        case "crypto": {
          const all = await client.getCryptoQuotes();
          quotes = all.filter((q) =>
            symbols.some((s) => q.symbol.toUpperCase().includes(s.toUpperCase())),
          );
          break;
        }
        case "commodity": {
          const all = await client.getCommodityQuotes();
          quotes = all.filter((q) =>
            symbols.some((s) => q.symbol.toUpperCase().includes(s.toUpperCase())),
          );
          break;
        }
        case "index": {
          const all = await client.getIndexQuotes();
          quotes = all.filter((q) =>
            symbols.some((s) => q.symbol.toUpperCase().includes(s.toUpperCase())),
          );
          break;
        }
        default:
          quotes = await client.getQuotes(symbols);
      }

      if (!quotes.length) {
        return JSON.stringify({
          ok: false,
          message: `No quotes found for ${symbols.join(", ")}${assetType ? ` (${assetType})` : ""}`,
        });
      }

      const results = quotes.map((q) => ({
        symbol: q.symbol,
        name: q.name,
        price: q.price,
        changesPercentage: q.changesPercentage,
        change: q.change,
        dayHigh: q.dayHigh,
        dayLow: q.dayLow,
        volume: q.volume,
        avgVolume: q.avgVolume,
        volumeVsAvg: q.avgVolume > 0
          ? Math.round((q.volume / q.avgVolume) * 100) / 100
          : null,
        previousClose: q.previousClose,
      }));

      return JSON.stringify({ ok: true, quotes: results });
    } catch (err) {
      return JSON.stringify({
        ok: false,
        message: `Failed to fetch quotes: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  },
  {
    name: "marketQuote",
    description:
      "Fetch real-time price quotes for stocks, forex pairs, crypto, commodities, or indexes. Returns current price, percentage change, volume, and volume-vs-average for evaluating signal significance.",
    schema: z.object({
      symbols: z
        .array(z.string())
        .min(1)
        .max(20)
        .describe(
          "Symbols to quote (e.g. ['AAPL'], ['EURUSD'], ['BTCUSD'], ['^GSPC'])",
        ),
      assetType: z
        .enum(["equity", "forex", "crypto", "commodity", "index"])
        .optional()
        .describe(
          "Asset class hint. Use 'forex', 'crypto', 'commodity', or 'index' for those asset types. Omit or use 'equity' for stocks.",
        ),
    }),
  },
);
