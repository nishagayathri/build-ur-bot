"use client";

import React, { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useStory } from "@/hooks/useStories";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { StoryDetail } from "@/components/story/StoryDetail";
import { StoryPropertiesPanel } from "@/components/story/StoryPropertiesPanel";

export default function StoryDetailPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = React.use(params);
  const { setBreadcrumbs } = useBreadcrumbContext();
  const { data: story, isLoading, isError } = useStory(storyId);

  useEffect(() => {
    if (story) {
      setBreadcrumbs([
        { label: "Pipeline", href: "/pipeline" },
        { label: story.entity },
        { label: story.story_id },
      ]);
    }
  }, [story, setBreadcrumbs]);

  if (isLoading) {
    return <PageSkeleton variant="detail" />;
  }

  if (isError || !story) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Story not found"
        description="The story you are looking for does not exist or could not be loaded."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      <div className="min-w-0">
        <StoryDetail story={story} />
      </div>
      <div>
        <StoryPropertiesPanel story={story} />
      </div>
    </div>
  );
}
