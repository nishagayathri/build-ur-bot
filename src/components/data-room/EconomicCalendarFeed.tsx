"use client";

import type { EconomicEvent } from "@/types";
import { DataRoomPanel } from "@/components/data-room/DataRoomPanel";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface EconomicCalendarFeedProps {
  events: EconomicEvent[];
}

const IMPACT_STYLES: Record<EconomicEvent["impact"], string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

export function EconomicCalendarFeed({ events }: EconomicCalendarFeedProps) {
  return (
    <DataRoomPanel title="Economic Calendar">
      {events.map((event) => (
        <div
          key={event.event_id}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 border-b border-border/50",
            event.impact === "HIGH" && "border-l-2 border-l-amber-500"
          )}
        >
          <span className="text-[13px] font-mono text-muted-foreground w-12">
            {formatTime(event.time)}
          </span>
          <span className="font-medium text-[13px] flex-1">{event.name}</span>
          <span
            className={cn(
              "text-[11px] rounded px-1.5",
              IMPACT_STYLES[event.impact]
            )}
          >
            {event.impact}
          </span>
          <span
            className={cn(
              "text-[11px]",
              event.status === "UPCOMING"
                ? "text-blue-500"
                : "text-muted-foreground"
            )}
          >
            {event.status}
          </span>
          {event.status === "RELEASED" && (
            <span className="flex items-center gap-1">
              <span className="text-[13px] font-medium">{event.actual}</span>
              <span className="text-xs text-muted-foreground">vs</span>
              <span className="text-xs text-muted-foreground">
                {event.expected}
              </span>
            </span>
          )}
        </div>
      ))}
    </DataRoomPanel>
  );
}
