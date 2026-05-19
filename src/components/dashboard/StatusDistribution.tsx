"use client";

import { useMemo } from "react";
import { PieChart } from "lucide-react";
import type { StoryObject } from "@/types";

interface StatusDistributionProps {
  stories: StoryObject[];
}

export function StatusDistribution({ stories }: StatusDistributionProps) {
  const { succeeded, queued, running, failed, total } = useMemo(() => {
    let succeeded = 0;
    let queued = 0;
    let running = 0;
    let failed = 0;

    for (const s of stories) {
      switch (s.status) {
        case "PUBLISHED":
          succeeded++;
          break;
        case "SCHEDULED":
        case "DETECTED":
        case "RANKED":
          queued++;
          break;
        case "REJECTED":
        case "KILLED":
          failed++;
          break;
        default:
          running++;
          break;
      }
    }

    return { succeeded, queued, running, failed, total: stories.length || 1 };
  }, [stories]);

  const totalStories = stories.length;

  // Compute conic gradient angles
  const sDeg = (succeeded / total) * 360;
  const qDeg = sDeg + (queued / total) * 360;
  const rDeg = qDeg + (running / total) * 360;

  const gradient =
    totalStories > 0
      ? `conic-gradient(var(--success) 0deg, var(--success) ${sDeg}deg, var(--warning) ${sDeg}deg, var(--warning) ${qDeg}deg, var(--genesis-accent) ${qDeg}deg, var(--genesis-accent) ${rDeg}deg, var(--error) ${rDeg}deg, var(--error) 360deg)`
      : `conic-gradient(var(--surface-3) 0deg, var(--surface-3) 360deg)`;

  return (
    <div className="h-full rounded-[12px] border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-[var(--shadow-1)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3 mb-4 flex items-center gap-2">
        <PieChart className="h-3.5 w-3.5 text-text-4" />
        Status Distribution
      </p>

      <div className="flex flex-col items-center gap-4 mt-1">
        {/* Ring gauge */}
        <div
          className="w-[160px] h-[160px] rounded-full flex items-center justify-center shrink-0 relative"
          style={{ background: gradient }}
        >
          {/* Inner cutout */}
          <div className="w-[120px] h-[120px] rounded-full bg-card transition-colors duration-500" />
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-[1]">
            <span className="font-heading text-[30px] font-bold text-text-1 leading-none">
              {totalStories}
            </span>
            <span className="text-[10px] text-text-3 mt-0.5">total runs</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 w-full mt-4">
          <LegendRow color="var(--success)" label="Succeeded" value={succeeded} />
          <LegendRow color="var(--warning)" label="Queued" value={queued} />
          <LegendRow color="var(--genesis-accent)" label="Running" value={running} />
          <LegendRow color="var(--error)" label="Failed" value={failed} />
        </div>
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      <span className="text-[12px] text-text-2 flex-1">{label}</span>
      <span className="text-[12px] font-semibold text-text-1">{value}</span>
    </div>
  );
}
