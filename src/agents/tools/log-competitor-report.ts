import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAccountId, getAgentId } from "@/agents/runtime/agent-context";

/**
 * Writes a structured competitor intelligence report to the DB.
 *
 * The Competitor Monitor calls this once per insight after analysing
 * competitor posts — NOT once per post. One call = one editorial insight.
 *
 * Reports are later queried by:
 *  - The EIC agent (narrative saturation check before approving stories)
 *  - The competitive intelligence feed in the data room
 */
export const logCompetitorReport = tool(
  async ({
    report_type,
    source,
    observation,
    editorial_opportunity,
    urgency,
    recommended_action,
    compliance_note,
    topics,
    engagement_summary,
  }) => {
    let accountId: string;
    let agentId: string;
    try {
      accountId = getAccountId();
      agentId = getAgentId();
    } catch {
      return JSON.stringify({ ok: false, error: "Account/agent context not set" });
    }

    try {
      const report = await prisma.competitorReport.create({
        data: {
          accountId,
          agentId,
          reportType: report_type,
          source,
          observation,
          editorialOpportunity: editorial_opportunity,
          urgency,
          recommendedAction: recommended_action,
          complianceNote: compliance_note ?? null,
          topics: topics ?? [],
          engagementSummary: engagement_summary ?? undefined,
        },
        select: { id: true, reportType: true, urgency: true, createdAt: true },
      });

      return JSON.stringify({
        ok: true,
        report_id: report.id,
        message: `${report_type} report logged (${urgency} urgency)`,
      });
    } catch (err) {
      return JSON.stringify({
        ok: false,
        error: `Failed to log report: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  },
  {
    name: "logCompetitorReport",
    description:
      "Write a structured competitor intelligence report to the database. " +
      "Call this once per insight — e.g. once when you detect narrative saturation, once for a content gap. " +
      "Do NOT call it once per competitor post. Synthesise first, then log the editorial insight. " +
      "If an insight spans multiple types, pick the single most fitting report_type and make a second call for the other. " +
      "Reports are read by the EIC when making coverage decisions.",
    schema: z.object({
      report_type: z
        .enum([
          "BREAKING_GAP",
          "NARRATIVE_SATURATION",
          "BEGINNER_GAP",
          "MISLEADING_CONTENT",
          "FORMAT_TREND",
          "GENERAL_INTELLIGENCE",
        ])
        .describe(
          "BREAKING_GAP: story competitors have that we haven't covered. " +
          "NARRATIVE_SATURATION: same narrative across 3+ outlets — contrarian opportunity. " +
          "BEGINNER_GAP: competitors underserving the beginner audience. " +
          "MISLEADING_CONTENT: irresponsible content we could address honestly. " +
          "FORMAT_TREND: a content format or style gaining traction. " +
          "GENERAL_INTELLIGENCE: strategic observation that doesn't fit other types.",
        ),
      source: z
        .string()
        .describe("Outlet or creator name and platform, e.g. 'CoinDesk (X)' or '@exness (Instagram)'"),
      observation: z
        .string()
        .describe("Factual description of what you observed. No editorialising — just what you saw."),
      editorial_opportunity: z
        .string()
        .describe("How our newsroom could respond or capitalise on this observation."),
      urgency: z
        .enum(["HIGH", "MEDIUM", "LOW"])
        .describe("HIGH: act within hours. MEDIUM: act this week. LOW: monitor."),
      recommended_action: z
        .enum(["COVER_NOW", "COUNTER_NARRATIVE", "MONITOR", "IGNORE"])
        .describe(
          "COVER_NOW: surface to EIC immediately. " +
          "COUNTER_NARRATIVE: we should publish a contrarian take. " +
          "MONITOR: watch but don't act yet. " +
          "IGNORE: not relevant to our brand.",
        ),
      compliance_note: z
        .string()
        .optional()
        .describe("Flag if the competitor content involves claims we should not replicate."),
      topics: z
        .array(z.string())
        .optional()
        .describe(
          "2–5 topic keywords extracted from this report, e.g. ['BTC', 'ETF', 'price prediction']. " +
          "Used by the EIC to match against story topics when checking narrative saturation.",
        ),
      engagement_summary: z
        .object({
          total_posts: z.number().describe("Total number of posts scanned for this competitor"),
          total_likes: z.number().describe("Sum of likes across all scanned posts"),
          total_views: z.number().nullable().describe("Sum of views/impressions across all scanned posts. Null if unavailable."),
          total_comments: z.number().describe("Sum of comments across all scanned posts"),
          avg_likes_per_post: z.number().describe("Average likes per post"),
          top_post: z.object({
            text: z.string().describe("Caption or text of the highest-engagement post (truncated to 200 chars)"),
            url: z.string().nullable(),
            likes: z.number(),
            views: z.number().nullable(),
          }).describe("The single post with the highest total engagement"),
        })
        .optional()
        .describe(
          "Aggregate engagement metrics computed from the competitorScan results. " +
          "Always include this when you have scan data — it is the quantitative backbone of the report.",
        ),
    }),
  },
);
