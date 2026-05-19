"use client";

import { cn } from "@/lib/utils";
import type { StoryStatus } from "@/types";

const PIPELINE_STEPS: { status: StoryStatus; label: string }[] = [
  { status: "DETECTED", label: "Detected" },
  { status: "RANKED", label: "Ranked" },
  { status: "EIC_APPROVED", label: "Approved" },
  { status: "WRITING", label: "Writing" },
  { status: "HUMAN_REVIEW", label: "Review" },
  { status: "SCHEDULED", label: "Scheduled" },
  { status: "PUBLISHED", label: "Published" },
];

const SIDE_STATES: Partial<Record<StoryStatus, { label: string; color: string }>> = {
  REVISION: { label: "Revision requested", color: "text-amber-400" },
  KILLED: { label: "Story killed", color: "text-red-400" },
  REJECTED: { label: "Story rejected", color: "text-red-400" },
};

interface PipelineStepperProps {
  status: StoryStatus;
}

export function PipelineStepper({ status }: PipelineStepperProps) {
  const sideState = SIDE_STATES[status];
  const currentIndex = PIPELINE_STEPS.findIndex((s) => s.status === status);

  if (sideState) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className={cn("text-[11px] font-semibold uppercase tracking-[0.06em]", sideState.color)}>
          {sideState.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 w-full">
      {PIPELINE_STEPS.map((step, idx) => {
        const isPast = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isFuture = idx > currentIndex;

        return (
          <div key={step.status} className="flex items-center flex-1 min-w-0">
            {/* Step node */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  isPast && "bg-text-3",
                  isCurrent && "bg-text-1 ring-2 ring-offset-1 ring-offset-background ring-text-1",
                  isFuture && "bg-border",
                )}
              />
              <span
                className={cn(
                  "text-[9px] uppercase tracking-[0.05em] mt-1 font-semibold whitespace-nowrap",
                  isPast && "text-text-3",
                  isCurrent && "text-text-1",
                  isFuture && "text-text-4",
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {idx < PIPELINE_STEPS.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-1 transition-colors",
                  idx < currentIndex ? "bg-text-3" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
