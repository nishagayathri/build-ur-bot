"use client";

import type { AgentConfig } from "@/types";
import { AgentRunCard } from "@/components/dashboard/AgentRunCard";

interface AgentStatusGridProps {
  agents: AgentConfig[];
}

export function AgentStatusGrid({ agents }: AgentStatusGridProps) {
  return (
    <div className="rounded-[12px] border border-border bg-card p-6 transition-shadow duration-300 ease-in-out hover:shadow-[var(--shadow-1)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3 mb-4">
        Active Agents
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {agents.map((agent) => (
          <AgentRunCard key={agent.agent_id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
