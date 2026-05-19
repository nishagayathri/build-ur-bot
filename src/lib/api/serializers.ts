import type {
  Agent,
  Story,
  Persona,
  BusEvent as PrismaBusEvent,
  MarketSignal as PrismaMarketSignal,
  NewsSignal as PrismaNewsSignal,
  TrendSignal as PrismaTrendSignal,
  EconomicEvent as PrismaEconomicEvent,
  AgentRun as PrismaAgentRun,
  AgentStep as PrismaAgentStep,
  ToolInvocation as PrismaToolInvocation,
  EarningsEvent as PrismaEarningsEvent,
  InsiderTrade as PrismaInsiderTrade,
} from "@/generated/prisma";
import type {
  AgentConfig,
  StoryObject,
  AccountPersona,
  BusEvent,
  MarketSignal,
  NewsSignal,
  TrendSignal,
  EconomicEvent,
  EarningsEvent,
  InsiderTrade,
  Signal,
  AuditEntry,
  StoryPerformance,
} from "@/types";
import { EIC_SYSTEM_PROMPT } from "@/agents/prompts/eic-system";
import { getDataDeskSystemPrompt } from "@/agents/prompts/data-desk-system";
import { getWriterSystemPrompt } from "@/agents/prompts/writer-system";
import { getCompetitorMonitorSystemPrompt } from "@/agents/prompts/competitor-monitor-system";

