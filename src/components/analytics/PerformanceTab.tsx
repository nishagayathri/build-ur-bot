"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useStories } from "@/hooks/useStories";
import { usePersonas } from "@/hooks/usePersonas";
import { formatNumber, formatDateTime } from "@/lib/format";
import { ImpressionsLineChart } from "@/components/analytics/ImpressionsLineChart";
import { SignalPerformanceBar } from "@/components/analytics/SignalPerformanceBar";
import { PostingHeatmap } from "@/components/analytics/PostingHeatmap";

interface PerformanceTabProps {
  dateRange: string;
}

export function PerformanceTab({ dateRange: _dateRange }: PerformanceTabProps) {
  const { data: stories } = useStories();
  const storiesList = stories ?? [];
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];

  const publishedStories = useMemo(
    () =>
      storiesList
        .filter((s) => s.status === "PUBLISHED" && s.performance)
        .sort(
          (a, b) =>
            (b.performance?.impressions ?? 0) -
            (a.performance?.impressions ?? 0)
        ),
    [storiesList]
  );

  function getPersonaName(handle: string | null): string {
    if (!handle) return "\u2014";
    const persona = personasList.find((p) => p.account_handle === handle);
    return persona?.account_handle ?? handle;
  }
  return (
    <div className="space-y-6">
      <ImpressionsLineChart />
      <SignalPerformanceBar />
      <PostingHeatmap />

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-4">Top Posts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Headline</th>
                <th className="pb-2 pr-4 font-medium">Persona</th>
                <th className="pb-2 pr-4 font-medium">Published</th>
                <th className="pb-2 pr-4 font-medium text-right">Impressions</th>
                <th className="pb-2 pr-4 font-medium text-right">Engagements</th>
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
                      className="hover:text-primary transition-colors"
                    >
                      {story.headline}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {getPersonaName(story.assigned_persona)}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {story.scheduled_time
                      ? formatDateTime(story.scheduled_time)
                      : "—"}
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
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
