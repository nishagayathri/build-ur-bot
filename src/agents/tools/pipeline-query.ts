import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAccountId } from "@/agents/runtime/agent-context";

/**
 * Internal tool that queries the story pipeline.
 * Agents use this to understand what is in the pipeline, filter by status
 * or entity, and decide on next actions.
 */
export const pipelineQuery = tool(
  async ({ status, entity, limit }) => {
    const where: Record<string, unknown> = {};
    try { where.accountId = getAccountId(); } catch { /* allow unscoped queries in fallback */ }
    if (status) where.status = status;
    if (entity) where.entity = { contains: entity, mode: "insensitive" };

    const stories = await prisma.story.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    if (stories.length === 0) {
      return "No stories match the given filters.";
    }

    const summary = stories.map((s) => ({
      id: s.id,
      status: s.status,
      priority: s.priority,
      entity: s.entity,
      entityType: s.entityType,
      headline: s.headline,
      stackingScore: s.stackingScore,
      assignedPersona: s.assignedPersona,
      updatedAt: s.updatedAt.toISOString(),
    }));

    return JSON.stringify(summary, null, 2);
  },
  {
    name: "pipelineQuery",
    description:
      "Query the Marketary story pipeline. Filter by status (e.g. DETECTED, RANKED, WRITING) and/or entity (e.g. EUR/USD, BTC). Returns a JSON summary of matching stories.",
    schema: z.object({
      status: z
        .string()
        .optional()
        .describe("Story status to filter by (e.g. DETECTED, RANKED, WRITING, PUBLISHED)"),
      entity: z
        .string()
        .optional()
        .describe("Entity or asset name to search for (partial match, case-insensitive)"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe("Maximum number of stories to return (default 10)"),
    }),
  },
);
