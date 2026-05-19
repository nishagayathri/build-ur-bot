import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  DATA_SKILL_AGENTS,
  ENGAGEMENT_SKILL_AGENTS,
  COST_PER_OUTPUT,
  slugify,
} from "@/lib/skill-agent-maps";

const VALID_SKILL_TYPES = new Set([
  "TECHNICAL_ANALYSIS",
  "NEWS_MONITORING",
  "ECONOMIC_CALENDAR",
  "EARNINGS_CALENDAR",
  "SOCIAL_SENTIMENT",
  "REGULATORY_MONITOR",
  "THREAD_CREATION",
  "CHART_GENERATION",
  "MEME_CONTENT",
  "AUTO_REPLY",
  "COMPETITOR_TRACKING",
  "TREND_SURFACING",
]);

/** POST /api/accounts/:accountId/agents-from-skills
 *  Upserts skill configs AND creates corresponding agents for newly-enabled skills.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    const userId = await requireAuth();
    const { accountId } = await params;

    const membership = await prisma.accountMember.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { skills } = await request.json();

    if (!Array.isArray(skills)) {
      return NextResponse.json(
        { error: "Skills array is required" },
        { status: 400 },
      );
    }

    const validSkills = skills.filter(
      (s: { skill_type: string }) => VALID_SKILL_TYPES.has(s.skill_type),
    );

    // Fetch account for slug generation + instruments
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { profile: true },
    });
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const slug = slugify(account.name);
    const instruments = account.profile?.markets ?? [];

    // Fetch existing agents to know which roles are already covered
    const existingAgents = await prisma.agent.findMany({
      where: { accountId },
      select: { role: true },
    });
    const existingRoles = new Set(existingAgents.map((a) => a.role));

    // Build list of agents to create
    type AgentCreateInput = {
      id: string;
      accountId: string;
      name: string;
      desk: "DATA_DESK" | "ENGAGEMENT_DESK";
      role: string;
      model: string;
      adapterType: string;
      budgetMonthlyUsd: number;
      costPerOutput: number;
      instrumentsWatched: string[];
      toolNames: string[];
      adapterConfig: Record<string, never>;
    };

    const agentsToCreate: AgentCreateInput[] = [];

    for (const skill of validSkills as { skill_type: string; enabled: boolean; config?: Record<string, unknown> }[]) {
      if (!skill.enabled) continue;

      const skillType = skill.skill_type;

      // Data desk agents
      if (skillType in DATA_SKILL_AGENTS && !existingRoles.has(DATA_SKILL_AGENTS[skillType].role)) {
        const agentDef = DATA_SKILL_AGENTS[skillType];
        agentsToCreate.push({
          id: `agent-${slugify(agentDef.role)}-${slug}`,
          accountId,
          name: agentDef.name,
          desk: "DATA_DESK",
          role: agentDef.role,
          model: agentDef.model,
          adapterType: "process",
          budgetMonthlyUsd: 10,
          costPerOutput: COST_PER_OUTPUT[agentDef.model],
          instrumentsWatched: instruments,
          toolNames: agentDef.toolNames,
          adapterConfig: {},
        });
      }

      // Engagement desk agents
      if (skillType in ENGAGEMENT_SKILL_AGENTS && !existingRoles.has(ENGAGEMENT_SKILL_AGENTS[skillType].role)) {
        const agentDef = ENGAGEMENT_SKILL_AGENTS[skillType];
        const adapterConfig: Record<string, unknown> =
          skillType === "COMPETITOR_TRACKING" && skill.config
            ? (() => {
                if (Array.isArray(skill.config.competitors) && skill.config.competitors.length > 0) {
                  return { competitors: skill.config.competitors };
                }
                return {};
              })()
            : {};

        agentsToCreate.push({
          id: `agent-${slugify(agentDef.role)}-${slug}`,
          accountId,
          name: agentDef.name,
          desk: "ENGAGEMENT_DESK",
          role: agentDef.role,
          model: agentDef.model,
          adapterType: "process",
          budgetMonthlyUsd: 10,
          costPerOutput: COST_PER_OUTPUT[agentDef.model],
          instrumentsWatched: instruments,
          toolNames: agentDef.toolNames ?? ["pipelineQuery", "budgetCheck"],
          adapterConfig: adapterConfig as Record<string, never>,
        });
      }
    }

    // Execute in a transaction: upsert skills + create agents
    await prisma.$transaction(async (tx) => {
      // Upsert skill configs
      for (const s of validSkills as { skill_type: string; enabled: boolean; config?: Record<string, unknown> }[]) {
        await tx.accountSkillConfig.upsert({
          where: {
            accountId_skillType: {
              accountId,
              skillType: s.skill_type as never,
            },
          },
          create: {
            accountId,
            skillType: s.skill_type as never,
            enabled: s.enabled,
            config: (s.config ?? {}) as Record<string, unknown> as never,
          },
          update: {
            enabled: s.enabled,
            config: (s.config ?? {}) as Record<string, unknown> as never,
          },
        });
      }

      // Create new agents
      for (const agent of agentsToCreate) {
        await tx.agent.upsert({
          where: { id: agent.id },
          create: {
            id: agent.id,
            accountId: agent.accountId,
            name: agent.name,
            desk: agent.desk,
            role: agent.role,
            model: agent.model,
            adapterType: agent.adapterType,
            budgetMonthlyUsd: agent.budgetMonthlyUsd,
            costPerOutput: agent.costPerOutput,
            instrumentsWatched: agent.instrumentsWatched,
            toolNames: agent.toolNames,
            adapterConfig: agent.adapterConfig,
          },
          update: {
            name: agent.name,
            model: agent.model,
            toolNames: agent.toolNames,
          },
        });
      }
    });

    return NextResponse.json({
      ok: true,
      agents_created: agentsToCreate.length,
    });
  } catch (err) {
    console.error("agents-from-skills failed:", err);
    const message = err instanceof Error ? err.message : "Failed to create agents";

    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
