"use client";

import type { Signal } from "@/types";
import {
  TrendingUp,
  Newspaper,
  BarChart2,
  CalendarDays,
  Flame,
  BookOpen,
  CircleDot,
  Crosshair,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SignalStackProps {
  signals: Signal[];
  stackingScore: number;
  className?: string;
}

const sourceIcons: Record<string, LucideIcon> = {
  PRICE: TrendingUp,
  NEWS: Newspaper,
  EARNINGS: BarChart2,
  ECONOMIC_CALENDAR: CalendarDays,
  SOCIAL_TREND: Flame,
  DERIV_KNOWLEDGE: BookOpen,
  competitor_gap: Crosshair,
  audience_fit: Users,
};

const sourceLabels: Record<string, string> = {
  PRICE: "Price",
  NEWS: "News",
  EARNINGS: "Earnings",
  ECONOMIC_CALENDAR: "Calendar",
  SOCIAL_TREND: "Social",
  DERIV_KNOWLEDGE: "Knowledge",
  competitor_gap: "Competitor",
  audience_fit: "Audience",
};

/** Format unknown source keys into readable labels (e.g. "some_new_source" → "Some New Source") */
function formatSourceLabel(source: string): string {
  return source
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SignalStack({
  signals,
  stackingScore,
  className,
}: SignalStackProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="font-heading text-[15px] font-medium text-text-1">
        Signals Stacked ({signals.length})
      </h4>

      <div className="space-y-2.5">
        {signals.map((rawSignal, idx) => {
          // Normalize: handle freeform objects that don't match the Signal shape
          const signal = rawSignal as unknown as Record<string, unknown>;
          const source = (signal.source as string | undefined) ?? "UNKNOWN";
          const value =
            typeof signal.value === "string"
              ? signal.value
              : signal.detail ?? signal.description ?? signal.summary ?? signal.event ?? "—";
          const confidence =
            typeof signal.confidence === "number" ? signal.confidence : 0;
          const timestamp =
            typeof signal.timestamp === "string" ? signal.timestamp : null;

          const Icon = sourceIcons[source] ?? CircleDot;

          const hasConfidence = confidence > 0;
          const hasTimestamp = !!timestamp;

          return (
            <div key={idx} className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 shrink-0 text-text-3" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3 w-[72px] shrink-0">
                {sourceLabels[source] ?? formatSourceLabel(source)}
              </span>
              <span className="text-[13px] text-text-2 flex-1 truncate">{String(value)}</span>
              {hasConfidence && (
                <div className="w-16 shrink-0">
                  <Progress value={confidence} max={100} />
                </div>
              )}
              {hasTimestamp && (
                <span className="text-[11px] text-text-3 shrink-0">
                  {timeAgo(timestamp)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5 pt-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3">
          Stacking Score
        </span>
        <div className="flex-1">
          <Progress value={stackingScore} max={100} />
        </div>
      </div>
    </div>
  );
}
