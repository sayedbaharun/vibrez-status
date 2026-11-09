import { Card, CardContent } from "@/components/ui/card";
import { formatLondonDay } from "@/lib/dates";
import type { BoardModel } from "@/lib/types";
import { EmptyNote, IssueList } from "./issue-list";

const STATS = [
  { key: "open", label: "Open" },
  { key: "overdue", label: "Overdue" },
  { key: "dueThisWeek", label: "Due this week" },
  { key: "doneLast7Days", label: "Done in 7 days" },
] as const;

export function Overview({ board }: { board: BoardModel }) {
  const maxStatus = board.byStatus[0]?.count ?? 1;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl tracking-tight">Overview</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Open work on team VIB. This week is Monday to Sunday, London time. Overdue means a due
          date before today and the issue is still open.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.key} size="sm">
            <CardContent className="pt-1">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">{stat.label}</p>
              <p
                className={
                  stat.key === "overdue" && board.counts.overdue > 0
                    ? "font-serif text-3xl text-destructive tabular-nums"
                    : "font-serif text-3xl tabular-nums"
                }
              >
                {board.counts[stat.key]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          By status
        </h3>
        {board.byStatus.length === 0 ? (
          <EmptyNote>No open issues.</EmptyNote>
        ) : (
          <ul className="space-y-2">
            {board.byStatus.map((row) => (
              <li key={row.name} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3">
                <span className="truncate text-sm">{row.name}</span>
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${Math.max(8, (row.count / maxStatus) * 100)}%` }}
                  />
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Projects
        </h3>
        {board.projects.length === 0 ? (
          <EmptyNote>No projects on this team.</EmptyNote>
        ) : (
          <ul className="space-y-4">
            {board.projects.map((project) => (
              <li key={project.id}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {project.percent == null ? "No progress" : `${project.percent}%`}
                  </p>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={project.percent ?? undefined}
                  aria-label={project.name}
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${project.percent ?? 0}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {projectState(project.state)}
                  {project.targetDate ? ` · Target ${formatLondonDay(project.targetDate)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
          Overdue now
        </h3>
        {board.overdueIssues.length === 0 ? (
          <EmptyNote>Nothing is past its due date.</EmptyNote>
        ) : (
          <IssueList issues={board.overdueIssues} />
        )}
      </section>
    </div>
  );
}

function projectState(state: string | null): string {
  if (!state) return "No status";
  if (state === "started") return "In progress";
  return state.charAt(0).toUpperCase() + state.slice(1);
}
