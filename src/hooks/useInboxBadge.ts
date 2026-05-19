"use client";

import { useStories } from "@/hooks/useStories";

export function useInboxBadge() {
  const { data: stories } = useStories({ status: ["HUMAN_REVIEW"] });

  const pendingCount = stories?.length ?? 0;
  const hasCritical =
    stories?.some((s) => s.priority === "CRITICAL") ?? false;

  return { count: pendingCount, pendingCount, hasCritical };
}
