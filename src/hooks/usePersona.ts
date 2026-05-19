"use client";

import { useQuery } from "@tanstack/react-query";
import type { AccountPersona } from "@/types";

export function usePersona(personaId: string) {
  return useQuery<AccountPersona | undefined>({
    queryKey: ["personas", personaId],
    queryFn: async () => {
      const res = await fetch(`/api/personas/${personaId}`);
      if (res.status === 404) return undefined;
      if (!res.ok) throw new Error("Failed to fetch persona");
      return res.json();
    },
  });
}
