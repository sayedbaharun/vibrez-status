import { describe, expect, it } from "vitest";
import { buildHealth, formatWait, overallStatus, type HealthCheck } from "./health";
import { createSample } from "./sample";
import type { Issue } from "./types";

const NOW = new Date("2026-11-10T12:00:00Z");
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();
const daysAgo = (days: number) => minutesAgo(days * 24 * 60);

function issue(partial: Partial<Issue> & Pick<Issue, "id" | "identifier">): Issue {
  return {
    teamKey: partial.identifier.startsWith("PER") ? "PER" : "VIB",
    title: partial.identifier,
    url: `https://linear.app/vibrezhq/issue/${partial.identifier}`,
    priority: 3,
    priorityLabel: "Medium",
    dueDate: null,
    completedAt: null,
    createdAt: minutesAgo(5),
    updatedAt: minutesAgo(5),
    assignee: null,
    stateName: "Todo",
    stateType: "unstarted",
    stateColor: null,
    labels: [],
    projectId: null,
    projectName: null,
    ...partial,
  };
}

function check(checks: HealthCheck[], id: string): HealthCheck {
  const found = checks.find((item) => item.id === id);
  if (!found) throw new Error(`missing check ${id}`);
  return found;
}

const health = (issues: Issue[]) => buildHealth({ ok: true, issues }, NOW);

describe("buildHealth", () => {
  it("returns every check in order and is all OK for a quiet board", () => {
    const checks = health([issue({ id: "1", identifier: "VIB-1" })]);
    expect(checks.map((item) => item.id)).toEqual([
      "linear",
      "triage-sweep",
      "sweep-alarm",
      "overdue",
      "review",
      "blocked",
      "personal-triage",
    ]);
    expect(checks.every((item) => item.status === "ok")).toBe(true);
    expect(overallStatus(checks)).toBe("ok");
    expect(check(checks, "triage-sweep").detail).toBe("Nothing waiting.");
  });

  it("fails only the Linear check when the fetch failed", () => {
    const checks = buildHealth({ ok: false, error: "Linear took too long to respond." }, NOW);
    expect(checks).toEqual([
      {
        id: "linear",
        label: "Linear data",
        status: "fail",
        detail: "Linear took too long to respond.",
      },
    ]);
    expect(overallStatus(checks)).toBe("fail");
  });

  it("is OK while the oldest VIB triage issue is within 45 minutes", () => {
    const checks = health([
      issue({ id: "1", identifier: "VIB-1", stateType: "triage", createdAt: minutesAgo(10) }),
      issue({ id: "2", identifier: "VIB-2", stateType: "triage", createdAt: minutesAgo(3) }),
    ]);
    expect(check(checks, "triage-sweep")).toMatchObject({
      status: "ok",
      detail: "2 in triage, oldest 10 min.",
    });
  });

  it("fails the sweep when a VIB triage issue has waited over 45 minutes", () => {
    const checks = health([
      issue({ id: "1", identifier: "VIB-123", stateType: "triage", createdAt: minutesAgo(125) }),
      issue({ id: "2", identifier: "VIB-124", stateType: "triage", createdAt: minutesAgo(50) }),
      issue({ id: "3", identifier: "PER-1", stateType: "triage", createdAt: minutesAgo(600) }),
    ]);
    expect(check(checks, "triage-sweep")).toMatchObject({
      status: "fail",
      detail: "Triage sweep looks stopped: VIB-123 waiting 2 h.",
      href: "https://linear.app/vibrezhq/issue/VIB-123",
    });
  });

  it("fails on an open sweep alarm and ignores a closed one", () => {
    const open = issue({
      id: "1",
      identifier: "VIB-50",
      title: "Triage sweep has failed 3 times",
      stateType: "backlog",
    });
    const closed = issue({
      id: "2",
      identifier: "VIB-40",
      title: "Triage sweep has failed",
      stateType: "completed",
    });
    expect(check(health([closed]), "sweep-alarm").status).toBe("ok");
    expect(check(health([open, closed]), "sweep-alarm")).toMatchObject({
      status: "fail",
      href: open.url,
    });
  });

  it("warns on overdue open issues across both teams, by London date", () => {
    const checks = health([
      issue({ id: "1", identifier: "VIB-1", dueDate: "2026-11-09" }),
      issue({ id: "2", identifier: "PER-2", dueDate: "2026-11-01" }),
      issue({ id: "3", identifier: "VIB-3", dueDate: "2026-11-10" }),
      issue({ id: "4", identifier: "VIB-4", dueDate: "2026-11-01", stateType: "canceled" }),
    ]);
    expect(check(checks, "overdue")).toMatchObject({
      status: "warn",
      detail: "2 overdue: PER-2, VIB-1.",
    });
  });

  it("lists at most four identifiers, then a count", () => {
    const late = Array.from({ length: 6 }, (_, index) =>
      issue({ id: String(index), identifier: `VIB-${index + 1}`, dueDate: "2026-11-01" }),
    );
    expect(check(health(late), "overdue").detail).toBe(
      "6 overdue: VIB-1, VIB-2, VIB-3, VIB-4 +2 more.",
    );
  });

  it("warns when review work has not moved for over 3 days", () => {
    const checks = health([
      issue({ id: "1", identifier: "VIB-1", stateName: "Needs Review", updatedAt: daysAgo(4) }),
      issue({ id: "2", identifier: "PER-2", stateName: "In Review", updatedAt: daysAgo(5) }),
      issue({ id: "3", identifier: "VIB-3", stateName: "In Review", updatedAt: daysAgo(1) }),
    ]);
    expect(check(checks, "review")).toMatchObject({
      status: "warn",
      detail: "2 untouched over 3 days: PER-2, VIB-1.",
    });
  });

  it("reports blocked work as information only", () => {
    const checks = health([
      issue({ id: "1", identifier: "VIB-1", stateName: "Blocked", stateType: "started" }),
      issue({ id: "2", identifier: "PER-2", stateName: "Blocked", stateType: "started" }),
    ]);
    expect(check(checks, "blocked")).toMatchObject({ status: "ok", detail: "2 blocked." });
  });

  it("warns when personal triage items sit for over 2 days", () => {
    const fresh = issue({ id: "1", identifier: "PER-1", stateType: "triage", createdAt: daysAgo(1) });
    const old = issue({ id: "2", identifier: "PER-2", stateType: "triage", createdAt: daysAgo(3) });
    expect(check(health([fresh]), "personal-triage")).toMatchObject({
      status: "ok",
      detail: "1 in triage, all under 2 days.",
    });
    expect(check(health([fresh, old]), "personal-triage")).toMatchObject({
      status: "warn",
      detail: "1 filed but not sorted: PER-2.",
      href: old.url,
    });
  });

  it("gives the sample board exactly one warning and no failures", () => {
    const sample = createSample(NOW);
    const checks = health(sample.issues);
    expect(checks.filter((item) => item.status === "fail")).toEqual([]);
    expect(checks.filter((item) => item.status === "warn").map((item) => item.id)).toEqual([
      "overdue",
    ]);
  });
});

describe("formatWait", () => {
  it("uses minutes, then hours, then days", () => {
    expect(formatWait(9 * 60_000)).toBe("9 min");
    expect(formatWait(125 * 60_000)).toBe("2 h");
    expect(formatWait(3 * 24 * 60 * 60_000)).toBe("3 d");
  });
});
