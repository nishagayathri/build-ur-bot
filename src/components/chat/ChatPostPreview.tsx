"use client";

import { usePersonas } from "@/hooks/usePersonas";

export function ChatPostPreview() {
  const { data: personas } = usePersonas();
  const personasList = personas ?? [];
  const persona = personasList.find(
    (p) => p.account_handle === "@MarketaryFX"
  );

  return (
    <div className="bg-surface-2 rounded-lg p-4 border border-border mt-3">
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: persona?.avatar_color }}
        >
          {persona?.display_name.charAt(0) ?? "M"}
        </div>
        <span className="text-[13px] font-semibold text-text-1">
          {persona?.account_handle ?? "@MarketaryFX"}
        </span>
        <span className="text-[11px] bg-surface-3 rounded px-1.5 py-0.5 text-text-3">
          𝕏
        </span>
      </div>
      <p className="text-[13px] whitespace-pre-wrap text-text-2 mb-3">
        {`🔴 USD/JPY breaks above 155 for the first time since Oct 2022.\n\nBoJ intervention rhetoric intensifying. MOF's Kanda warns of 'decisive action.'\n\n3 signals stacked:\n📊 Price: +2.34% in 4H\n📰 Reuters: Intervention imminent\n🔥 Social: #YenIntervention trending\n\nWatch 155.50 resistance. Trade setups on Deriv →`}
      </p>
      <div className="flex items-center gap-4 text-xs text-text-3 mb-3">
        <span>♡ 1.2K</span>
        <span>🔁 342</span>
        <span>👁 24.5K</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="h-8 px-3 rounded-lg border border-border-visible text-[13px] text-text-2 bg-transparent hover:bg-surface-2 transition-colors duration-200 cursor-pointer">
          Add to pipeline →
        </button>
        <button className="h-8 px-3 rounded-lg text-[13px] text-text-3 bg-transparent hover:bg-surface-2 transition-colors duration-200 cursor-pointer">
          Schedule for next slot →
        </button>
      </div>
    </div>
  );
}
