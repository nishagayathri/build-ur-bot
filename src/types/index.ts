// ─── Auth & Account Types ───────────────────────────────────────────────────

export type MemberRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

export type SocialPlatform =
  | "X" | "INSTAGRAM" | "LINKEDIN" | "TIKTOK"
  | "YOUTUBE" | "THREADS" | "REDDIT" | "TELEGRAM";

export type SkillType =
  | "TECHNICAL_ANALYSIS" | "NEWS_MONITORING" | "ECONOMIC_CALENDAR"
  | "EARNINGS_CALENDAR" | "SOCIAL_SENTIMENT"
  | "REGULATORY_MONITOR" | "THREAD_CREATION" | "CHART_GENERATION"
  | "MEME_CONTENT"
  | "AUTO_REPLY" | "COMPETITOR_TRACKING" | "TREND_SURFACING";

export interface AccountDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  onboarding_step: number;
  onboarding_complete: boolean;
  created_at: string;
  members: AccountMemberInfo[];
  social_connections: SocialConnectionInfo[];
  profile: AccountProfileData | null;
  skill_configs: AccountSkillConfigData[];
}

export interface AccountMemberInfo {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  role: MemberRole;
  accepted_at: string | null;
}

export interface SocialConnectionInfo {
  id: string;
  platform: SocialPlatform;
  handle: string;
  display_name: string | null;
  connected: boolean;
  connected_at: string | null;
}

export interface AccountProfileData {
  // Identity & Positioning
  markets: string[];
  target_audience: string;
  secondary_audience: string | null;
  editorial_angle: string;
  brand_name: string | null;
  brand_website: string | null;
  brand_one_liner: string | null;

  // Voice & Tone
  voice_personality: string;
  secondary_voice: string | null;
  tone_formal: number;
  tone_seriousness: number;
  tone_provocativeness: number;
  tone_technical: number;
  admired_accounts: string[];
  always_use_terms: string[];
  never_use_terms: string[];

  // Content Strategy
  content_goals: string[];
  content_mix: Record<string, number>;
  reaction_speed: string;
  preposition_enabled: boolean;
  sentiment_arb_enabled: boolean;

  // Compliance & Guardrails
  is_regulated: boolean;
  regulatory_jurisdiction: string | null;
  required_disclaimers: string[];
  off_limits_topics: string[];
  prediction_sensitivity: string;
  approval_requirement: string;

  // Intelligence Triggers
  trigger_thresholds: Record<string, number>;
}

