"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import type { StoryObject } from "@/types";
import { timeAgo } from "@/lib/format";

interface BreakingAlertBannerProps {
  stories: StoryObject[];
}

export function BreakingAlertBanner({ stories }: BreakingAlertBannerProps) {
  const breakingStory = stories.find(
    (s) => s.priority === "CRITICAL" && s.status === "HUMAN_REVIEW"
  );

  if (!breakingStory) return null;

  return (
    <div className="rounded-[12px] border-[1.5px] border-[#D4A03B]/40 bg-[#D4A03B]/8 p-4 flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <Zap className="h-4 w-4 text-[#D4A03B] shrink-0" />
        <span className="text-[13px] font-semibold text-text-1 truncate">
          BREAKING: {breakingStory.headline} — {timeAgo(breakingStory.updated_at)}
        </span>
      </div>
      <Link
        href="/inbox/pending"
        className="text-[#D4A03B] font-semibold text-[13px] whitespace-nowrap ml-4 hover:underline transition-colors duration-150"
      >
        Review Now →
      </Link>
    </div>
  );
}
