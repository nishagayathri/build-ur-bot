"use client";

import { useQuery } from "@tanstack/react-query";
import type { AccountPersona } from "@/types";
import { useAccountContext } from "@/context/AccountContext";

export function usePersonas() {
  const { activeAccount } = useAccountContext();
  const accountId = activeAccount?.id;

  return useQuery<AccountPersona[]>({
    queryKey: ["personas", accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const res = await fetch(`/api/personas?accountId=${accountId}`);
      if (!res.ok) throw new Error("Failed to fetch personas");
      return res.json();
    },
  });
}
