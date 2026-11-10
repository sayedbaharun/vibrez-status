import { isOpen } from "./board";
import { isIsoDate, londonDate } from "./dates";
import type { Issue } from "./types";

/** The VIB triage sweep runs every 15 minutes; three missed runs means it has stopped. */
export const TRIAGE_SWEEP_MAX_WAIT_MINUTES = 45;
/** Review work untouched for this long is stuck. */
export const REVIEW_STUCK_DAYS = 3;
/** Personal items left in triage this long were filed but never sorted. */
export const PERSONAL_TRIAGE_MAX_DAYS = 2;
/** Title the sweep uses when it files its own failure alarm. */
export const SWEEP_ALARM_TITLE = "Triage sweep has failed";
/** How many identifiers a detail line lists before saying "+N more". */
export const MAX_LISTED = 4;

const REVIEW_STATES = new Set(["needs review", "in review"]);
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export type HealthStatus = "ok" | "warn" | "fail";

export type HealthCheck = {
  id: string;
  label: string;
  status: HealthStatus;
  detail: string;
  href?: string;
};

export type HealthInput =
  | { ok: true; issues: Issue[] }
  | { ok: false; error: string };

function stateKey(name: string): string {
  return name.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function ageMs(iso: string, now: Date): number {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? 0 : now.getTime() - time;
}

/** "10 min", "2 h", "3 d". */
export function formatWait(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / MINUTE));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

function listIds(issues: Issue[]): string {
  const ids = issues.slice(0, MAX_LISTED).map((issue) => issue.identifier);
  const more = issues.length - ids.length;
  return more > 0 ? `${ids.join(", ")} +${more} more` : ids.join(", ");
}

function oldestFirst(a: Issue, b: Issue): number {
  return a.createdAt.localeCompare(b.createdAt) || a.identifier.localeCompare(b.identifier);
}

function triageSweep(issues: Issue[], now: Date): HealthCheck {
  const waiting = issues
    .filter((issue) => issue.teamKey === "VIB" && issue.stateType === "triage")
    .sort(oldestFirst);
  const base = { id: "triage-sweep", label: "Triage sweep" };
  const oldest = waiting[0];
  if (!oldest) return { ...base, status: "ok", detail: "Nothing waiting." };

  const wait = ageMs(oldest.createdAt, now);
  if (wait > TRIAGE_SWEEP_MAX_WAIT_MINUTES * MINUTE) {
    return {
      ...base,
      status: "fail",
      detail: `Triage sweep looks stopped: ${oldest.identifier} waiting ${formatWait(wait)}.`,
      href: oldest.url,
    };
  }
  return {
    ...base,
    status: "ok",
    detail: `${waiting.length} in triage, oldest ${formatWait(wait)}.`,
  };
}

function sweepAlarm(issues: Issue[]): HealthCheck {
  const needle = SWEEP_ALARM_TITLE.toLowerCase();
  const alarms = issues
    .filter((issue) => isOpen(issue) && issue.title.toLowerCase().includes(needle))
    .sort(oldestFirst);
  const base = { id: "sweep-alarm", label: "Sweep alarm" };
  if (alarms.length === 0) return { ...base, status: "ok", detail: "No alarm filed." };
  return {
    ...base,
    status: "fail",
    detail: `Sweep filed a failure alarm: ${listIds(alarms)}.`,
    href: alarms[0].url,
  };
}

function overdue(issues: Issue[], now: Date): HealthCheck {
  const today = londonDate(now);
  const late = issues
    .filter(
      (issue) =>
        isOpen(issue) && !!issue.dueDate && isIsoDate(issue.dueDate) && issue.dueDate < today,
    )
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  const base = { id: "overdue", label: "Overdue" };
  if (late.length === 0) return { ...base, status: "ok", detail: "Nothing past its due date." };
  return {
    ...base,
    status: "warn",
    detail: `${late.length} overdue: ${listIds(late)}.`,
    href: late.length === 1 ? late[0].url : undefined,
  };
}

function stuckInReview(issues: Issue[], now: Date): HealthCheck {
  const stuck = issues
    .filter(
      (issue) =>
        isOpen(issue) &&
        REVIEW_STATES.has(stateKey(issue.stateName)) &&
        ageMs(issue.updatedAt, now) > REVIEW_STUCK_DAYS * DAY,
    )
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  const base = { id: "review", label: "Stuck in review" };
  if (stuck.length === 0) {
    return { ...base, status: "ok", detail: `Nothing in review over ${REVIEW_STUCK_DAYS} days.` };
  }
  return {
    ...base,
    status: "warn",
    detail: `${stuck.length} untouched over ${REVIEW_STUCK_DAYS} days: ${listIds(stuck)}.`,
    href: stuck.length === 1 ? stuck[0].url : undefined,
  };
}

function blocked(issues: Issue[]): HealthCheck {
  const count = issues.filter(
    (issue) => isOpen(issue) && stateKey(issue.stateName).includes("blocked"),
  ).length;
  return {
    id: "blocked",
    label: "Blocked",
    status: "ok",
    detail: count === 0 ? "Nothing blocked." : `${count} blocked.`,
  };
}

function personalTriage(issues: Issue[], now: Date): HealthCheck {
  const inTriage = issues.filter(
    (issue) => issue.teamKey === "PER" && issue.stateType === "triage",
  );
  const old = inTriage
    .filter((issue) => ageMs(issue.createdAt, now) > PERSONAL_TRIAGE_MAX_DAYS * DAY)
    .sort(oldestFirst);
  const base = { id: "personal-triage", label: "Personal triage" };
  if (old.length > 0) {
    return {
      ...base,
      status: "warn",
      detail: `${old.length} filed but not sorted: ${listIds(old)}.`,
      href: old.length === 1 ? old[0].url : undefined,
    };
  }
  return {
    ...base,
    status: "ok",
    detail:
      inTriage.length === 0
        ? "Nothing waiting."
        : `${inTriage.length} in triage, all under ${PERSONAL_TRIAGE_MAX_DAYS} days.`,
  };
}

/** Ordered "is it working?" checks, all derived from what Linear returned. */
export function buildHealth(input: HealthInput, now: Date): HealthCheck[] {
  if (!input.ok) {
    return [{ id: "linear", label: "Linear data", status: "fail", detail: input.error }];
  }
  const { issues } = input;
  return [
    { id: "linear", label: "Linear data", status: "ok", detail: `Loaded ${issues.length} issues.` },
    triageSweep(issues, now),
    sweepAlarm(issues),
    overdue(issues, now),
    stuckInReview(issues, now),
    blocked(issues),
    personalTriage(issues, now),
  ];
}

export function overallStatus(checks: HealthCheck[]): HealthStatus {
  if (checks.some((check) => check.status === "fail")) return "fail";
  if (checks.some((check) => check.status === "warn")) return "warn";
  return "ok";
}
