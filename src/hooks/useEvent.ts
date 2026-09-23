import { useSyncExternalStore } from "react";
import { eventLabels } from "../lib/event";
import { getEventSnapshot, subscribeToEvent } from "../lib/event-store";
export function useEvent() {
  const settings = useSyncExternalStore(subscribeToEvent, getEventSnapshot);
  return { settings, labels: eventLabels(settings) };
}
