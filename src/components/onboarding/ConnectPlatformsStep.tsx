"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, Plus, X } from "lucide-react";
import type { SocialPlatform, SocialConnectionInfo } from "@/types";
import { cn } from "@/lib/utils";

const PLATFORMS: {
  id: SocialPlatform;
  name: string;
  color: string;
  icon: string;
}[] = [
  { id: "X", name: "X (Twitter)", color: "bg-zinc-900", icon: "𝕏" },
  { id: "INSTAGRAM", name: "Instagram", color: "bg-gradient-to-br from-purple-600 to-pink-500", icon: "IG" },
  { id: "LINKEDIN", name: "LinkedIn", color: "bg-blue-600", icon: "in" },
  { id: "TIKTOK", name: "TikTok", color: "bg-zinc-900", icon: "TT" },
  { id: "YOUTUBE", name: "YouTube", color: "bg-red-600", icon: "YT" },
  { id: "THREADS", name: "Threads", color: "bg-zinc-800", icon: "@" },
  { id: "REDDIT", name: "Reddit", color: "bg-orange-600", icon: "R" },
  { id: "TELEGRAM", name: "Telegram", color: "bg-sky-500", icon: "TG" },
];

interface ConnectPlatformsStepProps {
  accountId: string;
  onNext: () => void;
}

export function ConnectPlatformsStep({
  accountId,
  onNext,
}: ConnectPlatformsStepProps) {
  const [connections, setConnections] = useState<SocialConnectionInfo[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/accounts/${accountId}/connections`);
      if (res.ok) {
        setConnections(await res.json());
      }
    }
    load();
  }, [accountId]);

  const connectedPlatforms = new Set(connections.map((c) => c.platform));

  async function handleConnect(platform: SocialPlatform) {
    const handle = `${platform.toLowerCase()}_user`;
    const res = await fetch(`/api/accounts/${accountId}/connections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, handle, displayName: `@${handle}` }),
    });
    if (res.ok) {
      const connection = await res.json();
      setConnections((prev) => [...prev, connection]);
    }
  }

  async function handleDisconnect(connectionId: string) {
    await fetch(`/api/accounts/${accountId}/connections?id=${connectionId}`, {
      method: "DELETE",
    });
    setConnections((prev) => prev.filter((c) => c.id !== connectionId));
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Connect your platforms
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Link the social media accounts your newsroom will publish to. Click a
          platform to authorize your connection. Connect at least one to
          continue.
        </p>
      </div>

      {/* Platform grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PLATFORMS.map((platform) => {
          const isConnected = connectedPlatforms.has(platform.id);
          const connection = connections.find(
            (c) => c.platform === platform.id
          );
          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => {
                if (isConnected) return;
                handleConnect(platform.id);
              }}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
                isConnected
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-border hover:border-muted-foreground/40"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white",
                  platform.color
                )}
              >
                {platform.icon}
              </div>
              <span className="text-xs font-medium">{platform.name}</span>
              {!isConnected && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Plus className="h-3 w-3" />
                  Connect
                </span>
              )}
              {isConnected && connection && (
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-500/30 text-emerald-500"
                >
                  <Check className="h-3 w-3" />@{connection.handle}
                </Badge>
              )}
              {isConnected && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (connection) handleDisconnect(connection.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      if (connection) handleDisconnect(connection.id);
                    }
                  }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Connected count */}
      {connections.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {connections.length} platform{connections.length > 1 ? "s" : ""}{" "}
          connected
        </p>
      )}

      <Button
        onClick={onNext}
        disabled={connections.length === 0}
        className="gap-2"
      >
        Continue
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
