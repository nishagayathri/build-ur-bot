import { randomUUID } from "node:crypto";
import { prisma } from "../db";

/**
 * Daily budget reset processor.
 * Resets outputsToday to 0 for all agents and creates a
 * BUDGET_WARNING bus event noting the reset.
 */
export async function processBudgetReset(): Promise<void> {
  console.log("[budget-reset] Starting daily budget reset");

  const result = await prisma.agent.updateMany({
    data: { outputsToday: 0 },
  });

  console.log(
    `[budget-reset] Reset outputsToday for ${result.count} agent(s)`,
  );

  // Create a bus event per account (pick the first agent from each account)
  const agents = await prisma.agent.findMany({
    select: { accountId: true },
    distinct: ["accountId"],
  });

  for (const { accountId } of agents) {
    await prisma.busEvent.create({
      data: {
        id: randomUUID(),
        accountId,
        type: "BUDGET_WARNING",
        agent: "worker:budget-reset",
        message: `Daily budget reset complete. Reset outputsToday for ${result.count} agent(s).`,
        priority: "NORMAL",
      },
    });
  }

  console.log("[budget-reset] Daily budget reset complete");
}
