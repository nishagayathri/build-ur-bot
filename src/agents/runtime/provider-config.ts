import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";

/**
 * All models are routed through LiteLLM (OpenAI-compatible proxy).
 * Set LITELLM_BASE_URL and LITELLM_API_KEY in .env.
 *
 * Legacy model aliases are mapped to current LiteLLM model identifiers
 * so existing agents in the DB continue to work.
 */

const MODEL_ALIASES: Record<string, string> = {
  // Legacy → current
  "claude-3-5-sonnet": "claude-sonnet-4-6",
  "claude-sonnet-4":   "claude-sonnet-4-6",
  "claude-4-sonnet":   "claude-sonnet-4-6",
  "claude-3-5-haiku":  "gemini-3.1-flash-lite-preview",
  "claude-haiku-4":    "gemini-3.1-flash-lite-preview",
  "claude-haiku-4-5":  "gemini-3.1-flash-lite-preview",
  "gpt-4o":            "gpt-5.4",
  "gpt-4.1":           "gpt-5.4",
  "gpt-4.1-mini":      "gpt-5.4",
  "gemini-2.0-flash":  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash":  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-pro":    "gemini-3.1-pro-preview",
  "deepseek-r1":       "gemini-3-pro-preview",
};

const DEFAULT_MODEL = "claude-sonnet-4-6";

function resolveLiteLLMModel(name: string): string {
  return MODEL_ALIASES[name] ?? name;
}

export function getModel(modelName: string): BaseChatModel {
  const resolved = resolveLiteLLMModel(modelName || DEFAULT_MODEL);

  return new ChatOpenAI({
    model: resolved,
    temperature: 0.2,
    maxTokens: 4096,
    streaming: true,
    configuration: {
      baseURL: process.env.LITELLM_BASE_URL || "https://litellmprod.deriv.ai/v1",
      apiKey: process.env.LITELLM_API_KEY,
    },
  });
}
