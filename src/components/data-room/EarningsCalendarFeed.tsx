"use client";

import type { EarningsEvent } from "@/types";
import { DataRoomPanel } from "@/components/data-room/DataRoomPanel";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface EarningsCalendarFeedProps {
  events: EarningsEvent[];
}

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toFixed(2)}`;
}

export function EarningsCalendarFeed({ events }: EarningsCalendarFeedProps) {
  return (
    <DataRoomPanel title="Earnings Calendar">
      {events.map((event) => {
        const epsBeat =
          event.status === "REPORTED" &&
          event.eps_actual != null &&
          event.eps_estimate != null &&
          event.eps_actual > event.eps_estimate;

        return (
          <div
            key={event.event_id}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 border-b border-border/50",
              epsBeat && "border-l-2 border-l-emerald-500",
            )}
          >
            <span className="font-medium text-[13px] w-16">
              {event.symbol}
            </span>
            <span className="text-[13px] font-mono text-muted-foreground w-12">
              {formatTime(event.report_date)}
            </span>
            <span
              className={cn(
                "text-[11px] rounded px-1.5",
                event.status === "UPCOMING"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {event.status}
            </span>
            {event.status === "REPORTED" ? (
              <span className="flex items-center gap-1 flex-1 justify-end text-[13px]">
                <span className="font-medium">
                  EPS {event.eps_actual?.toFixed(2) ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">vs</span>
                <span className="text-xs text-muted-foreground">
                  {event.eps_estimate?.toFixed(2) ?? "—"}
                </span>
                <span className="mx-1 text-muted-foreground/50">|</span>
                <span className="font-medium">
                  {formatCurrency(event.revenue_actual)}
                </span>
                <span className="text-xs text-muted-foreground">vs</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(event.revenue_estimate)}
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-1 flex-1 justify-end text-[13px] text-muted-foreground">
                <span>Est EPS {event.eps_estimate?.toFixed(2) ?? "—"}</span>
                <span className="mx-1 text-muted-foreground/50">|</span>
                <span>Rev {formatCurrency(event.revenue_estimate)}</span>
              </span>
            )}
          </div>
        );
      })}
    </DataRoomPanel>
  );
}
