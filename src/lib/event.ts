export const EVENT = {
  title: "Birthday Racing Experience",
  startsAt: "2026-10-24T15:00:00-04:00",
  address: "Avenida Diego Velázquez N-12, El Conquistador, Puerto Rico",
  timeZone: "America/Puerto_Rico",
};
export const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EVENT.address)}`;
export function remainingTime(now = Date.now()) {
  const total = Math.max(
    0,
    Math.floor((Date.parse(EVENT.startsAt) - now) / 1000),
  );
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor(total / 3600) % 24,
    minutes: Math.floor(total / 60) % 60,
    seconds: total % 60,
    total,
  };
}
export function calendarContent() {
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Racing Birthday//Invitation//EN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:racing-birthday-20261024@pxchecoo.github.io",
      "DTSTAMP:20260923T120000Z",
      "DTSTART:20261024T190000Z",
      `SUMMARY:${EVENT.title}`,
      `LOCATION:${EVENT.address.replaceAll(",", "\\,")}`,
      "DESCRIPTION:Start your engines. You are invited to a racing birthday experience!",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n") + "\r\n"
  );
}
export function downloadCalendar() {
  const url = URL.createObjectURL(
    new Blob([calendarContent()], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "racing-birthday-october-24.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
