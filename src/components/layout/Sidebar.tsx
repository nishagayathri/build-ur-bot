"use client";

import { useSidebarContext } from "@/context/SidebarContext";
import { useAccountContext } from "@/context/AccountContext";
import { useInboxBadge } from "@/hooks/useInboxBadge";
import { useStories } from "@/hooks/useStories";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarSection } from "./SidebarSection";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Inbox,
  CircleDot,
  CalendarDays,
  Radio,
  MessageSquare,
  Bot,
  Users,
} from "lucide-react";
import type { StoryStatus } from "@/types";

const TERMINAL_STATUSES: StoryStatus[] = ["PUBLISHED", "REJECTED", "KILLED"];

export function Sidebar() {
  const { isCollapsed } = useSidebarContext();
  const { activeAccount } = useAccountContext();
  const { pendingCount, hasCritical } = useInboxBadge();
  const { data: allStories } = useStories();
  const pipelineCount =
    allStories?.filter((s) => !TERMINAL_STATUSES.includes(s.status)).length ??
    0;

  if (isCollapsed) return null;

  return (
    <div className="w-[184px] border-r border-border bg-surface-1 flex flex-col h-full">
      <div className="px-4 py-4">
        <span className="text-[13px] font-semibold text-text-1">
          {activeAccount ? `${activeAccount.name}'s workspace` : "Loading..."}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <SidebarNavItem
          label="Dashboard"
          icon={LayoutDashboard}
          href="/dashboard"
        />
        <SidebarNavItem
          label="Inbox"
          icon={Inbox}
          href="/inbox/pending"
          badge={pendingCount}
          alertDot={hasCritical}
        />

        <SidebarSection label="Newsroom">
          <SidebarNavItem
            label="Pipeline"
            icon={CircleDot}
            href="/pipeline"
            badge={pipelineCount > 0 ? pipelineCount : undefined}
          />
          <SidebarNavItem
            label="Calendar"
            icon={CalendarDays}
            href="/calendar"
          />
          <SidebarNavItem
            label="Data Room"
            icon={Radio}
            href="/data-room"
          />
        </SidebarSection>

        <SidebarSection label="Operations">
          <SidebarNavItem
            label="Chat"
            icon={MessageSquare}
            href="/chat"
          />
          <SidebarNavItem
            label="Agents"
            icon={Bot}
            href="/agents"
          />
          <SidebarNavItem
            label="Personalities"
            icon={Users}
            href="/personalities"
          />
        </SidebarSection>

      </nav>

      <div className="mt-auto px-4 pb-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-4 text-center py-2">
          Marketary v2.0.0
        </p>
      </div>
    </div>
  );
}
