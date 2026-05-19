"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, List, SlidersHorizontal, AlertCircle } from "lucide-react";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { useStories } from "@/hooks/useStories";
import { PageTabBar } from "@/components/shared/PageTabBar";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { PipelineFilters } from "@/components/pipeline/PipelineFilters";
import { StoryKanban } from "@/components/pipeline/StoryKanban";
import { StoryListView } from "@/components/pipeline/StoryListView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { StoryStatus, EntityType, StoryPriority } from "@/types";

interface PipelineFiltersState {
  status: StoryStatus[];
  entityType: EntityType[];
  priority: StoryPriority[];
  persona: string[];
  isPrepositioned: boolean | undefined;
  sentimentArbitrage: boolean | undefined;
  search: string;
}

const STATUS_TABS = [
  { label: "All", value: "all" },
  { label: "Detected", value: "DETECTED" },
  { label: "Writing", value: "WRITING" },
  { label: "Review", value: "HUMAN_REVIEW" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Published", value: "PUBLISHED" },
];

function PipelinePageContent() {
  const searchParams = useSearchParams();
  const { setBreadcrumbs } = useBreadcrumbContext();

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [activeTab, setActiveTab] = useState(
    searchParams.get("status") ?? "all"
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<PipelineFiltersState>({
    status: [],
    entityType: [],
    priority: [],
    persona: [],
    isPrepositioned: undefined,
    sentimentArbitrage: undefined,
    search: "",
  });

  useEffect(() => {
    setBreadcrumbs([{ label: "Pipeline" }]);
  }, [setBreadcrumbs]);

  const queryFilters = useMemo(() => {
    const statusFromTab =
      activeTab !== "all" ? [activeTab as StoryStatus] : [];
    const mergedStatus =
      statusFromTab.length > 0 ? statusFromTab : filters.status;

    return {
      status: mergedStatus.length > 0 ? mergedStatus : undefined,
      entityType: filters.entityType.length > 0 ? filters.entityType : undefined,
      priority: filters.priority.length > 0 ? filters.priority : undefined,
      persona: filters.persona.length > 0 ? filters.persona : undefined,
      isPrepositioned: filters.isPrepositioned,
      sentimentArbitrage: filters.sentimentArbitrage,
      search: filters.search || undefined,
    };
  }, [activeTab, filters]);

  const { data: stories, isLoading, isError, refetch } = useStories(queryFilters);

  const tabsWithCounts = useMemo(() => {
    return STATUS_TABS.map((tab) => ({
      ...tab,
      count:
        tab.value === "all"
          ? stories?.length
          : stories?.filter((s) => s.status === tab.value).length,
    }));
  }, [stories]);

  if (isLoading) {
    return <PageSkeleton variant="grid" />;
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to load pipeline"
        description="Something went wrong while fetching stories."
        action={{ label: "Retry", onClick: () => refetch() }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Pipeline</h1>
          <Badge variant="secondary" className="text-xs">
            {stories?.length ?? 0} stories
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(filtersOpen && "bg-accent")}
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-1.5" />
            Filters
          </Button>

          <div className="flex items-center rounded-lg border border-border p-0.5">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <PageTabBar
        tabs={tabsWithCounts}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent>
          <PipelineFilters filters={filters} onFiltersChange={setFilters} />
        </CollapsibleContent>
      </Collapsible>

      {!stories || stories.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No stories found"
          description="Try adjusting your filters."
        />
      ) : viewMode === "kanban" ? (
        <StoryKanban stories={stories} />
      ) : (
        <StoryListView stories={stories} />
      )}
    </div>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={<PageSkeleton variant="grid" />}>
      <PipelinePageContent />
    </Suspense>
  );
}
