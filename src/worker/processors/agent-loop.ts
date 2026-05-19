import type PgBoss from "pg-boss";
import { prisma } from "../db";

interface AgentLoopData {
  agentId: string;
  trigger?: Record<string, unknown>;
}

export async function processAgentLoop(
  jobs: PgBoss.Job<AgentLoopData>[],
): Promise<void> {
  for (const job of jobs) {
    const { agentId, trigger } = job.data;

    console.log(`[agent-loop] Processing agent ${agentId}`, trigger ?? {});

    // Load agent config from DB
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });

    if (!agent) {
      console.warn(`[agent-loop] Agent ${agentId} not found, skipping`);
      continue;
    }

    if (!agent.enabled) {
      console.log(`[agent-loop] Agent ${agentId} is disabled, skipping`);
      continue;
    }

    if (agent.status === "PAUSED") {
      console.log(`[agent-loop] Agent ${agentId} is PAUSED, skipping`);
      continue;
    }

    try {
      // Attempt to dynamically import the executor module
      // It may not exist yet in early development phases
      const { executeAgent } = await import("../../agents/runtime/executor");
      await executeAgent(agentId, trigger);
      console.log(`[agent-loop] Agent ${agentId} executed successfully`);
    } catch (error) {
      // If the executor module doesn't exist yet, log what we would do
      if (
        error instanceof Error &&
        (error.message.includes("Cannot find module") ||
          error.message.includes("MODULE_NOT_FOUND"))
      ) {
        console.log(
          `[agent-loop] Executor not available yet. Would execute agent ${agentId}`,
          trigger,
        );
        // Simulate execution by updating agent status
        await prisma.agent.update({
          where: { id: agentId },
          data: {
            lastAction: `simulated-execution:${trigger?.type ?? "manual"}`,
            lastActionAt: new Date(),
          },
        });
        continue;
      }

      // Genuine execution error — set agent to ERROR status
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[agent-loop] Agent ${agentId} execution failed:`,
        errorMessage,
      );

      await prisma.agent.update({
        where: { id: agentId },
        data: {
          status: "ERROR",
          currentTask: `Error: ${errorMessage.slice(0, 200)}`,
        },
      });
    }
  }
}
