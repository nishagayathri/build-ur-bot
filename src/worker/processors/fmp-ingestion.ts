import { randomUUID } from "node:crypto";
import { prisma } from "../db";
import { FMPClient } from "../../lib/fmp/client";
import type { FMPQuote, FMPInsiderTrade } from "../../lib/fmp/types";

// ── Helpers ─────────────────────────────────────────────────────────────────

function getClient(): FMPClient {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    throw new Error("[fmp-ingestion] FMP_API_KEY is not set");
  }
  return new FMPClient({ apiKey });
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

type EntityType = "FOREX" | "CRYPTO" | "INDEX" | "EQUITY" | "COMMODITY";

/**
 * Heuristic score for how story-worthy a price move is.
 * 0–1 scale: 60% weight on price magnitude, 40% on volume anomaly.
 */
function computeStoryPotential(
  priceChangePct: number,
  volumeVsAvg: number,
): number {
  const priceMagnitude = Math.min(Math.abs(priceChangePct) / 5, 1);
  const volumeBoost = Math.min(volumeVsAvg / 3, 1);
  return Math.round((priceMagnitude * 0.6 + volumeBoost * 0.4) * 100) / 100;
}

function buildInterpretation(
  symbol: string,
  pct: number,
  volRatio: number,
): string {
  const dir = pct >= 0 ? "+" : "";
  const vol =
    volRatio > 1.5
      ? `${volRatio.toFixed(1)}x avg volume`
      : "normal volume";
  return `${symbol} moved ${dir}${pct.toFixed(2)}% on ${vol}`;
}

async function getOnboardedAccounts(): Promise<string[]> {
  const accounts = await prisma.account.findMany({
    where: { onboardingComplete: true },
    select: { id: true },
  });
  return accounts.map((a) => a.id);
}

// ── Market Data Ingestion ───────────────────────────────────────────────────

async function ingestQuotes(
  client: FMPClient,
  accountIds: string[],
  quotes: FMPQuote[],
  entityType: EntityType,
): Promise<number> {
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000);
  let created = 0;

  for (const q of quotes) {
    if (!q.symbol || q.changesPercentage == null) continue;

    const volumeVsAvg =
      q.avgVolume > 0
        ? Math.round((q.volume / q.avgVolume) * 100) / 100
        : 1;
    const potential = computeStoryPotential(q.changesPercentage, volumeVsAvg);

    for (const accountId of accountIds) {
      const existing = await prisma.marketSignal.findFirst({
        where: {
          accountId,
          asset: q.symbol,
          timestamp: { gte: twoMinAgo },
        },
        select: { id: true },
      });

      if (existing) continue;

      await prisma.marketSignal.create({
        data: {
          id: `msig_${randomUUID()}`,
          accountId,
          asset: q.symbol,
          entityType,
          priceChangePct: q.changesPercentage,
          volumeVsAvg: volumeVsAvg,
          storyPotentialScore: potential,
          agentInterpretation: buildInterpretation(
            q.symbol,
            q.changesPercentage,
            volumeVsAvg,
          ),
        },
      });
      created++;
    }
  }

  return created;
}

/**
 * Polls FMP for real-time quotes across all asset classes and writes
 * MarketSignal records for every onboarded account.
 * Scheduled: every 2 minutes.
 */
export async function processFmpMarketData(): Promise<void> {
  console.log("[fmp-ingestion] Starting market data ingestion");

  const accountIds = await getOnboardedAccounts();
  if (!accountIds.length) {
    console.log("[fmp-ingestion] No onboarded accounts, skipping market data");
    return;
  }

  const client = getClient();
  let totalCreated = 0;

  try {
    // Forex
    const forex = await client.getForexQuotes();
    totalCreated += await ingestQuotes(client, accountIds, forex, "FOREX");

    // Crypto
    const crypto = await client.getCryptoQuotes();
    totalCreated += await ingestQuotes(client, accountIds, crypto, "CRYPTO");

    // Indexes
    const indexes = await client.getIndexQuotes();
    totalCreated += await ingestQuotes(client, accountIds, indexes, "INDEX");

    // Commodities
    const commodities = await client.getCommodityQuotes();
    totalCreated += await ingestQuotes(
      client,
      accountIds,
      commodities,
      "COMMODITY",
    );
  } catch (err) {
    console.error("[fmp-ingestion] Market data error:", err);
  }

  console.log(
    `[fmp-ingestion] Market data complete: ${totalCreated} signals created`,
  );
}

