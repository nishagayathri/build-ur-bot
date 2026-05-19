"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useStoryPatch(storyId: string) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/stories/${storyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update story");
      await queryClient.invalidateQueries({ queryKey: ["stories", storyId] });
      await queryClient.invalidateQueries({ queryKey: ["stories"] });
    } finally {
      setLoading(false);
    }
  }

  return { patch, loading };
}
