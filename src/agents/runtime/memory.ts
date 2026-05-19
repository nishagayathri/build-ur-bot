import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";

/**
 * Loads the most recent conversation history for an agent from the
 * AgentMessage table and converts each row into the appropriate
 * LangChain message type.
 */
export async function loadAgentMemory(
  agentId: string,
  limit: number = 50,
): Promise<BaseMessage[]> {
  const rows = await prisma.agentMessage.findMany({
    where: { agentId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Reverse so messages are in chronological order for the LLM
  return rows.reverse().map((row) => {
    switch (row.role) {
      case "system":
        return new SystemMessage(row.content);
      case "human":
        return new HumanMessage(row.content);
      case "ai":
        return new AIMessage(row.content);
      case "tool":
        return new ToolMessage({
          content: row.content,
          tool_call_id: (row.metadata as Record<string, string>)?.tool_call_id ?? "unknown",
        });
      default:
        return new HumanMessage(row.content);
    }
  });
}

/**
 * Persists a single agent message to the AgentMessage table.
 */
export async function saveAgentMessage(
  agentId: string,
  role: "system" | "human" | "ai" | "tool",
  content: string,
  metadata: Record<string, unknown> = {},
  accountId?: string,
): Promise<void> {
  // If accountId not provided, look it up from the agent record
  let resolvedAccountId = accountId;
  if (!resolvedAccountId) {
    const agent = await prisma.agent.findUniqueOrThrow({ where: { id: agentId } });
    resolvedAccountId = agent.accountId;
  }

  await prisma.agentMessage.create({
    data: {
      accountId: resolvedAccountId,
      agentId,
      role,
      content,
      metadata: metadata as Record<string, string>,
    },
  });
}
