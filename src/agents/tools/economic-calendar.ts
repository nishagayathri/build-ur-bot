import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getFMPClient } from "@/lib/fmp";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Economic calendar events from FMP.
 * DATA_DESK agents use this to monitor upcoming and recently-released
 * macro events (CPI, NFP, PMI, Fed speakers, etc.).
 */
export const economicCalendar = tool(
  async ({ from, to, impactFilter }) => {
    const client = getFMPClient();

    const now = new Date();
    const fromDate = from ?? toDateStr(now);
    const toDate =
      to ?? toDateStr(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));

    try {
      let events = await client.getEconomicCalendar(fromDate, toDate);

      if (impactFilter) {
        events = events.filter(
          (e) => e.impact.toUpperCase() === impactFilter,
        );
      }

      // Sort by date ascending
      events.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      if (!events.length) {
        return JSON.stringify({
          ok: true,
          events: [],
          message: `No economic events found from ${fromDate} to ${toDate}${impactFilter ? ` with ${impactFilter} impact` : ""}.`,
        });
      }

      const results = events.map((e) => ({
        date: e.date,
        event: e.event,
        country: e.country,
        impact: e.impact,
        actual: e.actual,
        previous: e.previous,
        estimate: e.estimate,
        released: e.actual !== null,
      }));

      return JSON.stringify({ ok: true, events: results });
    } catch (err) {
      return JSON.stringify({
        ok: false,
        message: `Failed to fetch economic calendar: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  },
  {
    name: "economicCalendar",
    description:
      "Fetch upcoming and recent economic calendar events (CPI, NFP, PMI, central bank decisions, etc.). Returns event name, date, country, impact level, and actual vs estimated values.",
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
      impactFilter: z
        .enum(["LOW", "MEDIUM", "HIGH"])
        .optional()
        .describe(
          "Filter events by impact level. Omit to return all events.",
        ),
    }),
  },
);
