"use client";

import type { NewsSignal } from "@/types";
import { DataRoomPanel } from "@/components/data-room/DataRoomPanel";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface NewsFeedProps {
  signals: NewsSignal[];
}

export function NewsFeed({ signals }: NewsFeedProps) {
  return (
    <DataRoomPanel title="News Feed">
      {signals.map((signal) => (
        <div
          key={signal.signal_id}
          className={cn(
            "flex items-start gap-3 px-4 py-2.5 border-b border-border/50",
            signal.relevance_score < 40 && "opacity-50",
            signal.relevance_score > 80 && "border-l-2 border-l-blue-500"
          )}
        >
          <span className="text-[11px] bg-muted rounded px-1.5 py-0.5 whitespace-nowrap">
            {signal.source}
          </span>
          <span className="text-[13px] flex-1">{signal.headline}</span>
          <span className="text-[11px] bg-muted rounded-full px-1.5">
            {signal.relevance_score}
          </span>
          {signal.has_deriv_angle && (
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[11px] rounded px-1">
              D
            </span>
          )}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo(signal.timestamp)}
          </span>
        </div>
      ))}
    </DataRoomPanel>
  );
}
