"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { usePersonas } from "@/hooks/usePersonas";
import type { AccountPersona } from "@/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function generateImpressionData(personas: AccountPersona[]) {
  return DAYS.map((day) => {
    const row: Record<string, string | number> = { day };
    personas.forEach((p) => {
      const base = p.performance_7d.avg_impressions;
      row[p.account_handle] = Math.round(base * (0.7 + Math.random() * 0.6));
    });
    return row;
  });
}

export function ImpressionsLineChart() {
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];

  const data = useMemo(
    () => generateImpressionData(personasList),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [personasList.length]
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-medium mb-4">Impressions by Persona</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="day"
            className="text-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis className="text-foreground" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: 8,
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend />
          {personasList.map((p) => (
            <Line
              key={p.persona_id}
              type="monotone"
              dataKey={p.account_handle}
              stroke={p.avatar_color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
