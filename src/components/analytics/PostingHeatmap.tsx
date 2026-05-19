"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

function generateHeatmapData(): number[][] {
  return DAYS.map(() =>
    HOURS.map(() => Math.floor(Math.random() * 500))
  );
}

const heatmapData = generateHeatmapData();
const maxVal = Math.max(...heatmapData.flat());

function getOpacity(value: number): number {
  if (maxVal === 0) return 0.05;
  return 0.05 + (value / maxVal) * 0.95;
}

export function PostingHeatmap() {
  const [tooltip, setTooltip] = useState<{
    day: string;
    hour: number;
    value: number;
  } | null>(null);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium mb-4">Engagement Heatmap</h3>
      <div className="relative">
        <div className="flex gap-1">
          <div className="flex flex-col gap-1 pr-2">
            <div className="h-5" />
            {HOURS.map((h) => (
              <div
                key={h}
                className="h-5 flex items-center text-[10px] text-muted-foreground"
              >
                {h}:00
              </div>
            ))}
          </div>

          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex-1 flex flex-col gap-1">
              <div className="h-5 text-center text-[10px] text-muted-foreground">
                {day}
              </div>
              {HOURS.map((hour, hourIdx) => {
                const value = heatmapData[dayIdx][hourIdx];
                return (
                  <div
                    key={hour}
                    className={cn(
                      "h-5 rounded-sm bg-primary cursor-pointer transition-opacity"
                    )}
                    style={{ opacity: getOpacity(value) }}
                    onMouseEnter={() => setTooltip({ day, hour, value })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {tooltip && (
          <div className="absolute top-0 right-0 rounded-lg bg-popover border border-border px-3 py-1.5 text-xs shadow-md">
            {tooltip.day} {tooltip.hour}:00 — avg {tooltip.value} engagements
          </div>
        )}
      </div>
    </div>
  );
}
