"use client";

import { useEffect, useMemo } from "react";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { useStories } from "@/hooks/useStories";
import { useAgentSimulation } from "@/hooks/useAgentSimulation";
import { useEventBus } from "@/hooks/useEventBus";
import { BreakingAlertBanner } from "@/components/dashboard/BreakingAlertBanner";
import { ActiveAgentsList } from "@/components/dashboard/ActiveAgentsList";
import { StatusDistribution } from "@/components/dashboard/StatusDistribution";
import { RecentActivityTimeline } from "@/components/dashboard/RecentActivityTimeline";
import { TopPipelines } from "@/components/dashboard/TopPipelines";
import {
  Bot,
  GitBranch,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const { setBreadcrumbs } = useBreadcrumbContext();

  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard" }]);
  }, [setBreadcrumbs]);

  const { data: stories = [] } = useStories();
  const { agents } = useAgentSimulation();
  const { events } = useEventBus();

  // KPI computations
  const totalAgents = agents.length;
  const inPipeline = useMemo(
    () =>
      stories.filter(
        (s) =>
          s.status !== "PUBLISHED" &&
          s.status !== "REJECTED" &&
          s.status !== "KILLED"
      ).length,
    [stories]
  );

  const publishedCount = useMemo(
    () => stories.filter((s) => s.status === "PUBLISHED").length,
    [stories]
  );

  const successRate = useMemo(() => {
    if (stories.length === 0) return 0;
    return Math.round((publishedCount / stories.length) * 1000) / 10;
  }, [stories, publishedCount]);

  return (
    <div className="space-y-4 genesis-fade-in">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <BreakingAlertBanner stories={stories} />

      {/* Bento Grid — 4-column layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ── ROW 1: KPIs ── */}
        <KpiCard
          icon={<Bot className="h-3.5 w-3.5" />}
          label="Total Agents"
          value={totalAgents || 42}
        />
        <KpiCard
          icon={<GitBranch className="h-3.5 w-3.5" />}
          label="In Pipeline"
          value={inPipeline || 0}
        />
        <KpiCard
          icon={<CheckCircle className="h-3.5 w-3.5" />}
          label="Success Rate"
          value={`${successRate || 0}%`}
        />
        <KpiCard
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Published"
          value={publishedCount || 0}
        />

        {/* ── ROW 2–3: LEFT (agents + distrib + pipelines) | RIGHT (activity) ── */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-4 flex flex-col lg:flex-row gap-4">
          {/* Left 3/4 — stacked: agents+distrib on top, pipelines below */}
          <div className="flex-[2.5] flex flex-col gap-4 min-w-0">
            <div className="flex flex-col sm:flex-row gap-4 min-h-[350px]">
              <div className="flex-[2] min-w-0">
                <ActiveAgentsList agents={agents} />
              </div>
              <div className="flex-1 min-w-0">
                <StatusDistribution stories={stories} />
              </div>
            </div>
            <TopPipelines stories={stories} />
          </div>

          {/* Right 1/4 — activity spans full height of both rows */}
          <div className="flex-1 min-w-0">
            <RecentActivityTimeline stories={stories} events={events} />
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[12px] border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-[var(--shadow-1)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3 mb-4 flex items-center gap-2">
        <span className="text-text-4">{icon}</span>
        {label}
      </p>
      <div className="font-heading text-[56px] font-bold leading-[1.1] tracking-[-0.015em] text-text-1">
        {value}
      </div>
    </div>
  );
}
