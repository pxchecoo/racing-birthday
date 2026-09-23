import { describe, it, expect } from "vitest";
import {
  calendarContent,
  DEFAULT_SETTINGS,
  eventInstant,
  eventLabels,
  isEventSettings,
  remainingTime,
} from "../src/lib/event";
import { rsvpStats } from "../src/lib/admin";
import {
  matchesPassword,
  newToken,
  sha256,
  validSchedule,
} from "../supabase/functions/race-control/security";
describe("dynamic Puerto Rico schedule", () => {
  const updated = {
    ...DEFAULT_SETTINGS,
    event_date: "2027-01-02",
    event_time: "00:30:00",
  };
  it("keeps midnight and date boundaries in Puerto Rico independently of viewer timezone", () => {
    expect(new Date(eventInstant(updated)).toISOString()).toBe(
      "2027-01-02T04:30:00.000Z",
    );
    expect(eventLabels(updated)).toMatchObject({
      date: "January 2, 2027",
      shortDate: "January 2",
      time: "12:30 AM",
      day: "2",
      year: "2027",
    });
  });
  it("updates countdown and ICS from the same settings", () => {
    expect(
      remainingTime(Date.parse("2027-01-02T04:29:00Z"), updated).total,
    ).toBe(60);
    expect(calendarContent(updated)).toContain("DTSTART:20270102T043000Z");
  });
  it("rejects malformed or impossible settings", () => {
    expect(isEventSettings(updated)).toBe(true);
    for (const value of [
      null,
      {},
      { ...updated, id: 2 },
      { ...updated, event_date: "2027-02-30" },
      { ...updated, event_time: "24:00" },
      { ...updated, updated_at: "bad" },
    ])
      expect(isEventSettings(value)).toBe(false);
  });
});
describe("private administration", () => {
  it("counts only going people and their additional guests", () => {
    const base = {
      id: "a",
      name: "Test",
      message: null,
      created_at: "2026-09-23T12:00:00Z",
    };
    expect(
      rsvpStats([
        { ...base, attending: true, guest_count: 2 },
        { ...base, id: "b", attending: true, guest_count: 0 },
        { ...base, id: "c", attending: false, guest_count: 0 },
      ]),
    ).toEqual({ going: 2, notGoing: 1, total: 3, totalGuests: 4 });
    expect(rsvpStats([])).toEqual({
      going: 0,
      notGoing: 0,
      total: 0,
      totalGuests: 0,
    });
  });
  it("generates independent 256-bit opaque tokens and hashes them for storage", async () => {
    const a = newToken(),
      b = newToken();
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(a).not.toBe(b);
    expect(await sha256(a)).not.toBe(a);
  });
  it("compares credentials server-side without prefix matching", async () => {
    expect(await matchesPassword("test-password", "test-password")).toBe(true);
    expect(await matchesPassword("test-password-extra", "test-password")).toBe(
      false,
    );
    expect(await matchesPassword("", "test-password")).toBe(false);
  });
  it("validates calendar dates, minutes and supported range", () => {
    expect(validSchedule("2028-02-29", "23:59")).toBe(true);
    for (const [date, time] of [
      ["2027-02-29", "12:00"],
      ["2101-01-01", "12:00"],
      ["2026-10-24", "24:00"],
      ["2026-10-24", "12:61"],
      ["2026-10-24", "12:00:20"],
    ])
      expect(validSchedule(date, time)).toBe(false);
  });
});
