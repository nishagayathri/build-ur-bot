"use client";

import { useState } from "react";
import type { AccountPersona } from "@/types";
import { Badge } from "@/components/ui/badge";
import { PageTabBar } from "@/components/shared/PageTabBar";
import { PersonaPerformanceTab } from "@/components/personalities/PersonaPerformanceTab";
import { PersonaPostsTab } from "@/components/personalities/PersonaPostsTab";
import { PersonaSettingsTab } from "@/components/personalities/PersonaSettingsTab";

interface PersonaDetailLayoutProps {
  persona: AccountPersona;
}

const TABS = [
  { label: "Performance", value: "performance" },
  { label: "Posts", value: "posts" },
  { label: "Settings", value: "settings" },
];

export function PersonaDetailLayout({ persona }: PersonaDetailLayoutProps) {
  const [activeTab, setActiveTab] = useState("performance");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-white font-semibold text-lg"
          style={{ backgroundColor: persona.avatar_color }}
        >
          {persona.display_name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{persona.account_handle}</h1>
            <Badge variant="secondary" className="text-[11px] bg-surface-2 rounded px-1.5">
              {persona.platform}
            </Badge>
          </div>
          <p className="text-[13px] text-text-3">{persona.display_name}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[13px] text-text-3">
            {persona.posts_today} / {persona.max_posts_per_day} posts today
          </p>
        </div>
      </div>

      {/* Tabs */}
      <PageTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === "performance" && <PersonaPerformanceTab persona={persona} />}
      {activeTab === "posts" && <PersonaPostsTab persona={persona} />}
      {activeTab === "settings" && <PersonaSettingsTab persona={persona} />}
    </div>
  );
}
