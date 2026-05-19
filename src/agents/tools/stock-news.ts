import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getFMPClient } from "@/lib/fmp";

/**
 * Latest market news from FMP.
 * DATA_DESK agents use this to scan for breaking headlines and
 * story-worthy developments across tracked instruments.
 */
export const stockNews = tool(
  async ({ tickers, limit }) => {
    const client = getFMPClient();

    try {
      const news = await client.getStockNews({
        tickers: tickers?.length ? tickers : undefined,
        limit,
      });

      if (!news.length) {
        return JSON.stringify({
          ok: true,
          articles: [],
          message: "No news articles found for the given criteria.",
        });
      }

      const articles = news.map((n) => ({
        symbol: n.symbol,
        publishedDate: n.publishedDate,
        title: n.title,
        text: n.text.length > 500 ? n.text.slice(0, 500) + "..." : n.text,
        url: n.url,
        site: n.site,
      }));

      return JSON.stringify({ ok: true, articles });
    } catch (err) {
      return JSON.stringify({
        ok: false,
        message: `Failed to fetch news: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  },
  {
    name: "stockNews",
    description:
      "Fetch the latest market news articles. Optionally filter by specific ticker symbols. Returns headlines, source, publication date, and a text snippet for each article.",
    schema: z.object({
      tickers: z
        .array(z.string())
        .optional()
        .describe(
          "Ticker symbols to filter news for (e.g. ['AAPL', 'MSFT']). Omit for general market news.",
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe("Maximum number of articles to return (default 10)"),
    }),
  },
);
