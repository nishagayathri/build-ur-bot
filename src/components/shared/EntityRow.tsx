"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EntityRowProps {
  children: ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

export function EntityRow({
  children,
  onClick,
  isSelected = false,
  className,
}: EntityRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.();
        }
      }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-[13px] hover:bg-surface-2 cursor-pointer transition-colors duration-150 ease-out",
        isSelected && "bg-genesis-accent-subtle",
        className
      )}
    >
      {children}
    </div>
  );
}
