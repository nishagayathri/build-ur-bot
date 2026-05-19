import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getFMPClient } from "@/lib/fmp";

/**
 * Top market movers: gainers, losers, or most active stocks.
 * DATA_DESK agents use this to identify story-worthy equity moves
 * and unusual volume activity.
 */
export const marketMovers = tool(
  async ({ category, limit }) => {
    const client = getFMPClient();

    try {
      let movers;

      switch (category) {
        case "gainers":
          movers = await client.getGainers();
          break;
        case "losers":
          movers = await client.getLosers();
          break;
        case "actives":
          movers = await client.getMostActive();
          break;
      }

      const results = movers.slice(0, limit).map((m) => ({
        symbol: m.symbol,
        name: m.name,
        price: m.price,
        changesPercentage: m.changesPercentage,
        change: m.change,
      }));

      return JSON.stringify({ ok: true, movers: results });
    } catch (err) {
      return JSON.stringify({
        ok: false,
        message: `Failed to fetch ${category}: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  },
  {
    name: "marketMovers",
    description:
      "Fetch today's top market movers: biggest gainers, biggest losers, or most actively traded stocks. Useful for spotting story-worthy equity moves.",
    schema: z.object({
      category: z
        .enum(["gainers", "losers", "actives"])
        .describe("Which mover list to fetch"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(30)
        .default(10)
        .describe("Maximum number of results to return (default 10)"),
    }),
  },
);
