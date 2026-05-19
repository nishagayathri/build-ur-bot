"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { StoryObject, StoryStatus } from "@/types";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from "@/lib/constants";

interface PipelineSummaryBarProps {
  stories: StoryObject[];
}

export function PipelineSummaryBar({ stories }: PipelineSummaryBarProps) {
  const stageCounts = useMemo(() => {
    const counts = new Map<StoryStatus, number>();
    for (const stage of PIPELINE_STAGES) {
      counts.set(stage, stories.filter((s) => s.status === stage).length);
    }
    return counts;
  }, [stories]);

  const totalStories = stories.length || 1;

  return (
    <div className="rounded-[12px] border border-border bg-card p-6 transition-shadow duration-300 ease-in-out hover:shadow-[var(--shadow-1)]">
      <p className="font-heading text-[15px] font-medium text-text-1 mb-4">Pipeline</p>
      <div className="space-y-3">
        {PIPELINE_STAGES.map((stage) => {
          const count = stageCounts.get(stage) ?? 0;
          const pct = Math.round((count / totalStories) * 100);

          return (
            <div key={stage} className="space-y-1">
              <div className="flex items-center justify-between">
                <Link
                  href={`/pipeline?status=${stage}`}
                  className="text-[13px] text-text-2 hover:text-text-1 transition-colors duration-150"
                >
                  {PIPELINE_STAGE_LABELS[stage]}
                </Link>
                <span className="text-[13px] font-medium text-text-1">
                  {count}
                </span>
              </div>
              {/* Genesis-style progress bar */}
              <div className="h-1 w-full rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-genesis-accent transition-all duration-500 ease-in-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
