"use client";

import { useEffect, useState } from "react";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { PageTabBar } from "@/components/shared/PageTabBar";
import { Button } from "@/components/ui/button";
import { PerformanceTab } from "@/components/analytics/PerformanceTab";
import { AgentEfficiencyTab } from "@/components/analytics/AgentEfficiencyTab";

type AnalyticsTab = "performance" | "efficiency";
type DateRange = "today" | "7d" | "30d" | "custom";

const TABS = [
  { label: "Performance", value: "performance" },
  { label: "Agent Efficiency", value: "efficiency" },
];

const DATE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "Today", value: "today" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
];

export default function AnalyticsPage() {
  const { setBreadcrumbs } = useBreadcrumbContext();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("performance");
  const [dateRange, setDateRange] = useState<DateRange>("7d");

  useEffect(() => {
    setBreadcrumbs([{ label: "Analytics" }]);
  }, [setBreadcrumbs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <div className="flex gap-1">
          {DATE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={dateRange === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <PageTabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(v) => setActiveTab(v as AnalyticsTab)}
      />

      {activeTab === "performance" && <PerformanceTab dateRange={dateRange} />}
      {activeTab === "efficiency" && (
        <AgentEfficiencyTab dateRange={dateRange} />
      )}
    </div>
  );
}
