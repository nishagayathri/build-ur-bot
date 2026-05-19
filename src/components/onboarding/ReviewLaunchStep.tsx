"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Rocket,
  Bot,
  Users,
  Link2,
  Shield,
  Brain,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  AccountDetail,
  AccountSkillConfigData,
  SocialConnectionInfo,
  SkillType,
} from "@/types";

// ─── Constants ──────────────────────────────────────────────────────────────

const DATA_SKILL_AGENTS: Record<string, { name: string; model: string }> = {
  TECHNICAL_ANALYSIS: { name: "Market Agent", model: "gemini-3.1-flash-lite-preview" },
  NEWS_MONITORING: { name: "News Agent", model: "gemini-3.1-flash-lite-preview" },
  ECONOMIC_CALENDAR: { name: "Calendar Agent", model: "gemini-3.1-flash-lite-preview" },
  EARNINGS_CALENDAR: { name: "Earnings Agent", model: "gemini-3.1-flash-lite-preview" },
  SOCIAL_SENTIMENT: { name: "Social Trend Agent", model: "gemini-3.1-flash-lite-preview" },
  REGULATORY_MONITOR: { name: "Regulatory Agent", model: "gemini-3.1-flash-lite-preview" },
};

const ENGAGEMENT_SKILL_AGENTS: Record<string, { name: string; model: string }> =
  {
    TREND_SURFACING: { name: "Trend Watcher", model: "gemini-3.1-flash-lite-preview" },
    AUTO_REPLY: { name: "Reply Agent", model: "gemini-3.1-flash-lite-preview" },
    COMPETITOR_TRACKING: { name: "Competitor Monitor", model: "gemini-3.1-flash-lite-preview" },
  };

