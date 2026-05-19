import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * Query persona availability and configuration.
 * If a personaId is supplied, returns that specific persona.
 * Otherwise returns all personas with their current posting capacity.
 */
export const personaLookup = tool(
  async ({ personaId }) => {
    if (personaId) {
      const persona = await prisma.persona.findUnique({
        where: { id: personaId },
      });
      if (!persona) {
        return JSON.stringify({ ok: false, error: `Persona ${personaId} not found` });
      }
      return JSON.stringify({
        ok: true,
        persona: {
          id: persona.id,
          handle: persona.accountHandle,
          platform: persona.platform,
          displayName: persona.displayName,
          voice: persona.voice,
          topicWeights: persona.topicWeights,
          postsToday: persona.postsToday,
          maxPostsPerDay: persona.maxPostsPerDay,
          remainingPosts: persona.maxPostsPerDay - persona.postsToday,
          offLimitsTopics: persona.offLimitsTopics,
          postingHours: persona.postingHours,
        },
      });
    }

    // Return all personas with capacity info
    const personas = await prisma.persona.findMany({
      orderBy: { accountHandle: "asc" },
    });

    const summary = personas.map((p) => ({
      id: p.id,
      handle: p.accountHandle,
      platform: p.platform,
      voice: p.voice,
      postsToday: p.postsToday,
      maxPostsPerDay: p.maxPostsPerDay,
      remainingPosts: p.maxPostsPerDay - p.postsToday,
      topicWeights: p.topicWeights,
    }));

    return JSON.stringify({ ok: true, personas: summary });
  },
  {
    name: "personaLookup",
    description:
      "Look up persona information including posting capacity, voice description, topic weights, and off-limits topics. Provide a personaId for a specific persona, or omit it to list all personas.",
    schema: z.object({
      personaId: z
        .string()
        .optional()
        .describe("Specific persona ID to look up. Omit to list all personas."),
    }),
  },
);
