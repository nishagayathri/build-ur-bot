"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const signalData = [
  { source: "PRICE", avgEngagement: 2800 },
  { source: "NEWS", avgEngagement: 2400 },
  { source: "SOCIAL_TREND", avgEngagement: 1900 },
  { source: "EARNINGS", avgEngagement: 3000 },
  { source: "ECON_CAL", avgEngagement: 1200 },
  { source: "DERIV_KB", avgEngagement: 800 },
];

export function SignalPerformanceBar() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium mb-4">Avg Engagement by Signal Source</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={signalData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="source"
            className="text-foreground"
            tick={{ fontSize: 11 }}
          />
          <YAxis className="text-foreground" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: 8,
            }}
          />
          <Bar
            dataKey="avgEngagement"
            fill="hsl(var(--primary))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
