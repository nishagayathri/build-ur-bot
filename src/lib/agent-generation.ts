/**
 * Agent auto-generation logic.
 *
 * Given an account's profile, social connections, and skill configs,
 * produces the full set of Agent and Persona records to create.
 */

import type { SkillType, SocialPlatform } from "@/types";
import {
  buildEicPrompt,
  buildWriterPrompt,
  buildDataDeskPrompt,
} from "./prompt-builders";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProfileInput {
  markets: string[];
  targetAudience: string;
  editorialAngle: string;
  brandName?: string | null;
  brandOneLiner?: string | null;
  voicePersonality: string;
  secondaryVoice?: string | null;
  toneFormal: number;
  toneSeriousness: number;
  toneProvocativeness: number;
  toneTechnical: number;
  alwaysUseTerms: string[];
  neverUseTerms: string[];
  contentGoals: string[];
  contentMix: Record<string, number>;
  reactionSpeed: string;
  isRegulated: boolean;
  regulatoryJurisdiction?: string | null;
  requiredDisclaimers: string[];
  offLimitsTopics: string[];
  predictionSensitivity: string;
  approvalRequirement: string;
  triggerThresholds: Record<string, number>;
  prepositionEnabled: boolean;
  sentimentArbEnabled: boolean;
}

interface ConnectionInput {
  platform: SocialPlatform;
  handle: string;
  displayName?: string | null;
}

