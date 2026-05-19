"use client";

import type { CompetitorReport, CompetitorReportType, CompetitorEngagementSummary } from "@/types";
import { formatNumber } from "@/lib/format";
import { DataRoomPanel } from "@/components/data-room/DataRoomPanel";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CompetitorIntelFeedProps {
  reports: CompetitorReport[];
}

const REPORT_TYPE_META: Record<CompetitorReportType, { label: string; className: string }> = {
  NARRATIVE_SATURATION: {
    label: "SATURATED",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  BREAKING_GAP:  {
    label: "GAP",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  MISLEADING_CONTENT: {
    label: "COMPLIANCE",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  BEGINNER_GAP: {
    label: "BEGINNER GAP",
    className: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  },
  FORMAT_TREND: {
    label: "FORMAT",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  GENERAL_INTELLIGENCE: {
    label: "INTEL",
    className: "bg-muted text-muted-foreground",
  },
};

const ACTION_STYLES: Record<CompetitorReport["recommended_action"], string> = {
  COVER_NOW:        "text-blue-600 dark:text-blue-400",
  COUNTER_NARRATIVE: "text-amber-600 dark:text-amber-400",
  MONITOR:          "text-muted-foreground",
  IGNORE:           "text-muted-foreground line-through",
};

function EngagementBar({ summary }: { summary: CompetitorEngagementSummary }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3 flex-wrap">
        <Metric label="posts" value={summary.total_posts} />
        <Metric label="likes" value={summary.total_likes} />
        {summary.total_views != null && (
          <Metric label="views" value={summary.total_views} />
        )}
        <Metric label="comments" value={summary.total_comments} />
        <span className="text-[10px] text-muted-foreground">
          avg {formatNumber(summary.avg_likes_per_post)} likes/post
        </span>
      </div>
      {summary.top_post && (
        <div className="rounded bg-muted/50 px-2 py-1.5">
          <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Top post</p>
          <p className="text-[11px] leading-snug line-clamp-2">{summary.top_post.text}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground">
              {formatNumber(summary.top_post.likes)} likes
              {summary.top_post.views != null && ` · ${formatNumber(summary.top_post.views)} views`}
            </span>
            {summary.top_post.url && (
              <a
                href={summary.top_post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary underline underline-offset-2"
              >
                view →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-[11px]">
      <span className="font-medium tabular-nums">{formatNumber(value)}</span>
      <span className="text-muted-foreground ml-0.5">{label}</span>
    </span>
  );
}

export function CompetitorIntelFeed({ reports }: CompetitorIntelFeedProps) {
  return (
    <DataRoomPanel title="Competitor Intelligence">
      {reports.length === 0 ? (
        <div className="px-4 py-6 text-center text-[12px] text-muted-foreground italic">
          No reports yet — run the Competitor Monitor to populate this feed.
        </div>
      ) : (
        reports.map((report) => {
          const typeMeta = REPORT_TYPE_META[report.report_type];
          return (
            <div
              key={report.id}
              className={cn(
                "px-4 py-3 border-b border-border/50 space-y-1.5",
                report.urgency === "HIGH" && "border-l-2 border-l-red-500",
                report.urgency === "MEDIUM" && "border-l-2 border-l-amber-400",
              )}
            >
              {/* Header row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5",
                    typeMeta.className,
                  )}
                >
                  {typeMeta.label}
                </span>
                <span className="text-[11px] font-medium truncate max-w-[160px]">
                  {report.source}
                </span>
                {report.urgency === "HIGH" && (
                  <span className="text-[10px] font-semibold text-red-500 uppercase">
                    HIGH
                  </span>
                )}
                <span className="ml-auto text-[11px] text-muted-foreground whitespace-nowrap">
                  {timeAgo(report.created_at)}
                </span>
              </div>

              {/* Observation */}
              <p className="text-[12px] leading-snug line-clamp-2">
                {report.observation}
              </p>

              {/* Editorial opportunity */}
              <p className={cn("text-[11px] leading-snug", ACTION_STYLES[report.recommended_action])}>
                → {report.editorial_opportunity}
              </p>

              {/* Engagement metrics */}
              {report.engagement_summary && (
                <EngagementBar summary={report.engagement_summary} />
              )}

              {/* Topics */}
              {report.topics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {report.topics.slice(0, 4).map((t) => (
                    <span key={t} className="text-[10px] bg-muted rounded px-1.5 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </DataRoomPanel>
  );
}
