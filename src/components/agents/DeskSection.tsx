"use client";

import type { AgentConfig, AgentDesk } from "@/types";
import { AgentCard } from "@/components/agents/AgentCard";

interface DeskSectionProps {
  desk: AgentDesk;
  agents: AgentConfig[];
}

const deskLabels: Record<AgentDesk, string> = {
  DATA_DESK: "Data Desk",
  CONTENT_DESK: "Content Desk",
  ENGAGEMENT_DESK: "Engagement Desk",
  EIC: "Editor-in-Chief",
};

export function DeskSection({ desk, agents }: DeskSectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 py-2 px-4">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {deskLabels[desk]}
        </span>
        <span className="text-[11px] text-muted-foreground">
          ({agents.length})
        </span>
      </div>
      <div>
        {agents.map((agent) => (
          <AgentCard key={agent.agent_id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
