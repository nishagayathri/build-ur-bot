"use client";

import { useQuery } from "@tanstack/react-query";
import type { AgentConfig, AgentDesk, AgentStatus } from "@/types";

interface AgentFilters {
  desk?: AgentDesk;
  status?: AgentStatus;
}

export function useAgents(filters: AgentFilters = {}) {
  return useQuery<AgentConfig[]>({
    queryKey: ["agents", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.desk) params.set("desk", filters.desk);
      if (filters.status) params.set("status", filters.status);
      const res = await fetch(`/api/agents?${params}`);
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
  });
}

export function useAgent(agentId: string) {
  return useQuery<AgentConfig | undefined>({
    queryKey: ["agents", agentId],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${agentId}`);
      if (res.status === 404) return undefined;
      if (!res.ok) throw new Error("Failed to fetch agent");
      return res.json();
    },
  });
}
