"use client";

import type { StoryStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { storyStatusConfig } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: StoryStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = storyStatusConfig[status];

  return (
    <Badge variant="secondary" className={cn(config.className, "border-0", className)}>
      {config.label}
    </Badge>
  );
}
