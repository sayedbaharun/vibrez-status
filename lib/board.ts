import { addCalendarDays, isIsoDate, londonDate, londonWeekRange } from "./dates";
import type { BoardIssue, BoardModel, Issue, Project, ProjectProgress } from "./types";

const NEEDS_SAYED = new Set(["needs-sayed", "human-only"]);
const AGENT = "agent-can-finish";

export function normalizeLabel(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function isBlockedOrReview(stateName: string): boolean {
  const name = stateName
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  return name.includes("blocked") || name === "needs review" || name === "in review";
}

export function isOpen(issue: Issue): boolean {
  return issue.stateType !== "completed" && issue.stateType !== "canceled";
}

function hasLabel(issue: Issue, keys: Set<string> | string): boolean {
  const wanted = typeof keys === "string" ? new Set([keys]) : keys;
  return issue.labels.some((label) => wanted.has(normalizeLabel(label.name)));
}

function priorityRank(priority: number): number {
  return priority === 0 ? 99 : priority;
}

function dueRank(dueDate: string | null): string {
  return dueDate && isIsoDate(dueDate) ? dueDate : "9999-99-99";
}

function byDueThenPriority(a: BoardIssue, b: BoardIssue): number {
  const byDue = dueRank(a.dueDate).localeCompare(dueRank(b.dueDate));
  if (byDue !== 0) return byDue;
  const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
  if (byPriority !== 0) return byPriority;
  return a.identifier.localeCompare(b.identifier);
}

function byPriorityThenId(a: BoardIssue, b: BoardIssue): number {
  const byPriority = priorityRank(a.priority) - priorityRank(b.priority);
  if (byPriority !== 0) return byPriority;
  return a.identifier.localeCompare(b.identifier);
}

function completionInstant(issue: Issue): Date | null {
  if (issue.stateType !== "completed") return null;
  const raw = issue.completedAt ?? issue.updatedAt;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toPercent(progress: number | null): number | null {
  if (progress == null || Number.isNaN(progress)) return null;
  const value = progress <= 1 ? progress * 100 : progress;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function deriveBoard(issues: Issue[], projects: Project[], now: Date): BoardModel {
  const today = londonDate(now);
  const week = londonWeekRange(today);
  const doneSince = addCalendarDays(today, -6);
  const horizon = addCalendarDays(today, 13);

  const decorate = (issue: Issue): BoardIssue => ({
    ...issue,
    overdue:
      isOpen(issue) &&
      !!issue.dueDate &&
      isIsoDate(issue.dueDate) &&
      issue.dueDate < today,
  });

  const open = issues.filter(isOpen).map(decorate);
  const needsSayed = open.filter((issue) => hasLabel(issue, NEEDS_SAYED)).sort(byDueThenPriority);
  const agents = open.filter((issue) => hasLabel(issue, AGENT)).sort(byDueThenPriority);
  const blocked = open
    .filter((issue) => isBlockedOrReview(issue.stateName))
    .sort(byDueThenPriority);

  const overdueIssues = open.filter((issue) => issue.overdue).sort(byDueThenPriority);
  const dueThisWeek = open.filter(
    (issue) =>
      !!issue.dueDate &&
      isIsoDate(issue.dueDate) &&
      issue.dueDate >= week.start &&
      issue.dueDate <= week.end,
  );

  const done = issues
    .filter((issue) => {
      const completed = completionInstant(issue);
      if (!completed) return false;
      const day = londonDate(completed);
      return day >= doneSince && day <= today;
    })
    .map((issue) => decorate(issue))
    .sort((a, b) => {
      const aKey = a.completedAt ?? a.updatedAt;
      const bKey = b.completedAt ?? b.updatedAt;
      return bKey.localeCompare(aKey) || a.identifier.localeCompare(b.identifier);
    });

  const status = new Map<string, { count: number; color: string | null }>();
  for (const issue of open) {
    const current = status.get(issue.stateName) ?? { count: 0, color: issue.stateColor };
    current.count += 1;
    if (!current.color && issue.stateColor) current.color = issue.stateColor;
    status.set(issue.stateName, current);
  }

  const groups = new Map<string, BoardIssue[]>();
  for (const issue of open) {
    if (!issue.dueDate || !isIsoDate(issue.dueDate)) continue;
    if (issue.dueDate < today || issue.dueDate > horizon) continue;
    const day = groups.get(issue.dueDate) ?? [];
    day.push(issue);
    groups.set(issue.dueDate, day);
  }

  const projectRows: ProjectProgress[] = projects
    .filter((project) => project.state !== "canceled")
    .map((project) => ({
      id: project.id,
      teamKey: project.teamKey,
      name: project.name,
      percent: toPercent(project.progress),
      state: project.state,
      targetDate: project.targetDate,
    }))
    .sort((a, b) => {
      if (a.teamKey !== b.teamKey) return a.teamKey === "VIB" ? -1 : 1;
      const aDone = a.state === "completed" ? 1 : 0;
      const bDone = b.state === "completed" ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      const aPercent = a.percent ?? -1;
      const bPercent = b.percent ?? -1;
      if (aPercent !== bPercent) return aPercent - bPercent;
      return a.name.localeCompare(b.name);
    });

  return {
    counts: {
      open: open.length,
      overdue: overdueIssues.length,
      dueThisWeek: dueThisWeek.length,
      doneLast7Days: done.length,
    },
    byStatus: [...status.entries()]
      .map(([name, value]) => ({ name, count: value.count, color: value.color }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    projects: projectRows,
    needsSayed,
    agents,
    blocked,
    overdueIssues,
    timeline: [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayIssues]) => ({
        date,
        issues: [...dayIssues].sort(byPriorityThenId),
      })),
    done,
  };
}
