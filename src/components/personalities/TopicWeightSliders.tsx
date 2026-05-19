"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AccountPersona } from "@/types";

interface TopicWeightSlidersProps {
  weights: AccountPersona["topic_weights"];
  onChange: (weights: AccountPersona["topic_weights"]) => void;
}

const WEIGHT_LABELS: { key: keyof AccountPersona["topic_weights"]; label: string }[] = [
  { key: "market_analysis", label: "Market Analysis" },
  { key: "deriv_promo", label: "Deriv Promo" },
  { key: "macro_commentary", label: "Macro Commentary" },
  { key: "engagement", label: "Engagement" },
];

export function TopicWeightSliders({ weights, onChange }: TopicWeightSlidersProps) {
  const sum = Math.round(
    (weights.market_analysis + weights.deriv_promo + weights.macro_commentary + weights.engagement) * 100
  );

  function handleChange(key: keyof AccountPersona["topic_weights"], rawValue: number) {
    const newValue = rawValue / 100;
    onChange({ ...weights, [key]: newValue });
  }

  return (
    <div className="space-y-4">
      {WEIGHT_LABELS.map(({ key, label }) => (
        <div key={key} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[13px]">{label}</Label>
            <span className="text-[11px] text-muted-foreground">
              {Math.round(weights[key] * 100)}%
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            value={[Math.round(weights[key] * 100)]}
            onValueChange={(val) => {
              const arr = Array.isArray(val) ? val : [val];
              handleChange(key, arr[0]);
            }}
          />
        </div>
      ))}
      <p
        className={cn(
          "text-[13px] font-medium",
          sum === 100 ? "text-emerald-500" : "text-red-500"
        )}
      >
        Total: {sum}/100
      </p>
    </div>
  );
}
