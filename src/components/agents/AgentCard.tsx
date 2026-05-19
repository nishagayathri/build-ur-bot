"use client";

import { useRouter } from "next/navigation";
import type { AgentConfig } from "@/types";
import { AgentIdentity } from "@/components/shared/AgentIdentity";
import { EntityRow } from "@/components/shared/EntityRow";
import { timeAgo } from "@/lib/format";
import { getToolsForDesk } from "@/lib/tool-catalog";

interface AgentCardProps {
  agent: AgentConfig;
}

export function AgentCard({ agent }: AgentCardProps) {
  const router = useRouter();
  const toolCount = getToolsForDesk(agent.desk).length;

  return (
    <EntityRow onClick={() => router.push(`/agents/${agent.agent_id}`)}>
      <AgentIdentity
        name={agent.name}
        desk={agent.desk}
        status={agent.status}
        showDesk
      />
      <span className="hidden text-[11px] bg-muted rounded px-1.5 py-0.5 max-w-[200px] truncate sm:inline">
        {agent.role}
      </span>
      <span className="text-[11px] text-muted-foreground">
        {agent.model}
      </span>
      <span className="hidden items-center gap-1 sm:flex">
        <span className="text-[11px] bg-muted rounded px-1.5 py-0.5">
          {toolCount} tools
        </span>
      </span>
      <span className="ml-auto text-[11px] text-muted-foreground">
        {agent.last_action_at ? timeAgo(agent.last_action_at) : "—"}
      </span>
      {agent.status === "BUSY" && (
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[11px] text-blue-500">live</span>
        </span>
      )}
    </EntityRow>
  );
}
