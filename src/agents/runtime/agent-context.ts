import { AsyncLocalStorage } from "node:async_hooks";

interface AgentExecutionContext {
  accountId: string;
  agentId: string;
}

export const agentContext = new AsyncLocalStorage<AgentExecutionContext>();

export function getAccountId(): string {
  const ctx = agentContext.getStore();
  if (!ctx) throw new Error("Agent context not set — are you inside executeAgent?");
  return ctx.accountId;
}

export function getAgentId(): string {
  const ctx = agentContext.getStore();
  if (!ctx) throw new Error("Agent context not set — are you inside executeAgent?");
  return ctx.agentId;
}
