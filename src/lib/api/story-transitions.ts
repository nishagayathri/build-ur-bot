import type { StoryStatus } from "@/types";

export const VALID_TRANSITIONS: Record<StoryStatus, StoryStatus[]> = {
  DETECTED: ["RANKED", "REJECTED"],
  RANKED: ["EIC_APPROVED", "REJECTED"],
  EIC_APPROVED: ["WRITING", "REJECTED"],
  WRITING: ["HUMAN_REVIEW", "KILLED"],
  REVISION: ["HUMAN_REVIEW", "KILLED"],
  HUMAN_REVIEW: ["SCHEDULED", "REVISION", "KILLED"],
  SCHEDULED: ["PUBLISHED", "HUMAN_REVIEW", "KILLED"],
  PUBLISHED: [],
  REJECTED: ["DETECTED"],
  KILLED: ["DETECTED"],
};

export function isValidTransition(
  from: StoryStatus,
  to: StoryStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
