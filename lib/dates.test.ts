import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  formatLondonDay,
  formatLondonStamp,
  londonDate,
  londonWeekRange,
} from "./dates";

describe("Europe/London calendar", () => {
  it("uses BST when London is an hour ahead of UTC", () => {
    expect(londonDate(new Date("2026-06-15T23:30:00Z"))).toBe("2026-06-16");
  });

  it("stays on the same civil date in winter", () => {
    expect(londonDate(new Date("2026-11-09T23:30:00Z"))).toBe("2026-11-09");
  });

  it("adds calendar days across month boundaries", () => {
    expect(addCalendarDays("2026-11-09", 13)).toBe("2026-11-22");
    expect(addCalendarDays("2026-11-09", -6)).toBe("2026-11-03");
  });

  it("treats Monday as the start of the week", () => {
    expect(londonWeekRange("2026-11-09")).toEqual({
      start: "2026-11-09",
      end: "2026-11-15",
    });
    expect(londonWeekRange("2026-11-15")).toEqual({
      start: "2026-11-09",
      end: "2026-11-15",
    });
    expect(londonWeekRange("2026-11-08")).toEqual({
      start: "2026-11-02",
      end: "2026-11-08",
    });
  });

  it("formats a due date in London style", () => {
    const now = new Date("2026-11-09T12:00:00Z");
    expect(formatLondonDay("2026-11-09", now)).toBe("Mon 9 Nov");
    expect(formatLondonDay("2025-12-01", now)).toContain("2025");
  });

  it("formats a timestamp in the London clock", () => {
    const stamp = formatLondonStamp(new Date("2026-11-09T15:04:00Z"));
    expect(stamp).toContain("15:04");
    expect(stamp).toContain("9 Nov");
    expect(stamp).toContain("2026");
  });
});
