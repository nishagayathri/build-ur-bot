"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";
import type { StoryObject, BusEvent } from "@/types";
import { formatTime } from "@/lib/format";

type DotVariant = "ok" | "err" | "warn" | "acc";

interface TimelineEntry {
  time: string;
  dot: DotVariant;
  agent: string;
  text: string;
}

interface RecentActivityTimelineProps {
  stories: StoryObject[];
  events: BusEvent[];
}

const dotColors: Record<DotVariant, string> = {
  ok: "bg-success",
  err: "bg-error",
  warn: "bg-warning",
  acc: "bg-genesis-accent",
};

export function RecentActivityTimeline({
  stories,
  events,
}: RecentActivityTimelineProps) {
  const entries = useMemo(() => {
    const items: TimelineEntry[] = [];

    // Derive from event bus
    for (const ev of events) {
      let dot: DotVariant = "ok";
      if (ev.type.includes("FAIL") || ev.type.includes("ERROR")) dot = "err";
      else if (ev.type.includes("WARN") || ev.type.includes("REVIEW")) dot = "warn";
      else if (ev.type.includes("SCHEDULED") || ev.type.includes("PUBLISHED")) dot = "acc";

      items.push({
        time: formatTime(ev.timestamp),
        dot,
        agent: ev.agent,
        text: ev.message,
      });
    }

    // Also pull from story audit trails (merged, not gated)
    const seenEventKeys = new Set(items.map((i) => `${i.time}-${i.agent}`));
    const auditEntries = stories
      .flatMap((s) =>
        (s.audit_trail ?? []).map((a) => ({
          ...a,
          headline: s.headline,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    for (const a of auditEntries) {
      const key = `${formatTime(a.timestamp)}-${a.agent}`;
      if (seenEventKeys.has(key)) continue;

      let dot: DotVariant = "ok";
      if (
        a.action.toLowerCase().includes("fail") ||
        a.action.toLowerCase().includes("reject") ||
        a.action.toLowerCase().includes("kill")
      )
        dot = "err";
      else if (
        a.action.toLowerCase().includes("review") ||
        a.action.toLowerCase().includes("queue")
      )
        dot = "warn";
      else if (
        a.action.toLowerCase().includes("publish") ||
        a.action.toLowerCase().includes("schedul")
      )
        dot = "acc";

      items.push({
        time: formatTime(a.timestamp),
        dot,
        agent: a.agent,
        text: `${a.action} — ${a.headline}`,
      });
    }

    return items;
  }, [stories, events]);

  // Fallback entries if no data available
  const displayEntries =
    entries.length > 0
      ? entries
      : [
          { time: "2:14p", dot: "ok" as const, agent: "Data Desk", text: "Completed enrichment for 48 signals in 12.4s" },
          { time: "2:11p", dot: "err" as const, agent: "Compliance", text: "Failed on entity validation — schema mismatch" },
          { time: "2:08p", dot: "ok" as const, agent: "EIC", text: "Classified 23 stories, escalated 2 to human review" },
          { time: "2:02p", dot: "acc" as const, agent: "Engagement Desk", text: "Sent batch 14 — 312 posts, 98.7% delivered" },
          { time: "1:55p", dot: "warn" as const, agent: "Content Desk", text: "Queued — waiting on external API rate limit reset" },
          { time: "1:48p", dot: "ok" as const, agent: "Content Desk", text: "Published 3 story drafts to staging environment" },
          { time: "1:40p", dot: "ok" as const, agent: "Data Desk", text: "Completed batch sync — 14,200 records transferred" },
        ];

  return (
    <div className="h-full rounded-[12px] border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-[var(--shadow-1)] flex flex-col overflow-hidden">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3 mb-4 flex items-center gap-2 shrink-0">
        <Activity className="h-3.5 w-3.5 text-text-4" />
        Recent Activity
      </p>

      <ul className="flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {displayEntries.map((entry, i) => (
          <li key={i} className="flex gap-3 py-[7px]">
            {/* Time column */}
            <span className="text-[11px] font-medium text-text-4 tracking-[0.02em] w-12 shrink-0 pt-0.5">
              {entry.time}
            </span>

            {/* Dot + line column */}
            <div className="flex flex-col items-center w-3 shrink-0 relative">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 z-[1]",
                  dotColors[entry.dot]
                )}
              />
              {i < displayEntries.length - 1 && (
                <span className="w-px flex-1 bg-border mt-1" />
              )}
            </div>

            {/* Text column */}
            <span className="flex-1 text-[13px] text-text-2 leading-[1.5] min-w-0">
              <strong className="font-semibold text-text-1">
                {entry.agent}
              </strong>{" "}
              {entry.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