// ── News Ingestion ──────────────────────────────────────────────────────────

/**
 * Polls FMP for latest market news and writes NewsSignal records
 * for every onboarded account.
 * Scheduled: every 5 minutes.
 */
export async function processFmpNews(): Promise<void> {
  console.log("[fmp-ingestion] Starting news ingestion");

  const accountIds = await getOnboardedAccounts();
  if (!accountIds.length) {
    console.log("[fmp-ingestion] No onboarded accounts, skipping news");
    return;
  }

  const client = getClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  let totalCreated = 0;

  try {
    const news = await client.getStockNews({ limit: 50 });

    for (const article of news) {
      if (!article.title) continue;

      for (const accountId of accountIds) {
        const existing = await prisma.newsSignal.findFirst({
          where: {
            accountId,
            headline: article.title,
            timestamp: { gte: oneHourAgo },
          },
          select: { id: true },
        });

        if (existing) continue;

        await prisma.newsSignal.create({
          data: {
            id: `nsig_${randomUUID()}`,
            accountId,
            source: article.site,
            headline: article.title,
            relevanceScore: 0.5,
            hasDerivAngle: false,
            derivAngleLabel: null,
          },
        });
        totalCreated++;
      }
    }
  } catch (err) {
    console.error("[fmp-ingestion] News ingestion error:", err);
  }

  console.log(
    `[fmp-ingestion] News complete: ${totalCreated} signals created`,
  );
}

// ── Economic Calendar Ingestion ─────────────────────────────────────────────

function mapImpact(raw: string): "LOW" | "MEDIUM" | "HIGH" {
  switch (raw.toLowerCase()) {
    case "high":
      return "HIGH";
    case "medium":
      return "MEDIUM";
    default:
      return "LOW";
  }
}

/**
 * Polls FMP for economic calendar events and writes/updates
 * EconomicEvent records for every onboarded account.
 * Scheduled: every 15 minutes.
 */
export async function processFmpEconomicCalendar(): Promise<void> {
  console.log("[fmp-ingestion] Starting economic calendar ingestion");

  const accountIds = await getOnboardedAccounts();
  if (!accountIds.length) {
    console.log(
      "[fmp-ingestion] No onboarded accounts, skipping economic calendar",
    );
    return;
  }

  const client = getClient();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  let totalCreated = 0;
  let totalUpdated = 0;

  try {
    const events = await client.getEconomicCalendar(
      toDateStr(yesterday),
      toDateStr(nextWeek),
    );

    for (const event of events) {
      if (!event.event) continue;

      const eventTime = new Date(event.date);
      const isReleased = event.actual !== null;

      for (const accountId of accountIds) {
        // Look for existing event by name + time + account
        const existing = await prisma.economicEvent.findFirst({
          where: {
            accountId,
            name: event.event,
            time: eventTime,
          },
          select: { id: true, status: true },
        });

        if (existing) {
          // Update if status changed (UPCOMING -> RELEASED)
          if (
            existing.status === "UPCOMING" &&
            isReleased
          ) {
            await prisma.economicEvent.update({
              where: { id: existing.id },
              data: {
                status: "RELEASED",
                actual: event.actual != null ? String(event.actual) : null,
                expected:
                  event.estimate != null ? String(event.estimate) : null,
              },
            });
            totalUpdated++;
          }
          continue;
        }

        await prisma.economicEvent.create({
          data: {
            id: `econ_${randomUUID()}`,
            accountId,
            time: eventTime,
            name: event.event,
            impact: mapImpact(event.impact),
            status: isReleased ? "RELEASED" : "UPCOMING",
            actual: event.actual != null ? String(event.actual) : null,
            expected: event.estimate != null ? String(event.estimate) : null,
          },
        });
        totalCreated++;
      }
    }
  } catch (err) {
    console.error("[fmp-ingestion] Economic calendar error:", err);
  }

  console.log(
    `[fmp-ingestion] Economic calendar complete: ${totalCreated} created, ${totalUpdated} updated`,
  );
}