const REACTION_SPEED_LABELS: Record<string, string> = {
  IMMEDIATE: "Immediate",
  FAST: "Fast",
  MEASURED: "Measured",
  NEXT_WINDOW: "Next Window",
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface AgentNode {
  name: string;
  model: string;
  children?: AgentNode[];
}

interface DeskNode {
  desk: string;
  children: AgentNode[];
}

interface ReviewLaunchStepProps {
  accountId: string;
  onLaunch: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildAgentTree(
  accountName: string,
  skills: AccountSkillConfigData[],
  connections: SocialConnectionInfo[],
): { root: AgentNode; totalAgents: number } {
  const enabledSkills = new Set(
    skills.filter((s) => s.enabled).map((s) => s.skill_type),
  );

  const desks: DeskNode[] = [];

  // DATA DESK
  const dataAgents: AgentNode[] = [];
  for (const [skillType, agent] of Object.entries(DATA_SKILL_AGENTS)) {
    if (enabledSkills.has(skillType as SkillType)) {
      dataAgents.push({ name: agent.name, model: agent.model });
    }
  }
  if (dataAgents.length > 0) {
    desks.push({ desk: "DATA DESK", children: dataAgents });
  }

  // CONTENT DESK
  const contentAgents: AgentNode[] = [];
  for (const conn of connections) {
    contentAgents.push({
      name: `Writer: @${conn.handle}`,
      model: "claude-sonnet-4-6",
    });
  }
  desks.push({ desk: "CONTENT DESK", children: contentAgents });

  // ENGAGEMENT DESK
  const engagementAgents: AgentNode[] = [];
  for (const [skillType, agent] of Object.entries(ENGAGEMENT_SKILL_AGENTS)) {
    if (enabledSkills.has(skillType as SkillType)) {
      engagementAgents.push({ name: agent.name, model: agent.model });
    }
  }
  if (engagementAgents.length > 0) {
    desks.push({ desk: "ENGAGEMENT DESK", children: engagementAgents });
  }

  // Build EIC root
  const eicChildren: AgentNode[] = desks.map((d) => ({
    name: d.desk,
    model: "",
    children: d.children,
  }));

  const root: AgentNode = {
    name: accountName,
    model: "",
    children: [
      {
        name: "EIC Agent",
        model: "claude-sonnet-4-6",
        children: eicChildren,
      },
    ],
  };

  // Count agents (EIC + Reviewer + data + content writers + engagement)
  let totalAgents = 1; // EIC
  totalAgents += dataAgents.length;
  totalAgents += connections.length; // Writers
  totalAgents += engagementAgents.length;

  return { root, totalAgents };
}

function countAgents(
  skills: AccountSkillConfigData[],
  connections: SocialConnectionInfo[],
): number {
  const enabledSkills = new Set(
    skills.filter((s) => s.enabled).map((s) => s.skill_type),
  );
  let count = 1; // EIC
  for (const skillType of Object.keys(DATA_SKILL_AGENTS)) {
    if (enabledSkills.has(skillType as SkillType)) count++;
  }
  count += connections.length; // Writers
  for (const skillType of Object.keys(ENGAGEMENT_SKILL_AGENTS)) {
    if (enabledSkills.has(skillType as SkillType)) count++;
  }
  return count;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {title}
    </div>
  );
}

function TreeNodeView({
  node,
  isLast,
  depth,
}: {
  node: AgentNode;
  isLast: boolean;
  depth: number;
}) {
  const isRoot = depth === 0;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={cn(!isRoot && "relative")}>
      <div
        className={cn(
          "flex items-center justify-between gap-3 py-1.5",
          !isRoot && "pl-5",
        )}
      >
        <div className="flex items-center gap-2">
          {!isRoot && (
            <span className="text-xs text-muted-foreground select-none">
              {isLast ? "└──" : "├──"}
            </span>
          )}
          <span
            className={cn(
              "text-sm",
              depth === 0 && "font-semibold",
              depth === 1 && "font-medium",
              depth === 2 && "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
              depth >= 3 && "text-sm",
            )}
          >
            {node.name}
          </span>
        </div>
        {node.model && (
          <Badge variant="secondary" className="font-mono text-[10px]">
            {node.model}
          </Badge>
        )}
      </div>
      {hasChildren && (
        <div
          className={cn(
            !isRoot && "ml-3 border-l border-border pl-3",
            isLast && !isRoot && "border-transparent",
          )}
        >
          {node.children!.map((child, i) => (
            <TreeNodeView
              key={`${child.name}-${i}`}
              node={child}
              isLast={i === node.children!.length - 1}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-48 w-full" />
      </div>
      <Skeleton className="h-10 w-48" />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function ReviewLaunchStep({
  accountId,
  onLaunch,
}: ReviewLaunchStepProps) {
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/accounts/${accountId}`);
        if (!res.ok) throw new Error("Failed to load account details");
        const data: AccountDetail = await res.json();
        if (!cancelled) {
          setAccount(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load account details. Please try again.");
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  const handleLaunch = useCallback(async () => {
    setLaunching(true);
    setLaunchError("");
    try {
      const res = await fetch(`/api/accounts/${accountId}/launch`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Launch failed");
      }
      const data = await res.json();
      toast.success("Newsroom launched", {
        description: `${data.agents_created} agents and ${data.personas_created} personas created. Redirecting to your EIC...`,
        duration: 4000,
      });
      onLaunch();
    } catch (err) {
      setLaunchError(
        err instanceof Error ? err.message : "Launch failed. Please try again.",
      );
      setLaunching(false);
    }
  }, [accountId, onLaunch]);

  if (loading) return <LoadingSkeleton />;

  if (error || !account) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">{error || "Account not found"}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const { profile, social_connections, skill_configs, members } = account;
  const enabledSkills = skill_configs.filter((s) => s.enabled);
  const connectedPlatforms = social_connections.filter((c) => c.connected);

  // Categorize skills for display
  const dataSkills = enabledSkills.filter((s) =>
    Object.keys(DATA_SKILL_AGENTS).includes(s.skill_type),
  );
  const contentSkills = enabledSkills.filter((s) =>
    [
      "THREAD_CREATION",
      "CHART_GENERATION",
      "MEME_CONTENT",
    ].includes(s.skill_type),
  );
  const engagementSkills = enabledSkills.filter((s) =>
    Object.keys(ENGAGEMENT_SKILL_AGENTS).includes(s.skill_type),
  );

  const { root: agentTree, totalAgents } = buildAgentTree(
    account.name,
    skill_configs,
    connectedPlatforms,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Review & Launch
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your newsroom configuration before launching. This will create
          your AI agent team and start monitoring your markets.
        </p>
      </div>

      {/* Account Section */}
      <section className="space-y-3">
        <SectionHeader icon={Users} title="Account" />
        <div className="rounded-lg border p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name</span>
              <div className="flex items-center gap-2">
                {account.color && (
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: account.color }}
                  />
                )}
                <p className="font-medium">{account.name}</p>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Team</span>
              <p className="font-medium">
                {members.length} member{members.length !== 1 ? "s" : ""}
              </p>
            </div>
            {account.description && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Description</span>
                <p className="font-medium">{account.description}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Separator />

      {/* Platforms Section */}
      <section className="space-y-3">
        <SectionHeader icon={Link2} title="Platforms" />
        <div className="flex flex-wrap gap-2">
          {connectedPlatforms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No platforms connected
            </p>
          ) : (
            connectedPlatforms.map((conn) => (
              <Badge key={conn.id} variant="outline" className="gap-1.5 py-1">
                <span className="font-medium">{conn.platform}</span>
                <span className="text-muted-foreground">@{conn.handle}</span>
              </Badge>
            ))
          )}
        </div>
      </section>

      <Separator />

      {/* Brand Profile Section */}
      {profile && (
        <>
          <section className="space-y-3">
            <SectionHeader icon={Brain} title="Brand Profile" />
            <div className="space-y-4 rounded-lg border p-4">
              {/* Markets */}
              <div>
                <span className="text-xs font-medium text-muted-foreground">
                  Markets
                </span>
                <p className="mt-1 text-sm font-medium">
                  {Array.isArray(profile.markets)
                    ? profile.markets.join(", ")
                    : profile.markets}
                </p>
              </div>

              {/* Voice */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Voice Personality
                  </span>
                  <p className="text-sm font-medium capitalize">
                    {profile.voice_personality.toLowerCase().replace(/_/g, " ")}
                    {profile.secondary_voice && (
                      <span className="text-muted-foreground">
                        {" "}
                        /{" "}
                        {profile.secondary_voice
                          .toLowerCase()
                          .replace(/_/g, " ")}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Reaction Speed
                  </span>
                  <p className="text-sm font-medium">
                    {REACTION_SPEED_LABELS[profile.reaction_speed] ??
                      profile.reaction_speed}
                  </p>
                </div>
              </div>

              {/* Compliance */}
              <div>
                <span className="text-xs font-medium text-muted-foreground">
                  Compliance
                </span>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge
                    variant={profile.is_regulated ? "default" : "secondary"}
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    {profile.is_regulated ? "Regulated" : "Unregulated"}
                  </Badge>
                  <Badge variant="outline">
                    Approval: {profile.approval_requirement.replace(/_/g, " ")}
                  </Badge>
                  <Badge variant="outline">
                    Sensitivity: {profile.prediction_sensitivity}
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          <Separator />
        </>
      )}

      {/* Skills Section */}
      <section className="space-y-3">
        <SectionHeader icon={ChevronRight} title="Skills" />
        <div className="space-y-3 rounded-lg border p-4">
          {enabledSkills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills enabled</p>
          ) : (
            <>
              {dataSkills.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Data Skills
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {dataSkills.map((s) => (
                      <Badge key={s.id} variant="secondary">
                        {s.skill_type.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {contentSkills.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Content Skills
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {contentSkills.map((s) => (
                      <Badge key={s.id} variant="secondary">
                        {s.skill_type.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {engagementSkills.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Engagement Skills
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {engagementSkills.map((s) => (
                      <Badge key={s.id} variant="secondary">
                        {s.skill_type.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Separator />

      {/* Agent Hierarchy Tree */}
      <section className="space-y-3">
        <SectionHeader icon={Bot} title="Agent Hierarchy" />
        <div className="rounded-lg border p-4">
          <TreeNodeView node={agentTree} isLast depth={0} />
        </div>
      </section>

      <Separator />

      {/* Launch */}
      <section className="space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-muted-foreground">
            This will create{" "}
            <span className="font-semibold text-foreground">
              {totalAgents} agent{totalAgents !== 1 ? "s" : ""}
            </span>{" "}
            and{" "}
            <span className="font-semibold text-foreground">
              {connectedPlatforms.length} persona
              {connectedPlatforms.length !== 1 ? "s" : ""}
            </span>{" "}
            for your newsroom.
          </p>
        </div>

        {launchError && (
          <p className="text-sm text-destructive">{launchError}</p>
        )}

        <Button
          size="lg"
          className="gap-2"
          onClick={handleLaunch}
          disabled={launching}
        >
          {launching ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Launching...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              Launch Newsroom
            </>
          )}
        </Button>
      </section>
    </div>
  );
}
