"use client";

import type { StoryPriority } from "@/types";
import { Badge } from "@/components/ui/badge";
import { priorityConfig } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: StoryPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <Badge
      variant="secondary"
      className={cn(
        config.className,
        "border-0",
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