// ── Earnings Calendar Ingestion ───────────────────────────────────────────

/**
 * Polls FMP for earnings calendar events and writes/updates
 * EarningsEvent records for every onboarded account.
 * Scheduled: every 20 minutes.
 */
export async function processFmpEarningsCalendar(): Promise<void> {
  console.log("[fmp-ingestion] Starting earnings calendar ingestion");

  const accountIds = await getOnboardedAccounts();
  if (!accountIds.length) {
    console.log(
      "[fmp-ingestion] No onboarded accounts, skipping earnings calendar",
    );
    return;
  }

  const client = getClient();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoWeeksOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  let totalCreated = 0;
  let totalUpdated = 0;

  try {
    const events = await client.getEarningsCalendar(
      toDateStr(yesterday),
      toDateStr(twoWeeksOut),
    );

    for (const event of events) {
      if (!event.symbol) continue;

      const reportDate = new Date(event.date);
      const isReported = event.eps !== null;

      for (const accountId of accountIds) {
        const existing = await prisma.earningsEvent.findFirst({
          where: {
            accountId,
            symbol: event.symbol,
            reportDate,
          },
          select: { id: true, status: true },
        });

        if (existing) {
          if (existing.status === "UPCOMING" && isReported) {
            await prisma.earningsEvent.update({
              where: { id: existing.id },
              data: {
                status: "REPORTED",
                epsActual: event.eps,
                revenueActual: event.revenue,
              },
            });
            totalUpdated++;
          }
          continue;
        }

        await prisma.earningsEvent.create({
          data: {
            id: `earn_${randomUUID()}`,
            accountId,
            symbol: event.symbol,
            reportDate,
            epsEstimate: event.epsEstimated,
            epsActual: event.eps,
            revenueEstimate: event.revenueEstimated,
            revenueActual: event.revenue,
            status: isReported ? "REPORTED" : "UPCOMING",
          },
        });
        totalCreated++;
      }
    }
  } catch (err) {
    console.error("[fmp-ingestion] Earnings calendar error:", err);
  }

  console.log(
    `[fmp-ingestion] Earnings calendar complete: ${totalCreated} created, ${totalUpdated} updated`,
  );
}

// ── Insider Trading Ingestion ─────────────────────────────────────────────

/**
 * Polls FMP for latest insider trading activity and writes
 * InsiderTrade records for every onboarded account.
 * Scheduled: every 15 minutes.
 */
export async function processFmpInsiderTrading(): Promise<void> {
  console.log("[fmp-ingestion] Starting insider trading ingestion");

  const accountIds = await getOnboardedAccounts();
  if (!accountIds.length) {
    console.log(
      "[fmp-ingestion] No onboarded accounts, skipping insider trading",
    );
    return;
  }

  const client = getClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let totalCreated = 0;

  try {
    const trades = await client.getLatestInsiderTrades(100);

    for (const trade of trades) {
      if (!trade.symbol || !trade.reportingName) continue;

      for (const accountId of accountIds) {
        const existing = await prisma.insiderTrade.findFirst({
          where: {
            accountId,
            symbol: trade.symbol,
            reportingName: trade.reportingName,
            securitiesTransacted: trade.securitiesTransacted,
            timestamp: { gte: oneDayAgo },
          },
          select: { id: true },
        });

        if (existing) continue;

        await prisma.insiderTrade.create({
          data: {
            id: `itrd_${randomUUID()}`,
            accountId,
            symbol: trade.symbol,
            filingDate: new Date(trade.filingDate),
            transactionDate: new Date(trade.transactionDate),
            reportingName: trade.reportingName,
            typeOfOwner: trade.typeOfOwner,
            transactionType: trade.transactionType,
            securitiesTransacted: trade.securitiesTransacted,
            price: trade.price,
            securityName: trade.securityName,
            formType: trade.formType,
            url: trade.url || null,
          },
        });
        totalCreated++;
      }
    }
  } catch (err) {
    console.error("[fmp-ingestion] Insider trading error:", err);
  }

  console.log(
    `[fmp-ingestion] Insider trading complete: ${totalCreated} trades created`,
  );
}
