import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import type { LLMResult } from "@langchain/core/outputs";

/**
 * Rough per-token cost table (USD).
 * Values represent approximate cost per 1 million tokens.
 */
const COST_PER_M_TOKENS: Record<string, { input: number; output: number }> = {
  "claude-4-5-sonnet":              { input: 3.0,  output: 15.0 },
  "claude-sonnet-4-6":              { input: 3.0,  output: 15.0 },
  "gemini-3-pro-preview":           { input: 1.25, output: 10.0 },
  "gemini-3.1-flash-lite-preview":  { input: 0.075, output: 0.3 },
  "gemini-3.1-pro-preview":         { input: 1.25, output: 10.0 },
  "gpt-5.4":                        { input: 2.5,  output: 10.0 },
};

const DEFAULT_COST = { input: 3.0, output: 15.0 };

/**
 * Computes the dollar cost for a given model call.
 */
export function computeCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const rates = COST_PER_M_TOKENS[modelName] ?? DEFAULT_COST;
  return (
    (inputTokens / 1_000_000) * rates.input +
    (outputTokens / 1_000_000) * rates.output
  );
}

/**
 * LangChain callback handler that accumulates token usage and cost
 * across all LLM calls during a single agent run.
 */
export class CostTracker extends BaseCallbackHandler {
  name = "CostTracker";

  totalInputTokens = 0;
  totalOutputTokens = 0;
  totalTokens = 0;
  totalCostUsd = 0;

  private modelName: string;

  constructor(modelName: string) {
    super();
    this.modelName = modelName;
  }

  async handleLLMEnd(output: LLMResult): Promise<void> {
    const usage = output.llmOutput?.tokenUsage ??
      output.llmOutput?.usage ??
      output.llmOutput?.estimatedTokenUsage;

    if (!usage) return;

    const inputTokens: number =
      usage.promptTokens ?? usage.input_tokens ?? usage.prompt_tokens ?? 0;
    const outputTokens: number =
      usage.completionTokens ?? usage.output_tokens ?? usage.completion_tokens ?? 0;

    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;
    this.totalTokens += inputTokens + outputTokens;
    this.totalCostUsd += computeCost(this.modelName, inputTokens, outputTokens);
  }

  /** Returns a plain summary object suitable for DB storage. */
  getSummary() {
    return {
      inputTokens: this.totalInputTokens,
      outputTokens: this.totalOutputTokens,
      totalTokens: this.totalTokens,
      costUsd: Math.round(this.totalCostUsd * 1_000_000) / 1_000_000, // 6 dp
      model: this.modelName,
    };
  }
}
