import { describe, expect, it } from "vitest";
import { parseUpdates } from "./updates";

describe("parseUpdates", () => {
  it("keeps valid entries, newest first, and drops a blank link", () => {
    const parsed = parseUpdates([
      {
        date: "2026-11-01",
        source: "agent",
        title: "Older",
        detail: "First pass.",
        link: "",
      },
      {
        date: "2026-11-09",
        source: "example",
        title: "Newer",
        detail: "Second pass.",
        link: "https://linear.app",
      },
      { date: "nope", source: "agent", title: "Bad", detail: "Skip." },
      { title: "Missing fields" },
    ]);

    expect(parsed.map((entry) => entry.title)).toEqual(["Newer", "Older"]);
    expect(parsed[0]?.link).toBe("https://linear.app");
    expect(parsed[1]?.link).toBeUndefined();
  });
});
