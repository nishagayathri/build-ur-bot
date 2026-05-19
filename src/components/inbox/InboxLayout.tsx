"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, Inbox } from "lucide-react";
import { useStories } from "@/hooks/useStories";
import { useStoryPatch } from "@/hooks/useStoryPatch";
import { PageTabBar } from "@/components/shared/PageTabBar";
import { EmptyState } from "@/components/shared/EmptyState";
import { InboxStoryRow } from "@/components/inbox/InboxStoryRow";
import { InboxDetailPane } from "@/components/inbox/InboxDetailPane";
import type { StoryObject } from "@/types";

interface InboxLayoutProps {
  filter: "pending" | "all";
}

export function InboxLayout({ filter }: InboxLayoutProps) {
  const router = useRouter();
  const { data: allStories } = useStories();
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  const { patch, loading } = useStoryPatch(selectedStoryId ?? "");

  const stories = useMemo(() => {
    if (!allStories) return [];
    if (filter === "pending") {
      return allStories.filter((s) => s.status === "HUMAN_REVIEW");
    }
    return allStories;
  }, [allStories, filter]);

  const pendingCount = useMemo(() => {
    if (!allStories) return 0;
    return allStories.filter((s) => s.status === "HUMAN_REVIEW").length;
  }, [allStories]);

  const selectedStory = useMemo<StoryObject | undefined>(
    () => stories.find((s) => s.story_id === selectedStoryId),
    [stories, selectedStoryId]
  );

  const tabs = [
    { label: "Pending", value: "pending", count: pendingCount },
    { label: "All", value: "all" },
  ];

  const handleTabChange = useCallback(
    (value: string) => {
      router.push(`/inbox/${value}`);
    },
    [router]
  );

  const handleApprove = useCallback(
    async (scheduledTime: string) => {
      if (!selectedStoryId) return;
      try {
        await patch({ status: "SCHEDULED", scheduledTime });
        setSelectedStoryId(null);
        toast.success("Story approved and scheduled.");
      } catch {
        toast.error("Failed to schedule story.");
      }
    },
    [selectedStoryId, patch]
  );

  const handleRevision = useCallback(async () => {
    if (!selectedStoryId) return;
    try {
      await patch({ status: "REVISION" });
      setSelectedStoryId(null);
      toast.success("Story sent back for revision.");
    } catch {
      toast.error("Failed to request revision.");
    }
  }, [selectedStoryId, patch]);

  const handleKill = useCallback(async () => {
    if (!selectedStoryId) return;
    try {
      await patch({ status: "KILLED" });
      setSelectedStoryId(null);
      toast.success("Story killed.");
    } catch {
      toast.error("Failed to kill story.");
    }
  }, [selectedStoryId, patch]);

  return (
    <div className="flex flex-col h-full gap-4">
      <h1 className="text-2xl font-semibold">Inbox</h1>
      <PageTabBar
        tabs={tabs}
        activeTab={filter}
        onTabChange={handleTabChange}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-96 border-r border-border h-full overflow-auto">
          {stories.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No pending stories"
              description="All caught up."
              className="h-full"
            />
          ) : (
            stories.map((story) => (
              <InboxStoryRow
                key={story.story_id}
                story={story}
                isSelected={story.story_id === selectedStoryId}
                onClick={() => setSelectedStoryId(story.story_id)}
              />
            ))
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {selectedStory ? (
            <InboxDetailPane
              story={selectedStory}
              onApprove={handleApprove}
              onRevision={handleRevision}
              onKill={handleKill}
              loading={loading}
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="Select a story to review"
              className="h-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
