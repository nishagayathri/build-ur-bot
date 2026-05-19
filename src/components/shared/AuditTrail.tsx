"use client";

import type { AuditEntry } from "@/types";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AuditTrailProps {
  entries: AuditEntry[];
  className?: string;
}

export function AuditTrail({ entries, className }: AuditTrailProps) {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className={cn("space-y-0", className)}>
      <h4 className="font-heading text-[15px] font-medium text-text-1 mb-4">Post DNA</h4>

      <div className="border-l-2 border-border">
        {sorted.map((entry, idx) => (
          <div key={idx} className="ml-5 relative pb-5 last:pb-0">
            <span className="absolute -left-[22px] h-3 w-3 rounded-full bg-surface-2 border-2 border-background" />
            <div className="flex items-center gap-2">
              <span className="bg-genesis-accent-subtle text-genesis-accent rounded-[999px] px-2.5 py-0.5 text-[10px] font-semibold">
                {entry.agent}
              </span>
              <span className="text-[11px] text-text-3">
                {timeAgo(entry.timestamp)}
              </span>
            </div>
            <p className="text-[13px] text-text-1 mt-1.5 leading-relaxed">{entry.action}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
