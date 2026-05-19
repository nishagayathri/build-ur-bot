"use client";

import { useEffect, useState } from "react";
import { Eye, TrendingDown, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CompetitorReport } from "@/types";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CompetitorHealthCard() {
  const [reports, setReports] = useState<CompetitorReport[]>([]);

  useEffect(() => {
    fetch("/api/competitor-reports?limit=20&lookback_days=7")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReports(data);
      })
      .catch(() => {});
  }, []);

  const highUrgency = reports.filter((r) => r.urgency === "HIGH").length;
  const saturated   = reports.filter((r) => r.report_type === "NARRATIVE_SATURATION").length;
  const gaps        = reports.filter((r) => r.report_type === "BREAKING_GAP" || r.report_type === "BEGINNER_GAP").length;
  const topReport   = reports[0] ?? null;

  return (
    <div className="rounded-[12px] border border-border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-3">
            Competitor Intelligence
          </span>
          <span className="text-[10px] text-muted-foreground">· 7d</span>
        </div>
        <Link
          href="/data-room"
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {reports.length === 0 ? (
        <p className="text-[12px] text-muted-foreground italic">
          No competitor reports yet. Run the Competitor Monitor to populate.
        </p>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label="Alerts"
              value={highUrgency}
              icon={<AlertTriangle className="h-3 w-3" />}
              className={highUrgency > 0 ? "text-red-500" : "text-muted-foreground"}
            />
            <Stat
              label="Saturated"
              value={saturated}
              icon={<TrendingDown className="h-3 w-3" />}
              className={saturated > 0 ? "text-amber-500" : "text-muted-foreground"}
            />
            <Stat
              label="Gaps"
              value={gaps}
              icon={<Eye className="h-3 w-3" />}
              className={gaps > 0 ? "text-blue-500" : "text-muted-foreground"}
            />
          </div>

          {/* Latest report */}
          {topReport && (
            <div className={cn(
              "rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 space-y-1",
              topReport.urgency === "HIGH" && "border-l-2 border-l-red-500",
            )}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Latest
                </span>
                <span className="text-[11px] font-medium truncate">{topReport.source}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {timeAgo(topReport.created_at)}
                </span>
              </div>
              <p className="text-[12px] leading-snug line-clamp-2 text-text-1">
                {topReport.observation}
              </p>
              <p className="text-[11px] text-muted-foreground line-clamp-1">
                → {topReport.editorial_opportunity}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="text-center">
      <div className={cn("flex items-center justify-center gap-1 mb-0.5", className)}>
        {icon}
        <span className="text-xl font-bold tabular-nums">{value}</span>
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </div>
  );
}
