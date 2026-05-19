"use client";

import type { InsiderTrade } from "@/types";
import { DataRoomPanel } from "@/components/data-room/DataRoomPanel";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface InsiderTradingFeedProps {
  trades: InsiderTrade[];
}

const ACQUISITION_TYPES = new Set([
  "P-Purchase",
  "A-Award",
  "M-Exempt",
  "G-Gift",
  "C-Conversion",
]);

function formatCount(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

export function InsiderTradingFeed({ trades }: InsiderTradingFeedProps) {
  return (
    <DataRoomPanel title="Insider Trading">
      {trades.map((trade) => {
        const isAcquisition = ACQUISITION_TYPES.has(trade.transaction_type);
        const isLarge = trade.securities_transacted * trade.price > 1_000_000;

        return (
          <div
            key={trade.trade_id}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 border-b border-border/50",
              isLarge && "border-l-2 border-l-amber-500",
            )}
          >
            <span className="font-medium text-[13px] w-16">
              {trade.symbol}
            </span>
            <span
              className={cn(
                "text-[11px] rounded px-1.5",
                isAcquisition
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
              )}
            >
              {trade.transaction_type}
            </span>
            <span className="text-[13px] truncate flex-1">
              {trade.reporting_name}
            </span>
            <span className="text-[13px] font-mono text-muted-foreground">
              {formatCount(trade.securities_transacted)}
            </span>
            {trade.price > 0 && (
              <span className="text-[13px] font-mono text-muted-foreground">
                @${trade.price.toFixed(2)}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">
              {timeAgo(trade.filing_date)}
            </span>
          </div>
        );
      })}
    </DataRoomPanel>
  );
}
