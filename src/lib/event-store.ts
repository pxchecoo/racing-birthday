import { DEFAULT_SETTINGS, isEventSettings, type EventSettings } from "./event";
const cacheKey = "racing-event-settings-v1";
function cachedSettings() {
  try {
    const data = JSON.parse(localStorage.getItem(cacheKey) || "null");
    if (isEventSettings(data)) return data;
  } catch {
    /* Storage may be unavailable. */
  }
  return DEFAULT_SETTINGS;
}
let current = cachedSettings();
const listeners = new Set<() => void>();
let pending: Promise<void> | null = null;
export const getEventSnapshot = () => current;
export function publishEventSettings(settings: EventSettings) {
  if (!isEventSettings(settings)) return;
  if (JSON.stringify(current) === JSON.stringify(settings)) return;
  current = settings;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(settings));
  } catch {
    /* Public settings also work without persistence. */
  }
  listeners.forEach((listener) => listener());
}
export function refreshEventSettings() {
  if (pending) return pending;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return Promise.resolve();
  const startingSnapshot = current;
  pending = (async () => {
    try {
      const response = await fetch(
        `${url}/rest/v1/event_settings?id=eq.1&select=id,event_date,event_time,updated_at`,
        {
          headers: { apikey: key },
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!response.ok) return;
      const data = await response.json();
      if (
        isEventSettings(data[0]) &&
        (current === startingSnapshot ||
          Date.parse(data[0].updated_at) >= Date.parse(current.updated_at))
      )
        publishEventSettings(data[0]);
    } catch {
      /* Keep the last known event if the network is temporarily unavailable. */
    } finally {
      pending = null;
    }
  })();
  return pending;
}
function onStorage(event: StorageEvent) {
  if (event.key !== cacheKey || !event.newValue) return;
  try {
    const settings = JSON.parse(event.newValue);
    if (isEventSettings(settings)) {
      current = settings;
      listeners.forEach((listener) => listener());
    }
  } catch {
    /* Ignore invalid cache data. */
  }
}
function onFocus() {
  if (document.visibilityState === "visible") void refreshEventSettings();
}
let interval: ReturnType<typeof setInterval> | undefined;
export function subscribeToEvent(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refreshEventSettings();
    interval = setInterval(onFocus, 30000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("storage", onStorage);
    }
  };
}
