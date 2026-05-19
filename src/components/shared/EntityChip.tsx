"use client";

import type { EntityType } from "@/types";
import { cn } from "@/lib/utils";

interface EntityChipProps {
  entity: string;
  entityType: EntityType;
  className?: string;
}

export function EntityChip({ entity, entityType, className }: EntityChipProps) {
  return (
    <span
      className={cn(
        "rounded-[999px] px-2.5 py-0.5 text-[11px] font-medium bg-genesis-accent-subtle text-genesis-accent",
        className
      )}
    >
      {entity} · {entityType}
    </span>
  );
}
