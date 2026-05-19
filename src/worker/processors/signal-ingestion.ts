import { prisma } from "../db";
import { getQueue } from "../queue";

/**
 * Signal ingestion processor — runs on a recurring schedule.
 * Finds all DATA_DESK agents that are enabled and not PAUSED,
 * then enqueues an agent-loop job for each to perform a signal scan.
 */
export async function processSignalIngestion(): Promise<void> {
  console.log("[signal-ingestion] Starting signal scan cycle");

  const agents = await prisma.agent.findMany({
    where: {
      desk: "DATA_DESK",
      enabled: true,
      status: { not: "PAUSED" },
    },
    select: { id: true, name: true },
  });

  if (agents.length === 0) {
    console.log("[signal-ingestion] No eligible DATA_DESK agents found");
    return;
  }

  console.log(
    `[signal-ingestion] Found ${agents.length} DATA_DESK agent(s) to trigger`,
  );

  const boss = await getQueue();

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  for (const agent of agents) {
    await boss.send("agent-loop", {
      agentId: agent.id,
      trigger: {
        type: "signal-scan",
        task: `Signal scan for ${today}. Use your tools to scan for events and data released between ${yesterday} and ${today} that fall within your role. For every story-worthy signal you detect, you MUST call pipelineMutate with action "create_story" immediately — do not describe signals in text only.`,
      },
    });
    console.log(
      `[signal-ingestion] Enqueued agent-loop for ${agent.name} (${agent.id})`,
    );
  }

  console.log("[signal-ingestion] Signal scan cycle complete");
}
