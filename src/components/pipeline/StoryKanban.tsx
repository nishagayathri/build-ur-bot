"use client";

import { useMemo } from "react";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS } from "@/lib/constants";
import { StoryCard } from "@/components/pipeline/StoryCard";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { StoryObject, StoryStatus } from "@/types";

interface StoryKanbanProps {
  stories: StoryObject[];
}

const EXTRA_COLUMNS: StoryStatus[] = ["REJECTED", "KILLED"];

const COLUMN_BORDER: Partial<Record<StoryStatus, string>> = {
  WRITING: "border-purple-500/40",
  HUMAN_REVIEW: "border-amber-500/40",
};

const COLUMN_LABELS: Record<string, string> = {
  ...PIPELINE_STAGE_LABELS,
  REJECTED: "Rejected",
  KILLED: "Killed",
};

export function StoryKanban({ stories }: StoryKanbanProps) {
  const columns = useMemo(() => {
    const allStatuses: StoryStatus[] = [...PIPELINE_STAGES, ...EXTRA_COLUMNS];

    return allStatuses.map((status) => ({
      status,
      label: COLUMN_LABELS[status] ?? status,
      stories: stories.filter((s) => s.status === status),
    }));
  }, [stories]);

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4">
        {columns.map((col) => (
          <div
            key={col.status}
            className={cn(
              "flex-shrink-0 w-72 rounded-xl border border-border bg-card/50",
              COLUMN_BORDER[col.status]
            )}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
              <span className="text-[13px] font-medium">{col.label}</span>
              <Badge variant="secondary" className="text-[11px]">
                {col.stories.length}
              </Badge>
            </div>

            <div className="p-2 space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {col.stories.map((story) => (
                <StoryCard key={story.story_id} story={story} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
