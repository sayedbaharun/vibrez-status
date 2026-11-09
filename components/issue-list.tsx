import { Badge } from "@/components/ui/badge";
import { formatLondonDay } from "@/lib/dates";
import type { BoardIssue } from "@/lib/types";
import { cn } from "cn";

export function EmptyNote({ children }: { children: string }) {
  return (
    <p className="rounded-xl bg-muted px-4 py-6 text-sm leading-6 text-muted-foreground">
      {children}
    </p>
  );
}

export function IssueList({ issues }: { issues: BoardIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <ul className="divide-y divide-border">
      {issues.map((issue) => (
        <li key={issue.id}>
          <IssueRow issue={issue} />
        </li>
      ))}
    </ul>
  );
}

function IssueRow({ issue }: { issue: BoardIssue }) {
  const due = issue.dueDate ? formatLondonDay(issue.dueDate) : "No due date";

  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block rounded-xl px-3 py-3 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        issue.overdue && "bg-destructive/10",
      )}
    >
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-sm text-primary">{issue.identifier}</span>
        <span className="text-xs tracking-wide text-muted-foreground uppercase">
          {issue.priorityLabel}
        </span>
      </span>
      <span className="mt-1 block text-base leading-snug font-medium text-foreground">
        {issue.title}
      </span>
      <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <span>{issue.stateName}</span>
        <span aria-hidden="true">·</span>
        <span>{issue.assignee ?? "Unassigned"}</span>
        <span aria-hidden="true">·</span>
        <span>{due}</span>
        {issue.projectName ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{issue.projectName}</span>
          </>
        ) : null}
        {issue.overdue ? <Badge variant="destructive">Overdue</Badge> : null}
      </span>
      {issue.labels.length > 0 ? (
        <span className="mt-2 flex flex-wrap gap-1.5">
          {issue.labels.map((label) => (
            <Badge key={label.name} variant="outline">
              {label.name}
            </Badge>
          ))}
        </span>
      ) : null}
    </a>
  );
}
