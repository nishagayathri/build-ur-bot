"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Bot } from "lucide-react";
import { useAgentSimulation } from "@/hooks/useAgentSimulation";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { AgentDetailLayout } from "@/components/agents/AgentDetailLayout";

export default function AgentDetailPage() {
  const params = useParams<{ agentId: string }>();
  const { agents } = useAgentSimulation();
  const { setBreadcrumbs } = useBreadcrumbContext();

  const agent = agents.find((a) => a.agent_id === params.agentId);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Agents", href: "/agents" },
      { label: agent?.name ?? "Agent" },
    ]);
  }, [setBreadcrumbs, agent?.name]);

  if (agents.length === 0) {
    return <PageSkeleton variant="detail" />;
  }

  if (!agent) {
    return (
      <EmptyState
        icon={Bot}
        title="Agent not found"
        description="The agent you are looking for does not exist or has been removed."
      />
    );
  }

  return <AgentDetailLayout agent={agent} />;
}
