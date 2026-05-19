"use client";

import { useAccountContext } from "@/context/AccountContext";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

export function AccountRail() {
  const { accounts, activeAccount, setActiveAccount } = useAccountContext();

  return (
    <div className="w-14 border-r border-border bg-surface-1 flex flex-col items-center py-4 gap-3">
      {accounts.map((account) => {
        const color = account.color || "var(--genesis-accent)";
        const isActive = activeAccount?.id === account.id;

        return (
          <button
            key={account.id}
            onClick={() => setActiveAccount(account)}
            title={account.name}
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-150 ease-out",
              isActive && "ring-2 ring-offset-2 ring-offset-background"
            )}
            style={{
              backgroundColor: isActive ? color : `color-mix(in srgb, ${color} 20%, transparent)`,
              color: isActive ? "#fff" : color,
              ...(isActive ? { "--tw-ring-color": color } as React.CSSProperties : {}),
            }}
          >
            {account.name.charAt(0).toUpperCase()}
          </button>
        );
      })}

      <Link
        href="/onboarding"
        className="flex items-center justify-center h-8 w-8 rounded-full border border-dashed border-border-visible text-text-3 hover:text-text-1 hover:border-text-2 transition-all duration-150 ease-out"
        title="Create new account"
      >
        <Plus className="h-3.5 w-3.5" />
      </Link>

      <div className="mt-auto flex flex-col items-center gap-2">
        <ThemeToggle />
        <Link
          href="/settings"
          className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-md)] text-text-3 hover:text-text-1 hover:bg-surface-2 transition-all duration-150 ease-out"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
