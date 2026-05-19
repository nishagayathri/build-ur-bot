"use client";

import { useState, useEffect } from "react";
import type {
  MarketSignal,
  NewsSignal,
  TrendSignal,
  EconomicEvent,
  EarningsEvent,
  InsiderTrade,
  EngagementSignal,
} from "@/types";
import { MARKET_SIGNAL_INTERVAL_MS, MAX_FEED_ITEMS } from "@/lib/constants";

export function useMarketSignals() {
  const [marketSignals, setMarketSignals] = useState<MarketSignal[]>([]);
  const [newsSignals, setNewsSignals] = useState<NewsSignal[]>([]);
  const [trendSignals, setTrendSignals] = useState<TrendSignal[]>([]);
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [earningsEvents, setEarningsEvents] = useState<EarningsEvent[]>([]);
  const [insiderTrades, setInsiderTrades] = useState<InsiderTrade[]>([]);
  const [engagementSignals, setEngagementSignals] = useState<EngagementSignal[]>([]);

  // Initial load from API
  useEffect(() => {
    const safeFetch = (url: string) =>
      fetch(url).then((r) => (r.ok ? r.json() : []));

    Promise.all([
      safeFetch("/api/signals/market"),
      safeFetch("/api/signals/news"),
      safeFetch("/api/signals/trends"),
      safeFetch("/api/signals/economic"),
      safeFetch("/api/signals/earnings"),
      safeFetch("/api/signals/insider"),
      safeFetch("/api/signals/engagement"),
    ]).then(([m, n, t, e, earn, ins, eng]) => {
      setMarketSignals(m);
      setNewsSignals(n);
      setTrendSignals(t);
      setEconomicEvents(e);
      setEarningsEvents(earn);
      setInsiderTrades(ins);
      setEngagementSignals(eng);
    });
  }, []);

  // Rotate signals for live feel (re-fetches periodically)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [m, n, t] = await Promise.all([
          fetch("/api/signals/market?limit=1").then((r) => r.json()),
          fetch("/api/signals/news?limit=1").then((r) => r.json()),
          fetch("/api/signals/trends?limit=1").then((r) => r.json()),
        ]);

        if (m.length) {
          const signal = { ...m[0], signal_id: crypto.randomUUID(), timestamp: new Date().toISOString() };
          setMarketSignals((prev) => [signal, ...prev].slice(0, MAX_FEED_ITEMS));
        }
        if (n.length) {
          const signal = { ...n[0], signal_id: crypto.randomUUID(), timestamp: new Date().toISOString() };
          setNewsSignals((prev) => [signal, ...prev].slice(0, MAX_FEED_ITEMS));
        }
        if (t.length) {
          const signal = { ...t[0], signal_id: crypto.randomUUID(), timestamp: new Date().toISOString() };
          setTrendSignals((prev) => [signal, ...prev].slice(0, MAX_FEED_ITEMS));
        }
      } catch {
        // Silently ignore
      }
    }, MARKET_SIGNAL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return { marketSignals, newsSignals, trendSignals, economicEvents, earningsEvents, insiderTrades, engagementSignals };
}
