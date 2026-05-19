import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import { getModel } from "./provider-config";
import { getToolsForAgent } from "../tools/registry";
import { agentContext } from "./agent-context";
import { loadAgentMemory, saveAgentMessage } from "./memory";
import { CostTracker } from "./cost-tracker";
import { EIC_SYSTEM_PROMPT } from "../prompts/eic-system";
import { getWriterSystemPrompt } from "../prompts/writer-system";
import { getDataDeskSystemPrompt } from "../prompts/data-desk-system";
import { getCompetitorMonitorSystemPrompt } from "../prompts/competitor-monitor-system";
import type { AgentDesk } from "@/types";

/**
 * Resolve the system prompt for an agent based on its desk, role, and
 * configuration stored in the DB.
 */
function resolveSystemPrompt(
  desk: AgentDesk,
  agentName: string,
  agent: {
    role: string;
    assignedPersona: string | null;
    instrumentsWatched: string[];
    adapterConfig: unknown;
    systemPromptOverride?: string | null;
  },
): string {
  // Prefer the persisted account-specific prompt over hardcoded fallbacks
  if (agent.systemPromptOverride) {
    const instrumentsList = agent.instrumentsWatched.join(", ") || "all instruments";
    return agent.systemPromptOverride.replace(/\{\{instruments\}\}/g, instrumentsList);
  }

  switch (desk) {
    case "EIC":
      return EIC_SYSTEM_PROMPT;

    case "DATA_DESK":
      return getDataDeskSystemPrompt(
        agentName,
        agent.instrumentsWatched,
        new Date().toISOString().split("T")[0],
      );

    case "CONTENT_DESK":
      return getWriterSystemPrompt(
        agent.assignedPersona ?? agentName,
        agent.role,
        [],
      );

    case "ENGAGEMENT_DESK":
      if (agent.role === "competitor_tracking") {
        const config = (agent.adapterConfig ?? {}) as Record<string, unknown>;
        const competitors =
          (config.competitors as unknown[]) ??
          (config.competitor_handles as string[]) ??
          [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return getCompetitorMonitorSystemPrompt(competitors as any);
      }
      return [
        `You are ${agentName}, an engagement agent in the Marketary newsroom.`,
        `Your role: ${agent.role}`,
        `You monitor published content performance and manage audience interactions.`,
        `Always stay professional, on-brand, and compliant.`,
      ].join("\n");

    default:
      return `You are ${agentName}. Role: ${agent.role}`;
  }
}

/**
 * Core agent executor — the main entry point for running any Marketary
 * agent through a LangGraph ReAct loop.
 *
 * Flow:
 *  1. Load agent config from DB
 *  2. Create an AgentRun record
 *  3. Set agent status to BUSY
 *  4. Build model + tools + memory
 *  5. Create and invoke a ReAct agent
 *  6. Persist results, steps, and cost
 *  7. Reset agent status to IDLE
 *  8. Emit a BusEvent
 */
export async function executeAgent(
  agentId: string,
  trigger?: Record<string, unknown>,
) {
  // 1. Load agent config
  const agent = await prisma.agent.findUniqueOrThrow({
    where: { id: agentId },
  });

  // 1b. Budget guard — block execution when budget is nearly exhausted
  const utilization = agent.budgetMonthlyUsd > 0
    ? agent.spentMonthlyUsd / agent.budgetMonthlyUsd
    : 0;
  if (utilization >= 0.95) {
    throw new Error(
      `Budget exhausted (${Math.round(utilization * 100)}% used). Reset or increase budget to continue.`,
    );
  }

  // 2. Atomic BUSY check — only one concurrent run per agent
  const busyResult = await prisma.agent.updateMany({
    where: { id: agentId, status: { not: "BUSY" } },
    data: {
      status: "BUSY",
      currentTask: (trigger?.task as string) ?? "Executing agent run",
    },
  });
  if (busyResult.count === 0) {
    throw new Error("Agent is already running or unavailable");
  }

  // 3. Create AgentRun
  const run = await prisma.agentRun.create({
    data: {
      agentId,
      storyId: (trigger?.storyId as string) ?? null,
      graphName: "react",
      input: (trigger ?? {}) as Record<string, string>,
      status: "RUNNING",
    },
  });

  const costTracker = new CostTracker(agent.model);

  // Wrap execution in AsyncLocalStorage so tools read context per-request
  return agentContext.run(
    { accountId: agent.accountId, agentId },
    async () => {
      try {
        // 4. Build model, tools, memory
        const model = getModel(agent.model);
        const tools = getToolsForAgent(agent.desk as AgentDesk, agent.name, agent.toolNames);
        const memory = await loadAgentMemory(agentId, 30);

        // Build system prompt
        const systemPrompt = resolveSystemPrompt(
          agent.desk as AgentDesk,
          agent.name,
          agent,
        );

        // Build the trigger message
        const triggerMessage =
          (trigger?.message as string) ??
          (trigger?.task as string) ??
          "Execute your current task based on the pipeline state.";

        // Assemble initial messages
        const messages = [
          new SystemMessage(systemPrompt),
          ...memory,
          new HumanMessage(triggerMessage),
        ];

        // 5. Create and invoke ReAct agent
        const reactAgent = createReactAgent({
          llm: model,
          tools,
        });

        // Record the initial step
        const initStep = await prisma.agentStep.create({
          data: {
            runId: run.id,
            nodeName: "agent",
            input: { triggerMessage },
          },
        });

        const result = await reactAgent.invoke(
          { messages },
          {
            callbacks: [costTracker],
            recursionLimit: 25,
          },
        );

        // Extract the final AI message
        const finalMessages = result.messages ?? [];
        const lastMessage = finalMessages[finalMessages.length - 1];
        const outputContent =
          typeof lastMessage?.content === "string"
            ? lastMessage.content
            : JSON.stringify(lastMessage?.content ?? "");

        // Complete the step
        await prisma.agentStep.update({
          where: { id: initStep.id },
          data: {
            output: { content: outputContent },
            endedAt: new Date(),
          },
        });

        // Record tool invocations from the message history
        for (const msg of finalMessages) {
          if (
            msg._getType() === "ai" &&
            "tool_calls" in msg &&
            Array.isArray((msg as Record<string, unknown>).tool_calls)
          ) {
            const toolCalls = (msg as Record<string, unknown>).tool_calls as Array<{
              name: string;
              args: Record<string, unknown>;
              id?: string;
            }>;
            for (const tc of toolCalls) {
              // Find the corresponding tool message
              const toolResponse = finalMessages.find(
                (m) =>
                  m._getType() === "tool" &&
                  "tool_call_id" in m &&
                  (m as Record<string, unknown>).tool_call_id === tc.id,
              );

              await prisma.toolInvocation.create({
                data: {
                  runId: run.id,
                  toolName: tc.name,
                  input: JSON.parse(JSON.stringify(tc.args)),
                  output: toolResponse
                    ? JSON.parse(JSON.stringify({ content: typeof toolResponse.content === "string" ? toolResponse.content : JSON.stringify(toolResponse.content) }))
                    : null,
                  endedAt: new Date(),
                },
              });
            }
          }
        }

        // Save the AI response to memory
        await saveAgentMessage(agentId, "ai", outputContent, {}, agent.accountId);

        // 6. Update AgentRun with results
        const costSummary = costTracker.getSummary();
        await prisma.agentRun.update({
          where: { id: run.id },
          data: {
            status: "COMPLETED",
            output: { content: outputContent },
            tokenCount: costSummary.totalTokens,
            costUsd: costSummary.costUsd,
            completedAt: new Date(),
          },
        });

        // Update agent spend
        await prisma.agent.update({
          where: { id: agentId },
          data: {
            spentMonthlyUsd: { increment: costSummary.costUsd },
            outputsToday: { increment: 1 },
            lastAction: outputContent.slice(0, 200),
            lastActionAt: new Date(),
          },
        });

        // 7. Emit BusEvent
        await prisma.busEvent.create({
          data: {
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            accountId: agent.accountId,
            type: "EIC_DECISION",
            agent: agent.name,
            message: `Agent run completed: ${outputContent.slice(0, 100)}`,
            storyId: (trigger?.storyId as string) ?? null,
            priority: "NORMAL",
          },
        });

        // 8. Safety net for DATA_DESK agents: if the agent ran signal stacking
        //    but never called pipelineMutate(create_story), surface an alert.
        if (agent.desk === "DATA_DESK") {
          type ToolCall = { name: string; args: Record<string, unknown> };

          const allToolCalls = finalMessages.flatMap((m) => {
            if (
              m._getType() === "ai" &&
              "tool_calls" in m &&
              Array.isArray((m as Record<string, unknown>).tool_calls)
            ) {
              return (m as Record<string, unknown>).tool_calls as ToolCall[];
            }
            return [];
          });

          const ranSignalStacking = allToolCalls.some((tc) => tc.name === "signalStacking");
          const createdStory = allToolCalls.some(
            (tc) => tc.name === "pipelineMutate" && tc.args?.action === "create_story",
          );

          if (ranSignalStacking && !createdStory) {
            await prisma.busEvent.create({
              data: {
                id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                accountId: agent.accountId,
                type: "SIGNAL_DETECTED",
                agent: agent.name,
                message: `${agent.name} detected a signal but did not create a story — review run ${run.id}`,
                storyId: null,
                priority: "HIGH",
              },
            });
          }
        }

        // Return the completed run
        return prisma.agentRun.findUniqueOrThrow({
          where: { id: run.id },
          include: { steps: true, tools: true },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Mark run as failed
        await prisma.agentRun.update({
          where: { id: run.id },
          data: {
            status: "FAILED",
            error: errorMessage,
            completedAt: new Date(),
          },
        }).catch((e) => console.error(`[executor] Failed to mark run ${run.id} as FAILED:`, e));

        // Emit error event
        await prisma.busEvent.create({
          data: {
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            accountId: agent.accountId,
            type: "BUDGET_WARNING",
            agent: agent.name,
            message: `Agent run failed: ${errorMessage.slice(0, 150)}`,
            storyId: (trigger?.storyId as string) ?? null,
            priority: "HIGH",
          },
        }).catch((e) => console.error(`[executor] Failed to emit error event:`, e));

        // Re-throw so the caller can handle it
        throw error;
      } finally {
        // Always reset agent status so it never stays stuck in BUSY
        await prisma.agent.update({
          where: { id: agentId },
          data: {
            status: agent.desk === "EIC" ? "ACTIVE" : "IDLE",
            currentTask: null,
          },
        }).catch((e) => console.error(`[executor] Failed to reset agent ${agentId} status:`, e));
      }
    },
  );
}
