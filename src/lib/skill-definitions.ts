import {
  TrendingUp,
  Newspaper,
  Calendar,
  BarChart3,
  MessageCircle,
  Shield,
  Layers,
  BarChart,
  Smile,
  Reply,
  Eye,
  Flame,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkillConfig {
  skill_type: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface SkillDefinition {
  skill_type: string;
  name: string;
  description: string;
  icon: LucideIcon;
  group: "data_intelligence" | "content_capabilities" | "engagement";
  hasConfig: boolean;
  defaultConfig: Record<string, unknown>;
}

export interface ChipOption {
  label: string;
  value: string;
}

export type SocialPlatform = "X" | "INSTAGRAM" | "LINKEDIN";

export interface CompetitorHandle {
  platform: SocialPlatform;
  handle: string;
}

export interface CompetitorEntry {
  name: string;
  handles: CompetitorHandle[];
}

// ---------------------------------------------------------------------------
// Skill definitions
// ---------------------------------------------------------------------------

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  // Data Intelligence
  {
    skill_type: "technical_analysis",
    name: "Technical Analysis",
    description: "Analyze price action, chart patterns, and key indicators",
    icon: TrendingUp,
    group: "data_intelligence",
    hasConfig: true,
    defaultConfig: { timeframes: ["1h", "4h", "1D"], indicators: ["RSI", "MACD"] },
  },
  {
    skill_type: "news_monitoring",
    name: "News Monitoring",
    description: "Track breaking news and market-moving headlines in real time",
    icon: Newspaper,
    group: "data_intelligence",
    hasConfig: true,
    defaultConfig: { sources: ["Reuters", "Bloomberg", "CoinDesk"], keywords: [] },
  },
  {
    skill_type: "economic_calendar",
    name: "Economic Calendar",
    description: "Monitor scheduled economic events and data releases",
    icon: Calendar,
    group: "data_intelligence",
    hasConfig: true,
    defaultConfig: { economies: ["US", "EU"], min_impact: "MEDIUM" },
  },
  {
    skill_type: "earnings_calendar",
    name: "Earnings Calendar",
    description: "Track upcoming and recent corporate earnings reports",
    icon: BarChart3,
    group: "data_intelligence",
    hasConfig: true,
    defaultConfig: { sectors: ["Technology", "Finance"] },
  },
  {
    skill_type: "social_sentiment",
    name: "Social Sentiment",
    description: "Gauge market mood from social media conversations",
    icon: MessageCircle,
    group: "data_intelligence",
    hasConfig: true,
    defaultConfig: { platforms: ["X", "Reddit"], keywords: [] },
  },
  {
    skill_type: "regulatory_monitor",
    name: "Regulatory Monitor",
    description: "Track regulatory filings, enforcement actions, and policy changes",
    icon: Shield,
    group: "data_intelligence",
    hasConfig: true,
    defaultConfig: { jurisdictions: ["SEC", "CFTC"] },
  },
  // Content Capabilities
  {
    skill_type: "thread_carousel",
    name: "Thread/Carousel Creation",
    description: "Generate engaging social media threads and carousel posts",
    icon: Layers,
    group: "content_capabilities",
    hasConfig: false,
    defaultConfig: {},
  },
  {
    skill_type: "chart_infographic",
    name: "Chart/Infographic Generation",
    description: "Create data visualizations, charts, and infographic assets",
    icon: BarChart,
    group: "content_capabilities",
    hasConfig: false,
    defaultConfig: {},
  },
  {
    skill_type: "meme_engagement",
    name: "Meme/Engagement Content",
    description: "Produce memes, polls, and high-engagement social content",
    icon: Smile,
    group: "content_capabilities",
    hasConfig: false,
    defaultConfig: {},
  },
  // Engagement
  {
    skill_type: "auto_reply",
    name: "Auto-Reply Management",
    description: "Automatically respond to mentions and comments with context-aware replies",
    icon: Reply,
    group: "engagement",
    hasConfig: true,
    defaultConfig: { match_voice_tone: true },
  },
  {
    skill_type: "competitor_tracking",
    name: "Competitor Tracking",
    description: "Monitor competitor accounts for strategy and content insights",
    icon: Eye,
    group: "engagement",
    hasConfig: true,
    defaultConfig: { competitors: [] },
  },
  {
    skill_type: "trend_surfacing",
    name: "Trend Surfacing",
    description: "Identify emerging trends and viral topics before they peak",
    icon: Flame,
    group: "engagement",
    hasConfig: true,
    defaultConfig: { min_volume: 1000 },
  },
];

export const GROUPS: {
  key: SkillDefinition["group"];
  title: string;
  description: string;
}[] = [
  {
    key: "data_intelligence",
    title: "Data Intelligence",
    description: "Sources and signals that power your newsroom's market awareness",
  },
  {
    key: "content_capabilities",
    title: "Content Capabilities",
    description: "Creative formats your AI agents can produce",
  },
  {
    key: "engagement",
    title: "Engagement",
    description: "Automated audience interaction and competitive intelligence",
  },
];

// ---------------------------------------------------------------------------
// Multi-select chip options
// ---------------------------------------------------------------------------

export const TIMEFRAME_OPTIONS: ChipOption[] = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1D", value: "1D" },
];

export const INDICATOR_OPTIONS: ChipOption[] = [
  { label: "RSI", value: "RSI" },
  { label: "MACD", value: "MACD" },
  { label: "Bollinger Bands", value: "Bollinger Bands" },
  { label: "Moving Averages", value: "Moving Averages" },
  { label: "Volume Profile", value: "Volume Profile" },
];

export const ECONOMY_OPTIONS: ChipOption[] = [
  { label: "US", value: "US" },
  { label: "EU", value: "EU" },
  { label: "UK", value: "UK" },
  { label: "Japan", value: "Japan" },
  { label: "China", value: "China" },
  { label: "Australia", value: "Australia" },
];

export const SENTIMENT_PLATFORM_OPTIONS: ChipOption[] = [
  { label: "X", value: "X" },
  { label: "Reddit", value: "Reddit" },
  { label: "Telegram", value: "Telegram" },
];

// ---------------------------------------------------------------------------
// Frontend skill_type → Prisma SkillType enum mapping
// ---------------------------------------------------------------------------

export const SKILL_TYPE_TO_ENUM: Record<string, string> = {
  technical_analysis: "TECHNICAL_ANALYSIS",
  news_monitoring: "NEWS_MONITORING",
  economic_calendar: "ECONOMIC_CALENDAR",
  earnings_calendar: "EARNINGS_CALENDAR",
  social_sentiment: "SOCIAL_SENTIMENT",
  regulatory_monitor: "REGULATORY_MONITOR",
  thread_carousel: "THREAD_CREATION",
  chart_infographic: "CHART_GENERATION",
  meme_engagement: "MEME_CONTENT",
  auto_reply: "AUTO_REPLY",
  competitor_tracking: "COMPETITOR_TRACKING",
  trend_surfacing: "TREND_SURFACING",
};
