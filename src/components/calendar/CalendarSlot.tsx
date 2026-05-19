"use client";

import { useState } from "react";
import type { StoryObject, AccountPersona } from "@/types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SignalStack } from "@/components/shared/SignalStack";
import { AuditTrail } from "@/components/shared/AuditTrail";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { formatNumber } from "@/lib/format";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface CalendarSlotProps {
  story: StoryObject;
  persona?: AccountPersona;
}

export function CalendarSlot({ story, persona }: CalendarSlotProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-border bg-background p-1.5 text-left hover:bg-accent/50 transition-colors cursor-pointer"
        style={{ borderLeftWidth: "3px", borderLeftColor: persona?.avatar_color ?? "var(--border)" }}
      >
        {persona && (
          <span className="text-[11px] text-muted-foreground block truncate">
            {persona.account_handle}
          </span>
        )}
        <span className="text-[13px] line-clamp-2 leading-tight">
          {story.headline}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <StatusBadge status={story.status} className="text-[10px] px-1 py-0" />
          {story.status === "PUBLISHED" && story.performance && (
            <span className="text-xs text-muted-foreground">
              {formatNumber(story.performance.engagements)} eng
            </span>
          )}
        </div>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="overflow-auto">
          <SheetHeader>
            <SheetTitle>{story.headline}</SheetTitle>
            <SheetDescription>
              {story.entity} · {story.entity_type}
            </SheetDescription>
          </SheetHeader>

          <div className="p-4 space-y-6">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={story.priority} />
              <StatusBadge status={story.status} />
            </div>

            {story.draft_content && (
              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <h4 className="text-sm font-medium mb-2">Draft</h4>
                <p className="text-[13px] whitespace-pre-wrap">{story.draft_content}</p>
              </div>
            )}

            <SignalStack
              signals={story.signals_stacked}
              stackingScore={story.stacking_score}
            />

            <AuditTrail entries={story.audit_trail} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
