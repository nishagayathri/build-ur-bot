"use client";

import type { TrendSignal } from "@/types";
import { DataRoomPanel } from "@/components/data-room/DataRoomPanel";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TrendsFeedProps {
  signals: TrendSignal[];
}

const VELOCITY_DISPLAY: Record<TrendSignal["velocity"], { icon: string; className: string }> = {
  ACCELERATING: { icon: "🔥", className: "text-emerald-500" },
  FADING: { icon: "↓", className: "text-muted-foreground" },
  STABLE: { icon: "—", className: "text-muted-foreground" },
};

const SENTIMENT_STYLES: Record<TrendSignal["sentiment"], string> = {
  BULLISH: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  BEARISH: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  NEUTRAL: "bg-muted text-muted-foreground",
  MIXED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

export function TrendsFeed({ signals }: TrendsFeedProps) {
  return (
    <DataRoomPanel title="Trends">
      {signals.map((signal) => {
        const velocity = VELOCITY_DISPLAY[signal.velocity];
        return (
          <div
            key={signal.signal_id}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50"
          >
            <span className="font-medium text-[13px]">{signal.topic}</span>
            <span className="text-[13px]">{formatNumber(signal.volume)}</span>
            <span className={cn("text-[13px]", velocity.className)}>
              {velocity.icon}
            </span>
            <span
              className={cn(
                "text-[11px] rounded px-1.5 py-0.5",
                SENTIMENT_STYLES[signal.sentiment]
              )}
            >
              {signal.sentiment}
            </span>
            {signal.opportunity_flagged && (
              <Button
                size="sm"
                variant="outline"
                className="text-amber-500 border-amber-500/50"
              >
                JUMP IN →
              </Button>
            )}
          </div>
        );
      })}
    </DataRoomPanel>
  );
}
