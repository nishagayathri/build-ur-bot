-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('X', 'INSTAGRAM', 'LINKEDIN', 'TIKTOK', 'YOUTUBE', 'THREADS', 'REDDIT', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "SkillType" AS ENUM ('TECHNICAL_ANALYSIS', 'NEWS_MONITORING', 'ECONOMIC_CALENDAR', 'EARNINGS_CALENDAR', 'SOCIAL_SENTIMENT', 'REGULATORY_MONITOR', 'THREAD_CREATION', 'CHART_GENERATION', 'MEME_CONTENT', 'AUTO_REPLY', 'COMPETITOR_TRACKING', 'TREND_SURFACING');

-- CreateEnum
CREATE TYPE "AgentDesk" AS ENUM ('EIC', 'DATA_DESK', 'CONTENT_DESK', 'ENGAGEMENT_DESK');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ACTIVE', 'IDLE', 'BUSY', 'PAUSED', 'ERROR');

-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('DETECTED', 'RANKED', 'EIC_APPROVED', 'WRITING', 'REVISION', 'HUMAN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'REJECTED', 'KILLED');

-- CreateEnum
CREATE TYPE "StoryPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('FOREX', 'CRYPTO', 'INDEX', 'EQUITY', 'COMMODITY');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('SIGNAL_DETECTED', 'STORY_CREATED', 'EIC_DECISION', 'WRITER_ASSIGNED', 'DRAFT_COMPLETE', 'HUMAN_REVIEW_REQUIRED', 'POST_SCHEDULED', 'POST_PUBLISHED', 'BUDGET_WARNING', 'TREND_ALERT', 'PREPOSITION_ARMED', 'SENTIMENT_ARBITRAGE_DETECTED', 'HYPE_ALERT');

-- CreateEnum
CREATE TYPE "EventPriority" AS ENUM ('HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('X', 'INSTAGRAM', 'LINKEDIN', 'TIKTOK', 'YOUTUBE', 'THREADS', 'REDDIT', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "Velocity" AS ENUM ('ACCELERATING', 'STABLE', 'FADING');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('BULLISH', 'BEARISH', 'NEUTRAL', 'MIXED');

-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "EconomicEventStatus" AS ENUM ('UPCOMING', 'RELEASED');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('system', 'human', 'ai', 'tool');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('user', 'eic');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "onboarding_step" INTEGER NOT NULL DEFAULT 1,
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'VIEWER',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "account_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'VIEWER',
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_connections" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "handle" TEXT NOT NULL,
    "display_name" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "connected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_profiles" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "markets" TEXT[],
    "target_audience" TEXT NOT NULL,
    "secondary_audience" TEXT,
    "editorial_angle" TEXT NOT NULL,
    "brand_name" TEXT,
    "brand_website" TEXT,
    "brand_one_liner" TEXT,
    "voice_personality" TEXT NOT NULL,
    "secondary_voice" TEXT,
    "tone_formal" INTEGER NOT NULL DEFAULT 5,
    "tone_seriousness" INTEGER NOT NULL DEFAULT 5,
    "tone_provocativeness" INTEGER NOT NULL DEFAULT 3,
    "tone_technical" INTEGER NOT NULL DEFAULT 5,
    "admired_accounts" TEXT[],
    "always_use_terms" TEXT[],
    "never_use_terms" TEXT[],
    "content_goals" JSONB NOT NULL,
    "content_mix" JSONB NOT NULL,
    "reaction_speed" TEXT NOT NULL,
    "preposition_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sentiment_arb_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_regulated" BOOLEAN NOT NULL DEFAULT false,
    "regulatory_jurisdiction" TEXT,
    "required_disclaimers" TEXT[],
    "off_limits_topics" TEXT[],
    "prediction_sensitivity" TEXT NOT NULL DEFAULT 'MODERATE',
    "approval_requirement" TEXT NOT NULL DEFAULT 'ALL',
    "trigger_thresholds" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_skill_configs" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "skill_type" "SkillType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_skill_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "agent_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "desk" "AgentDesk" NOT NULL,
    "role" TEXT NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'IDLE',
    "model" TEXT NOT NULL,
    "adapter_type" TEXT NOT NULL,
    "current_task" TEXT,
    "last_action" TEXT,
    "last_action_at" TIMESTAMP(3),
    "budget_monthly_usd" DOUBLE PRECISION NOT NULL,
    "spent_monthly_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost_per_output" DOUBLE PRECISION NOT NULL,
    "outputs_today" INTEGER NOT NULL DEFAULT 0,
    "instruments_watched" TEXT[],
    "assigned_persona" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "adapter_config" JSONB NOT NULL DEFAULT '{}',
    "heartbeat_cron" TEXT,
    "system_prompt_override" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("agent_id")
);

-- CreateTable
CREATE TABLE "stories" (
    "story_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "status" "StoryStatus" NOT NULL DEFAULT 'DETECTED',
    "priority" "StoryPriority" NOT NULL DEFAULT 'MEDIUM',
    "entity" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "headline" TEXT NOT NULL,
    "signals_stacked" JSONB NOT NULL DEFAULT '[]',
    "stacking_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eic_directive" TEXT,
    "assigned_persona" TEXT,
    "draft_content" TEXT,
    "scheduled_time" TIMESTAMP(3),
    "published_url" TEXT,
    "performance" JSONB,
    "audit_trail" JSONB NOT NULL DEFAULT '[]',
    "is_prepositioned" BOOLEAN NOT NULL DEFAULT false,
    "sentiment_arbitrage" BOOLEAN NOT NULL DEFAULT false,
    "virality_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("story_id")
);

-- CreateTable
CREATE TABLE "personas" (
    "persona_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "account_handle" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "display_name" TEXT NOT NULL,
    "voice" TEXT NOT NULL,
    "avatar_color" TEXT NOT NULL,
    "topic_weights" JSONB NOT NULL,
    "max_posts_per_day" INTEGER NOT NULL,
    "posts_today" INTEGER NOT NULL DEFAULT 0,
    "performance_7d" JSONB NOT NULL,
    "off_limits_topics" TEXT[],
    "posting_hours" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("persona_id")
);

-- CreateTable
CREATE TABLE "bus_events" (
    "event_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "agent" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "story_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" "EventPriority" NOT NULL DEFAULT 'NORMAL',

    CONSTRAINT "bus_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "market_signals" (
    "signal_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "price_change_pct" DOUBLE PRECISION NOT NULL,
    "volume_vs_avg" DOUBLE PRECISION NOT NULL,
    "story_potential_score" DOUBLE PRECISION NOT NULL,
    "agent_interpretation" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_signals_pkey" PRIMARY KEY ("signal_id")
);

-- CreateTable
CREATE TABLE "news_signals" (
    "signal_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "relevance_score" DOUBLE PRECISION NOT NULL,
    "has_deriv_angle" BOOLEAN NOT NULL,
    "deriv_angle_label" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_signals_pkey" PRIMARY KEY ("signal_id")
);

-- CreateTable
CREATE TABLE "trend_signals" (
    "signal_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "volume" INTEGER NOT NULL,
    "velocity" "Velocity" NOT NULL,
    "sentiment" "Sentiment" NOT NULL,
    "opportunity_flagged" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trend_signals_pkey" PRIMARY KEY ("signal_id")
);

-- CreateTable
CREATE TABLE "economic_events" (
    "event_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "impact" "ImpactLevel" NOT NULL,
    "status" "EconomicEventStatus" NOT NULL,
    "actual" TEXT,
    "expected" TEXT,

    CONSTRAINT "economic_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "agent_runs" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "story_id" TEXT,
    "status" "RunStatus" NOT NULL DEFAULT 'RUNNING',
    "graph_name" TEXT NOT NULL,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB,
    "error" TEXT,
    "token_count" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "agent_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_steps" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "node_name" TEXT NOT NULL,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "agent_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tool_invocations" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "tool_invocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_messages" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_slug_key" ON "accounts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "account_members_user_id_account_id_key" ON "account_members"("user_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_invites_token_key" ON "account_invites"("token");

-- CreateIndex
CREATE INDEX "account_invites_token_idx" ON "account_invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "social_connections_account_id_platform_handle_key" ON "social_connections"("account_id", "platform", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "account_profiles_account_id_key" ON "account_profiles"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_skill_configs_account_id_skill_type_key" ON "account_skill_configs"("account_id", "skill_type");

-- CreateIndex
CREATE INDEX "agents_account_id_idx" ON "agents"("account_id");

-- CreateIndex
CREATE INDEX "stories_account_id_idx" ON "stories"("account_id");

-- CreateIndex
CREATE INDEX "personas_account_id_idx" ON "personas"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "personas_account_id_account_handle_key" ON "personas"("account_id", "account_handle");

-- CreateIndex
CREATE INDEX "bus_events_account_id_idx" ON "bus_events"("account_id");

-- CreateIndex
CREATE INDEX "bus_events_story_id_idx" ON "bus_events"("story_id");

-- CreateIndex
CREATE INDEX "bus_events_timestamp_idx" ON "bus_events"("timestamp");

-- CreateIndex
CREATE INDEX "market_signals_account_id_idx" ON "market_signals"("account_id");

-- CreateIndex
CREATE INDEX "market_signals_timestamp_idx" ON "market_signals"("timestamp");

-- CreateIndex
CREATE INDEX "news_signals_account_id_idx" ON "news_signals"("account_id");

-- CreateIndex
CREATE INDEX "news_signals_timestamp_idx" ON "news_signals"("timestamp");

-- CreateIndex
CREATE INDEX "trend_signals_account_id_idx" ON "trend_signals"("account_id");

-- CreateIndex
CREATE INDEX "trend_signals_timestamp_idx" ON "trend_signals"("timestamp");

-- CreateIndex
CREATE INDEX "economic_events_account_id_idx" ON "economic_events"("account_id");

-- CreateIndex
CREATE INDEX "economic_events_time_idx" ON "economic_events"("time");

-- CreateIndex
CREATE INDEX "agent_runs_agent_id_idx" ON "agent_runs"("agent_id");

-- CreateIndex
CREATE INDEX "agent_runs_story_id_idx" ON "agent_runs"("story_id");

-- CreateIndex
CREATE INDEX "agent_steps_run_id_idx" ON "agent_steps"("run_id");

-- CreateIndex
CREATE INDEX "tool_invocations_run_id_idx" ON "tool_invocations"("run_id");

-- CreateIndex
CREATE INDEX "agent_messages_account_id_idx" ON "agent_messages"("account_id");

-- CreateIndex
CREATE INDEX "agent_messages_agent_id_created_at_idx" ON "agent_messages"("agent_id", "created_at");

-- CreateIndex
CREATE INDEX "chat_messages_account_id_idx" ON "chat_messages"("account_id");

-- CreateIndex
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages"("created_at");

-- AddForeignKey
ALTER TABLE "account_members" ADD CONSTRAINT "account_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_members" ADD CONSTRAINT "account_members_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_invites" ADD CONSTRAINT "account_invites_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_profiles" ADD CONSTRAINT "account_profiles_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_skill_configs" ADD CONSTRAINT "account_skill_configs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_events" ADD CONSTRAINT "bus_events_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_events" ADD CONSTRAINT "bus_events_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("story_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_signals" ADD CONSTRAINT "market_signals_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_signals" ADD CONSTRAINT "news_signals_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trend_signals" ADD CONSTRAINT "trend_signals_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "economic_events" ADD CONSTRAINT "economic_events_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("agent_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_steps" ADD CONSTRAINT "agent_steps_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tool_invocations" ADD CONSTRAINT "tool_invocations_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "agent_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("agent_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
