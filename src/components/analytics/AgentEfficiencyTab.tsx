"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { MetricCard } from "@/components/shared/MetricCard";

interface AgentEfficiencyTabProps {
  dateRange: string;
}

const throughputData = [
  { agent: "Market Agent", stories: 42 },
  { agent: "News Agent", stories: 67 },
  { agent: "Econ Calendar", stories: 8 },
  { agent: "Social Trend", stories: 31 },
  { agent: "Deriv KB", stories: 9 },
  { agent: "Writer (FX)", stories: 4 },
  { agent: "Writer (Deriv)", stories: 3 },
  { agent: "Writer (Crypto)", stories: 5 },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const decisionSpeedData = DAYS.map((day) => ({
  day,
  minutes: +(1 + Math.random() * 3).toFixed(1),
  target: 2,
}));

const prepositionedData = [
  {
    event: "Fed Rate Decision",
    scenarios: 3,
    fired: true,
    latency: "47s",
    engagementVsAvg: "+340%",
  },
  {
    event: "ECB Rate Decision",
    scenarios: 2,
    fired: true,
    latency: "62s",
    engagementVsAvg: "+210%",
  },
  {
    event: "US CPI Release",
    scenarios: 3,
    fired: false,
    latency: "—",
    engagementVsAvg: "—",
  },
  {
    event: "NVDA Earnings",
    scenarios: 2,
    fired: true,
    latency: "38s",
    engagementVsAvg: "+520%",
  },
  {
    event: "BoJ Rate Decision",
    scenarios: 3,
    fired: true,
    latency: "55s",
    engagementVsAvg: "+180%",
  },
];

export function AgentEfficiencyTab({
  dateRange: _dateRange,
}: AgentEfficiencyTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Stories Processed" value={47} />
        <MetricCard label="Avg EIC Decision Time" value="1m 42s" />
        <MetricCard label="Revision Rate" value="23%" />
        <MetricCard label="Pre-positioned Success Rate" value="89%" />
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-4">Story Throughput by Agent</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={throughputData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              type="number"
              className="text-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="agent"
              width={120}
              className="text-foreground"
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: 8,
              }}
            />
            <Bar
              dataKey="stories"
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-medium mb-4">
            EIC Decision Speed (RANKED → EIC_APPROVED)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={decisionSpeedData}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
              />
              <XAxis
                dataKey="day"
                className="text-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                className="text-foreground"
                tick={{ fontSize: 12 }}
                domain={[0, 5]}
                label={{
                  value: "minutes",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: 8,
                }}
                formatter={(value) => `${value} min`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="#3b82f6"
                strokeWidth={2}
                dot
                name="Actual"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#ef4444"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Target (2 min)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-4">
          Pre-positioned Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Event</th>
                <th className="pb-2 pr-4 font-medium text-right">Scenarios</th>
                <th className="pb-2 pr-4 font-medium">Fired</th>
                <th className="pb-2 pr-4 font-medium text-right">Latency</th>
                <th className="pb-2 font-medium text-right">Eng vs Avg</th>
              </tr>
            </thead>
            <tbody>
              {prepositionedData.map((row) => (
                <tr
                  key={row.event}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-2 pr-4 font-medium">{row.event}</td>
                  <td className="py-2 pr-4 text-right">{row.scenarios}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        row.fired
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      }
                    >
                      {row.fired ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right">{row.latency}</td>
                  <td className="py-2 text-right font-medium">
                    {row.engagementVsAvg}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