function resolveSystemPrompt(agent: Agent): string {
  if (agent.systemPromptOverride) {
    const instrumentsList = agent.instrumentsWatched.join(", ") || "all instruments";
    return agent.systemPromptOverride.replace(/\{\{instruments\}\}/g, instrumentsList);
  }

  switch (agent.desk) {
    case "EIC":
      return EIC_SYSTEM_PROMPT;
    case "DATA_DESK":
      return getDataDeskSystemPrompt(agent.name, agent.instrumentsWatched);
    case "CONTENT_DESK":
      return getWriterSystemPrompt(
        agent.assignedPersona ?? agent.name,
        "Default voice — professional, clear, and analytical.",
        [],
      );
    case "ENGAGEMENT_DESK":
      if (agent.role === "competitor_tracking") {
        const config = (agent.adapterConfig ?? {}) as Record<string, unknown>;
        // Prefer new structured format, fall back to legacy flat handles
        const competitors =
          (config.competitors as unknown[]) ??
          (config.competitor_handles as string[]) ??
          [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return getCompetitorMonitorSystemPrompt(competitors as any);
      }
      return `You are ${agent.name}, an Engagement Desk agent in the Marketary newsroom. You monitor social trends, audience engagement, and community signals to help the newsroom stay connected with its audience.`;
    default:
      return `System prompt for ${agent.name} (${agent.desk})`;
  }
}

export function serializeAgent(agent: Agent): AgentConfig {
  return {
    agent_id: agent.id,
    name: agent.name,
    desk: agent.desk,
    role: agent.role,
    status: agent.status,
    model: agent.model,
    adapter_type: agent.adapterType as "process" | "http",
    current_task: agent.currentTask,
    last_action: agent.lastAction,
    last_action_at: agent.lastActionAt?.toISOString() ?? null,
    budget_monthly_usd: agent.budgetMonthlyUsd,
    spent_monthly_usd: agent.spentMonthlyUsd,
    cost_per_output: agent.costPerOutput,
    outputs_today: agent.outputsToday,
    instruments_watched: agent.instrumentsWatched,
    tool_names: agent.toolNames,
    assigned_persona: agent.assignedPersona,
    enabled: agent.enabled,
    adapter_config: agent.adapterConfig as Record<string, unknown>,
    system_prompt: resolveSystemPrompt(agent),
    system_prompt_is_override: !!agent.systemPromptOverride,
  };
}

export function serializeStory(story: Story): StoryObject {
  return {
    story_id: story.id,
    status: story.status,
    priority: story.priority,
    entity: story.entity,
    entity_type: story.entityType,
    headline: story.headline,
    signals_stacked: (story.signalsStacked as unknown as Signal[]) ?? [],
    stacking_score: story.stackingScore,
    eic_directive: story.eicDirective,
    assigned_persona: story.assignedPersona?.replace(/^@/, '') ?? null,
    draft_content: story.draftContent,
    scheduled_time: story.scheduledTime?.toISOString() ?? null,
    published_url: story.publishedUrl,
    performance:
      (story.performance as unknown as StoryPerformance) ?? null,
    audit_trail: (story.auditTrail as unknown as AuditEntry[]) ?? [],
    created_at: story.createdAt.toISOString(),
    updated_at: story.updatedAt.toISOString(),
    is_prepositioned: story.isPrepositioned,
    sentiment_arbitrage: story.sentimentArbitrage,
    virality_score: story.viralityScore,
  };
}

export function serializePersona(persona: Persona): AccountPersona {
  return {
    persona_id: persona.id,
    account_handle: persona.accountHandle,
    platform: persona.platform as "X" | "INSTAGRAM" | "LINKEDIN",
    display_name: persona.displayName,
    voice: persona.voice,
    avatar_color: persona.avatarColor,
    topic_weights: persona.topicWeights as AccountPersona["topic_weights"],
    max_posts_per_day: persona.maxPostsPerDay,
    posts_today: persona.postsToday,
    performance_7d: persona.performance7d as AccountPersona["performance_7d"],
    off_limits_topics: persona.offLimitsTopics,
    posting_hours: persona.postingHours as { start: number; end: number },
  };
}

export function serializeBusEvent(event: PrismaBusEvent): BusEvent {
  return {
    event_id: event.id,
    type: event.type,
    agent: event.agent,
    message: event.message,
    story_id: event.storyId,
    timestamp: event.timestamp.toISOString(),
    priority: event.priority,
  };
}

export function serializeMarketSignal(
  signal: PrismaMarketSignal
): MarketSignal {
  return {
    signal_id: signal.id,
    asset: signal.asset,
    entity_type: signal.entityType,
    price_change_pct: signal.priceChangePct,
    volume_vs_avg: signal.volumeVsAvg,
    story_potential_score: signal.storyPotentialScore,
    agent_interpretation: signal.agentInterpretation,
    timestamp: signal.timestamp.toISOString(),
  };
}

export function serializeNewsSignal(signal: PrismaNewsSignal): NewsSignal {
  return {
    signal_id: signal.id,
    source: signal.source,
    headline: signal.headline,
    relevance_score: signal.relevanceScore,
    has_deriv_angle: signal.hasDerivAngle,
    deriv_angle_label: signal.derivAngleLabel,
    timestamp: signal.timestamp.toISOString(),
  };
}

export function serializeTrendSignal(signal: PrismaTrendSignal): TrendSignal {
  return {
    signal_id: signal.id,
    topic: signal.topic,
    volume: signal.volume,
    velocity: signal.velocity,
    sentiment: signal.sentiment,
    opportunity_flagged: signal.opportunityFlagged,
    timestamp: signal.timestamp.toISOString(),
  };
}

export function serializeEconomicEvent(
  event: PrismaEconomicEvent
): EconomicEvent {
  return {
    event_id: event.id,
    time: event.time.toISOString(),
    name: event.name,
    impact: event.impact,
    status: event.status,
    actual: event.actual,
    expected: event.expected,
  };
}

export function serializeEarningsEvent(
  event: PrismaEarningsEvent
): EarningsEvent {
  return {
    event_id: event.id,
    symbol: event.symbol,
    report_date: event.reportDate.toISOString(),
    eps_estimate: event.epsEstimate,
    eps_actual: event.epsActual,
    revenue_estimate: event.revenueEstimate,
    revenue_actual: event.revenueActual,
    status: event.status,
    timestamp: event.timestamp.toISOString(),
  };
}

export function serializeInsiderTrade(
  trade: PrismaInsiderTrade
): InsiderTrade {
  return {
    trade_id: trade.id,
    symbol: trade.symbol,
    filing_date: trade.filingDate.toISOString(),
    transaction_date: trade.transactionDate.toISOString(),
    reporting_name: trade.reportingName,
    type_of_owner: trade.typeOfOwner,
    transaction_type: trade.transactionType,
    securities_transacted: trade.securitiesTransacted,
    price: trade.price,
    security_name: trade.securityName,
    url: trade.url,
    timestamp: trade.timestamp.toISOString(),
  };
}

export interface SerializedAgentRun {
  id: string;
  agent_id: string;
  story_id: string | null;
  status: string;
  graph_name: string;
  input: unknown;
  output: unknown;
  error: string | null;
  token_count: number;
  cost_usd: number;
  started_at: string;
  completed_at: string | null;
  steps: { id: string; node_name: string; input: unknown; output: unknown; started_at: string; ended_at: string | null }[];
  tool_invocations: { id: string; tool_name: string; input: unknown; output: unknown; error: string | null; started_at: string; ended_at: string | null }[];
}

type AgentRunWithRelations = PrismaAgentRun & {
  steps?: PrismaAgentStep[];
  tools?: PrismaToolInvocation[];
};

export function serializeAgentRun(run: AgentRunWithRelations): SerializedAgentRun {
  return {
    id: run.id,
    agent_id: run.agentId,
    story_id: run.storyId,
    status: run.status,
    graph_name: run.graphName,
    input: run.input,
    output: run.output,
    error: run.error,
    token_count: run.tokenCount,
    cost_usd: run.costUsd,
    started_at: run.startedAt.toISOString(),
    completed_at: run.completedAt?.toISOString() ?? null,
    steps: (run.steps ?? []).map((s) => ({
      id: s.id,
      node_name: s.nodeName,
      input: s.input,
      output: s.output,
      started_at: s.startedAt.toISOString(),
      ended_at: s.endedAt?.toISOString() ?? null,
    })),
    tool_invocations: (run.tools ?? []).map((t) => ({
      id: t.id,
      tool_name: t.toolName,
      input: t.input,
      output: t.output,
      error: t.error,
      started_at: t.startedAt.toISOString(),
      ended_at: t.endedAt?.toISOString() ?? null,
    })),
  };
}
