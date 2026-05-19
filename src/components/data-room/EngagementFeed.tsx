"use client";

import type { EngagementSignal } from "@/types";
import { DataRoomPanel } from "@/components/data-room/DataRoomPanel";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface EngagementFeedProps {
  signals: EngagementSignal[];
}

const TYPE_STYLES: Record<EngagementSignal["type"], { label: string; className: string }> = {
  MENTION: { label: "MENTION", className: "bg-muted text-muted-foreground" },
  REPLY_NEEDED: { label: "REPLY", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  HYPE_ALERT: { label: "HYPE", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  RISK_FLAGGED: { label: "RISK", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const PLATFORM_ICON: Record<EngagementSignal["platform"], string> = {
  X: "𝕏",
  INSTAGRAM: "IG",
  LINKEDIN: "LI",
  REDDIT: "RD",
};

export function EngagementFeed({ signals }: EngagementFeedProps) {
  return (
    <DataRoomPanel title="Engagement Desk">
      {signals.map((signal) => {
        const typeStyle = TYPE_STYLES[signal.type];
        return (
          <div
            key={signal.signal_id}
            className={cn(
              "flex items-start gap-2.5 px-4 py-2.5 border-b border-border/50",
              signal.urgency === "HIGH" && "border-l-2 border-l-red-500",
              signal.type === "HYPE_ALERT" && signal.urgency !== "HIGH" && "border-l-2 border-l-amber-400"
            )}
          >
            <span className="text-[11px] text-muted-foreground font-mono mt-0.5 w-5 shrink-0">
              {PLATFORM_ICON[signal.platform]}
            </span>
            <span
              className={cn(
                "text-[11px] rounded px-1.5 py-0.5 whitespace-nowrap shrink-0",
                typeStyle.className
              )}
            >
              {typeStyle.label}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-medium text-muted-foreground">
                {signal.handle}
              </span>
              <p className="text-[12px] leading-snug mt-0.5 line-clamp-2">{signal.content}</p>
              {signal.agent_action && (
                <p className="text-[11px] text-muted-foreground mt-0.5 italic truncate">
                  → {signal.agent_action}
                </p>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
              {timeAgo(signal.timestamp)}
            </span>
          </div>
        );
      })}
    </DataRoomPanel>
  );
}
