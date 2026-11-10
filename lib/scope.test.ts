import { describe, expect, it } from "vitest";
import { boardHref, filterByScope, normalizeScope } from "./scope";
import { createSample } from "./sample";

describe("scope", () => {
  it("defaults to all and accepts known scopes", () => {
    expect(normalizeScope(undefined)).toBe("all");
    expect(normalizeScope("Personal")).toBe("personal");
    expect(normalizeScope(["vibrez"])).toBe("vibrez");
    expect(normalizeScope("nope")).toBe("all");
  });

  it("filters issues and projects by team", () => {
    const sample = createSample(new Date("2026-11-10T12:00:00Z"));
    const personal = filterByScope(sample.issues, "personal");
    expect(personal.length).toBeGreaterThan(0);
    expect(personal.every((item) => item.teamKey === "PER")).toBe(true);
    expect(filterByScope(sample.projects, "vibrez").every((p) => p.teamKey === "VIB")).toBe(true);
    expect(filterByScope(sample.issues, "all")).toHaveLength(sample.issues.length);
  });

  it("keeps view and scope in the URL, leaving defaults out", () => {
    expect(boardHref("overview", "all")).toBe("/");
    expect(boardHref("sayed", "all")).toBe("/?view=sayed");
    expect(boardHref("overview", "personal")).toBe("/?scope=personal");
    expect(boardHref("done", "vibrez")).toBe("/?view=done&scope=vibrez");
  });
});
