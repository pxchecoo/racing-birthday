export interface EventSettings {
  id: number;
  event_date: string;
  event_time: string;
  updated_at: string;
}
export const EVENT = {
  title: "Birthday Racing Experience",
  address: "Avenida Diego Velázquez N-12, El Conquistador, Puerto Rico",
  timeZone: "America/Puerto_Rico",
};
// Single offline fallback; the public page replaces it with the Supabase record.
export const DEFAULT_SETTINGS: EventSettings = {
  id: 1,
  event_date: "2026-10-24",
  event_time: "15:00:00",
  updated_at: "2026-09-23T12:00:00Z",
};
export const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EVENT.address)}`;
export function isEventSettings(value: unknown): value is EventSettings {
  if (!value || typeof value !== "object") return false;
  const event = value as EventSettings;
  if (
    event.id !== 1 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(event.event_date) ||
    !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(event.event_time)
  )
    return false;
  const date = new Date(`${event.event_date}T12:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === event.event_date &&
    typeof event.updated_at === "string" &&
    !Number.isNaN(Date.parse(event.updated_at))
  );
}
export function eventInstant(settings: EventSettings) {
  return `${settings.event_date}T${settings.event_time.slice(0, 5)}:00-04:00`;
}
export function eventLabels(settings: EventSettings) {
  const instant = new Date(eventInstant(settings));
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone: EVENT.timeZone,
      ...options,
    }).format(instant);
  return {
    date: format({ month: "long", day: "numeric", year: "numeric" }),
    shortDate: format({ month: "long", day: "numeric" }),
    month: format({ month: "short" }).toUpperCase(),
    day: format({ day: "numeric" }),
    weekday: format({ weekday: "long" }).toUpperCase(),
    year: format({ year: "numeric" }),
    time: format({ hour: "numeric", minute: "2-digit", hour12: true }),
  };
}
export function remainingTime(now = Date.now(), settings = DEFAULT_SETTINGS) {
  const total = Math.max(
    0,
    Math.floor((Date.parse(eventInstant(settings)) - now) / 1000),
  );
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor(total / 3600) % 24,
    minutes: Math.floor(total / 60) % 60,
    seconds: total % 60,
    total,
  };
}
export function calendarContent(settings = DEFAULT_SETTINGS) {
  const stamp = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Racing Birthday//Invitation//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:racing-birthday-20261024@pxchecoo.github.io",
      `DTSTAMP:${stamp(new Date())}`,
      `LAST-MODIFIED:${stamp(new Date(settings.updated_at))}`,
      `DTSTART:${stamp(new Date(eventInstant(settings)))}`,
      `SUMMARY:${EVENT.title}`,
      `LOCATION:${EVENT.address.replaceAll(",", "\\,")}`,
      "DESCRIPTION:Start your engines. You are invited to a racing birthday experience!",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n") + "\r\n"
  );
}
export function downloadCalendar(settings = DEFAULT_SETTINGS) {
  const url = URL.createObjectURL(
    new Blob([calendarContent(settings)], {
      type: "text/calendar;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  const labels = eventLabels(settings);
  link.download = `racing-birthday-${labels.shortDate.toLowerCase().replaceAll(" ", "-")}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
