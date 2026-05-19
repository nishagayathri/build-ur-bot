"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useEventBusStore } from "@/store/eventBusStore";
import type { BusEvent } from "@/types";

interface EventBusContextValue {
  events: BusEvent[];
  latestEvent: BusEvent | null;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
}

const EventBusContext = createContext<EventBusContextValue | null>(null);

export function EventBusProvider({ children }: { children: ReactNode }) {
  const events = useEventBusStore((state) => state.events);
  const latestEvent = useEventBusStore((state) => state.latestEvent);
  const isPaused = useEventBusStore((state) => state.isPaused);
  const pause = useEventBusStore((state) => state.pause);
  const resume = useEventBusStore((state) => state.resume);

  return (
    <EventBusContext.Provider
      value={{ events, latestEvent, isPaused, pause, resume }}
    >
      {children}
    </EventBusContext.Provider>
  );
}

export function useEventBusContext() {
  const context = useContext(EventBusContext);
  if (!context) {
    throw new Error(
      "useEventBusContext must be used within an EventBusProvider"
    );
  }
  return context;
}
