"use client";

import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  value: string;
  count?: number;
}

interface PageTabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

export function PageTabBar({
  tabs,
  activeTab,
  onTabChange,
  className,
}: PageTabBarProps) {
  return (
    <div className={cn("flex gap-1 border-b border-border", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
          className={cn(
            "px-3 py-2.5 text-[13px] font-medium transition-colors duration-150 ease-out",
            activeTab === tab.value
              ? "border-b-2 border-genesis-accent text-text-1"
              : "text-text-3 hover:text-text-1"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 rounded-[999px] bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-text-2">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
