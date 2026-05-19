"use client";

import { useEffect, useState } from "react";
import { NewAgentSheet } from "@/components/agents/NewAgentSheet";
import { List, GitBranch, Plus } from "lucide-react";
import { useAgentSimulation } from "@/hooks/useAgentSimulation";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { PageTabBar } from "@/components/shared/PageTabBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeskSection } from "@/components/agents/DeskSection";
import { DeskTree } from "@/components/agents/DeskTree";
import type { AgentConfig, AgentDesk, AgentStatus } from "@/types";

type TabFilter = "all" | "active" | "paused" | "error";

const tabs = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Error", value: "error" },
];

const deskOrder: AgentDesk[] = [
  "EIC",
  "DATA_DESK",
  "CONTENT_DESK",
  "ENGAGEMENT_DESK",
];

const tabStatusMap: Record<Exclude<TabFilter, "all">, AgentStatus[]> = {
  active: ["ACTIVE", "BUSY", "IDLE"],
  paused: ["PAUSED"],
  error: ["ERROR"],
};

export default function AgentsPage() {
  const { agents } = useAgentSimulation();
  const { setBreadcrumbs } = useBreadcrumbContext();
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setBreadcrumbs([{ label: "Agents" }]);
  }, [setBreadcrumbs]);

  const liveCount = agents.filter((a) => a.status === "BUSY").length;

  const filtered =
    activeTab === "all"
      ? agents
      : agents.filter((a) => tabStatusMap[activeTab].includes(a.status));

  const grouped = deskOrder.reduce<Record<AgentDesk, AgentConfig[]>>(
    (acc, desk) => {
      acc[desk] = filtered.filter((a) => a.desk === desk);
      return acc;
    },
    { EIC: [], DATA_DESK: [], CONTENT_DESK: [], ENGAGEMENT_DESK: [] }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Agents</h1>
          <Badge variant="secondary" className="tabular-nums">
            {liveCount} live
          </Badge>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="h-4 w-4" />
          New Agent
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <PageTabBar
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(v) => setActiveTab(v as TabFilter)}
        />
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "tree" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("tree")}
          >
            <GitBranch className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="space-y-4">
          {deskOrder.map((desk) => {
            const deskAgents = grouped[desk];
            if (deskAgents.length === 0) return null;
            return (
              <DeskSection
                key={desk}
                desk={desk}
                agents={deskAgents}
              />
            );
          })}
        </div>
      ) : (
        <DeskTree agents={filtered} />
      )}

      <NewAgentSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
