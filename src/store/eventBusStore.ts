import { create } from "zustand";
import type { BusEvent } from "@/types";
import { MAX_EVENTS_IN_MEMORY } from "@/lib/constants";

interface EventBusState {
  events: BusEvent[];
  latestEvent: BusEvent | null;
  isPaused: boolean;
  addEvent: (event: BusEvent) => void;
  pause: () => void;
  resume: () => void;
}

export const useEventBusStore = create<EventBusState>((set) => ({
  events: [],
  latestEvent: null,
  isPaused: false,
  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, MAX_EVENTS_IN_MEMORY),
      latestEvent: event,
    })),
  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),
}));
