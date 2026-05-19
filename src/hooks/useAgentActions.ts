import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AgentRunResult } from "@/types";

export function useRunAgent(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation<AgentRunResult, Error, { trigger?: Record<string, unknown> } | void>({
    mutationFn: async (data) => {
      const res = await fetch(`/api/agents/${agentId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: data?.trigger ?? {} }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Agent execution failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agents-live"] });
      const cost = data.cost_usd != null ? ` · $${data.cost_usd.toFixed(4)}` : "";
      toast.success(`Run completed${cost}`);
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["agents-live"] });
      toast.error(error.message);
    },
  });
}

export function usePauseAgent(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/agents/${agentId}/pause`, { method: "PUT" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to pause agent");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents-live"] });
      toast.success("Agent paused");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useResumeAgent(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/agents/${agentId}/resume`, { method: "PUT" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to resume agent");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents-live"] });
      toast.success("Agent resumed");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateAgent(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save changes");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents-live"] });
      toast.success("Changes saved");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateAgentPrompt(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (systemPromptOverride: string | null) => {
      const res = await fetch(`/api/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPromptOverride }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update prompt");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents-live"] });
      toast.success("System prompt saved");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAgentRuns(agentId: string) {
  return useQuery<AgentRunResult[]>({
    queryKey: ["agent-runs", agentId],
    queryFn: async () => {
      const res = await fetch(`/api/agents/${agentId}/runs`);
      if (!res.ok) throw new Error("Failed to fetch runs");
      return res.json();
    },
    refetchInterval: 15_000,
  });
}
