import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Signal } from "@/types";

/**
 * Weights for the stacking score computation.
 */
const SOURCE_DIVERSITY_WEIGHT = 0.35;
const CONFIDENCE_WEIGHT = 0.40;
const RECENCY_WEIGHT = 0.25;

/**
 * Compute and persist a stacking score for a story based on its
 * accumulated signals. The score considers:
 *   1. Source diversity  - more distinct signal sources = higher score
 *   2. Average confidence - mean confidence across all signals
 *   3. Recency           - signals from the last hour boost the score
 */
export const signalStacking = tool(
  async ({ storyId }) => {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) {
      return JSON.stringify({ ok: false, error: `Story ${storyId} not found` });
    }

    const signals = (story.signalsStacked ?? []) as unknown as Signal[];
    if (signals.length === 0) {
      return JSON.stringify({ ok: true, storyId, stackingScore: 0, reason: "No signals to stack" });
    }

    // 1. Source diversity (0-1): unique sources / total possible sources
    const TOTAL_SOURCES = 6; // PRICE, NEWS, EARNINGS, ECONOMIC_CALENDAR, SOCIAL_TREND, DERIV_KNOWLEDGE
    const uniqueSources = new Set(signals.map((s) => s.source));
    const diversityScore = Math.min(uniqueSources.size / TOTAL_SOURCES, 1);

    // 2. Average confidence (0-1)
    const avgConfidence =
      signals.reduce((sum, s) => sum + (s.confidence ?? 0), 0) / signals.length;

    // 3. Recency bonus (0-1): fraction of signals from the last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentCount = signals.filter((s) => {
      const ts = new Date(s.timestamp).getTime();
      return ts >= oneHourAgo;
    }).length;
    const recencyScore = recentCount / signals.length;

    // Weighted composite
    const stackingScore = Math.round(
      (diversityScore * SOURCE_DIVERSITY_WEIGHT +
        avgConfidence * CONFIDENCE_WEIGHT +
        recencyScore * RECENCY_WEIGHT) *
        100,
    );

    // Persist
    await prisma.story.update({
      where: { id: storyId },
      data: { stackingScore },
    });

    return JSON.stringify({
      ok: true,
      storyId,
      stackingScore,
      breakdown: {
        sourceDiversity: Math.round(diversityScore * 100),
        avgConfidence: Math.round(avgConfidence * 100),
        recency: Math.round(recencyScore * 100),
        signalCount: signals.length,
        uniqueSources: [...uniqueSources],
      },
    });
  },
  {
    name: "signalStacking",
    description:
      "Compute a stacking score for a story based on its accumulated signals. The score weighs source diversity, average confidence, and signal recency. The result is persisted to the story record.",
    schema: z.object({
      storyId: z.string().describe("The story ID to compute stacking for"),
    }),
  },
);