export interface AccountSkillConfigData {
  id: string;
  skill_type: SkillType;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface AccountInviteInfo {
  id: string;
  email: string;
  role: MemberRole;
  expires_at: string;
  accepted_at: string | null;
}

// ─── Story & Pipeline Types ─────────────────────────────────────────────────

export type StoryStatus =
  | "DETECTED" | "RANKED" | "EIC_APPROVED" | "WRITING"
  | "REVISION" | "HUMAN_REVIEW"
  | "SCHEDULED" | "PUBLISHED" | "REJECTED" | "KILLED";

export type StoryPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type SignalSource =
  | "PRICE" | "NEWS" | "EARNINGS"
  | "ECONOMIC_CALENDAR" | "SOCIAL_TREND" | "DERIV_KNOWLEDGE";

export type EntityType = "FOREX" | "CRYPTO" | "INDEX" | "EQUITY" | "COMMODITY";

export interface Signal {
  source: SignalSource;
  value: string;
  confidence: number;
  timestamp: string;
}

export interface AuditEntry {
  timestamp: string;
  agent: string;
  action: string;
  metadata?: Record<string, string>;
}

export interface StoryPerformance {
  impressions: number;
  engagements: number;
  clicks: number;
  retweets: number;
}

export interface StoryObject {
  story_id: string;
  status: StoryStatus;
  priority: StoryPriority;
  entity: string;
  entity_type: EntityType;
  headline: string;
  signals_stacked: Signal[];
  stacking_score: number;
  eic_directive: string | null;
  assigned_persona: string | null;
  draft_content: string | null;
  scheduled_time: string | null;
  published_url: string | null;
  performance: StoryPerformance | null;
  audit_trail: AuditEntry[];
  created_at: string;
  updated_at: string;
  is_prepositioned: boolean;
  sentiment_arbitrage: boolean;
  virality_score: number | null;
  /** Latest agent run status for this story (populated when status is WRITING/REVISION) */
  agent_run_status?: "RUNNING" | "COMPLETED" | "FAILED" | null;
}

export type AgentStatus = "ACTIVE" | "IDLE" | "BUSY" | "PAUSED" | "ERROR";
export type AgentDesk = "DATA_DESK" | "CONTENT_DESK" | "ENGAGEMENT_DESK" | "EIC";

export interface AgentConfig {
  agent_id: string;
  name: string;
  desk: AgentDesk;
  role: string;
  status: AgentStatus;
  model: string;
  adapter_type: "process" | "http";
  current_task: string | null;
  last_action: string | null;
  last_action_at: string | null;
  budget_monthly_usd: number;
  spent_monthly_usd: number;
  cost_per_output: number;
  outputs_today: number;
  instruments_watched: string[];
  tool_names: string[];
  assigned_persona: string | null;
  enabled: boolean;
  adapter_config: Record<string, unknown>;
  system_prompt: string;
  system_prompt_is_override: boolean;
}

// ─── Agent Run Types ────────────────────────────────────────────────────────

export interface AgentRunStep {
  id: string;
  node_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  started_at: string;
  ended_at: string | null;
}

export interface AgentToolInvocation {
  id: string;
  tool_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface AgentRunResult {
  id: string;
  agent_id: string;
  story_id: string | null;
  status: string;
  graph_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  token_count: number | null;
  cost_usd: number | null;
  started_at: string;
  completed_at: string | null;
  steps: AgentRunStep[];
  tool_invocations: AgentToolInvocation[];
}

// ─── Event Types ────────────────────────────────────────────────────────────

export type EventType =
  | "SIGNAL_DETECTED" | "STORY_CREATED" | "EIC_DECISION"
  | "WRITER_ASSIGNED" | "DRAFT_COMPLETE"
  | "HUMAN_REVIEW_REQUIRED" | "POST_SCHEDULED"
  | "POST_PUBLISHED" | "BUDGET_WARNING" | "TREND_ALERT"
  | "PREPOSITION_ARMED"
  | "SENTIMENT_ARBITRAGE_DETECTED" | "HYPE_ALERT";

export interface BusEvent {
  event_id: string;
  type: EventType;
  agent: string;
  message: string;
  story_id: string | null;
  timestamp: string;
  priority: "HIGH" | "NORMAL" | "LOW";
}

export interface AccountPersona {
  persona_id: string;
  account_handle: string;
  platform: "X" | "INSTAGRAM" | "LINKEDIN";
  display_name: string;
  voice: string;
  avatar_color: string;
  topic_weights: {
    market_analysis: number;
    deriv_promo: number;
    macro_commentary: number;
    engagement: number;
  };
  max_posts_per_day: number;
  posts_today: number;
  performance_7d: {
    avg_impressions: number;
    avg_engagements: number;
    best_post_type: string;
  };
  off_limits_topics: string[];
  posting_hours: { start: number; end: number };
}

export interface MarketSignal {
  signal_id: string;
  asset: string;
  entity_type: EntityType;
  price_change_pct: number;
  volume_vs_avg: number;
  story_potential_score: number;
  agent_interpretation: string;
  timestamp: string;
}

export interface NewsSignal {
  signal_id: string;
  source: string;
  headline: string;
  relevance_score: number;
  has_deriv_angle: boolean;
  deriv_angle_label: string | null;
  timestamp: string;
}

export interface TrendSignal {
  signal_id: string;
  topic: string;
  volume: number;
  velocity: "ACCELERATING" | "STABLE" | "FADING";
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" | "MIXED";
  opportunity_flagged: boolean;
  timestamp: string;
}

export interface EconomicEvent {
  event_id: string;
  time: string;
  name: string;
  impact: "LOW" | "MEDIUM" | "HIGH";
  status: "UPCOMING" | "RELEASED";
  actual: string | null;
  expected: string | null;
}

export interface EarningsEvent {
  event_id: string;
  symbol: string;
  report_date: string;
  eps_estimate: number | null;
  eps_actual: number | null;
  revenue_estimate: number | null;
  revenue_actual: number | null;
  status: "UPCOMING" | "REPORTED";
  timestamp: string;
}

export interface InsiderTrade {
  trade_id: string;
  symbol: string;
  filing_date: string;
  transaction_date: string;
  reporting_name: string;
  type_of_owner: string;
  transaction_type: string;
  securities_transacted: number;
  price: number;
  security_name: string;
  url: string | null;
  timestamp: string;
}

export type CompetitorReportType =
  | "BREAKING_GAP"
  | "NARRATIVE_SATURATION"
  | "BEGINNER_GAP"
  | "MISLEADING_CONTENT"
  | "FORMAT_TREND"
  | "GENERAL_INTELLIGENCE";

export interface CompetitorEngagementSummary {
  total_posts: number;
  total_likes: number;
  total_views: number | null;
  total_comments: number;
  avg_likes_per_post: number;
  top_post: {
    text: string;
    url: string | null;
    likes: number;
    views: number | null;
  };
}

export interface CompetitorReport {
  id: string;
  report_type: CompetitorReportType;
  source: string;
  observation: string;
  editorial_opportunity: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  recommended_action: "COVER_NOW" | "COUNTER_NARRATIVE" | "MONITOR" | "IGNORE";
  compliance_note: string | null;
  topics: string[];
  engagement_summary: CompetitorEngagementSummary | null;
  created_at: string;
  agent_id: string;
}

export interface EngagementSignal {
  signal_id: string;
  platform: "X" | "INSTAGRAM" | "LINKEDIN" | "REDDIT";
  type: "MENTION" | "REPLY_NEEDED" | "HYPE_ALERT" | "RISK_FLAGGED";
  handle: string;
  content: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  agent_action: string | null;
  timestamp: string;
}

