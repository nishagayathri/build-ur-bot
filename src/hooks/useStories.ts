"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  StoryObject,
  StoryStatus,
  EntityType,
  StoryPriority,
} from "@/types";
import { useAccountContext } from "@/context/AccountContext";

interface StoryFilters {
  status?: StoryStatus[];
  entityType?: EntityType[];
  persona?: string[];
  priority?: StoryPriority[];
  isPrepositioned?: boolean;
  sentimentArbitrage?: boolean;
  search?: string;
}

export function useStories(filters: StoryFilters = {}) {
  const { activeAccount } = useAccountContext();
  const accountId = activeAccount?.id;

  return useQuery<StoryObject[]>({
    queryKey: ["stories", accountId, filters],
    enabled: !!accountId,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("accountId", accountId!);
      if (filters.status?.length) params.set("status", filters.status.join(","));
      if (filters.entityType?.length)
        params.set("entityType", filters.entityType.join(","));
      if (filters.persona?.length)
        params.set("persona", filters.persona.join(","));
      if (filters.priority?.length)
        params.set("priority", filters.priority.join(","));
      if (filters.isPrepositioned !== undefined)
        params.set("isPrepositioned", String(filters.isPrepositioned));
      if (filters.sentimentArbitrage !== undefined)
        params.set("sentimentArbitrage", String(filters.sentimentArbitrage));
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/stories?${params}`);
      if (!res.ok) throw new Error("Failed to fetch stories");
      return res.json();
    },
  });
}

export function useStory(storyId: string) {
  const query = useQuery<StoryObject | undefined>({
    queryKey: ["stories", storyId],
    queryFn: async () => {
      const res = await fetch(`/api/stories/${storyId}`);
      if (res.status === 404) return undefined;
      if (!res.ok) throw new Error("Failed to fetch story");
      return res.json();
    },
    // Poll every 5s while an agent is actively working on the story
    refetchInterval: query => {
      const status = query.state.data?.status;
      return status === "WRITING" || status === "REVISION" ? 5000 : false;
    },
  });
  return query;
}
