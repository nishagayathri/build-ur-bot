import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Web search tool stub.
 *
 * This is a placeholder that will be replaced with a real search
 * integration (e.g. Tavily, SerpAPI, or Brave Search) once an API key
 * is configured in the environment.
 */
export const webSearch = tool(
  async ({ query }) => {
    return JSON.stringify({
      ok: false,
      query,
      results: [],
      message:
        "Web search is not configured. Add a search API key (TAVILY_API_KEY or SERP_API_KEY) to the environment to enable real-time web search. Until then, rely on the data already available in the pipeline and signal tables.",
    });
  },
  {
    name: "webSearch",
    description:
      "Search the web for real-time information about markets, news, or trends. NOTE: This tool is currently a stub and will return an error until a search API key is configured.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query to run"),
    }),
  },
);
