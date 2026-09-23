import { describe, expect, it } from "vitest";
import {
  remainingTime,
  calendarContent,
  EVENT,
  DIRECTIONS_URL,
} from "../src/lib/event";
import { validateRsvp } from "../src/lib/rsvp";
describe("event time and links", () => {
  it("uses 19:00 UTC for 3 PM Puerto Rico, independently of viewer timezone", () => {
    expect(new Date(EVENT.startsAt).toISOString()).toBe(
      "2026-10-24T19:00:00.000Z",
    );
  });
  it("counts each unit correctly", () => {
    expect(remainingTime(Date.parse(EVENT.startsAt) - 90061000)).toEqual({
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 1,
      total: 90061,
    });
  });
  it("never becomes negative after the event", () => {
    expect(remainingTime(Date.parse(EVENT.startsAt) + 10000).total).toBe(0);
  });
  it("exports UTC ICS with escaped location and no invented end time", () => {
    expect(calendarContent()).toContain("DTSTART:20261024T190000Z\r\n");
    expect(calendarContent()).toContain("N-12\\, El Conquistador");
    expect(calendarContent()).not.toContain("DTEND");
    expect(calendarContent()).toContain("END:VCALENDAR\r\n");
  });
  it("encodes the complete address in Google Maps", () => {
    expect(new URL(DIRECTIONS_URL).searchParams.get("query")).toBe(
      EVENT.address,
    );
  });
});
describe("RSVP validation", () => {
  const valid = {
    name: "Alex Driver",
    attending: true,
    guest_count: 2,
    message: null,
  };
  it("accepts attendance and decline with zero guests", () => {
    expect(validateRsvp(valid)).toBeNull();
    expect(
      validateRsvp({ ...valid, attending: false, guest_count: 0 }),
    ).toBeNull();
  });
  it("rejects blank names and excessive text", () => {
    expect(validateRsvp({ ...valid, name: "  " })).toBeTruthy();
    expect(validateRsvp({ ...valid, name: "x".repeat(101) })).toBeTruthy();
    expect(validateRsvp({ ...valid, message: "x".repeat(1001) })).toBeTruthy();
  });
  it("rejects invalid and fractional guest counts", () => {
    for (const guest_count of [-1, 11, 0.2, NaN])
      expect(validateRsvp({ ...valid, guest_count })).toBeTruthy();
  });
  it("rejects guests for a declined invitation", () => {
    expect(validateRsvp({ ...valid, attending: false })).toBeTruthy();
  });
});
