"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccountContext } from "@/context/AccountContext";
import type { AgentConfig } from "@/types";
import { AGENT_SIMULATION_INTERVAL_MS } from "@/lib/constants";

export function useAgentSimulation(intervalMs?: number) {
  const { activeAccount } = useAccountContext();
  const accountId = activeAccount?.id ?? null;

  const { data: agents = [] } = useQuery<AgentConfig[]>({
    queryKey: ["agents-live", accountId],
    queryFn: async () => {
      const url = accountId
        ? `/api/agents?accountId=${encodeURIComponent(accountId)}`
        : "/api/agents";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
    enabled: !!accountId,
    refetchInterval: intervalMs ?? AGENT_SIMULATION_INTERVAL_MS,
  });

  return { agents };
}
