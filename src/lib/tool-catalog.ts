import type { AgentDesk } from "@/types";

export interface ToolMeta {
  name: string;
  label: string;
  description: string;
  source: "fmp" | "internal" | "scrape-creators";
}

const TOOL_CATALOG: Record<string, ToolMeta> = {
  pipelineQuery: {
    name: "pipelineQuery",
    label: "Pipeline Query",
    description: "Query the story pipeline by status, entity, or priority",
    source: "internal",
  },
  pipelineMutate: {
    name: "pipelineMutate",
    label: "Pipeline Mutate",
    description: "Create stories, update status, and assign personas",
    source: "internal",
  },
  signalStacking: {
    name: "signalStacking",
    label: "Signal Stacking",
    description: "Compute composite signal stacking scores",
    source: "internal",
  },
  personaLookup: {
    name: "personaLookup",
    label: "Persona Lookup",
    description: "Fetch persona configs and posting capacity",
    source: "internal",
  },
  budgetCheck: {
    name: "budgetCheck",
    label: "Budget Check",
    description: "Monitor agent spend and remaining budget",
    source: "internal",
  },
  contentGenerate: {
    name: "contentGenerate",
    label: "Content Generate",
    description: "Assemble content prompt templates for drafting",
    source: "internal",
  },
  marketQuote: {
    name: "marketQuote",
    label: "Market Quote",
    description: "Real-time price quotes across all asset classes",
    source: "fmp",
  },
  stockNews: {
    name: "stockNews",
    label: "Stock News",
    description: "Latest market news and headlines",
    source: "fmp",
  },
  economicCalendar: {
    name: "economicCalendar",
    label: "Economic Calendar",
    description: "Upcoming and recent macro events (CPI, NFP, PMI)",
    source: "fmp",
  },
  marketMovers: {
    name: "marketMovers",
    label: "Market Movers",
    description: "Top gainers, losers, and most actively traded",
    source: "fmp",
  },
  competitorScan: {
    name: "competitorScan",
    label: "Competitor Scan",
    description: "Scan competitor social accounts for recent posts and engagement via Scrape Creators",
    source: "scrape-creators",
  },
  logCompetitorReport: {
    name: "logCompetitorReport",
    label: "Log Competitor Report",
    description: "Write a structured competitor intelligence report to the database",
    source: "internal",
  },
  checkCompetitorContext: {
    name: "checkCompetitorContext",
    label: "Competitor Context",
    description: "Query competitor intelligence reports by topic before making coverage decisions",
    source: "internal",
  },
};

/**
 * Maps each desk to its tool names — mirrors the runtime registry
 * in src/agents/tools/registry.ts without importing LangChain deps.
 */
const DESK_TOOLS: Record<AgentDesk, string[]> = {
  EIC: [
    "pipelineQuery",
    "pipelineMutate",
    "signalStacking",
    "personaLookup",
    "budgetCheck",
  ],
  DATA_DESK: [
    "pipelineQuery",
    "marketQuote",
    "stockNews",
    "economicCalendar",
    "marketMovers",
    "budgetCheck",
  ],
  CONTENT_DESK: [
    "pipelineQuery",
    "pipelineMutate",
    "contentGenerate",
    "personaLookup",
    "budgetCheck",
  ],
  ENGAGEMENT_DESK: ["pipelineQuery", "budgetCheck"],
};

export function getToolsForDesk(desk: AgentDesk): ToolMeta[] {
  const names = DESK_TOOLS[desk] ?? DESK_TOOLS.ENGAGEMENT_DESK;
  return names.map((n) => TOOL_CATALOG[n]).filter(Boolean);
}

export function getToolsForNames(toolNames: string[]): ToolMeta[] {
  return toolNames.map((n) => TOOL_CATALOG[n]).filter(Boolean);
}

export function hasFmpTools(desk: AgentDesk): boolean {
  return getToolsForDesk(desk).some((t) => t.source === "fmp");
}
