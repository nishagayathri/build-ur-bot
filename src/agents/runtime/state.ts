import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

/**
 * Shared LangGraph state annotation used by all Marketary agent graphs.
 */
export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  agentId: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  runId: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  storyId: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  currentStep: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "init",
  }),
  toolResults: Annotation<Record<string, unknown>>({
    reducer: (_prev, next) => next,
    default: () => ({}),
  }),
  iterations: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0,
  }),
  maxIterations: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 10,
  }),
});

export type AgentStateType = typeof AgentState.State;
