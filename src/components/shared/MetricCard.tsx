"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "amber" | "danger";
  className?: string;
}

export function MetricCard({
  label,
  value,
  trend,
  trendValue,
  variant = "default",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-border bg-card p-6 transition-shadow duration-300 ease-in-out hover:shadow-[var(--shadow-1)]",
        variant === "amber" && "border-warning/40",
        variant === "danger" && "border-error/40",
        className
      )}
    >
      {/* Label — Genesis --label token */}
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-text-3 mb-3">
        {label}
      </p>

      {/* Value + trend inline — Genesis display font */}
      <div className="flex items-baseline gap-3">
        <p className="font-heading text-[48px] leading-[1.08] font-semibold tracking-[-0.015em] text-text-1">
          {value}
        </p>

        {trend && trend !== "neutral" && trendValue && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-[999px] px-2 py-0.5 text-[11px] font-semibold",
              trend === "up" && "bg-[#5B9A6F]/15 text-[#5B9A6F]",
              trend === "down" && "bg-[#D94F4F]/15 text-[#D94F4F]"
            )}
          >
            {trend === "up" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
