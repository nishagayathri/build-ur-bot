"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ExternalLink, BarChart3 } from "lucide-react";
import type { AccountPersona } from "@/types";
import { useStories } from "@/hooks/useStories";
import { formatNumber, formatDateTime } from "@/lib/format";
import { MetricCard } from "@/components/shared/MetricCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { PersonaImpressionsChart } from "@/components/personalities/PersonaImpressionsChart";

interface PersonaPerformanceTabProps {
  persona: AccountPersona;
}

export function PersonaPerformanceTab({ persona }: PersonaPerformanceTabProps) {
  const { data: stories } = useStories({
    persona: [persona.account_handle],
  });

  const publishedStories = useMemo(
    () =>
      (stories ?? [])
        .filter((s) => s.status === "PUBLISHED" && s.performance)
        .sort(
          (a, b) =>
            (b.performance?.impressions ?? 0) -
            (a.performance?.impressions ?? 0),
        ),
    [stories],
  );

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Avg Impressions"
          value={formatNumber(persona.performance_7d.avg_impressions)}
        />
        <MetricCard
          label="Avg Engagements"
          value={formatNumber(persona.performance_7d.avg_engagements)}
        />
        <MetricCard
          label="Best Post Type"
          value={persona.performance_7d.best_post_type}
        />
      </div>

      {/* Impressions chart */}
      <PersonaImpressionsChart
        avgImpressions={persona.performance_7d.avg_impressions}
        avatarColor={persona.avatar_color}
      />

      {/* Top posts table */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-4">Top Posts</h3>
        {publishedStories.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No published posts yet"
            description="Stories assigned to this persona will appear here once published."
            className="py-10"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-text-3">
                  <th className="pb-2 pr-4 font-medium">Headline</th>
                  <th className="pb-2 pr-4 font-medium">Published</th>
                  <th className="pb-2 pr-4 font-medium text-right">
                    Impressions
                  </th>
                  <th className="pb-2 pr-4 font-medium text-right">
                    Engagements
                  </th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {publishedStories.map((story) => (
                  <tr
                    key={story.story_id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-2 pr-4 max-w-xs truncate">
                      <Link
                        href={`/story/${story.story_id}`}
                        className="hover:text-genesis-accent transition-colors"
                      >
                        {story.headline}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-text-3">
                      {story.scheduled_time
                        ? formatDateTime(story.scheduled_time)
                        : "\u2014"}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {formatNumber(story.performance?.impressions ?? 0)}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {formatNumber(story.performance?.engagements ?? 0)}
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/story/${story.story_id}`}
                        className="text-text-3 hover:text-genesis-accent"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
