import { ChatOpenAI } from "@langchain/openai";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- createReactAgent is deprecated in @langchain/langgraph/prebuilt but the
// replacement (createAgent in the langchain meta-package) is an entirely different API.
// Suppressing until LangGraph provides a true drop-in replacement.
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildEicPrompt } from "@/lib/prompt-builders";
import { initializeAgentPrompts } from "@/lib/prompt-initialization";
import { executeAgent } from "@/agents/runtime/executor";
import type { AuditEntry, Signal, StoryStatus, StoryPriority, EntityType } from "@/types";

// ─── Tools (scoped to accountId via closure) ────────────────────────────────

function buildTools(accountId: string) {
  const pipelineQueryTool = tool(
    async ({ status, entity, limit }) => {
      const where: Record<string, unknown> = { accountId };
      if (status) where.status = status;
      if (entity) where.entity = { contains: entity, mode: "insensitive" };

      const stories = await prisma.story.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
      });

      if (stories.length === 0) return "No stories found matching the query.";

      return stories
        .map((s) => {
          const signals = (s.signalsStacked as unknown as Signal[]) ?? [];
          return `[${s.id}] ${s.status} | ${s.priority} | ${s.entity} (${s.entityType}) | "${s.headline}" | stacking: ${s.stackingScore} | signals: ${signals.length} | persona: ${s.assignedPersona ?? "unassigned"}`;
        })
        .join("\n");
    },
    {
      name: "pipeline_query",
      description:
        "Query the story pipeline. Filter by status and/or entity. Returns a summary of matching stories with their IDs, status, priority, stacking scores, and assigned personas.",
      schema: z.object({
        status: z
          .string()
          .optional()
          .describe("Filter by story status (e.g. HUMAN_REVIEW, WRITING)"),
        entity: z
          .string()
          .optional()
          .describe("Filter by entity/asset name (e.g. BTC, NVDA)"),
        limit: z.number().optional().default(10).describe("Max results"),
      }),
    },
  );

  const agentStatusTool = tool(
    async ({ desk }) => {
      const where: Record<string, unknown> = { accountId };
      if (desk) where.desk = desk;

      const agents = await prisma.agent.findMany({ where });

      if (agents.length === 0) return "No agents found.";

      return agents
        .map(
          (a) =>
            `${a.name} [${a.desk}] | ${a.status} | task: ${a.currentTask ?? "idle"} | budget: $${a.spentMonthlyUsd}/$${a.budgetMonthlyUsd} (${Math.round((a.spentMonthlyUsd / a.budgetMonthlyUsd) * 100)}%) | outputs today: ${a.outputsToday}`,
        )
        .join("\n");
    },
    {
      name: "agent_status",
      description:
        "Check the current status of all agents or agents in a specific desk. Returns status, current task, budget usage, and output counts.",
      schema: z.object({
        desk: z
          .string()
          .optional()
          .describe(
            "Filter by desk: EIC, DATA_DESK, CONTENT_DESK, ENGAGEMENT_DESK",
          ),
      }),
    },
  );

  const budgetCheckTool = tool(
    async ({}) => {
      const agents = await prisma.agent.findMany({ where: { accountId } });

      if (agents.length === 0) return "No agents configured for this account.";

      const totalBudget = agents.reduce((s, a) => s + a.budgetMonthlyUsd, 0);
      const totalSpent = agents.reduce((s, a) => s + a.spentMonthlyUsd, 0);
      const daysPassed = new Date().getDate();
      const dailyBurn = totalSpent / Math.max(daysPassed, 1);

      let summary = `Total budget: $${totalBudget} | Spent: $${totalSpent.toFixed(2)} (${Math.round((totalSpent / totalBudget) * 100)}%) | Daily burn: $${dailyBurn.toFixed(2)}/day\n\n`;

      const overBudget = agents.filter(
        (a) => a.spentMonthlyUsd / a.budgetMonthlyUsd > 0.6,
      );
      if (overBudget.length) {
        summary += "Agents above 60% spend:\n";
        for (const a of overBudget) {
          const pct = Math.round(
            (a.spentMonthlyUsd / a.budgetMonthlyUsd) * 100,
          );
          summary += `  ${a.name}: $${a.spentMonthlyUsd}/$${a.budgetMonthlyUsd} (${pct}%)\n`;
        }
      }

      return summary;
    },
    {
      name: "budget_check",
      description:
        "Get a comprehensive budget overview across all agents, including total spend, daily burn rate, and agents nearing their limits.",
      schema: z.object({}),
    },
  );

  const personaLookupTool = tool(
    async ({ personaHandle }) => {
      const where: Record<string, unknown> = { accountId };
      if (personaHandle) where.accountHandle = personaHandle;

      const personas = await prisma.persona.findMany({ where });

      if (personas.length === 0) return "No personas found.";

      return personas
        .map(
          (p) =>
            `${p.accountHandle} (${p.displayName}) | ${p.postsToday}/${p.maxPostsPerDay} posts today | voice: ${p.voice.slice(0, 100)}... | off-limits: ${p.offLimitsTopics.join(", ")}`,
        )
        .join("\n");
    },
    {
      name: "persona_lookup",
      description:
        "Look up persona information including posting capacity, voice style, and content constraints.",
      schema: z.object({
        personaHandle: z
          .string()
          .optional()
          .describe(
            "Persona handle (e.g. @MarketaryFX). Omit to list all.",
          ),
      }),
    },
  );

  const scheduleTool = tool(
    async ({ storyId, scheduledTime, assignedPersona }) => {
      const story = await prisma.story.findFirst({
        where: { id: storyId, accountId },
      });
      if (!story) return `Story ${storyId} not found in this account.`;

      const trail = (story.auditTrail as unknown as AuditEntry[]) ?? [];
      trail.push({
        timestamp: new Date().toISOString(),
        agent: "EIC",
        action: `SCHEDULED for ${scheduledTime}${assignedPersona ? ` | persona: ${assignedPersona}` : ""}`,
      });

      // Normalize persona handle (strip @ prefix to match account_handle format)
      const normalizedPersona = assignedPersona?.replace(/^@/, '') ?? story.assignedPersona?.replace(/^@/, '') ?? null;

      const updated = await prisma.story.update({
        where: { id: storyId },
        data: {
          status: "SCHEDULED",
          scheduledTime: new Date(scheduledTime),
          assignedPersona: normalizedPersona,
          auditTrail: JSON.parse(JSON.stringify(trail)),
        },
      });

      // Wake the writer agent if a persona is assigned and no draft exists
      if (normalizedPersona && !updated.draftContent) {
        const persona = await prisma.persona.findFirst({
          where: { accountId, accountHandle: normalizedPersona },
        });
        if (persona) {
          const writerAgent = await prisma.agent.findFirst({
            where: {
              accountId,
              desk: "CONTENT_DESK",
              assignedPersona: persona.id,
              enabled: true,
            },
          });
          if (writerAgent && writerAgent.status !== "BUSY") {
            const directive = updated.eicDirective
              ? `EIC directive: ${updated.eicDirective}\n\n`
              : "";
            await executeAgent(writerAgent.id, {
              storyId: updated.id,
              task: `Write content for story ${updated.id}`,
              message:
                `You have been assigned a scheduled story. Produce content for it now in your persona's format.\n\n` +
                `Story ID: ${updated.id}\n` +
                `Headline: ${updated.headline}\n` +
                `Asset: ${updated.entity} (${updated.entityType})\n` +
                `Scheduled: ${scheduledTime}\n` +
                `${directive}` +
                `Use your tools to research, draft, and update the pipeline when done.`,
            }).catch((err: unknown) => {
              console.error(`[SCHEDULE] Failed to wake writer ${writerAgent.id}:`, err);
            });
          }
        }
      }

      return `Story ${storyId} scheduled for ${scheduledTime}${normalizedPersona ? ` | writer: ${normalizedPersona}` : " | no persona assigned — assign one to wake a writer"}`;
    },
    {
      name: "schedule_story",
      description:
        "Schedule or reschedule a story for publication at a specific time. Optionally assign a persona to trigger writer assignment.",
      schema: z.object({
        storyId: z.string().describe("Story ID"),
        scheduledTime: z
          .string()
          .describe(
            "ISO 8601 datetime for publication (e.g. 2026-04-15T14:00:00Z)",
          ),
        assignedPersona: z
          .string()
          .optional()
          .describe(
            "Persona handle to assign (e.g. instagram_user). If the story already has a persona, this is optional.",
          ),
      }),
    },
  );

  const createStoryTool = tool(
    async ({ entity, entityType, headline, priority, signals, assignedPersona }) => {
      const story = await prisma.story.create({
        data: {
          id: `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          accountId,
          entity,
          entityType: entityType as EntityType,
          headline,
          priority: priority as StoryPriority,
          assignedPersona: assignedPersona?.replace(/^@/, '') ?? null,
          signalsStacked: (signals ?? []) as unknown as never,
          auditTrail: JSON.parse(JSON.stringify([
            {
              timestamp: new Date().toISOString(),
              agent: "EIC",
              action: "Story created via EIC chat",
            },
          ])),
        },
      });

      await prisma.busEvent.create({
        data: {
          id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          accountId,
          type: "STORY_CREATED",
          agent: "EIC",
          message: `Story created: ${story.headline}`,
          storyId: story.id,
          priority: "NORMAL",
        },
      });

      return `Story created: [${story.id}] "${story.headline}" | status: ${story.status} | priority: ${story.priority} | persona: ${story.assignedPersona ?? "unassigned"}`;
    },
    {
      name: "create_story",
      description:
        "Create a new story in the pipeline. Use this whenever the user or a signal warrants a new story. Always call this to actually persist the story — describing it in text alone does nothing.",
      schema: z.object({
        entity: z.string().describe("Ticker or instrument (e.g. MU, EUR/USD, BTC)"),
        entityType: z
          .enum(["FOREX", "CRYPTO", "INDEX", "EQUITY", "COMMODITY"])
          .describe("Asset class"),
        headline: z.string().describe("Concise, newsworthy headline"),
        priority: z
          .enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"])
          .describe("Story urgency"),
        signals: z
          .array(z.record(z.string(), z.unknown()))
          .optional()
          .describe("Supporting signals (price move, news, etc.)"),
        assignedPersona: z
          .string()
          .optional()
          .describe("Persona handle to assign (e.g. @youtube_user)"),
      }),
    },
  );

  const updateStoryTool = tool(
    async ({ storyId, status, assignedPersona, note }) => {
      const story = await prisma.story.findFirst({ where: { id: storyId, accountId } });
      if (!story) return `Story ${storyId} not found in this account.`;

      const trail = (story.auditTrail as unknown as AuditEntry[]) ?? [];
      const changes: string[] = [];

      if (status) changes.push(`Status → ${status}`);
      if (assignedPersona !== undefined) changes.push(`Persona → ${assignedPersona ?? "unassigned"}`);
      if (note) changes.push(`Note: ${note}`);

      trail.push({
        timestamp: new Date().toISOString(),
        agent: "EIC",
        action: changes.join(" | "),
      });

      const updated = await prisma.story.update({
        where: { id: storyId },
        data: {
          ...(status ? { status: status as StoryStatus } : {}),
          ...(assignedPersona !== undefined ? { assignedPersona } : {}),
          auditTrail: JSON.parse(JSON.stringify(trail)),
        },
      });

      await prisma.busEvent.create({
        data: {
          id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          accountId,
          type: "EIC_DECISION",
          agent: "EIC",
          message: `Story ${storyId} updated: ${changes.join(", ")}`,
          storyId,
          priority: "NORMAL",
        },
      });

      return `Story updated: [${updated.id}] "${updated.headline}" | status: ${updated.status} | persona: ${updated.assignedPersona ?? "unassigned"}`;
    },
    {
      name: "update_story",
      description:
        "Update an existing story's status and/or assigned persona. Use to move stories through the pipeline (e.g. DETECTED → EIC_APPROVED → WRITING) or assign/reassign a writer persona.",
      schema: z.object({
        storyId: z.string().describe("Story ID from pipeline_query"),
        status: z
          .enum(["DETECTED", "RANKED", "EIC_APPROVED", "WRITING", "REVISION", "HUMAN_REVIEW", "SCHEDULED", "PUBLISHED", "KILLED", "REJECTED"])
          .optional()
          .describe("New status to set"),
        assignedPersona: z
          .string()
          .nullable()
          .optional()
          .describe("Persona handle to assign, or null to unassign"),
        note: z.string().optional().describe("Reason or editorial note for the audit trail"),
      }),
    },
  );

  const reinitializePromptsTool = tool(
    async ({}) => {
      // Fire-and-forget — generating prompts for all agents is a large LLM call
      // (~16k tokens). We kick it off in the background so the EIC can respond
      // immediately rather than blocking for 30-60 seconds.
      initializeAgentPrompts(accountId).catch((err) =>
        console.error("[reinitialize_prompts] background error:", err),
      );
      return "Prompt regeneration started in the background. Agents will have updated prompts within a minute.";
    },
    {
      name: "reinitialize_prompts",
      description:
        "Regenerate and save personalized system prompts for all agents on this team based on the current onboarding profile. Use when brand, voice, compliance, or skills have changed. Runs in the background — returns immediately.",
      schema: z.object({}),
    },
  );

  const updateNewsroomProfileTool = tool(
    async ({ markets }) => {
      const updates: string[] = [];

      if (markets !== undefined) {
        await prisma.accountProfile.update({
          where: { accountId },
          data: { markets },
        });
        // Keep all agents' instrument lists in sync
        await prisma.agent.updateMany({
          where: { accountId },
          data: { instrumentsWatched: markets },
        });
        updates.push(`markets → ${markets.join(", ")}`);
      }

      if (updates.length === 0) return "No changes provided.";
      return `Newsroom profile updated: ${updates.join("; ")}`;
    },
    {
      name: "update_newsroom_profile",
      description:
        "Update the newsroom's configuration directly. Use this when the user asks to change what markets or instruments are covered. Syncs the change across the account profile and all agents automatically.",
      schema: z.object({
        markets: z
          .array(z.string())
          .optional()
          .describe(
            "Updated list of markets or instruments to cover (e.g. ['Forex (FX)', 'Gold & Silver (Commodities)'])",
          ),
      }),
    },
  );

  const competitorIntelTool = tool(
    async ({ topics, lookback_days, report_types }) => {
      const since = new Date(Date.now() - lookback_days * 86_400_000);

      const where: Record<string, unknown> = {
        accountId,
        createdAt: { gte: since },
      };
      if (report_types && report_types.length > 0) {
        where.reportType = { in: report_types };
      }

      const reports = await prisma.competitorReport.findMany({
        where,
        orderBy: [{ urgency: "asc" }, { createdAt: "desc" }],
        take: 20,
        select: {
          id: true,
          reportType: true,
          source: true,
          observation: true,
          editorialOpportunity: true,
          urgency: true,
          recommendedAction: true,
          complianceNote: true,
          topics: true,
          engagementSummary: true,
          createdAt: true,
        },
      });

      const lowerTopics = topics.map((t: string) => t.toLowerCase());

      const relevant = reports
        .filter((r) => {
          if (topics.length === 0) return true;
          const rt = r.topics.map((t) => t.toLowerCase());
          return (
            lowerTopics.some((t: string) =>
              rt.some((x) => x.includes(t) || t.includes(x)),
            ) ||
            lowerTopics.some(
              (t: string) =>
                r.observation.toLowerCase().includes(t) ||
                r.source.toLowerCase().includes(t),
            )
          );
        })
        .sort((a, b) => {
          const order: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          return (order[a.urgency] ?? 2) - (order[b.urgency] ?? 2);
        })
        .slice(0, 10);

      if (relevant.length === 0) {
        return "No competitor intelligence found for these topics in the lookback window.";
      }

      return relevant
        .map((r) => {
          const age = Math.round(
            (Date.now() - r.createdAt.getTime()) / 3_600_000,
          );
          const eng = r.engagementSummary as Record<string, unknown> | null;
          const engLine = eng
            ? ` | engagement: ${eng.total_posts ?? "?"} posts, ${eng.total_likes ?? "?"} likes, ${eng.total_views ?? "?"} views`
            : "";
          return `[${r.reportType}] ${r.source} | ${r.urgency} | ${age}h ago${engLine}\n  Observation: ${r.observation}\n  Opportunity: ${r.editorialOpportunity}${r.complianceNote ? `\n  Compliance: ${r.complianceNote}` : ""}`;
        })
        .join("\n\n");
    },
    {
      name: "competitor_intel",
      description:
        "Retrieve recent competitor intelligence reports logged by the Competitor Monitor. " +
        "Use this when the user asks about competitor activity, recent reports, or the competitive landscape. " +
        "Pass topic keywords to filter, or leave empty to get all recent reports.",
      schema: z.object({
        topics: z
          .array(z.string())
          .default([])
          .describe(
            "Topic keywords to filter by (e.g. ['gold', 'technical analysis']). Leave empty for all recent reports.",
          ),
        lookback_days: z
          .number()
          .int()
          .min(1)
          .max(30)
          .default(7)
          .describe("How many days of reports to consider (default 7)."),
        report_types: z
          .array(z.string())
          .optional()
          .describe(
            "Filter by report type: BREAKING_GAP, NARRATIVE_SATURATION, BEGINNER_GAP, MISLEADING_CONTENT, FORMAT_TREND, GENERAL_INTELLIGENCE. Omit for all.",
          ),
      }),
    },
  );

  return [
    pipelineQueryTool,
    agentStatusTool,
    budgetCheckTool,
    personaLookupTool,
    scheduleTool,
    createStoryTool,
    updateStoryTool,
    reinitializePromptsTool,
    updateNewsroomProfileTool,
    competitorIntelTool,
  ];
}

// ─── Team roster builder ────────────────────────────────────────────────────

function buildTeamRoster(
  agents: { name: string; desk: string; model: string; status: string; budgetMonthlyUsd: number }[],
  personas: { accountHandle: string; displayName: string; platform: string; maxPostsPerDay: number }[],
): string {
  const lines: string[] = ["\n## Your Team (Live Roster)"];

  const desks = ["EIC", "DATA_DESK", "CONTENT_DESK", "ENGAGEMENT_DESK"] as const;
  for (const desk of desks) {
    const deskAgents = agents.filter((a) => a.desk === desk);
    if (deskAgents.length === 0) continue;

    lines.push(`\n### ${desk.replace(/_/g, " ")}`);
    for (const a of deskAgents) {
      lines.push(`- **${a.name}** — model: ${a.model} | status: ${a.status} | budget: $${a.budgetMonthlyUsd}/mo`);
    }
  }

  if (personas.length > 0) {
    lines.push("\n### Personas");
    for (const p of personas) {
      lines.push(`- **@${p.accountHandle}** (${p.displayName}) — ${p.platform} | ${p.maxPostsPerDay} posts/day max`);
    }
  }

  return lines.join("\n");
}

// ─── Graph builder ──────────────────────────────────────────────────────────

export async function buildEICChatGraph(accountId: string) {
  // Load account profile, agents, and personas
  const [profile, agents, personas] = await Promise.all([
    prisma.accountProfile.findUnique({ where: { accountId } }),
    prisma.agent.findMany({
      where: { accountId },
      select: { id: true, name: true, desk: true, model: true, status: true, budgetMonthlyUsd: true, systemPromptOverride: true },
    }),
    prisma.persona.findMany({
      where: { accountId },
      select: { accountHandle: true, displayName: true, platform: true, maxPostsPerDay: true },
    }),
  ]);

  // Auto-initialize agent prompts on first chat if not yet done
  const needsInit = agents.length > 0 && agents.every((a) => !a.systemPromptOverride);
  if (needsInit && profile) {
    console.log(`[EIC] First chat — initializing agent prompts for account ${accountId}`);
    await initializeAgentPrompts(accountId);
  }

  // Build account-specific system prompt
  let systemPrompt: string;

  if (profile) {
    systemPrompt = buildEicPrompt({
      markets: profile.markets,
      targetAudience: profile.targetAudience,
      editorialAngle: profile.editorialAngle,
      brandName: profile.brandName,
      brandOneLiner: profile.brandOneLiner,
      voicePersonality: profile.voicePersonality,
      secondaryVoice: profile.secondaryVoice,
      toneFormal: profile.toneFormal,
      toneSeriousness: profile.toneSeriousness,
      toneProvocativeness: profile.toneProvocativeness,
      toneTechnical: profile.toneTechnical,
      alwaysUseTerms: profile.alwaysUseTerms,
      neverUseTerms: profile.neverUseTerms,
      contentGoals: profile.contentGoals as string[],
      contentMix: (profile.contentMix ?? {}) as Record<string, number>,
      reactionSpeed: profile.reactionSpeed,
      isRegulated: profile.isRegulated,
      regulatoryJurisdiction: profile.regulatoryJurisdiction,
      requiredDisclaimers: profile.requiredDisclaimers,
      offLimitsTopics: profile.offLimitsTopics,
      predictionSensitivity: profile.predictionSensitivity,
      approvalRequirement: profile.approvalRequirement,
      triggerThresholds: (profile.triggerThresholds ?? {}) as Record<string, number>,
      prepositionEnabled: profile.prepositionEnabled,
      sentimentArbEnabled: profile.sentimentArbEnabled,
    });
  } else {
    // Fallback for accounts without a profile yet
    systemPrompt = `You are the Editor-in-Chief (EIC) of this AI-powered financial content newsroom.\n\nThis account has not completed onboarding yet. Ask the user to complete the setup wizard so you can access brand profile, compliance rules, and content strategy.`;
  }

  // Append live team roster
  if (agents.length > 0 || personas.length > 0) {
    systemPrompt += buildTeamRoster(agents, personas);
  }

  const model = new ChatOpenAI({
    model: "claude-sonnet-4-6",
    temperature: 0.3,
    streaming: true,
    configuration: {
      baseURL: process.env.LITELLM_BASE_URL || "https://litellmprod.deriv.ai/v1",
      apiKey: process.env.LITELLM_API_KEY,
    },
  });

  const tools = buildTools(accountId);

  return createReactAgent({
    llm: model,
    tools,
    prompt: systemPrompt,
  });
}
