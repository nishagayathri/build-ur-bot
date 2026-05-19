import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAccountId } from "@/agents/runtime/agent-context";
import type { StoryStatus, StoryPriority, EntityType, AuditEntry } from "@/types";

/**
 * Internal tool that creates or updates stories in the pipeline.
 * Every mutation also emits a BusEvent so downstream agents and the UI
 * stay in sync.
 */
export const pipelineMutate = tool(
  async ({ action, storyId, data }) => {
    switch (action) {
      case "create_story": {
        const d = (data ?? {}) as Record<string, unknown>;
        const story = await prisma.story.create({
          data: {
            id: `story_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            accountId: getAccountId(),
            entity: (d.entity as string) ?? "UNKNOWN",
            entityType: ((d.entityType as string) ?? "FOREX") as EntityType,
            headline: (d.headline as string) ?? "Untitled story",
            priority: ((d.priority as string) ?? "MEDIUM") as StoryPriority,
            signalsStacked: (d.signals as unknown) ?? [],
            auditTrail: JSON.parse(JSON.stringify([
              {
                timestamp: new Date().toISOString(),
                agent: (d.agent as string) ?? "system",
                action: "Story created via pipeline-mutate tool",
              },
            ])),
          },
        });

        await prisma.busEvent.create({
          data: {
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            accountId: getAccountId(),
            type: "STORY_CREATED",
            agent: (d.agent as string) ?? "system",
            message: `Story created: ${story.headline}`,
            storyId: story.id,
            priority: "NORMAL",
          },
        });

        return JSON.stringify({ ok: true, storyId: story.id, headline: story.headline });
      }

      case "update_status": {
        if (!storyId) return JSON.stringify({ ok: false, error: "storyId is required for update_status" });
        const d = (data ?? {}) as Record<string, unknown>;
        const newStatus = (d.status as string) ?? "DETECTED";

        // Read current story to append to audit trail
        const existing = await prisma.story.findUniqueOrThrow({ where: { id: storyId } });
        const trail = (existing.auditTrail as unknown as AuditEntry[]) ?? [];
        trail.push({
          timestamp: new Date().toISOString(),
          agent: (d.agent as string) ?? "system",
          action: `Status updated to ${newStatus}`,
        });

        const story = await prisma.story.update({
          where: { id: storyId },
          data: {
            status: newStatus as StoryStatus,
            auditTrail: JSON.parse(JSON.stringify(trail)),
          },
        });

        await prisma.busEvent.create({
          data: {
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            accountId: getAccountId(),
            type: "EIC_DECISION",
            agent: (d.agent as string) ?? "system",
            message: `Story ${storyId} status changed to ${newStatus}`,
            storyId,
            priority: "NORMAL",
          },
        });

        return JSON.stringify({ ok: true, storyId: story.id, newStatus: story.status });
      }

      case "assign_persona": {
        if (!storyId) return JSON.stringify({ ok: false, error: "storyId is required for assign_persona" });
        const d = (data ?? {}) as Record<string, unknown>;
        const persona = (d.persona as string) ?? null;

        // Read current story to append to audit trail
        const existing = await prisma.story.findUniqueOrThrow({ where: { id: storyId } });
        const trail = (existing.auditTrail as unknown as AuditEntry[]) ?? [];
        trail.push({
          timestamp: new Date().toISOString(),
          agent: (d.agent as string) ?? "system",
          action: `Persona assigned: ${persona}`,
        });

        const story = await prisma.story.update({
          where: { id: storyId },
          data: {
            assignedPersona: persona,
            auditTrail: JSON.parse(JSON.stringify(trail)),
          },
        });

        await prisma.busEvent.create({
          data: {
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            accountId: getAccountId(),
            type: "WRITER_ASSIGNED",
            agent: (d.agent as string) ?? "system",
            message: `Persona ${persona} assigned to story ${storyId}`,
            storyId,
            priority: "NORMAL",
          },
        });

        return JSON.stringify({ ok: true, storyId: story.id, assignedPersona: persona });
      }

      default:
        return JSON.stringify({ ok: false, error: `Unknown action: ${action}` });
    }
  },
  {
    name: "pipelineMutate",
    description:
      "Create or update stories in the Marketary pipeline. Actions: create_story (creates a new story), update_status (changes story status), assign_persona (assigns a persona to a story). Each mutation emits a BusEvent.",
    schema: z.object({
      action: z
        .enum(["create_story", "update_status", "assign_persona"])
        .describe("The mutation to perform"),
      storyId: z
        .string()
        .optional()
        .describe("Story ID (required for update_status and assign_persona)"),
      data: z
        .record(z.string(), z.any())
        .optional()
        .describe(
          "Additional data for the action. For create_story: { entity, entityType, headline, priority, signals, agent }. For update_status: { status, agent }. For assign_persona: { persona, agent }.",
        ),
    }),
  },
);
