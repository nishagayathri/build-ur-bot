"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { AgentConfig } from "@/types";
import { agentStatusConfig } from "@/lib/status-colors";
import { cn } from "@/lib/utils";

const deskLabels: Record<string, string> = {
  DATA_DESK: "Data Desk",
  CONTENT_DESK: "Content Desk",
  ENGAGEMENT_DESK: "Engagement Desk",
  EIC: "Editor-in-Chief",
};

interface AgentRunCardProps {
  agent: AgentConfig;
}

export function AgentRunCard({ agent }: AgentRunCardProps) {
  const statusConfig = agentStatusConfig[agent.status];

  return (
    <div
      className={cn(
        "rounded-[12px] border border-border bg-card p-4 transition-shadow duration-300 ease-in-out hover:shadow-[var(--shadow-1)]",
        agent.status === "BUSY" && "border-genesis-accent/30"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold text-text-1">{agent.name}</span>
          <span className="text-[11px] text-text-3">{deskLabels[agent.desk] ?? agent.desk}</span>
        </div>
        <Link href={`/agents/${agent.agent_id}`} className="text-text-4 hover:text-text-1 transition-colors duration-150">
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex items-center gap-2 mt-2.5">
        <span
          className={cn(
            "h-2 w-2 rounded-full shrink-0",
            statusConfig.dotColor,
            agent.status === "BUSY" && "animate-pulse"
          )}
        />
        <span className={cn(
          "text-[11px] font-medium",
          agent.status === "ACTIVE" && "text-[#5B9A6F]",
          agent.status === "BUSY" && "text-genesis-accent",
          agent.status === "IDLE" && "text-text-3",
          agent.status === "PAUSED" && "text-[#D4A03B]",
          agent.status === "ERROR" && "text-[#D94F4F]",
        )}>
          {agent.current_task ? agent.current_task : statusConfig.label}
        </span>
      </div>
    </div>
  );
}