interface SkillInput {
  skillType: SkillType;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface AgentSpec {
  id: string;
  name: string;
  desk: "EIC" | "DATA_DESK" | "CONTENT_DESK" | "ENGAGEMENT_DESK";
  role: string;
  model: string;
  adapterType: string;
  budgetMonthlyUsd: number;
  costPerOutput: number;
  instrumentsWatched: string[];
  assignedPersona: string | null;
  heartbeatCron: string | null;
  systemPrompt: string;
}

export interface PersonaSpec {
  id: string;
  accountHandle: string;
  platform: string;
  displayName: string;
  voice: string;
  avatarColor: string;
  topicWeights: Record<string, number>;
  maxPostsPerDay: number;
  postingHours: { start: number; end: number };
  offLimitsTopics: string[];
  performance7d: Record<string, number | string>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
  "#3b82f6", "#6366f1",
];

const MARKET_TO_INSTRUMENTS: Record<string, string[]> = {
  FOREX: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF"],
  CRYPTO: ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"],
  EQUITIES: ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"],
  INDICES: ["SPX", "NDX", "DJI", "FTSE", "DAX", "N225"],
  COMMODITIES: ["XAUUSD", "XAGUSD", "CL", "NG"],
  DERIVATIVES: ["VIX", "ES", "NQ"],
  OPTIONS: ["SPX_OPTIONS", "VIX_OPTIONS"],
  "BONDS/FIXED_INCOME": ["US10Y", "US2Y", "DE10Y"],
};

const HEARTBEAT_MAP: Record<string, string> = {
  IMMEDIATE: "*/1 * * * *",   // every minute
  FAST: "*/5 * * * *",        // every 5 minutes
  MEASURED: "*/15 * * * *",   // every 15 minutes
  NEXT_WINDOW: "*/30 * * * *", // every 30 minutes
};

const SKILL_TO_AGENT: Record<string, { name: string; role: string; focus: string }> = {
  TECHNICAL_ANALYSIS: {
    name: "Market Agent",
    role: "Technical analysis, chart patterns, price action monitoring",
    focus: "technical analysis and price action",
  },
  NEWS_MONITORING: {
    name: "News Agent",
    role: "News monitoring, headline analysis, source aggregation",
    focus: "news and headline monitoring",
  },
  ECONOMIC_CALENDAR: {
    name: "Calendar Agent",
    role: "Economic calendar tracking, event impact assessment",
    focus: "economic calendar and macro events",
  },
  EARNINGS_CALENDAR: {
    name: "Earnings Agent",
    role: "Earnings tracking, revenue/EPS analysis, guidance monitoring",
    focus: "earnings releases and corporate events",
  },
  SOCIAL_SENTIMENT: {
    name: "Social Trend Agent",
    role: "Social media sentiment tracking, trend detection",
    focus: "social media sentiment and trend detection",
  },
  REGULATORY_MONITOR: {
    name: "Regulatory Agent",
    role: "Regulatory filing monitoring, compliance alert detection",
    focus: "regulatory filings and compliance developments",
  },
};

const ENGAGEMENT_SKILL_TO_AGENT: Record<string, { name: string; role: string }> = {
  TREND_SURFACING: {
    name: "Trend Watcher",
    role: "Trend identification, volume monitoring, opportunity flagging",
  },
  AUTO_REPLY: {
    name: "Reply Agent",
    role: "Community engagement, reply management, interaction handling",
  },
  COMPETITOR_TRACKING: {
    name: "Competitor Monitor",
    role: "Competitor content tracking, strategy analysis",
  },
};

// ─── Voice personality to voice string ──────────────────────────────────────

const VOICE_STRINGS: Record<string, string> = {
  "Authoritative Expert": "Authoritative, analytical, institutional-grade insight. Confident and data-backed.",
  "Approachable Educator": "Warm, accessible, jargon-free. Makes complex markets feel approachable.",
  "Bold Contrarian": "Provocative, contrarian, challenges consensus. Data-backed hot takes.",
  "Data-Driven Analyst": "Methodical, numbers-first, evidence-based. Lets data tell the story.",
  "Community Insider": "Relatable, trader-speak, in-the-trenches perspective. Friend who knows markets.",
  "Breaking News Reporter": "Fast, punchy, factual. First to report, fastest to update.",
};

// ─── Generator ──────────────────────────────────────────────────────────────

export function generateAgents(
  accountSlug: string,
  profile: ProfileInput,
  connections: ConnectionInput[],
  skills: SkillInput[],
): { agents: AgentSpec[]; personas: PersonaSpec[] } {
  const agents: AgentSpec[] = [];
  const personas: PersonaSpec[] = [];
  const enabledSkills = new Set(skills.filter((s) => s.enabled).map((s) => s.skillType));
  const allInstruments = profile.markets.flatMap(
    (m) => MARKET_TO_INSTRUMENTS[m] ?? []
  );
  const heartbeat = HEARTBEAT_MAP[profile.reactionSpeed] ?? HEARTBEAT_MAP.FAST;

  // ── 1. EIC (always created) ──────────────────────────────────────────────

  agents.push({
    id: `eic-${accountSlug}`,
    name: "Editor-in-Chief",
    desk: "EIC",
    role: "Signal triage, story prioritization, writer assignment, quality enforcement",
    model: "claude-sonnet-4-6",
    adapterType: "process",
    budgetMonthlyUsd: 50,
    costPerOutput: 0.03,
    instrumentsWatched: allInstruments,
    assignedPersona: null,
    heartbeatCron: heartbeat,
    systemPrompt: buildEicPrompt(profile),
  });

  // ── 2. Data Desk agents (per enabled data skill) ─────────────────────────

  for (const [skillType, spec] of Object.entries(SKILL_TO_AGENT)) {
    if (!enabledSkills.has(skillType as SkillType)) continue;

    const skillConfig = skills.find((s) => s.skillType === skillType)?.config ?? {};
    const instruments = (skillConfig.instruments as string[]) ?? allInstruments;

    agents.push({
      id: `data-${skillType.toLowerCase().replace(/_/g, "-")}-${accountSlug}`,
      name: spec.name,
      desk: "DATA_DESK",
      role: spec.role,
      model: "gemini-3.1-flash-lite-preview",
      adapterType: "process",
      budgetMonthlyUsd: 10,
      costPerOutput: 0.005,
      instrumentsWatched: instruments,
      assignedPersona: null,
      heartbeatCron: heartbeat,
      systemPrompt: buildDataDeskPrompt(profile, spec.name, instruments, spec.focus),
    });
  }

  // ── 3. Writers (per connected social platform) ───────────────────────────

  connections.forEach((conn, idx) => {
    const handle = conn.handle.startsWith("@") ? conn.handle : `@${conn.handle}`;
    const personaId = `persona-${conn.platform.toLowerCase()}-${conn.handle.replace("@", "")}-${accountSlug}`;

    // Create writer agent
    agents.push({
      id: `writer-${conn.platform.toLowerCase()}-${conn.handle.replace("@", "")}-${accountSlug}`,
      name: `Writer: ${handle}`,
      desk: "CONTENT_DESK",
      role: `Content writer for ${handle} on ${conn.platform}`,
      model: "claude-sonnet-4-6",
      adapterType: "process",
      budgetMonthlyUsd: 30,
      costPerOutput: 0.03,
      instrumentsWatched: allInstruments,
      assignedPersona: personaId,
      heartbeatCron: null,
      systemPrompt: buildWriterPrompt(profile, handle, conn.platform),
    });

    // Create persona
    const contentMix = profile.contentMix ?? {};
    personas.push({
      id: personaId,
      accountHandle: conn.handle.replace("@", ""),
      platform: conn.platform,
      displayName: conn.displayName ?? conn.handle,
      voice: VOICE_STRINGS[profile.voicePersonality] ?? VOICE_STRINGS["Data-Driven Analyst"],
      avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
      topicWeights: {
        market_analysis: (contentMix.analysis ?? 40) / 100,
        deriv_promo: (contentMix.promotional ?? 10) / 100,
        macro_commentary: (contentMix.news ?? 30) / 100,
        engagement: (contentMix.engagement ?? 20) / 100,
      },
      maxPostsPerDay: 5,
      postingHours: { start: 8, end: 22 },
      offLimitsTopics: profile.offLimitsTopics,
      performance7d: { avg_impressions: 0, avg_engagements: 0, best_post_type: "none" },
    });
  });


  // ── 5. Engagement Desk agents ────────────────────────────────────────────

  for (const [skillType, spec] of Object.entries(ENGAGEMENT_SKILL_TO_AGENT)) {
    if (!enabledSkills.has(skillType as SkillType)) continue;

    agents.push({
      id: `engagement-${skillType.toLowerCase().replace(/_/g, "-")}-${accountSlug}`,
      name: spec.name,
      desk: "ENGAGEMENT_DESK",
      role: spec.role,
      model: "gemini-3.1-flash-lite-preview",
      adapterType: "process",
      budgetMonthlyUsd: 10,
      costPerOutput: 0.005,
      instrumentsWatched: allInstruments.slice(0, 10),
      assignedPersona: null,
      heartbeatCron: heartbeat,
      systemPrompt: "",
    });
  }

  return { agents, personas };
}
