"use client";

import type { MarketSignal } from "@/types";
import { DataRoomPanel } from "@/components/data-room/DataRoomPanel";
import { Progress } from "@/components/ui/progress";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MarketFeedProps {
  signals: MarketSignal[];
}

export function MarketFeed({ signals }: MarketFeedProps) {
  return (
    <DataRoomPanel title="Market Feed">
      {signals.map((signal) => (
        <div
          key={signal.signal_id}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 border-b border-border/50",
            signal.story_potential_score > 70 && "border-l-2 border-l-amber-500"
          )}
        >
          <span className="font-medium text-[13px]">{signal.asset}</span>
          <span
            className={cn(
              "font-mono text-[13px]",
              signal.price_change_pct >= 0
                ? "text-emerald-500"
                : "text-red-500"
            )}
          >
            {formatPercent(signal.price_change_pct)}
          </span>
          {signal.volume_vs_avg > 1.5 && (
            <span className="text-[11px] bg-muted rounded px-1">
              Vol ×{signal.volume_vs_avg.toFixed(1)}
            </span>
          )}
          <span className="text-xs text-muted-foreground truncate flex-1">
            {signal.agent_interpretation}
          </span>
          <Progress
            value={signal.story_potential_score}
            className="w-12"
          />
        </div>
      ))}
    </DataRoomPanel>
  );
}
