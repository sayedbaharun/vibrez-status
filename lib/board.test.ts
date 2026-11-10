import { describe, expect, it } from "vitest";
import { deriveBoard, isBlockedOrReview, normalizeLabel } from "./board";
import { resolveLinearMode } from "./mode";
import { createSample } from "./sample";
import type { Issue, Project } from "./types";

const NOW = new Date("2026-11-09T12:00:00Z");

function issue(partial: Partial<Issue> & Pick<Issue, "id" | "identifier">): Issue {
  return {
    teamKey: "VIB",
    createdAt: "2026-11-01T12:00:00.000Z",
    title: partial.identifier,
    url: `https://linear.app/vibrezhq/issue/${partial.identifier}`,
    priority: 3,
    priorityLabel: "Medium",
    dueDate: null,
    completedAt: null,
    updatedAt: "2026-11-09T12:00:00.000Z",
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

describe("labels and blocked states", () => {
  it("matches label names regardless of spaces or case", () => {
    expect(normalizeLabel("Needs Sayed")).toBe("needs-sayed");
    expect(normalizeLabel("human_only")).toBe("human-only");
    expect(normalizeLabel("Agent Can Finish")).toBe("agent-can-finish");
  });

  it("treats a blocked name or Needs Review as the blocked view", () => {
    expect(isBlockedOrReview("Blocked")).toBe(true);
    expect(isBlockedOrReview("needs review")).toBe(true);
    expect(isBlockedOrReview("In Progress")).toBe(false);
  });
});

describe("deriveBoard", () => {
  const projects: Project[] = [
    {
      id: "site",
      teamKey: "VIB",
      name: "Vibrez site",
      progress: 0.64,
      state: "started",
      targetDate: "2026-11-30",
    },
    {
      id: "done",
      teamKey: "VIB",
      name: "Brand archive",
      progress: 1,
      state: "completed",
      targetDate: null,
    },
    {
      id: "drop",
      teamKey: "VIB",
      name: "Canceled pitch",
      progress: 0.2,
      state: "canceled",
      targetDate: null,
    },
    {
      id: "ops",
      teamKey: "VIB",
      name: "Internal ops",
      progress: null,
      state: "started",
      targetDate: null,
    },
  ];

  const issues: Issue[] = [
    issue({
      id: "1",
      identifier: "VIB-1",
      title: "Overdue invoice",
      priority: 1,
      priorityLabel: "Urgent",
      dueDate: "2026-11-07",
      assignee: "Sayed Baharun",
      stateName: "In Progress",
      stateType: "started",
      labels: [{ name: "Needs Sayed", color: null }],
    }),
    issue({
      id: "2",
      identifier: "VIB-2",
      title: "Due today",
      priority: 2,
      priorityLabel: "High",
      dueDate: "2026-11-09",
      labels: [{ name: "needs-sayed", color: null }],
    }),
    issue({
      id: "3",
      identifier: "VIB-3",
      title: "Urgent tomorrow",
      priority: 1,
      priorityLabel: "Urgent",
      dueDate: "2026-11-10",
      labels: [{ name: "needs-sayed", color: null }],
    }),
    issue({
      id: "4",
      identifier: "VIB-4",
      title: "Sign the form",
      priority: 2,
      priorityLabel: "High",
      dueDate: "2026-11-12",
      labels: [{ name: "human-only", color: null }],
    }),
    issue({
      id: "5",
      identifier: "VIB-5",
      title: "No date",
      priority: 4,
      priorityLabel: "Low",
      labels: [{ name: "needs-sayed", color: null }],
    }),
    issue({
      id: "6",
      identifier: "VIB-6",
      title: "Same day, lower priority",
      priority: 3,
      priorityLabel: "Medium",
      dueDate: "2026-11-09",
      labels: [{ name: "needs-sayed", color: null }],
    }),
    issue({
      id: "7",
      identifier: "VIB-7",
      title: "Finished ask",
      stateName: "Accepted",
      stateType: "completed",
      completedAt: "2026-11-08T10:00:00.000Z",
      labels: [{ name: "needs-sayed", color: null }],
    }),
    issue({
      id: "8",
      identifier: "VIB-8",
      title: "Agent draft",
      dueDate: "2026-11-11",
      stateName: "In Progress",
      stateType: "started",
      assignee: "Studio agent",
      labels: [{ name: "agent-can-finish", color: null }],
    }),
    issue({
      id: "9",
      identifier: "VIB-9",
      title: "Agent already done",
      stateName: "Accepted",
      stateType: "completed",
      completedAt: "2026-11-08T10:00:00.000Z",
      labels: [{ name: "agent-can-finish", color: null }],
    }),
    issue({
      id: "10",
      identifier: "VIB-10",
      title: "Waiting on photos",
      dueDate: "2026-11-14",
      stateName: "Blocked",
      stateType: "started",
    }),
    issue({
      id: "11",
      identifier: "VIB-11",
      title: "Homepage QA",
      dueDate: "2026-11-16",
      stateName: "Needs Review",
      stateType: "started",
    }),
    issue({
      id: "12",
      identifier: "VIB-12",
      title: "Later this fortnight",
      dueDate: "2026-11-22",
      stateName: "Backlog",
      stateType: "backlog",
    }),
    issue({
      id: "13",
      identifier: "VIB-13",
      title: "Outside the fortnight",
      dueDate: "2026-11-29",
      stateName: "Backlog",
      stateType: "backlog",
    }),
    issue({
      id: "14",
      identifier: "VIB-14",
      title: "Recent accept",
      stateName: "Accepted",
      stateType: "completed",
      completedAt: "2026-11-04T18:00:00.000Z",
      assignee: "Sayed Baharun",
    }),
    issue({
      id: "15",
      identifier: "VIB-15",
      title: "Accepted without a completion time",
      stateName: "Accepted",
      stateType: "completed",
      completedAt: null,
      updatedAt: "2026-11-07T09:00:00.000Z",
    }),
    issue({
      id: "16",
      identifier: "VIB-16",
      title: "Old accept",
      stateName: "Accepted",
      stateType: "completed",
      completedAt: "2026-10-20T09:00:00.000Z",
    }),
    issue({
      id: "17",
      identifier: "VIB-17",
      title: "Dropped",
      stateName: "Canceled",
      stateType: "canceled",
      dueDate: "2026-11-01",
    }),
    issue({
      id: "18",
      identifier: "VIB-18",
      title: "Overdue but not waiting on Sayed",
      dueDate: "2026-11-08",
      stateName: "In Progress",
      stateType: "started",
    }),
  ];

  const board = deriveBoard(issues, projects, NOW);

  it("sorts Needs Sayed by due date, then priority, and flags overdue rows", () => {
    expect(board.needsSayed.map((item) => item.identifier)).toEqual([
      "VIB-1",
      "VIB-2",
      "VIB-6",
      "VIB-3",
      "VIB-4",
      "VIB-5",
    ]);
    expect(board.needsSayed[0]?.overdue).toBe(true);
    expect(board.needsSayed.find((item) => item.identifier === "VIB-2")?.overdue).toBe(
      false,
    );
  });

  it("lists open agent-can-finish issues with their status", () => {
    expect(board.agents.map((item) => item.identifier)).toEqual(["VIB-8"]);
    expect(board.agents[0]?.stateName).toBe("In Progress");
  });

  it("collects blocked and Needs Review states", () => {
    expect(board.blocked.map((item) => item.identifier).sort()).toEqual([
      "VIB-10",
      "VIB-11",
    ]);
  });

  it("groups the next 14 days, including today, by due date", () => {
    expect(board.timeline.map((day) => day.date)).toEqual([
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-14",
      "2026-11-16",
      "2026-11-22",
    ]);
    expect(board.timeline[0]?.issues.map((item) => item.identifier)).toEqual([
      "VIB-2",
      "VIB-6",
    ]);
  });

  it("counts recently completed issues of any completed state from the last 7 days", () => {
    expect(board.done.map((item) => item.identifier)).toEqual([
      "VIB-7",
      "VIB-9",
      "VIB-15",
      "VIB-14",
    ]);
    expect(board.counts.doneLast7Days).toBe(4);
  });

  it("counts open issues by status, overdue, and due this week", () => {
    expect(board.counts.open).toBe(12);
    expect(board.counts.overdue).toBe(2);
    expect(board.counts.dueThisWeek).toBe(6);
    expect(board.byStatus.find((row) => row.name === "In Progress")?.count).toBe(3);
    expect(board.byStatus.some((row) => row.name === "Canceled")).toBe(false);
  });

  it("turns project progress into a percentage and hides canceled projects", () => {
    expect(board.projects.map((project) => project.name)).toEqual([
      "Internal ops",
      "Vibrez site",
      "Brand archive",
    ]);
    expect(board.projects[1]?.percent).toBe(64);
    expect(board.projects[0]?.percent).toBeNull();
    expect(board.projects[2]?.percent).toBe(100);
  });
});

describe("sample data and mode", () => {
  it("builds a fictional Vibrez board that still exercises every view", () => {
    const sample = createSample(NOW);
    expect(sample.sample).toBe(true);
    expect(sample.workspaceName.toLowerCase()).toContain("sample");
    const board = deriveBoard(sample.issues, sample.projects, NOW);
    expect(board.needsSayed.length).toBeGreaterThan(0);
    expect(board.agents.length).toBeGreaterThan(0);
    expect(board.blocked.length).toBeGreaterThan(0);
    expect(board.timeline.length).toBeGreaterThan(0);
    expect(board.done.length).toBeGreaterThan(0);
    expect(board.counts.overdue).toBeGreaterThan(0);
    expect(sample.issues.some((item) => item.teamKey === "PER")).toBe(true);
    expect(sample.projects.some((project) => project.teamKey === "PER")).toBe(true);
  });

  it("prefers mock mode, then a real key, then a setup state", () => {
    expect(resolveLinearMode({ MOCK_LINEAR: "1", LINEAR_API_KEY: "lin_api_x" })).toBe(
      "mock",
    );
    expect(resolveLinearMode({ MOCK_LINEAR: "true" })).toBe("mock");
    expect(resolveLinearMode({ LINEAR_API_KEY: " lin_api_x " })).toBe("live");
    expect(resolveLinearMode({ LINEAR_API_KEY: "  " })).toBe("unconfigured");
    expect(resolveLinearMode({})).toBe("unconfigured");
  });
});
