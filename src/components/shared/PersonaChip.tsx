"use client";

import { cn } from "@/lib/utils";

interface PersonaChipProps {
  handle: string;
  avatarColor: string;
  size?: "sm" | "md";
  className?: string;
}

export function PersonaChip({
  handle,
  avatarColor,
  size = "sm",
  className,
}: PersonaChipProps) {
  const initial = handle.charAt(0).toUpperCase();

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-full text-white font-bold",
          size === "sm" ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-[11px]"
        )}
        style={{ backgroundColor: avatarColor }}
      >
        {initial}
      </span>
      <span className={cn(
        "text-text-1",
        size === "sm" ? "text-[11px]" : "text-[13px]"
      )}>
        {handle}
      </span>
    </div>
  );
}
