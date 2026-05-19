"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatNumber } from "@/lib/format";

interface PersonaImpressionsChartProps {
  avgImpressions: number;
  avatarColor: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function generateData(avg: number) {
  return DAYS.map((day) => ({
    day,
    impressions: Math.round(avg * (0.7 + Math.random() * 0.6)),
  }));
}

export function PersonaImpressionsChart({
  avgImpressions,
  avatarColor,
}: PersonaImpressionsChartProps) {
  const data = useMemo(
    () => generateData(avgImpressions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [avgImpressions],
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium mb-4">7-Day Impressions</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => formatNumber(v)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: 8,
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value) => [formatNumber(Number(value)), "Impressions"]}
          />
          <Line
            type="monotone"
            dataKey="impressions"
            stroke={avatarColor}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
