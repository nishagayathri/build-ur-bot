"use client";

import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DataRoomPanelProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function DataRoomPanel({ title, children, className }: DataRoomPanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-medium">{title}</span>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      </div>
      <ScrollArea className="max-h-[350px]">
        {children}
      </ScrollArea>
    </div>
  );
}
