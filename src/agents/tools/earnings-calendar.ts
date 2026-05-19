import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getFMPClient } from "@/lib/fmp";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Earnings calendar events from FMP.
 * The Earnings Agent uses this to monitor upcoming and recently-released
 * corporate earnings that have commodity-market implications.
 */
export const earningsCalendar = tool(
  async ({ from, to, symbol }) => {
    const client = getFMPClient();

    const now = new Date();
    const fromDate = from ?? toDateStr(now);
    const toDate =
      to ?? toDateStr(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));

    try {
      let events = await client.getEarningsCalendar(fromDate, toDate);

      if (symbol) {
        const upper = symbol.toUpperCase();
        events = events.filter((e) => e.symbol.toUpperCase() === upper);
      }

      // Sort by date ascending
      events.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      if (!events.length) {
        return JSON.stringify({
          ok: true,
          earnings: [],
          message: `No earnings events found from ${fromDate} to ${toDate}${symbol ? ` for ${symbol}` : ""}.`,
        });
      }

      const results = events.map((e) => ({
        symbol: e.symbol,
        date: e.date,
        eps: e.eps,
        epsEstimated: e.epsEstimated,
        revenue: e.revenue,
        revenueEstimated: e.revenueEstimated,
        reported: e.eps !== null || e.revenue !== null,
      }));

      return JSON.stringify({ ok: true, earnings: results });
    } catch (err) {
      return JSON.stringify({
        ok: false,
        message: `Failed to fetch earnings calendar: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  },
  {
    name: "earningsCalendar",
    description:
      "Fetch upcoming and recent corporate earnings calendar events. Returns company symbol, report date, EPS actual vs estimated, and revenue actual vs estimated. Use this to monitor earnings from commodity-linked companies (oil majors, miners, agribusiness).",
    schema: z.object({
      from: z
        .string()
        .optional()
        .describe("Start date in YYYY-MM-DD format. Defaults to today."),
      to: z
        .string()
        .optional()
        .describe(
          "End date in YYYY-MM-DD format. Defaults to 7 days from now.",
        ),
      symbol: z
        .string()
        .optional()
        .describe(
          "Filter to a specific ticker symbol (e.g. XOM, NEM, ADM). Omit to return all earnings in the date range.",
        ),
    }),
  },
);
