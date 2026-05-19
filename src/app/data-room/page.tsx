"use client";

import { useEffect, useState } from "react";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { useMarketSignals } from "@/hooks/useMarketSignals";
import { MarketFeed } from "@/components/data-room/MarketFeed";
import { NewsFeed } from "@/components/data-room/NewsFeed";
import { TrendsFeed } from "@/components/data-room/TrendsFeed";
import { EconomicCalendarFeed } from "@/components/data-room/EconomicCalendarFeed";
import { EarningsCalendarFeed } from "@/components/data-room/EarningsCalendarFeed";
import { InsiderTradingFeed } from "@/components/data-room/InsiderTradingFeed";
import { CompetitorIntelFeed } from "@/components/data-room/CompetitorIntelFeed";
import type { CompetitorReport } from "@/types";

export default function DataRoomPage() {
  const { setBreadcrumbs } = useBreadcrumbContext();
  const { marketSignals, newsSignals, trendSignals, economicEvents, earningsEvents, insiderTrades } =
    useMarketSignals();
  const [competitorReports, setCompetitorReports] = useState<CompetitorReport[]>([]);

  useEffect(() => {
    setBreadcrumbs([{ label: "Data Room" }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    fetch("/api/competitor-reports?limit=20&lookback_days=7")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setCompetitorReports(data); })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Data Room</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MarketFeed signals={marketSignals} />
        <NewsFeed signals={newsSignals} />
        <TrendsFeed signals={trendSignals} />
        <EconomicCalendarFeed events={economicEvents} />
        <EarningsCalendarFeed events={earningsEvents} />
        <InsiderTradingFeed trades={insiderTrades} />
        <CompetitorIntelFeed reports={competitorReports} />
      </div>
    </div>
  );
}
