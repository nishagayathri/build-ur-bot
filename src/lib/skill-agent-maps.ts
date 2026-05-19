/** Maps SkillType to the data-desk agent it creates. */
export const DATA_SKILL_AGENTS: Record<
  string,
  { name: string; role: string; model: string; toolNames: string[] }
> = {
  TECHNICAL_ANALYSIS: {
    name: "Market Agent",
    role: "technical_analysis",
    model: "gemini-3.1-flash-lite-preview",
    toolNames: ["marketQuote", "marketMovers", "signalStacking", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  },
  NEWS_MONITORING: {
    name: "News Agent",
    role: "news_monitoring",
    model: "gemini-3.1-flash-lite-preview",
    toolNames: ["stockNews", "signalStacking", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  },
  ECONOMIC_CALENDAR: {
    name: "Calendar Agent",
    role: "economic_calendar",
    model: "gemini-3.1-flash-lite-preview",
    toolNames: ["economicCalendar", "signalStacking", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  },
  EARNINGS_CALENDAR: {
    name: "Earnings Agent",
    role: "earnings_calendar",
    model: "gemini-3.1-flash-lite-preview",
    toolNames: ["earningsCalendar", "marketQuote", "signalStacking", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  },
  SOCIAL_SENTIMENT: {
    name: "Social Trend Agent",
    role: "social_sentiment",
    model: "gemini-3.1-flash-lite-preview",
    toolNames: ["stockNews", "signalStacking", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  },
  ON_CHAIN_ANALYTICS: {
    name: "On-Chain Agent",
    role: "on_chain_analytics",
    model: "gemini-3.1-flash-lite-preview",
    toolNames: ["marketQuote", "signalStacking", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  },
  REGULATORY_MONITOR: {
    name: "Regulatory Agent",
    role: "regulatory_monitor",
    model: "gemini-3.1-flash-lite-preview",
    toolNames: ["stockNews", "signalStacking", "pipelineQuery", "pipelineMutate", "budgetCheck"],
  },
};

/** Maps SkillType to the engagement-desk agent it creates. */
export const ENGAGEMENT_SKILL_AGENTS: Record<
  string,
  { name: string; role: string; model: string; toolNames?: string[] }
> = {
  TREND_SURFACING: {
    name: "Trend Watcher",
    role: "trend_surfacing",
    model: "gemini-3.1-flash-lite-preview",
  },
  AUTO_REPLY: {
    name: "Reply Agent",
    role: "auto_reply",
    model: "gemini-3.1-flash-lite-preview",
  },
  COMPETITOR_TRACKING: {
    name: "Competitor Monitor",
    role: "competitor_tracking",
    model: "gemini-3.1-flash-lite-preview",
    toolNames: ["competitorScan", "logCompetitorReport", "pipelineQuery", "budgetCheck"],
  },
};

export const COST_PER_OUTPUT: Record<string, number> = {
  "claude-sonnet-4-6": 0.03,
  "gemini-3.1-flash-lite-preview": 0.005,
};

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
