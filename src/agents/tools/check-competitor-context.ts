import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAccountId } from "@/agents/runtime/agent-context";

/**
 * Queries recent CompetitorReport records for narrative saturation,
 * misleading content flags, and other competitive signals that should
 * influence the EIC's coverage decisions.
 *
 * The EIC calls this before approving a story to check whether the
 * topic is already saturated in the competitor landscape, or whether
 * there are active compliance concerns from competitor content.
 */
export const checkCompetitorContext = tool(
  async ({ topics, lookback_days, report_types }) => {
    let accountId: string;
    try {
      accountId = getAccountId();
    } catch {
      return JSON.stringify({ ok: false, error: "Account context not set" });
    }

    try {
      const since = new Date(Date.now() - lookback_days * 86_400_000);

      const where: Record<string, unknown> = {
        accountId,
        createdAt: { gte: since },
      };

      // Filter by report type if specified
      if (report_types && report_types.length > 0) {
        where.reportType = { in: report_types };
      }

      // Topic matching: find reports where any of the stored topics
      // overlap with the requested topics (case-insensitive substring)
      const reports = await prisma.competitorReport.findMany({
        where,
        orderBy: [
          // HIGH urgency first, then most recent
          { urgency: "asc" }, // HIGH < LOW alphabetically, so we sort desc below
          { createdAt: "desc" },
        ],
        take: 20,
        select: {
          id: true,
          reportType: true,
          source: true,
          observation: true,
          editorialOpportunity: true,
          urgency: true,
          recommendedAction: true,
          complianceNote: true,
          topics: true,
          engagementSummary: true,
          createdAt: true,
        },
      });

      // Filter by topic relevance client-side (Postgres array overlap
      // would need raw query; this is simpler and the result set is small)
      const lowerTopics = topics.map((t) => t.toLowerCase());

      const relevant = reports
        .filter((r) => {
          if (topics.length === 0) return true;
          const reportTopics = r.topics.map((t) => t.toLowerCase());
          return (
            lowerTopics.some((t) =>
              reportTopics.some((rt) => rt.includes(t) || t.includes(rt)),
            ) ||
            lowerTopics.some(
              (t) =>
                r.observation.toLowerCase().includes(t) ||
                r.source.toLowerCase().includes(t),
            )
          );
        })
        // Sort HIGH urgency first
        .sort((a, b) => {
          const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          return (
            (order[a.urgency as keyof typeof order] ?? 2) -
            (order[b.urgency as keyof typeof order] ?? 2)
          );
        })
        .slice(0, 5);

      if (relevant.length === 0) {
        return JSON.stringify({
          ok: true,
          count: 0,
          message: "No competitor intelligence found for these topics in the lookback window.",
          reports: [],
        });
      }

      const saturation = relevant.filter((r) => r.reportType === "NARRATIVE_SATURATION");
      const compliance = relevant.filter((r) => r.reportType === "MISLEADING_CONTENT");

      return JSON.stringify({
        ok: true,
        count: relevant.length,
        saturation_alerts: saturation.length,
        compliance_flags: compliance.length,
        // Concise summary for the EIC to reason over
        summary:
          saturation.length > 0
            ? `NARRATIVE SATURATED — ${saturation.length} outlet(s) already covering this: ${saturation.map((r) => r.source).join(", ")}.`
            : compliance.length > 0
            ? `COMPLIANCE FLAG — competitor content on this topic flagged as irresponsible.`
            : `${relevant.length} competitor intelligence report(s) found. No saturation alerts.`,
        reports: relevant.map((r) => ({
          id: r.id,
          type: r.reportType,
          source: r.source,
          observation: r.observation,
          editorial_opportunity: r.editorialOpportunity,
          urgency: r.urgency,
          recommended_action: r.recommendedAction,
          compliance_note: r.complianceNote,
          topics: r.topics,
          engagement_summary: r.engagementSummary,
          age_hours: Math.round(
            (Date.now() - r.createdAt.getTime()) / 3_600_000,
          ),
        })),
      });
    } catch (err) {
      return JSON.stringify({
        ok: false,
        error: `Failed to query competitor context: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  },
  {
    name: "checkCompetitorContext",
    description:
      "Query recent competitor intelligence reports relevant to a story topic. " +
      "Call this before approving a story to check: (1) is this narrative already saturated across competitors? " +
      "(2) are there compliance flags on this topic from competitor content? " +
      "(3) is there an editorial opportunity to counter or differentiate? " +
      "Returns a summary and up to 5 relevant reports sorted by urgency.",
    schema: z.object({
      topics: z
        .array(z.string())
        .describe(
          "Topic keywords from the story you are evaluating — e.g. ['BTC', 'ETF', 'price prediction']. " +
          "Used to match against competitor reports. Pass 2–5 keywords.",
        ),
      lookback_days: z
        .number()
        .int()
        .min(1)
        .max(30)
        .default(7)
        .describe("How many days of competitor reports to consider (default 7)."),
      report_types: z
        .array(
          z.enum([
            "BREAKING_GAP",
            "NARRATIVE_SATURATION",
            "BEGINNER_GAP",
            "MISLEADING_CONTENT",
            "FORMAT_TREND",
            "GENERAL_INTELLIGENCE",
          ]),
        )
        .optional()
        .describe(
          "Filter to specific report types. Omit to return all types. " +
          "Use ['NARRATIVE_SATURATION', 'MISLEADING_CONTENT'] for a quick compliance + saturation check.",
        ),
    }),
  },
);
