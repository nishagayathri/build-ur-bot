"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { type QueryObserverResult } from "@tanstack/react-query";
import { useAccounts } from "@/hooks/useAccounts";

export interface AccountSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  onboardingStep: number;
  onboardingComplete: boolean;
  role: string;
}

interface AccountContextValue {
  accounts: AccountSummary[];
  activeAccount: AccountSummary | null;
  setActiveAccount: (account: AccountSummary) => void;
  isLoading: boolean;
  isOnboarding: boolean;
  hasNoAccounts: boolean;
  refetch: () => Promise<QueryObserverResult<AccountSummary[], Error>>;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const { data: accounts, isLoading, refetch } = useAccounts();
  const accountsList = accounts ?? [];
  const [activeAccount, setActiveAccountState] = useState<AccountSummary | null>(null);

  // Persist active account in localStorage
  const setActiveAccount = useCallback((account: AccountSummary) => {
    setActiveAccountState(account);
    if (typeof window !== "undefined") {
      localStorage.setItem("marketary_active_account", account.id);
    }
  }, []);

  // Auto-select account on load
  useEffect(() => {
    if (activeAccount || accountsList.length === 0) return;

    const savedId =
      typeof window !== "undefined"
        ? localStorage.getItem("marketary_active_account")
        : null;
    const saved = savedId ? accountsList.find((a) => a.id === savedId) : null;

    setActiveAccountState(saved ?? accountsList[0]);
  }, [activeAccount, accountsList]);

  const hasNoAccounts = !isLoading && accountsList.length === 0;
  const isOnboarding =
    !isLoading &&
    (hasNoAccounts ||
      (activeAccount !== null && !activeAccount.onboardingComplete));

  return (
    <AccountContext.Provider
      value={{
        accounts: accountsList,
        activeAccount,
        setActiveAccount,
        isLoading,
        isOnboarding,
        hasNoAccounts,
        refetch,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccountContext() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccountContext must be used within an AccountProvider");
  }
  return context;
}
