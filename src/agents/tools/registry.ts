import type { StructuredToolInterface } from "@langchain/core/tools";
import type { AgentDesk } from "@/types";

import { pipelineQuery } from "./pipeline-query";
import { pipelineMutate } from "./pipeline-mutate";
import { signalStacking } from "./signal-stacking";
import { personaLookup } from "./persona-lookup";
import { budgetCheck } from "./budget-check";
import { contentGenerate } from "./content-generate";
import { marketQuote } from "./market-quote";
import { stockNews } from "./stock-news";
import { economicCalendar } from "./economic-calendar";
import { earningsCalendar } from "./earnings-calendar";
import { marketMovers } from "./market-movers";
import { competitorScan } from "./competitor-scan";
import { logCompetitorReport } from "./log-competitor-report";
import { checkCompetitorContext } from "./check-competitor-context";
import { webSearch } from "./web-search";

const ALL_TOOLS: Record<string, StructuredToolInterface> = {
  pipelineQuery,
  pipelineMutate,
  signalStacking,
  personaLookup,
  budgetCheck,
  contentGenerate,
  marketQuote,
  stockNews,
  economicCalendar,
  earningsCalendar,
  marketMovers,
  competitorScan,
  logCompetitorReport,
  checkCompetitorContext,
  webSearch,
};

/**
 * Returns the set of tools available to a given agent.
 *
 * When the agent has a non-empty toolNames list (stored in DB), those
 * exact tools are returned — principle of least privilege at the agent level.
 * Falls back to desk-wide defaults only for legacy agents without toolNames.
 */
export function getToolsForAgent(
  desk: AgentDesk,
  agentName: string,
  toolNames?: string[],
): StructuredToolInterface[] {
  if (toolNames && toolNames.length > 0) {
    const tools = toolNames.map((n) => ALL_TOOLS[n]).filter(Boolean);
    // Pipeline read is safe to add for all desks.
    // Pipeline write (pipelineMutate) is only auto-added for desks that
    // legitimately create stories — not ENGAGEMENT_DESK, which is
    // intelligence-only and must not create stories autonomously.
    if (!toolNames.includes("pipelineQuery")) tools.push(pipelineQuery);
    if (desk !== "ENGAGEMENT_DESK" && !toolNames.includes("pipelineMutate")) {
      tools.push(pipelineMutate);
    }
    return tools;
  }

  // Fallback for agents that predate per-agent toolNames — give only the
  // minimal safe set so a missing toolNames never silently over-provisions.
  return [pipelineQuery, pipelineMutate, budgetCheck];
}
