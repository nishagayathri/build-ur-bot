import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Competitor content scan via Scrape Creators API.
 *
 * Fetches recent posts + engagement metrics for a list of competitor handles
 * on X or Instagram. The Competitor Monitor uses this to identify what rivals
 * are publishing, what's resonating, and where we can own the conversation.
 *
 * Endpoints used:
 *  - X:         GET /v1/twitter/user-tweets?handle=
 *  - Instagram: GET /v2/instagram/user/posts?handle=
 *
 * Auth: x-api-key header (SCRAPE_CREATORS_API_KEY env var)
 */

const BASE_URL = "https://api.scrapecreators.com";
const TIMEOUT_MS = 30_000;

type Platform = "X" | "INSTAGRAM";

interface NormalizedPost {
  handle: string;
  platform: Platform;
  text: string;
  published_at: string;
  url: string | null;
  engagement: {
    likes: number;
    comments: number;
    reposts: number;
    views: number | null;
  };
}

function apiKey(): string {
  const key = process.env.SCRAPE_CREATORS_API_KEY;
  if (!key) throw new Error("SCRAPE_CREATORS_API_KEY is not set");
  return key;
}

async function fetchJson(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "x-api-key": apiKey() },
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status}: ${text.slice(0, 200)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTwitter(handle: string, data: any): NormalizedPost[] {
  const tweets: unknown[] = data?.tweets ?? [];
  return (tweets as any[]).map((t) => {
    const legacy = t?.legacy ?? {};
    const views = parseInt(t?.views?.count ?? "0", 10) || null;
    const text = legacy.full_text ?? "";
    return {
      handle,
      platform: "X" as const,
      // Trim to 500 chars to keep token usage predictable
      text: text.length > 500 ? text.slice(0, 500) + "…" : text,
      published_at: legacy.created_at ?? "",
      url: t?.url ?? (legacy.id_str ? `https://x.com/${handle}/status/${legacy.id_str}` : null),
      engagement: {
        likes: legacy.favorite_count ?? 0,
        comments: legacy.reply_count ?? 0,
        reposts: legacy.retweet_count ?? 0,
        views,
      },
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeInstagram(handle: string, data: any): NormalizedPost[] {
  const items: unknown[] = data?.items ?? [];
  return (items as any[]).map((item) => {
    const captionText = item?.caption?.text ?? item?.caption ?? "";
    const code = item?.code ?? "";
    return {
      handle,
      platform: "INSTAGRAM" as const,
      // Trim to 500 chars to keep token usage predictable
      text: captionText.length > 500 ? captionText.slice(0, 500) + "…" : captionText,
      published_at: item?.taken_at
        ? new Date(item.taken_at * 1000).toISOString()
        : "",
      url: item?.url ?? (code ? `https://www.instagram.com/p/${code}/` : null),
      engagement: {
        likes: item?.like_count ?? 0,
        comments: item?.comment_count ?? 0,
        reposts: 0,
        views: item?.play_count ?? item?.ig_play_count ?? null,
      },
    };
  });
}

async function scanHandle(
  handle: string,
  platform: Platform,
  maxPosts: number,
  lookbackDays: number,
): Promise<NormalizedPost[]> {
  const clean = handle.replace(/^@/, "");
  const cutoff = Date.now() - lookbackDays * 86_400_000;

  let posts: NormalizedPost[];

  if (platform === "X") {
    const data = await fetchJson(`/v1/twitter/user-tweets?handle=${encodeURIComponent(clean)}&trim=true`);
    posts = normalizeTwitter(clean, data);
  } else {
    const data = await fetchJson(`/v2/instagram/user/posts?handle=${encodeURIComponent(clean)}&trim=true`);
    posts = normalizeInstagram(clean, data);
  }

  // Filter to lookback window and cap
  return posts
    .filter((p) => !p.published_at || new Date(p.published_at).getTime() >= cutoff)
    .slice(0, maxPosts);
}

export const competitorScan = tool(
  async ({ handles, platform, lookback_days, max_posts }) => {
    try {
      const results: NormalizedPost[] = [];
      const errors: string[] = [];

      for (const handle of handles) {
        try {
          const posts = await scanHandle(handle, platform, max_posts, lookback_days);
          results.push(...posts);
        } catch (err) {
          errors.push(`${handle}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      if (results.length === 0 && errors.length > 0) {
        return JSON.stringify({ ok: false, message: errors.join("; ") });
      }

      // Sort by total engagement descending
      results.sort(
        (a, b) =>
          b.engagement.likes + b.engagement.comments + b.engagement.reposts -
          (a.engagement.likes + a.engagement.comments + a.engagement.reposts),
      );

      return JSON.stringify({
        ok: true,
        count: results.length,
        posts: results,
        ...(errors.length ? { partial_errors: errors } : {}),
      });
    } catch (err) {
      return JSON.stringify({
        ok: false,
        message: `Competitor scan failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  },
  {
    name: "competitorScan",
    description:
      "Fetch recent posts and engagement data from competitor social accounts. " +
      "Call once per platform — e.g. call with platform=X for all X handles, then again with platform=INSTAGRAM for Instagram handles. " +
      "Returns posts sorted by total engagement (likes + comments + reposts) so you can identify " +
      "what content is resonating with their audience. Use this to detect breaking stories, " +
      "oversaturated narratives, and content gaps for editorial intelligence reports.",
    schema: z.object({
      handles: z
        .array(z.string())
        .min(1)
        .max(10)
        .describe(
          "Handles to scan — @ prefix is optional. e.g. ['CoinDesk', '@Cointelegraph', 'decryptmedia']",
        ),
      platform: z
        .enum(["X", "INSTAGRAM"])
        .describe("Platform to scan. Use X for Twitter, INSTAGRAM for Instagram."),
      lookback_days: z
        .number()
        .int()
        .min(1)
        .max(30)
        .default(7)
        .describe("How many days back to look for posts (default 7)."),
      max_posts: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(10)
        .describe("Maximum posts to retrieve per handle (default 10)."),
    }),
  },
);
