"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import type { AccountPersona, StoryObject } from "@/types";
import { useStories } from "@/hooks/useStories";
import { formatNumber, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageTabBar } from "@/components/shared/PageTabBar";
import { EmptyState } from "@/components/shared/EmptyState";

interface PersonaPostsTabProps {
  persona: AccountPersona;
}

const STATUS_GROUPS: Record<string, string[]> = {
  all: [],
  published: ["PUBLISHED"],
  in_progress: ["WRITING", "REVISION", "HUMAN_REVIEW"],
  scheduled: ["SCHEDULED"],
  rejected: ["REJECTED", "KILLED"],
};

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "In Progress", value: "in_progress" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Rejected", value: "rejected" },
];

export function PersonaPostsTab({ persona }: PersonaPostsTabProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: stories, isLoading } = useStories({
    persona: [persona.account_handle],
  });

  const filtered = useMemo(() => {
    const list = stories ?? [];
    const allowed = STATUS_GROUPS[statusFilter];
    if (!allowed || allowed.length === 0) return list;
    return list.filter((s) => allowed.includes(s.status));
  }, [stories, statusFilter]);

  const tabsWithCounts = useMemo(() => {
    const list = stories ?? [];
    return STATUS_TABS.map((tab) => {
      const allowed = STATUS_GROUPS[tab.value];
      const count =
        !allowed || allowed.length === 0
          ? list.length
          : list.filter((s) => allowed.includes(s.status)).length;
      return { ...tab, count };
    });
  }, [stories]);

  return (
    <div className="space-y-4">
      <PageTabBar
        tabs={tabsWithCounts}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-surface-2 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No stories"
          description="No stories match this filter for this persona."
          className="py-10"
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-text-3">
                <th className="px-4 py-2 font-medium">Headline</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Updated</th>
                <th className="px-4 py-2 font-medium text-right">
                  Impressions
                </th>
                <th className="px-4 py-2 font-medium text-right">
                  Engagements
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((story: StoryObject) => (
                <tr
                  key={story.story_id}
                  className="border-b border-border/50 last:border-0 hover:bg-surface-2 transition-colors"
                >
                  <td className="px-4 py-2.5 max-w-xs truncate">
                    <Link
                      href={`/story/${story.story_id}`}
                      className="hover:text-genesis-accent transition-colors"
                    >
                      {story.headline}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={story.status} />
                  </td>
                  <td className="px-4 py-2.5 text-text-3">
                    {formatDateTime(story.updated_at)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {story.performance
                      ? formatNumber(story.performance.impressions)
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {story.performance
                      ? formatNumber(story.performance.engagements)
                      : "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
