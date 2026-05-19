import type { StoryStatus } from "@/types";

export const PIPELINE_STAGES = [
  "DETECTED",
  "RANKED",
  "EIC_APPROVED",
  "WRITING",
  "REVISION",
  "HUMAN_REVIEW",
  "SCHEDULED",
  "PUBLISHED",
] as const satisfies readonly StoryStatus[];

export const PIPELINE_STAGE_LABELS: Record<
  (typeof PIPELINE_STAGES)[number],
  string
> = {
  DETECTED: "Signal detected",
  RANKED: "Ranked for coverage",
  EIC_APPROVED: "EIC approved",
  WRITING: "Draft in progress",
  REVISION: "Revision pass",
  HUMAN_REVIEW: "Human review",
  SCHEDULED: "Scheduled to publish",
  PUBLISHED: "Published",
};

export const EVENT_BUS_INTERVAL_MS = 2500;
export const AGENT_SIMULATION_INTERVAL_MS = 5000;
export const MARKET_SIGNAL_INTERVAL_MS = 3000;
export const MAX_EVENTS_IN_MEMORY = 100;
export const MAX_FEED_ITEMS = 30;

export const AGENT_TASK_POOLS: Record<string, string[]> = {
  "Market Agent": [
    "Recompute EUR/USD intraday volatility bands",
    "Cross-check BTC spot vs perpetual basis divergence",
    "Flag WTI inventory surprise vs consensus range",
    "Refresh NASDAQ futures correlation to USD index",
    "Validate gold session highs against liquidity windows",
  ],
  "News Agent": [
    "Cluster central bank headline duplicates",
    "Score earnings call transcripts for tradable quotes",
    "Extract issuer guidance deltas from filings",
    "De-duplicate wire alerts across three vendors",
    "Map geopolitical headlines to watched FX pairs",
  ],
  "Economic Calendar Agent": [
    "Check CPI consensus vs whisper spread thresholds",
    "Reconcile NFP release timestamps across regions",
    "Queue PMI surprise thresholds for auto-ranking",
    "Refresh Fed speaker schedule and blackout rules",
    "Attach impact tags to G7 macro prints",
  ],
  "Social Trend Agent": [
    "Rank X volume spikes by sustained velocity",
    "Detect coordinated hashtag bursts on altcoins",
    "Score meme-cycle fatigue for ETH narratives",
    "Compare TikTok finance chatter to price action",
    "Surface contrarian threads with rising engagement",
  ],
  "Deriv Knowledge Agent": [
    "Match volatility spikes to multipliers and risk caps",
    "Draft compliant phrasing for accumulator scenarios",
    "Verify contract specs against latest product sheets",
    "Score educational angles for beginner cohorts",
    "Cross-check jurisdiction disclaimers for promos",
  ],
  "Writer (@MarketaryFX)": [
    "Tighten EUR/USD breakout thread with levels",
    "Add context box for Fed dots vs market pricing",
    "Rewrite lede for clarity under character cap",
    "Insert compliant risk line for leveraged products",
    "Polish CTA for Asia session follow-up post",
  ],
  "Writer (@DerivTrader)": [
    "Draft step-through for synthetic index setup",
    "Balance hype with guardrails on position sizing",
    "Thread three scenarios for range-bound NDX",
    "Localize idioms for UK English compliance pass",
    "Prepare quote tweet with chart annotation alt text",
  ],
  "Writer (@CryptoDesk)": [
    "Explain funding rate flip without promising returns",
    "Contrast L2 throughput claims with on-chain fees",
    "Cover ETF flow narrative with sourcing caveats",
    "Shorten thread for mobile-first readability",
    "Add timestamped disclosure for sponsorship mention",
  ],
  "Trend Watcher": [
    "Monitor AI equities basket for narrative decay",
    "Track memecoin leader rotation vs BTC dominance",
    "Score macro podcast clips for story potential",
    "Map influencer clusters around commodities",
    "Alert desk when retail sentiment flips hard",
  ],
  "Reply Agent": [
    "Queue thoughtful reply to high-follower skeptic",
    "Escalate regulatory bait comments to compliance",
    "Draft clarifying thread for misunderstood chart",
    "Route troll swarm to mute and log protocol",
    "Thank source with link to primary document",
  ],
  "Editor-in-Chief": [
    "Approve two CRITICAL items after desk sync",
    "Kill duplicate gold story after overlap check",
    "Reassign writer due to persona voice mismatch",
    "Set publication cadence cap before NY open",
    "Sign off human review queue for APAC window",
  ],
};

export const MOCK_CHAT_RESPONSES: Record<string, string> = {
  important:
    "We are prioritizing three lanes right now: a critical CPI follow-through thread, an earnings gap story with a clean derivatives angle, and a geopolitical FX shock watch that still needs compliance clearance.\n\nThe CPI lane is already EIC-approved and in writing with a hard cap on speculation. The earnings piece is stuck in revision after the reviewer flagged implied forward guidance. The FX shock watch is ranked but not yet approved because the stacking score dipped when social velocity cooled.\n\nIf you need a single decision surface, start with the CPI thread: it has the strongest stacked signals, the clearest compliance path, and the tightest publication window before liquidity thins out.",
  trending:
    "On-chain chatter and retail flow narratives are leaning hard into a short-term volatility regime around majors, while alt liquidity is fragmenting into a handful of themes rather than a broad risk-on bid.\n\nBTC is still the gravity well, but attention is rotating faster than price, which usually means we should favor explainers over calls. ETH L2 fee spikes are getting meme traction, yet the durable story is still throughput versus demand, not a single headline.\n\nFor Marketary, the play is to publish tight, time-stamped context that resists hype framing. If we chase the loudest hashtag, we will burn persona credibility; if we anchor to structure and levels, we win the next leg of the conversation.",
  pipeline:
    "The pipeline is healthy on throughput but uneven on quality gates. Detection and ranking are keeping up with the bus, yet human review is the bottleneck for two medium-priority items that should not be in revision this long.\n\nHuman review is intentionally light today because we cleared the APAC queue overnight. Scheduling is pacing correctly for NY overlap, and we have one prepositioned package armed pending EIC sign-off.\n\nNet: we can publish on time if we stop expanding scope mid-draft. I want writers to close loops, not add new angles after EIC approval unless the desk escalates with fresh signals.",
  budget:
    "Spend is tracking slightly above plan for the month, driven by higher token use on long-form threads and a spike in revision loops after a compliance-heavy macro week.\n\nWe still have runway if we hold cost-per-output flat for the next five sessions, but I am throttling discretionary simulations and tightening model routing on the engagement desk.\n\nIf budgets trip a warning again, we will pause non-critical agent tasks, keep EIC and review paths hot, and shift to shorter outputs with fewer multi-pass revisions.",
  default:
    "Here is the quick desk picture: signals are noisy but actionable, writers are loaded into the right personas, and the event bus is stable enough to trust for near-term sequencing.\n\nI am watching three risks: headline overfit to thin liquidity, duplicate coverage across desks, and any draft that smuggles performance language past the first pass.\n\nTell me whether you want priorities, risks, or scheduling, and I will narrow the answer to what changes your next hour.",
};
