"use client";

import { useEffect, useRef } from "react";
import { useEventBusStore } from "@/store/eventBusStore";
import { EVENT_BUS_INTERVAL_MS } from "@/lib/constants";
import { toast } from "sonner";
import type { BusEvent } from "@/types";

export function useEventBus() {
  const events = useEventBusStore((state) => state.events);
  const latestEvent = useEventBusStore((state) => state.latestEvent);
  const isPaused = useEventBusStore((state) => state.isPaused);
  const addEvent = useEventBusStore((state) => state.addEvent);
  const pause = useEventBusStore((state) => state.pause);
  const resume = useEventBusStore((state) => state.resume);
  const lastTimestamp = useRef<string | null>(null);

  // Track the latest event timestamp for polling
  useEffect(() => {
    if (latestEvent) {
      lastTimestamp.current = latestEvent.timestamp;
    }
  }, [latestEvent]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (isPaused) return;

      try {
        const params = new URLSearchParams({ limit: "5" });
        if (lastTimestamp.current) {
          // Fetch events newer than what we have
          // The API supports `after` param for cursor-based pagination
        }
        const res = await fetch(`/api/events?${params}`);
        if (!res.ok) return;

        const newEvents: BusEvent[] = await res.json();

        for (const event of newEvents.reverse()) {
          // Only add events we haven't seen
          if (
            !lastTimestamp.current ||
            event.timestamp > lastTimestamp.current
          ) {
            addEvent(event);

            if (event.priority === "HIGH") {
              toast(event.message, {
                description: `${event.agent} · ${event.type}`,
              });
            }
          }
        }
      } catch {
        // Silently ignore fetch errors
      }
    }, EVENT_BUS_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPaused, addEvent]);

  return { events, latestEvent, isPaused, pause, resume };
}
