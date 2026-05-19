import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  DATA_SKILL_AGENTS,
  ENGAGEMENT_SKILL_AGENTS,
  COST_PER_OUTPUT,
  slugify,
} from "@/lib/skill-agent-maps";


// ─── Constants ──────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
];

/** Map SocialPlatform enum values to the Persona Platform enum. They share names. */
function socialPlatformToPersonaPlatform(
  sp: string,
): "X" | "INSTAGRAM" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "THREADS" | "REDDIT" | "TELEGRAM" {
  return sp as "X" | "INSTAGRAM" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "THREADS" | "REDDIT" | "TELEGRAM";
}

// ─── POST handler ───────────────────────────────────────────────────────────

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    const userId = await requireAuth();
    const { accountId } = await params;

    // Verify OWNER or ADMIN
    const membership = await prisma.accountMember.findUnique({
      where: { userId_accountId: { userId, accountId } },
    });
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch full account with relations
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        profile: true,
        skillConfigs: true,
        socialConnections: {
          where: { connected: true },
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (account.onboardingComplete) {
      return NextResponse.json(
        { error: "Account already launched" },
        { status: 400 },
      );
    }

    const profile = account.profile;
    const enabledSkills = new Set(
      account.skillConfigs
        .filter((s) => s.enabled)
        .map((s) => s.skillType as string),
    );
    const skillConfigMap = Object.fromEntries(
      account.skillConfigs.map((s) => [s.skillType, s.config as Record<string, unknown>]),
    );
    const connections = account.socialConnections;
    const slug = slugify(account.name);
    const instruments = profile?.markets ?? [];

    // ─── Build agent records ────────────────────────────────────────────

    type AgentCreateInput = {
      id: string;
      accountId: string;
      name: string;
      desk: "EIC" | "DATA_DESK" | "CONTENT_DESK" | "ENGAGEMENT_DESK";
      role: string;
      model: string;
      adapterType: string;
      budgetMonthlyUsd: number;
      costPerOutput: number;
      instrumentsWatched: string[];
      toolNames: string[];
      adapterConfig: Record<string, never>;
      assignedPersona?: string;
      status?: "ACTIVE" | "IDLE";
    };

    const agentsToCreate: AgentCreateInput[] = [];

    // 1) EIC Agent — always starts as ACTIVE (supervisory role)
    agentsToCreate.push({
      id: `agent-eic-${slug}`,
      accountId,
      name: "EIC Agent",
      desk: "EIC",
      role: "editor_in_chief",
      model: "claude-sonnet-4-6",
      adapterType: "process",
      budgetMonthlyUsd: 50,
      costPerOutput: COST_PER_OUTPUT["claude-sonnet-4-6"],
      instrumentsWatched: instruments,
      toolNames: ["pipelineQuery", "pipelineMutate", "signalStacking", "personaLookup", "budgetCheck", "checkCompetitorContext"],
      adapterConfig: {},
      status: "ACTIVE",
    });

    // 2) Data Desk agents
    for (const [skillType, agentDef] of Object.entries(DATA_SKILL_AGENTS)) {
      if (enabledSkills.has(skillType)) {
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
    }

    // 3) Content Desk — one Writer per connected platform
    for (const conn of connections) {
      const personaId = `persona-${conn.platform.toLowerCase()}-${slugify(conn.handle)}`;
      agentsToCreate.push({
        id: `agent-writer-${conn.platform.toLowerCase()}-${slugify(conn.handle)}`,
        accountId,
        name: `Writer: @${conn.handle}`,
        desk: "CONTENT_DESK",
        role: "writer",
        model: "claude-sonnet-4-6",
        adapterType: "process",
        budgetMonthlyUsd: 30,
        costPerOutput: COST_PER_OUTPUT["claude-sonnet-4-6"],
        instrumentsWatched: instruments,
        toolNames: ["pipelineQuery", "contentGenerate", "personaLookup", "budgetCheck"],
        adapterConfig: {},
        assignedPersona: personaId,
      });
    }


    // 5) Engagement Desk agents
    for (const [skillType, agentDef] of Object.entries(
      ENGAGEMENT_SKILL_AGENTS,
    )) {
      if (enabledSkills.has(skillType)) {
        const skillConfig = skillConfigMap[skillType] ?? {};
        const adapterConfig: Record<string, unknown> =
          skillType === "COMPETITOR_TRACKING"
            ? (() => {
                // Prefer new structured format; migrate legacy flat handles if present
                if (Array.isArray(skillConfig.competitors) && skillConfig.competitors.length > 0) {
                  return { competitors: skillConfig.competitors };
                }
                const legacyHandles = (skillConfig.competitor_handles as string[]) ?? [];
                return {
                  competitors: legacyHandles.map((h: string) => ({
                    name: h.replace(/^@/, ""),
                    handles: [{ platform: "X", handle: h.replace(/^@/, "") }],
                  })),
                };
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

    // ─── Build persona records ──────────────────────────────────────────

    const voicePersonality = profile?.voicePersonality ?? "professional";

    // Map content mix from profile to topic weights
    const contentMix = (profile?.contentMix ?? {}) as Record<string, number>;
    const topicWeights = {
      market_analysis: (contentMix.analysis ?? contentMix.market_analysis ?? 40) / 100,
      deriv_promo: (contentMix.promo ?? contentMix.deriv_promo ?? 20) / 100,
      macro_commentary:
        (contentMix.commentary ?? contentMix.macro_commentary ?? 25) / 100,
      engagement: (contentMix.engagement ?? 15) / 100,
    };

    const offLimitsTopics = profile?.offLimitsTopics ?? [];

    type PersonaCreateInput = {
      id: string;
      accountId: string;
      accountHandle: string;
      platform: "X" | "INSTAGRAM" | "LINKEDIN" | "TIKTOK" | "YOUTUBE" | "THREADS" | "REDDIT" | "TELEGRAM";
      displayName: string;
      voice: string;
      avatarColor: string;
      topicWeights: typeof topicWeights;
      maxPostsPerDay: number;
      postsToday: number;
      performance7d: { avg_impressions: number; avg_engagements: number; best_post_type: string };
      offLimitsTopics: string[];
      postingHours: { start: number; end: number };
    };

    const personasToCreate: PersonaCreateInput[] = connections.map(
      (conn, index) => ({
        id: `persona-${conn.platform.toLowerCase()}-${slugify(conn.handle)}`,
        accountId,
        accountHandle: conn.handle,
        platform: socialPlatformToPersonaPlatform(conn.platform),
        displayName: conn.displayName ?? conn.handle,
        voice: voicePersonality,
        avatarColor: AVATAR_PALETTE[index % AVATAR_PALETTE.length],
        topicWeights,
        maxPostsPerDay: 5,
        postsToday: 0,
        performance7d: {
          avg_impressions: 0,
          avg_engagements: 0,
          best_post_type: "thread",
        },
        offLimitsTopics: offLimitsTopics,
        postingHours: { start: 8, end: 22 },
      }),
    );

    // ─── Execute in a transaction ───────────────────────────────────────

    await prisma.$transaction(async (tx) => {
      // Upsert agents (idempotent — safe if launch is retried)
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
            assignedPersona: agent.assignedPersona ?? null,
            ...(agent.status && { status: agent.status }),
          },
          update: {
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
            assignedPersona: agent.assignedPersona ?? null,
            ...(agent.status && { status: agent.status }),
          },
        });
      }

      // Upsert personas (idempotent — safe if launch is retried)
      for (const persona of personasToCreate) {
        await tx.persona.upsert({
          where: { id: persona.id },
          create: {
            id: persona.id,
            accountId: persona.accountId,
            accountHandle: persona.accountHandle,
            platform: persona.platform,
            displayName: persona.displayName,
            voice: persona.voice,
            avatarColor: persona.avatarColor,
            topicWeights: persona.topicWeights,
            maxPostsPerDay: persona.maxPostsPerDay,
            postsToday: persona.postsToday,
            performance7d: persona.performance7d,
            offLimitsTopics: persona.offLimitsTopics,
            postingHours: persona.postingHours,
          },
          update: {
            accountHandle: persona.accountHandle,
            platform: persona.platform,
            displayName: persona.displayName,
            voice: persona.voice,
            avatarColor: persona.avatarColor,
            topicWeights: persona.topicWeights,
            maxPostsPerDay: persona.maxPostsPerDay,
            performance7d: persona.performance7d,
            offLimitsTopics: persona.offLimitsTopics,
            postingHours: persona.postingHours,
          },
        });
      }

      // Mark onboarding as complete
      await tx.account.update({
        where: { id: accountId },
        data: {
          onboardingComplete: true,
          onboardingStep: 6,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      agents_created: agentsToCreate.length,
      personas_created: personasToCreate.length,
    });
  } catch (err) {
    console.error("Launch failed:", err);
    const message =
      err instanceof Error ? err.message : "Launch failed";

    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
