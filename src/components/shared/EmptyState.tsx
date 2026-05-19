"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16",
        className
      )}
    >
      <Icon className="h-12 w-12 text-text-4 mx-auto" />
      <p className="text-[15px] font-medium text-text-1 mt-4">{title}</p>
      {description && (
        <p className="text-[13px] text-text-2 mt-1.5 text-center max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button variant="outline" size="sm" className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
