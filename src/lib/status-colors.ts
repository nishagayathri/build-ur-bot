import type { StoryStatus, StoryPriority, AgentStatus, EventType } from "@/types";

/**
 * Genesis Design System — Status Colors
 * Uses warm purple-gray palette with illustrated accent colors.
 * No cool grays, no blue-tinted states.
 */

export const storyStatusConfig: Record<
  StoryStatus,
  { label: string; className: string; dotColor: string }
> = {
  DETECTED: {
    label: "Detected",
    className: "bg-[#6AAFE8]/10 text-[#6AAFE8] dark:bg-[#6AAFE8]/15 dark:text-[#6AAFE8]",
    dotColor: "bg-[#6AAFE8]",
  },
  RANKED: {
    label: "Ranked",
    className: "bg-[#9074A1]/10 text-[#9074A1] dark:bg-[#A891B6]/15 dark:text-[#A891B6]",
    dotColor: "bg-[#9074A1]",
  },
  EIC_APPROVED: {
    label: "EIC Approved",
    className: "bg-[#7B618B]/10 text-[#7B618B] dark:bg-[#A891B6]/15 dark:text-[#A891B6]",
    dotColor: "bg-[#7B618B]",
  },
  WRITING: {
    label: "Writing",
    className: "bg-[#4A3B6B]/10 text-[#4A3B6B] dark:bg-[#4A3B6B]/20 dark:text-[#A891B6]",
    dotColor: "bg-[#4A3B6B]",
  },
  REVISION: {
    label: "Revision",
    className: "bg-[#D4A03B]/10 text-[#D4A03B] dark:bg-[#D4A03B]/15 dark:text-[#D4A03B]",
    dotColor: "bg-[#D4A03B]",
  },
  HUMAN_REVIEW: {
    label: "Needs Approval",
    className: "bg-[#D4A03B]/10 text-[#D4A03B] dark:bg-[#D4A03B]/15 dark:text-[#D4A03B]",
    dotColor: "bg-[#D4A03B]",
  },
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-[#6AAFE8]/10 text-[#6AAFE8] dark:bg-[#6AAFE8]/15 dark:text-[#6AAFE8]",
    dotColor: "bg-[#6AAFE8]",
  },
  PUBLISHED: {
    label: "Published",
    className: "bg-[#5B9A6F]/10 text-[#5B9A6F] dark:bg-[#5B9A6F]/15 dark:text-[#5B9A6F]",
    dotColor: "bg-[#5B9A6F]",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-[#D94F4F]/10 text-[#D94F4F] dark:bg-[#D94F4F]/15 dark:text-[#D94F4F]",
    dotColor: "bg-[#D94F4F]",
  },
  KILLED: {
    label: "Killed",
    className: "bg-[#D94F4F] text-white",
    dotColor: "bg-[#D94F4F]",
  },
};

export const priorityConfig: Record<
  StoryPriority,
  { label: string; className: string }
> = {
  CRITICAL: {
    label: "Critical",
    className: "bg-[#D94F4F] text-white animate-pulse",
  },
  HIGH: {
    label: "High",
    className: "bg-[#D4A03B]/10 text-[#D4A03B] dark:bg-[#D4A03B]/15 dark:text-[#D4A03B]",
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-[#6AAFE8]/10 text-[#6AAFE8] dark:bg-[#6AAFE8]/15 dark:text-[#6AAFE8]",
  },
  LOW: {
    label: "Low",
    className: "bg-surface-2 text-text-2",
  },
};

export const agentStatusConfig: Record<
  AgentStatus,
  { label: string; dotColor: string }
> = {
  ACTIVE: { label: "Active", dotColor: "bg-[#5B9A6F]" },
  IDLE: { label: "Idle", dotColor: "bg-text-3" },
  BUSY: { label: "Busy", dotColor: "bg-[#9074A1]" },
  PAUSED: { label: "Paused", dotColor: "bg-[#D4A03B]" },
  ERROR: { label: "Error", dotColor: "bg-[#D94F4F]" },
};

export const eventBorderColors: Record<EventType, string> = {
  SIGNAL_DETECTED: "border-l-[#6AAFE8]",
  STORY_CREATED: "border-l-[#5B9A6F]",
  EIC_DECISION: "border-l-[#9074A1]",
  WRITER_ASSIGNED: "border-l-[#7B618B]",
  DRAFT_COMPLETE: "border-l-[#5B9A6F]",
  HUMAN_REVIEW_REQUIRED: "border-l-[#D4A03B]",
  POST_SCHEDULED: "border-l-[#6AAFE8]",
  POST_PUBLISHED: "border-l-[#5B9A6F]",
  BUDGET_WARNING: "border-l-[#D4A03B]",
  TREND_ALERT: "border-l-[#D4A848]",
  PREPOSITION_ARMED: "border-l-[#4A3B6B]",
  SENTIMENT_ARBITRAGE_DETECTED: "border-l-[#E8A0B8]",
  HYPE_ALERT: "border-l-[#D4A848]",
};
