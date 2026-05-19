import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * Check budget constraints for an agent.
 * Returns monthly limit, amount spent, remaining budget, and a
 * daily burn-rate estimate based on the current day of the month.
 */
export const budgetCheck = tool(
  async ({ agentId }) => {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return JSON.stringify({ ok: false, error: `Agent ${agentId} not found` });
    }

    const remaining = agent.budgetMonthlyUsd - agent.spentMonthlyUsd;
    const dayOfMonth = new Date().getDate();
    const dailyBurnRate =
      dayOfMonth > 0 ? agent.spentMonthlyUsd / dayOfMonth : 0;

    // Estimate days of budget remaining at current burn rate
    const daysRemaining =
      dailyBurnRate > 0 ? Math.floor(remaining / dailyBurnRate) : Infinity;

    // Warning thresholds
    const utilizationPct =
      agent.budgetMonthlyUsd > 0
        ? (agent.spentMonthlyUsd / agent.budgetMonthlyUsd) * 100
        : 0;
    const warning =
      utilizationPct >= 90
        ? "CRITICAL: Budget nearly exhausted"
        : utilizationPct >= 75
          ? "WARNING: Budget above 75% utilization"
          : null;

    return JSON.stringify({
      ok: true,
      agentId: agent.id,
      agentName: agent.name,
      budget: {
        monthlyLimitUsd: agent.budgetMonthlyUsd,
        spentUsd: Math.round(agent.spentMonthlyUsd * 100) / 100,
        remainingUsd: Math.round(remaining * 100) / 100,
        utilizationPct: Math.round(utilizationPct * 10) / 10,
        dailyBurnRate: Math.round(dailyBurnRate * 100) / 100,
        estimatedDaysRemaining: daysRemaining === Infinity ? "unlimited" : daysRemaining,
        costPerOutput: agent.costPerOutput,
        outputsToday: agent.outputsToday,
      },
      warning,
    });
  },
  {
    name: "budgetCheck",
    description:
      "Check the budget status of an agent. Returns monthly limit, amount spent, remaining budget, daily burn rate, and any warnings about high utilization.",
    schema: z.object({
      agentId: z.string().describe("The agent ID to check budget for"),
    }),
  },
);
