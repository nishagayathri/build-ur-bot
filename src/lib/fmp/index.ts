import { FMPClient } from "./client";

export { FMPClient } from "./client";
export type * from "./types";

let instance: FMPClient | null = null;

/**
 * Returns a lazily-initialised singleton FMP client.
 * Reads FMP_API_KEY from process.env at first call.
 */
export function getFMPClient(): FMPClient {
  if (!instance) {
    const apiKey = process.env.FMP_API_KEY;
    if (!apiKey) {
      throw new Error(
        "[fmp-client] FMP_API_KEY is not set in the environment. Add it to .env to enable FMP integration.",
      );
    }
    instance = new FMPClient({ apiKey });
  }
  return instance;
}
